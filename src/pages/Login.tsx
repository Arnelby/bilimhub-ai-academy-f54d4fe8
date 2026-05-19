import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

import { z } from 'zod';

export default function Login() {
  const { t } = useTranslation();
  const loginSchema = z.object({
    email: z.string().email(t('loginPage.errors.invalidEmail')),
    inviteCode: z.string().min(1, t('loginPage.errors.inviteRequired')),
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
        setGeneralError(t('loginPage.errors.accessCheck'));
        setIsLoading(false);
        return;
      }

      const validation = whitelistResult as { allowed: boolean; error?: string };

      if (!validation.allowed) {
        setGeneralError(t('loginPage.errors.accessDenied'));
        setIsLoading(false);
        return;
      }

      // Step 2: Try to sign in with invite code as password
      const trimmedEmail = email.trim();
      const trimmedCode = inviteCode.trim().toUpperCase();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedCode,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password: trimmedCode,
          });

          if (signUpError) {
            if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
              setGeneralError(t('loginPage.errors.wrongCodeForEmail'));
            } else {
              console.error('Sign up error:', signUpError);
              setGeneralError(t('loginPage.errors.signupFailed'));
            }
            setIsLoading(false);
            return;
          }

          if (signUpData?.user?.identities?.length === 0) {
            setGeneralError(t('loginPage.errors.wrongCodeForEmail'));
            setIsLoading(false);
            return;
          }

          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: trimmedCode,
          });

          if (retryError) {
            console.error('Sign in after signup error:', retryError);
            setGeneralError(t('loginPage.errors.signinAfterSignup'));
            setIsLoading(false);
            return;
          }
        } else {
          setGeneralError(signInError.message);
          setIsLoading(false);
          return;
        }
      }

      navigate(from, { replace: true });
    } catch (err) {
      setGeneralError(t('loginPage.errors.network'));
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
            <h2 className="mb-3 text-3xl font-bold tracking-tight gradient-text">BilimHub</h2>
            <Badge variant="outline" className="mx-auto mb-3 gap-1">
              <ShieldCheck className="h-3 w-3" />
              {t('loginPage.betaBadge')}
            </Badge>
            <CardTitle className="text-2xl">{t('loginPage.title')}</CardTitle>
            <CardDescription>{t('loginPage.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t('loginPage.emailLabel')}
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
                  {t('loginPage.inviteCodeLabel')}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setErrors(p => ({ ...p, inviteCode: undefined })); }}
                    placeholder={t('loginPage.inviteCodePlaceholder')}
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
                    {t('loginPage.submitting')}
                  </>
                ) : (
                  <>
                    {t('loginPage.submit')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              {t('loginPage.noCodeHint')}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
