import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bug, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

export function ReportIssueButton() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setFile(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (submitting) return;
    setOpen(v);
    if (!v) reset();
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: t('reportIssue.loginRequired'), variant: 'destructive' });
      return;
    }
    if (!title.trim()) {
      toast({ title: t('reportIssue.validationTitleRequired'), variant: 'destructive' });
      return;
    }
    if (!description.trim()) {
      toast({ title: t('reportIssue.validationDescriptionRequired'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let screenshot_url: string | null = null;
      if (file) {
        const ext = file.name.split('.').pop() || 'png';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('issue-screenshots')
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        screenshot_url = path;
      }

      const browser_info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        screen: { w: window.screen.width, h: window.screen.height },
        dpr: window.devicePixelRatio,
      };

      const { error } = await supabase.from('issue_reports').insert({
        user_id: user.id,
        email: user.email ?? null,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 5000),
        page_url: window.location.href,
        page_name: location.pathname,
        language,
        browser_info,
        screenshot_url,
      });
      if (error) throw error;

      toast({
        title: t('reportIssue.successTitle'),
        description: t('reportIssue.successMessage'),
      });
      handleOpenChange(false);
    } catch (e: any) {
      console.error('[ReportIssue] submit failed', e);
      toast({
        title: t('reportIssue.errorTitle'),
        description: t('reportIssue.errorMessage'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Hide for unauthenticated users
  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        aria-label={t('reportIssue.buttonAria')}
        size="sm"
        className="fixed bottom-4 right-4 z-40 h-11 gap-2 rounded-full shadow-lg md:bottom-6 md:right-6"
        variant="accent"
      >
        <Bug className="h-4 w-4" />
        <span className="hidden sm:inline">{t('reportIssue.title')}</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('reportIssue.modalTitle')}</DialogTitle>
            <DialogDescription>{t('reportIssue.modalDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ri-title">{t('reportIssue.fieldTitle')}</Label>
              <Input
                id="ri-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('reportIssue.fieldTitlePlaceholder')}
                maxLength={200}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ri-desc">{t('reportIssue.fieldDescription')}</Label>
              <Textarea
                id="ri-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('reportIssue.fieldDescriptionPlaceholder')}
                rows={5}
                maxLength={5000}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ri-file">{t('reportIssue.fieldScreenshot')}</Label>
              {file ? (
                <div className="flex items-center justify-between rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                  <span className="truncate">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setFile(null)}
                    disabled={submitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="ri-file"
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30"
                >
                  <Upload className="h-4 w-4" />
                  <span>{t('reportIssue.fieldScreenshot')}</span>
                </label>
              )}
              <input
                id="ri-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && f.size <= 5 * 1024 * 1024) setFile(f);
                  else if (f) toast({ title: 'Max 5 MB', variant: 'destructive' });
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              {t('reportIssue.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} variant="accent">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('reportIssue.submitting')}
                </>
              ) : (
                t('reportIssue.submit')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
