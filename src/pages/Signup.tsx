import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logo from '@/assets/bilimhub-logo.png';
import { z } from 'zod';

// Validation schema
const signupSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(50, 'Имя слишком длинное'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function Signup() {
  const { t } = useLanguage();
  const { signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    // If user is already logged in, redirect appropriately
    // New users will be redirected to diagnostic-test by ProtectedRoute
    if (user) {
      navigate('/diagnostic-test');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});
    
    // Validate with Zod
    const result = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FieldErrors;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }
    
    setIsLoading(true);
    try {
      // Check whitelist (closed beta)
      const { data: supabase } = await import('@/integrations/supabase/client');
      const { data: whitelistCheck, error: whitelistError } = await supabase.supabase
        .rpc('is_email_whitelisted', { check_email: email });
      
      if (whitelistError || !whitelistCheck) {
        setGeneralError('Регистрация доступна только по приглашению. Свяжитесь с администратором для получения доступа.');
        setIsLoading(false);
        return;
      }
      
      const { error: signUpError } = await signUp(email, password, name);
      
      if (signUpError) {
        // Handle specific error cases
        if (signUpError.message.includes('already registered')) {
          setGeneralError('Пользователь с таким email уже зарегистрирован. Попробуйте войти.');
        } else if (signUpError.message.includes('Invalid email')) {
          setFieldErrors({ email: 'Неверный формат email' });
        } else if (signUpError.message.includes('Password')) {
          setFieldErrors({ password: 'Пароль не соответствует требованиям' });
        } else {
          setGeneralError(signUpError.message || 'Произошла ошибка при регистрации');
        }
      } else {
        // Success - redirect to diagnostic test
        navigate('/diagnostic-test');
      }
    } catch (err) {
      setGeneralError('Произошла ошибка. Проверьте подключение к интернету.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logo} alt="BilimHub" className="mx-auto mb-4 h-12" />
            <CardTitle className="text-2xl">{t.nav.signup}</CardTitle>
            <CardDescription>
              Создайте аккаунт и начните подготовку к ОРТ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Имя
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Ваше имя"
                    className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
                      fieldErrors.name ? 'border-destructive' : 'border-input'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-xs text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    placeholder="your@email.com"
                    className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
                      fieldErrors.email ? 'border-destructive' : 'border-input'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
                      fieldErrors.password ? 'border-destructive' : 'border-input'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">Минимум 8 символов</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="••••••••"
                    className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
                      fieldErrors.confirmPassword ? 'border-destructive' : 'border-input'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {generalError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{generalError}</AlertDescription>
                </Alert>
              )}
              
              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    Создать аккаунт
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Регистрируясь, вы соглашаетесь с{' '}
              <a href="#" className="text-accent hover:underline">
                Условиями использования
              </a>{' '}
              и{' '}
              <a href="#" className="text-accent hover:underline">
                Политикой конфиденциальности
              </a>
            </p>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">или</span>
                </div>
              </div>

              <Button variant="outline" className="mt-4 w-full" disabled>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Зарегистрироваться через Google
              </Button>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-accent hover:underline">
                Войдите
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
