import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, KeyRound, ShieldCheck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/bilimhub-logo.png';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  inviteCode: z.string().min(1, 'Введите инвайт-код'),
});

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; inviteCode?: string }>({});
  const [generalError, setGeneralError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    const result = loginSchema.safeParse({ email, inviteCode });
    if (!result.success) {
      const fieldErrors: { email?: string; inviteCode?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'inviteCode') fieldErrors.inviteCode = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Validate whitelist
      const { data: whitelistResult, error: whitelistError } = await supabase.rpc(
        'validate_whitelist_login',
        { _email: email.trim(), _invite_code: inviteCode.trim() }
      );

      if (whitelistError) {
        console.error('Whitelist check error:', whitelistError);
        setGeneralError('Ошибка проверки доступа. Попробуйте позже.');
        setIsLoading(false);
        return;
      }

      const validation = whitelistResult as { allowed: boolean; error?: string };

      if (!validation.allowed) {
        setGeneralError('Доступ ограничен. Для входа необходим инвайт-код. Обратитесь к администратору.');
        setIsLoading(false);
        return;
      }

      // Step 2: Send magic link (passwordless sign-in)
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}${from}`,
        },
      });

      if (error) {
        setGeneralError(error.message);
        setIsLoading(false);
        return;
      }

      setMagicLinkSent(true);
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

  if (magicLinkSent) {
    return (
      <Layout showFooter={false}>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <Card variant="elevated" className="w-full max-w-md">
            <CardHeader className="text-center">
              <img src={logo} alt="BilimHub" className="mx-auto mb-4 h-12" />
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
              <CardTitle className="text-2xl">Проверьте почту</CardTitle>
              <CardDescription>
                Мы отправили ссылку для входа на <strong>{email}</strong>. Перейдите по ней, чтобы войти в BilimHub.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Не получили письмо? Проверьте папку «Спам» или{' '}
                <button
                  onClick={() => setMagicLinkSent(false)}
                  className="text-accent underline hover:no-underline"
                >
                  попробуйте снова
                </button>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logo} alt="BilimHub" className="mx-auto mb-4 h-12" />
            <Badge variant="outline" className="mx-auto mb-3 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Закрытая бета
            </Badge>
            <CardTitle className="text-2xl">Вход в BilimHub</CardTitle>
            <CardDescription>
              Доступ только по приглашению
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                    placeholder="your@email.com"
                    className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
                      errors.email ? 'border-destructive' : 'border-input'
                    }`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="inviteCode" className="text-sm font-medium">
                  Инвайт-код
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setErrors(p => ({ ...p, inviteCode: undefined })); }}
                    placeholder="BETA2024-XX"
                    className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-accent ${
                      errors.inviteCode ? 'border-destructive' : 'border-input'
                    }`}
                    required
                  />
                </div>
                {errors.inviteCode && (
                  <p className="text-xs text-destructive">{errors.inviteCode}</p>
                )}
              </div>

              {generalError && (
                <Alert variant="destructive">
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
                    Проверка доступа...
                  </>
                ) : (
                  <>
                    Получить ссылку для входа
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Нет инвайт-кода? Обратитесь к администратору платформы для получения доступа.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
