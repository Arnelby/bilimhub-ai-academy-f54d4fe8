import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Clock, CheckCircle, AlertCircle, Star, Bell, Plus, Loader2, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';

interface HomeworkSubmission {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  subject: string;
  topic_id: string | null;
  file_url: string;
  file_name: string;
  file_type: string;
  status: string;
  points_awarded: number;
  created_at: string;
  feedback?: HomeworkFeedback;
}

interface HomeworkFeedback {
  id: string;
  feedback: string;
  suggestions: string | null;
  corrections: string | null;
  score: number | null;
  strengths: string[];
  weaknesses: string[];
  additional_exercises: Array<{ title: string; description: string }>;
  created_at: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const translations = {
  en: {
    title: 'Homework',
    subtitle: 'Submit and track your homework assignments',
    newSubmission: 'New Submission',
    mySubmissions: 'My Submissions',
    notifications: 'Notifications',
    submitHomework: 'Submit Homework',
    homeworkTitle: 'Title',
    titlePlaceholder: 'e.g., Math Problem Set #5',
    description: 'Description',
    descriptionPlaceholder: 'Describe your homework...',
    subject: 'Subject',
    selectSubject: 'Select subject',
    notes: 'Additional Notes',
    notesPlaceholder: 'Any notes for the reviewer...',
    uploadFile: 'Upload File',
    dragDrop: 'Drag & drop or click to upload',
    supportedFormats: 'Supported: PDF, DOCX, Images',
    submit: 'Submit for Review',
    submitting: 'Submitting...',
    noSubmissions: 'No homework submissions yet',
    startSubmitting: 'Start by submitting your first homework!',
    viewFeedback: 'View Feedback',
    score: 'Score',
    status: 'Status',
    submitted: 'Submitted',
    reviewing: 'Under Review',
    reviewed: 'Reviewed',
    needsImprovement: 'Needs Improvement',
    completed: 'Completed',
    points: 'Points Earned',
    feedback: 'Feedback',
    suggestions: 'Suggestions',
    corrections: 'Corrections',
    strengths: 'Strengths',
    weaknesses: 'Areas to Improve',
    additionalExercises: 'Additional Exercises',
    noNotifications: 'No notifications',
    markAsRead: 'Mark as read',
    mathematics: 'Mathematics',
    russian: 'Russian Language',
    kyrgyz: 'Kyrgyz Language',
    chemistry: 'Chemistry',
    biology: 'Biology',
    physics: 'Physics',
    english: 'English',
  },
  ru: {
    title: 'Домашние задания',
    subtitle: 'Отправляйте и отслеживайте свои домашние задания',
    newSubmission: 'Новая работа',
    mySubmissions: 'Мои работы',
    notifications: 'Уведомления',
    submitHomework: 'Отправить домашнее задание',
    homeworkTitle: 'Название',
    titlePlaceholder: 'напр., Задачи по математике №5',
    description: 'Описание',
    descriptionPlaceholder: 'Опишите вашу работу...',
    subject: 'Предмет',
    selectSubject: 'Выберите предмет',
    notes: 'Дополнительные заметки',
    notesPlaceholder: 'Заметки для проверяющего...',
    uploadFile: 'Загрузить файл',
    dragDrop: 'Перетащите или нажмите для загрузки',
    supportedFormats: 'Поддерживаются: PDF, DOCX, Изображения',
    submit: 'Отправить на проверку',
    submitting: 'Отправка...',
    noSubmissions: 'Пока нет домашних заданий',
    startSubmitting: 'Начните с отправки вашего первого задания!',
    viewFeedback: 'Посмотреть отзыв',
    score: 'Оценка',
    status: 'Статус',
    submitted: 'Отправлено',
    reviewing: 'На проверке',
    reviewed: 'Проверено',
    needsImprovement: 'Требует доработки',
    completed: 'Завершено',
    points: 'Заработано баллов',
    feedback: 'Отзыв',
    suggestions: 'Предложения',
    corrections: 'Исправления',
    strengths: 'Сильные стороны',
    weaknesses: 'Области для улучшения',
    additionalExercises: 'Дополнительные упражнения',
    noNotifications: 'Нет уведомлений',
    markAsRead: 'Отметить как прочитанное',
    mathematics: 'Математика',
    russian: 'Русский язык',
    kyrgyz: 'Кыргызский язык',
    chemistry: 'Химия',
    biology: 'Биология',
    physics: 'Физика',
    english: 'Английский язык',
  },
  kg: {
    title: 'Үй тапшырмалары',
    subtitle: 'Үй тапшырмаларыңызды жөнөтүңүз жана көзөмөлдөңүз',
    newSubmission: 'Жаңы иш',
    mySubmissions: 'Менин иштерим',
    notifications: 'Билдирүүлөр',
    submitHomework: 'Үй тапшырмасын жөнөтүү',
    homeworkTitle: 'Аталышы',
    titlePlaceholder: 'мис., Математика боюнча тапшырмалар №5',
    description: 'Сүрөттөмө',
    descriptionPlaceholder: 'Ишиңизди сүрөттөңүз...',
    subject: 'Предмет',
    selectSubject: 'Предметти тандаңыз',
    notes: 'Кошумча эскертүүлөр',
    notesPlaceholder: 'Текшерүүчү үчүн эскертүүлөр...',
    uploadFile: 'Файл жүктөө',
    dragDrop: 'Сүйрөңүз же жүктөө үчүн басыңыз',
    supportedFormats: 'Колдоого алынат: PDF, DOCX, Сүрөттөр',
    submit: 'Текшерүүгө жөнөтүү',
    submitting: 'Жөнөтүлүүдө...',
    noSubmissions: 'Азырынча үй тапшырмалары жок',
    startSubmitting: 'Биринчи тапшырмаңызды жөнөтүү менен баштаңыз!',
    viewFeedback: 'Пикирди көрүү',
    score: 'Баа',
    status: 'Статус',
    submitted: 'Жөнөтүлдү',
    reviewing: 'Текшерүүдө',
    reviewed: 'Текшерилди',
    needsImprovement: 'Оңдоо керек',
    completed: 'Аяктады',
    points: 'Алынган упайлар',
    feedback: 'Пикир',
    suggestions: 'Сунуштар',
    corrections: 'Оңдоолор',
    strengths: 'Күчтүү жактары',
    weaknesses: 'Жакшыртуу керек болгон жактары',
    additionalExercises: 'Кошумча көнүгүүлөр',
    noNotifications: 'Билдирүүлөр жок',
    markAsRead: 'Окулду деп белгилөө',
    mathematics: 'Математика',
    russian: 'Орус тили',
    kyrgyz: 'Кыргыз тили',
    chemistry: 'Химия',
    biology: 'Биология',
    physics: 'Физика',
    english: 'Англис тили',
  },
};

const subjects = [
  { value: 'mathematics', labelKey: 'mathematics' },
  { value: 'russian', labelKey: 'russian' },
  { value: 'kyrgyz', labelKey: 'kyrgyz' },
  { value: 'chemistry', labelKey: 'chemistry' },
  { value: 'biology', labelKey: 'biology' },
  { value: 'physics', labelKey: 'physics' },
  { value: 'english', labelKey: 'english' },
];

export default function Homework() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const t = translations[language as keyof typeof translations] || translations.ru;

  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<HomeworkSubmission | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch submissions with feedback
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Fetch feedback for each submission
      const submissionsWithFeedback = await Promise.all(
        (submissionsData || []).map(async (submission) => {
          const { data: feedbackData } = await supabase
            .from('ai_homework_feedback')
            .select('*')
            .eq('submission_id', submission.id)
            .single();

          return {
            ...submission,
            feedback: feedbackData ? {
              ...feedbackData,
              strengths: feedbackData.strengths as string[] || [],
              weaknesses: feedbackData.weaknesses as string[] || [],
              additional_exercises: feedbackData.additional_exercises as Array<{ title: string; description: string }> || []
            } : undefined
          };
        })
      );

