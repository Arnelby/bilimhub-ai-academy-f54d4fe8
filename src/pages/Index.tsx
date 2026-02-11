import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Brain, 
  Target, 
  Trophy, 
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
  CheckCircle,
  BookOpenCheck,
  Lightbulb,
  GraduationCap,
  Flame,
  Star,
  Zap,
  Play,
  ChevronRight,
  Award,
  Rocket,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import heroPattern from '@/assets/hero-pattern.png';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Topic slug mapping for URL routing
const topicSlugMap: Record<string, string> = {
  'Algebra Basics': 'algebra',
  'Linear Equations': 'linear-equations',
  'Quadratic Equations': 'quadratics',
  'Functions': 'functions',
  'Geometry Basics': 'geometry',
  'Trigonometry': 'trigonometry',
  'Probability': 'probability',
  'Statistics': 'statistics',
};

const topicEmojis: Record<string, string> = {
  'Algebra Basics': '📐',
  'Linear Equations': '📏',
  'Quadratic Equations': '✖️',
  'Functions': '📈',
  'Geometry Basics': '📐',
  'Trigonometry': '📊',
  'Probability': '🎲',
  'Statistics': '📉',
};

const topicGradients = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-green-500 to-emerald-500',
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-yellow-500',
  'from-teal-500 to-cyan-500',
];

interface DBTopic {
  id: string;
  title: string;
  title_ru: string | null;
  title_kg: string | null;
  subject: string;
  order_index: number | null;
}

// Animated stat circle component
function StatCircle({ 
  value, 
  label, 
  icon: Icon, 
  color, 
  delay = 0 
}: { 
  value: string | number; 
  label: string; 
  icon: React.ElementType; 
  color: string;
  delay?: number;
}) {
  return (
    <div 
      className="flex flex-col items-center gap-2 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn(
        "relative flex h-20 w-20 items-center justify-center rounded-full",
        "bg-gradient-to-br shadow-lg transition-transform hover:scale-110",
        color
      )}>
        <div className="absolute inset-1 rounded-full bg-background/90 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold">{value}</div>
          </div>
        </div>
        <Icon className="absolute -top-1 -right-1 h-6 w-6 text-primary bg-background rounded-full p-1 shadow-md" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// Quick action card with hover effect
