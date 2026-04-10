import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface FullNameModalProps {
  userId: string;
  open: boolean;
  onComplete: (name: string) => void;
}

export function FullNameModal({ userId, open, onComplete }: FullNameModalProps) {
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setError('Минимум 2 символа');
      return;
    }
    setSaving(true);
    setError('');

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ full_name: trimmed })
      .eq('id', userId);

    setSaving(false);
    if (dbError) {
      setError('Ошибка сохранения. Попробуйте снова.');
      return;
    }
    onComplete(trimmed);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Добро пожаловать в BilimHub! 👋</DialogTitle>
          <DialogDescription>
            Укажите ваше имя для персонализации обучения
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">Ваше полное имя</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(''); }}
              placeholder="Например: Айдана Асанова"
              className="w-full rounded-lg border border-input bg-background py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <Button onClick={handleSave} variant="accent" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Продолжить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