      setSubmissions(submissionsWithFeedback);

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('homework_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);

    } catch (error) {
      console.error('Error fetching homework data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load homework data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload PDF, DOCX, or image files only.',
          variant: 'destructive',
        });
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB.',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!user || !title || !subject || !file) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields and upload a file.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('homework')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get file URL
      const { data: urlData } = supabase.storage
        .from('homework')
        .getPublicUrl(filePath);

      // Create submission record
      const { data: submission, error: submissionError } = await supabase
        .from('homework_submissions')
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          notes: notes || null,
          subject,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          status: 'submitted'
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Read file content for AI review (text-based files)
      let fileContent = '';
      if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
        fileContent = await file.text();
      }

      // Trigger AI review
      const { error: reviewError } = await supabase.functions.invoke('ai-homework-review', {
        body: {
          submissionId: submission.id,
          userId: user.id,
          fileContent,
          fileName: file.name,
          fileType: file.type,
          subject,
          title,
          description,
          language
        }
      });

      if (reviewError) {
        console.error('AI review error:', reviewError);
        // Don't throw - submission was successful, review will be retried
      }

      toast({
        title: 'Success!',
        description: 'Homework submitted successfully. AI review in progress.',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSubject('');
      setNotes('');
      setFile(null);
      setShowSubmitDialog(false);

      // Refresh data
      fetchData();

    } catch (error) {
      console.error('Error submitting homework:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit homework. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('homework_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
      submitted: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: t.submitted },
      reviewing: { variant: 'default', icon: <Loader2 className="h-3 w-3 animate-spin" />, label: t.reviewing },
      reviewed: { variant: 'outline', icon: <Eye className="h-3 w-3" />, label: t.reviewed },
      needs_improvement: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" />, label: t.needsImprovement },
      completed: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: t.completed },
    };

    const config = statusConfig[status] || statusConfig.submitted;

    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        <Tabs defaultValue="submissions" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="submissions">{t.mySubmissions}</TabsTrigger>
              <TabsTrigger value="notifications" className="relative">
                {t.notifications}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.newSubmission}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t.submitHomework}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="title">{t.homeworkTitle} *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t.titlePlaceholder}
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">{t.subject} *</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectSubject} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {t[s.labelKey as keyof typeof t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">{t.description}</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t.descriptionPlaceholder}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">{t.notes}</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t.notesPlaceholder}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>{t.uploadFile} *</Label>
                    <div className="mt-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {file ? (
                            <>
                              <FileText className="h-8 w-8 text-primary mb-2" />
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">{t.dragDrop}</p>
                              <p className="text-xs text-muted-foreground mt-1">{t.supportedFormats}</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.docx,image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleSubmit}
                    disabled={submitting || !title || !subject || !file}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      t.submit
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t.noSubmissions}</h3>
                  <p className="text-muted-foreground mb-4">{t.startSubmitting}</p>
                  <Button onClick={() => setShowSubmitDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t.newSubmission}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{submission.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {t[submission.subject as keyof typeof t] || submission.subject} • {new Date(submission.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(submission.status)}
                          {submission.points_awarded > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              +{submission.points_awarded}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {submission.description && (
                        <p className="text-sm text-muted-foreground mb-4">{submission.description}</p>
                      )}

                      {submission.feedback && (
                        <div className="space-y-4">
                          {submission.feedback.score !== null && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{t.score}</span>
                                <span className="text-lg font-bold">{submission.feedback.score}/100</span>
                              </div>
                              <Progress value={submission.feedback.score} className="h-2" />
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-medium mb-2">{t.feedback}</h4>
                            <p className="text-sm text-muted-foreground">{submission.feedback.feedback}</p>
                          </div>

                          {submission.feedback.suggestions && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">{t.suggestions}</h4>
                              <p className="text-sm text-muted-foreground">{submission.feedback.suggestions}</p>
                            </div>
                          )}

                          {submission.feedback.corrections && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">{t.corrections}</h4>
                              <p className="text-sm text-muted-foreground">{submission.feedback.corrections}</p>
                            </div>
                          )}

                          {submission.feedback.strengths && submission.feedback.strengths.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">{t.strengths}</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {submission.feedback.strengths.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {submission.feedback.weaknesses && submission.feedback.weaknesses.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">{t.weaknesses}</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {submission.feedback.weaknesses.map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {submission.feedback.additional_exercises && submission.feedback.additional_exercises.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">{t.additionalExercises}</h4>
                              <div className="space-y-2">
                                {submission.feedback.additional_exercises.map((ex, i) => (
                                  <div key={i} className="bg-muted/50 rounded-lg p-3">
                                    <p className="font-medium text-sm">{ex.title}</p>
                                    <p className="text-sm text-muted-foreground">{ex.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!submission.feedback && submission.status === 'reviewing' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">AI is reviewing your homework...</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">{t.noNotifications}</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`transition-colors ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${!notification.is_read ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Bell className={`h-4 w-4 ${!notification.is_read ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
