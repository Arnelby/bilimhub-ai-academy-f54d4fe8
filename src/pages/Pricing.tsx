import { Link } from 'react-router-dom';
import { 
  Check, 
  X,
  Zap,
  Crown,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';

const plans = [
  {
    name: 'Бесплатный',
    price: '0',
    period: 'навсегда',
    description: 'Начните свой путь к успеху',
    features: [
      { text: 'Доступ к 5 пробным тестам', included: true },
      { text: 'Базовые уроки', included: true },
      { text: 'Ограниченный AI чат (10 сообщений/день)', included: true },
      { text: 'Базовая статистика', included: true },
      { text: 'AI-генерация уроков', included: false },
      { text: 'Персональный план обучения', included: false },
      { text: 'Детальная аналитика', included: false },
      { text: 'Без рекламы', included: false },
    ],
    cta: 'Начать бесплатно',
    variant: 'outline' as const,
    popular: false,
  },
  {
    name: 'PRO',
    price: '500',
    period: 'месяц',
    description: 'Всё для серьёзной подготовки к ОРТ',
    features: [
      { text: 'Неограниченные тесты ОРТ', included: true },
      { text: 'Все уроки по всем предметам', included: true },
      { text: 'Неограниченный AI чат', included: true },
      { text: 'AI-генерация уроков', included: true },
      { text: 'Персональный план обучения', included: true },
      { text: 'Детальная аналитика и отчёты', included: true },
      { text: 'Приоритетная поддержка', included: true },
      { text: 'Без рекламы', included: true },
    ],
    cta: 'Получить PRO',
    variant: 'hero' as const,
    popular: true,
  },
  {
    name: 'PRO Годовой',
    price: '4000',
    period: 'год',
    description: 'Сэкономьте 33% с годовой подпиской',
    features: [
      { text: 'Всё из PRO плана', included: true },
      { text: 'Экономия 2000 сом', included: true },
      { text: 'Эксклюзивные материалы', included: true },
      { text: 'Ранний доступ к новым функциям', included: true },
      { text: 'Персональный наставник (1 консультация/мес)', included: true },
      { text: 'Сертификат о прохождении', included: true },
      { text: 'VIP поддержка', included: true },
      { text: 'Без рекламы', included: true },
    ],
    cta: 'Получить PRO Годовой',
    variant: 'accent' as const,
    popular: false,
    badge: 'Лучшая цена',
  },
];

const faqs = [
  {
    question: 'Могу ли я отменить подписку?',
    answer: 'Да, вы можете отменить подписку в любое время. Доступ сохранится до конца оплаченного периода.',
  },
  {
    question: 'Какие способы оплаты поддерживаются?',
    answer: 'Мы принимаем банковские карты (Visa, MasterCard), Элсом, О! Деньги и Balance.kg.',
  },
  {
    question: 'Есть ли пробный период для PRO?',
    answer: 'Да! При первой подписке вы получаете 7 дней бесплатного доступа к PRO функциям.',
  },
  {
    question: 'Можно ли использовать на нескольких устройствах?',
    answer: 'Да, ваш аккаунт работает на любом количестве устройств одновременно.',
  },
];

export default function Pricing() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge variant="accent" className="mb-4">
            <Star className="mr-1 h-3 w-3" />
            Тарифные планы
          </Badge>
          <h1 className="mb-4 text-4xl font-bold">
            Выберите подходящий план
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Начните бесплатно и перейдите на PRO когда будете готовы к серьёзной подготовке к ОРТ
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mb-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              variant={plan.popular ? 'elevated' : 'default'}
              className={`relative ${plan.popular ? 'border-accent border-2 shadow-xl' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="accent" className="px-4 py-1">
                    <Zap className="mr-1 h-3 w-3" />
                    Популярный
                  </Badge>
                </div>
              )}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="success" className="px-4 py-1">
                    <Crown className="mr-1 h-3 w-3" />
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> KGS/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 shrink-0 text-success" />
                      ) : (
                        <X className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <span className={feature.included ? '' : 'text-muted-foreground'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.variant}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link to="/signup">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mb-16 text-center">
          <p className="mb-6 text-muted-foreground">Нам доверяют более 5000 студентов</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">95%</p>
              <p className="text-sm text-muted-foreground">Улучшили результаты</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">4.9/5</p>
              <p className="text-sm text-muted-foreground">Рейтинг студентов</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">24/7</p>
              <p className="text-sm text-muted-foreground">AI поддержка</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold">Часто задаваемые вопросы</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
