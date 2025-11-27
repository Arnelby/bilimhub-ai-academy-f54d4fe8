import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Brain, 
  Target, 
  Trophy, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import heroPattern from '@/assets/hero-pattern.png';

export default function Index() {
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

            {/* Right Column - Interactive Card */}
            <div className="animate-slide-up lg:pl-8">
              <Card variant="elevated" className="mx-auto max-w-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="accent">BilimHub</Badge>
                    <span className="text-sm text-muted-foreground">Адаптивный тест (1/8)</span>
                  </div>
                  <CardTitle className="text-lg">Знакомство с пользователем</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Как тебя зовут?</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Введите имя..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Сколько тебе лет?</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Введите возраст..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Когда заканчиваешь школу?</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="2025..."
                    />
                  </div>
                  <Button variant="accent" className="w-full">
                    Далее
                    <ArrowRight className="ml-2 h-4 w-4" />
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
                <Button variant="accent" className="mt-4 w-full">
                  Смотреть полный план
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
