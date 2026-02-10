import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { useBetaAccess } from '@/hooks/useBetaAccess';

interface InviteCodeModalProps {
  open: boolean;
  onSuccess: () => void;
}

export function InviteCodeModal({ open, onSuccess }: InviteCodeModalProps) {
  const { redeemInviteCode } = useBetaAccess();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await redeemInviteCode(code);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setError(result.error || 'Неверный код приглашения');
    }
    
    setLoading(false);
  };

  const getErrorMessage = (error: string): string => {
    const errorMap: Record<string, string> = {
      'Invalid invite code': 'Неверный код приглашения',
      'Invite code does not match your email': 'Код не соответствует вашему email',
      'User not found': 'Пользователь не найден',
    };
    return errorMap[error] || error;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" />
            Запущено бета-тестирование
          </DialogTitle>
          <DialogDescription>
            BilimHub находится в закрытом бета-тестировании. Для доступа введите код приглашения.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-lg font-semibold">Доступ активирован!</p>
            <p className="text-sm text-muted-foreground">Добро пожаловать в BilimHub Beta</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="inviteCode" className="text-sm font-medium">
                Код приглашения
              </label>
              <Input
                id="inviteCode"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="BETA2024-XX"
                className="font-mono uppercase"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{getErrorMessage(error)}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              variant="accent" 
              className="w-full" 
              disabled={loading || !code}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Проверка...
                </>
              ) : (
                'Активировать доступ'
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Нет кода? Напишите нам на{' '}
              <a href="mailto:support@bilimhub.kg" className="text-accent hover:underline">
                support@bilimhub.kg
              </a>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