function QuickActionCard({ 
  to, 
  icon: Icon, 
  title, 
  description, 
  gradient,
  delay = 0
}: { 
  to: string; 
  icon: React.ElementType; 
  title: string; 
  description: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <Link 
      to={to}
      className="group block animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Card className="h-full overflow-hidden border-2 border-transparent transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1">
        <CardContent className="p-6">
          <div className={cn(
            "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-3",
            gradient
          )}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <h3 className="mb-2 text-lg font-bold group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Открыть <ChevronRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Component for authenticated users - Dashboard Home
function AuthenticatedHome() {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const [topics, setTopics] = useState<DBTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  
  const userName = profile?.name || 'Ученик';
  const userPoints = profile?.points || 0;
  const userStreak = profile?.streak || 0;
  const userLevel = profile?.level || 1;

  const hasProgress = userPoints > 0;
  
  // Calculate progress percentage (mock)
  const progressPercent = Math.min(Math.round((userPoints / 1000) * 100), 100);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('id, title, title_ru, title_kg, subject, order_index')
          .order('order_index', { ascending: true });
        if (!error && data) setTopics(data);
      } catch (e) {
        console.error('Error fetching topics:', e);
      } finally {
        setTopicsLoading(false);
      }
    }
    fetchTopics();
  }, []);

  const getTopicName = (topic: DBTopic) => {
    if (language === 'ru' && topic.title_ru) return topic.title_ru;
    if (language === 'kg' && topic.title_kg) return topic.title_kg;
    return topic.title;
  };

  const getTopicSlug = (topic: DBTopic) => {
    return topicSlugMap[topic.title] || topic.title.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section with Gradient Background */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-background pb-8 pt-8">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          
          <div className="container relative mx-auto px-4">
            {/* Welcome Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-5 animate-fade-in">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                    <GraduationCap className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-success text-white text-xs font-bold shadow-md">
                    {userLevel}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      Привет, {userName}!
                    </h1>
                    <span className="text-3xl animate-bounce">👋</span>
                  </div>
                  <p className="text-muted-foreground mt-1 flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-accent" />
                    Готов покорять математику?
                  </p>
                </div>
              </div>
              
              {/* Quick streak indicator */}
              {userStreak > 0 && (
                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 px-5 py-3 border border-orange-500/20 animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <Flame className="h-8 w-8 text-orange-500 animate-pulse" />
                  <div>
                    <div className="text-2xl font-bold text-orange-500">{userStreak}</div>
                    <div className="text-xs text-muted-foreground">дней подряд 🔥</div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-8 md:gap-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <StatCircle value={userPoints} label="Баллы" icon={Star} color="from-yellow-400 to-orange-500" delay={100} />
              <StatCircle value={userStreak} label="Серия" icon={Flame} color="from-orange-500 to-red-500" delay={200} />
              <StatCircle value={userLevel} label="Уровень" icon={Award} color="from-green-400 to-emerald-500" delay={300} />
              <StatCircle value={`${progressPercent}%`} label="Прогресс" icon={TrendingUp} color="from-blue-400 to-primary" delay={400} />
            </div>

            {/* Main CTA Card */}
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-primary via-primary/90 to-accent shadow-2xl">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl -translate-x-1/2 translate-y-1/2" />
                </div>
                
                <CardContent className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-8">
                  <div className="flex items-center gap-5 text-center md:text-left">
                    <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                        {hasProgress ? 'Продолжить путь к успеху!' : 'Начни свой путь к ОРТ!'}
                      </h2>
                      <p className="text-white/80">
                        {hasProgress 
                          ? 'Ты на правильном пути. Не останавливайся!'
                          : 'Первый шаг к мечте начинается сейчас'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="xl" 
                    className="bg-white text-primary hover:bg-white/90 shadow-lg font-bold px-8"
                    asChild
                  >
                    <Link to="/lessons">
                      <Zap className="mr-2 h-5 w-5" />
                      {hasProgress ? 'Продолжить' : 'Начать!'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Quick Actions Grid */}
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />
                Что изучаем сегодня?
              </h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <QuickActionCard
                to="/lessons"
                icon={BookOpenCheck}
                title="Уроки"
                description="Изучай теорию с примерами и объяснениями"
                gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
                delay={100}
              />
              <QuickActionCard
                to="/tests"
                icon={Target}
                title="Тесты ОРТ"
                description="Практикуйся на реальных заданиях ОРТ"
                gradient="bg-gradient-to-br from-purple-500 to-pink-500"
                delay={200}
              />
              <QuickActionCard
                to="/ai-tutor"
                icon={Brain}
                title="ИИ-репетитор"
                description="Задавай вопросы и получай объяснения"
                gradient="bg-gradient-to-br from-orange-500 to-red-500"
                delay={300}
              />
              <QuickActionCard
                to="/learning-plan"
                icon={Lightbulb}
                title="Мой план"
                description="Персональная траектория обучения"
                gradient="bg-gradient-to-br from-green-500 to-emerald-500"
                delay={400}
              />
            </div>
          </section>

          {/* Topics & Progress Section */}
          <section className="mb-12">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Topics Card */}
              <Card className="lg:col-span-2 overflow-hidden animate-fade-in" style={{ animationDelay: '300ms' }}>
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Доступные темы
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/lessons">
                        Все темы <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {topicsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {topics.map((topic, idx) => (
                        <Link
                          key={topic.id}
                          to={`/lessons/topic/${getTopicSlug(topic)}`}
                          className="group block"
                        >
                          <div className="rounded-xl border-2 border-transparent bg-muted/50 p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:-translate-y-1">
                            <div className="mb-3 text-3xl">{topicEmojis[topic.title] || '📚'}</div>
                            <h4 className="font-semibold group-hover:text-primary transition-colors text-sm">{getTopicName(topic)}</h4>
                            <div className="mt-2">
                              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full bg-gradient-to-r transition-all", topicGradients[idx % topicGradients.length])}
                                  style={{ width: '0%' }}
                                />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Achievements Preview */}
              <Card className="overflow-hidden animate-fade-in" style={{ animationDelay: '400ms' }}>
                <CardHeader className="border-b bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Достижения
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: '🎯', name: 'Первый тест', unlocked: true },
                      { icon: '🔥', name: '3 дня подряд', unlocked: userStreak >= 3 },
                      { icon: '⭐', name: '100 баллов', unlocked: userPoints >= 100 },
                      { icon: '📚', name: 'Первый урок', unlocked: true },
                      { icon: '🏆', name: 'Топ-10', unlocked: false },
                      { icon: '💯', name: 'Отличник', unlocked: false },
                    ].map((badge, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl p-3 text-center transition-transform hover:scale-105",
                          badge.unlocked ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20" : "bg-muted/50 opacity-50"
                        )}
                      >
                        <span className={cn("text-2xl mb-1", !badge.unlocked && "grayscale")}>{badge.icon}</span>
                        <span className="text-xs font-medium">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/profile">
                      Все достижения <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Quick Links Row */}
          <section className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { to: '/homework', icon: CheckCircle, label: 'Домашка' },
                { to: '/dashboard', icon: TrendingUp, label: 'Панель' },
                { to: '/profile', icon: GraduationCap, label: 'Профиль' },
                { to: '/tests/testing58', icon: Clock, label: 'ОРТ Тест' },
              ].map((link, idx) => (
                <Button 
                  key={link.to}
                  variant="outline" 
                  className="gap-2 rounded-full px-5"
                  asChild
                >
                  <Link to={link.to}>
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

// Component for guests - Landing Page
function GuestLanding() {
  const { t } = useLanguage();

  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: t.landing.features.ortTests.title,
      description: t.landing.features.ortTests.description,
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: t.landing.features.aiPlan.title,
      description: t.landing.features.aiPlan.description,
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: t.landing.features.resources.title,
      description: t.landing.features.resources.description,
    },
  ];

  const subjects = [
    { name: t.common.mathematics, progress: 20 },
    { name: 'Аналогия', progress: 12 },
    { name: 'Чтение и понимание', progress: 23 },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-pattern py-20 lg:py-32">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${heroPattern})`, backgroundSize: 'cover' }}
        />
        <div className="container relative mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Column - Content */}
            <div className="animate-fade-in">
              <Badge variant="accent" className="mb-4">
                <Sparkles className="mr-1 h-3 w-3" />
                AI-Powered Learning
              </Badge>
              <h1 className="mb-6 text-4xl font-bold leading-tight lg:text-5xl xl:text-6xl">
                {t.landing.hero.title}{' '}
                <span className="gradient-text">{t.landing.hero.titleHighlight}</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground lg:text-xl">
                {t.landing.hero.subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/signup">
                    {t.landing.hero.cta}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/pricing">{t.landing.hero.ctaSecondary}</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-12 flex flex-wrap gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">+1200</div>
                  <div className="text-sm text-muted-foreground">{t.landing.stats.questions}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">+7</div>
                  <div className="text-sm text-muted-foreground">{t.landing.stats.subjects}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">500 KGS</div>
                  <div className="text-sm text-muted-foreground">{t.landing.stats.price}</div>
                </div>
              </div>
            </div>

            {/* Right Column - Feature Preview */}
            <div className="animate-slide-up lg:pl-8">
              <Card variant="elevated" className="mx-auto max-w-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="accent">BilimHub</Badge>
                    <span className="text-sm text-muted-foreground">ИИ-план обучения</span>
                  </div>
                  <CardTitle className="text-lg">Персональный прогресс</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subjects.map((subject, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{subject.name}</span>
                        <span className="text-sm text-muted-foreground">{subject.progress}%</span>
                      </div>
                      <Progress value={subject.progress} className="h-2" />
                    </div>
                  ))}
                  <Button variant="accent" className="w-full" asChild>
                    <Link to="/signup">
                      Начать обучение
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* AI Plan Preview Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left - Info */}
            <div>
              <h2 className="mb-4 text-3xl font-bold lg:text-4xl">BilimHub</h2>
              <p className="mb-6 text-lg text-muted-foreground">
                Готовьтесь к ОРТ с ИИ-планами обучения. Персональные траектории, умная практика и реальный прогресс для старшеклассников Кыргызстана.
              </p>
              <Button variant="outline" asChild>
                <Link to="/tests">
                  Перейти к тестам
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right - AI Plan Card */}
            <Card variant="elevated" className="mx-auto w-full max-w-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <Brain className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle>Ваш ИИ-план</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjects.map((subject, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{subject.name}</span>
                      <span className="text-sm text-muted-foreground">{subject.progress}%</span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                ))}
                <Button variant="accent" className="mt-4 w-full" asChild>
                  <Link to="/signup">Смотреть полный план</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              {t.landing.features.title}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                variant="interactive"
                className="text-center"
              >
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <Card variant="gradient" className="overflow-hidden">
            <CardContent className="flex flex-col items-center gap-8 p-8 lg:flex-row lg:justify-between lg:p-12">
              <div className="text-center lg:text-left">
                <h2 className="mb-2 text-2xl font-bold lg:text-3xl">
                  {t.landing.cta.title}
                </h2>
                <p className="text-primary-foreground/80">
                  {t.landing.cta.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="glass" size="lg" asChild>
                  <Link to="/signup">{t.landing.cta.createProfile}</Link>
                </Button>
                <Button variant="glass" size="lg" asChild>
                  <Link to="/pricing">{t.landing.cta.learnMore}</Link>
                </Button>
              </div>
              <div className="hidden items-center gap-6 lg:flex">
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <Target className="h-5 w-5" />
                  <span>Цели</span>
                </div>
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <Clock className="h-5 w-5" />
                  <span>График</span>
                </div>
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <Brain className="h-5 w-5" />
                  <span>ИИ</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // Show authenticated home for logged-in users, landing page for guests
  return user ? <AuthenticatedHome /> : <GuestLanding />;
}
