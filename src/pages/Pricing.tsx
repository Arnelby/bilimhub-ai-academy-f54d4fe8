import { Link } from 'react-router-dom';
import { Check, X, Zap, Crown, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';

export default function Pricing() {
  const { t } = useTranslation();

  const plans = [
    {
      key: 'free',
      name: t('v2.pricing.plans.freeName'),
      price: '0',
      period: t('v2.pricing.plans.freePeriod'),
      description: t('v2.pricing.plans.freeDescription'),
      features: [
        { text: t('v2.pricing.plans.freeF1'), included: true },
        { text: t('v2.pricing.plans.freeF2'), included: true },
        { text: t('v2.pricing.plans.freeF3'), included: true },
        { text: t('v2.pricing.plans.freeF4'), included: true },
        { text: t('v2.pricing.plans.freeF5'), included: false },
        { text: t('v2.pricing.plans.freeF6'), included: false },
        { text: t('v2.pricing.plans.freeF7'), included: false },
        { text: t('v2.pricing.plans.freeF8'), included: false },
      ],
      cta: t('v2.pricing.plans.freeCta'),
      variant: 'outline' as const,
      popular: false,
    },
    {
      key: 'pro',
      name: t('v2.pricing.plans.proName'),
      price: '500',
      period: t('v2.pricing.plans.proPeriod'),
      description: t('v2.pricing.plans.proDescription'),
      features: [
        { text: t('v2.pricing.plans.proF1'), included: true },
        { text: t('v2.pricing.plans.proF2'), included: true },
        { text: t('v2.pricing.plans.proF3'), included: true },
        { text: t('v2.pricing.plans.proF4'), included: true },
        { text: t('v2.pricing.plans.proF5'), included: true },
        { text: t('v2.pricing.plans.proF6'), included: true },
        { text: t('v2.pricing.plans.proF7'), included: true },
        { text: t('v2.pricing.plans.proF8'), included: true },
      ],
      cta: t('v2.pricing.plans.proCta'),
      variant: 'hero' as const,
      popular: true,
    },
    {
      key: 'yearly',
      name: t('v2.pricing.plans.yearlyName'),
      price: '4000',
      period: t('v2.pricing.plans.yearlyPeriod'),
      description: t('v2.pricing.plans.yearlyDescription'),
      features: [
        { text: t('v2.pricing.plans.yearlyF1'), included: true },
        { text: t('v2.pricing.plans.yearlyF2'), included: true },
        { text: t('v2.pricing.plans.yearlyF3'), included: true },
        { text: t('v2.pricing.plans.yearlyF4'), included: true },
        { text: t('v2.pricing.plans.yearlyF5'), included: true },
        { text: t('v2.pricing.plans.yearlyF6'), included: true },
        { text: t('v2.pricing.plans.yearlyF7'), included: true },
        { text: t('v2.pricing.plans.yearlyF8'), included: true },
      ],
      cta: t('v2.pricing.plans.yearlyCta'),
      variant: 'accent' as const,
      popular: false,
      badge: t('v2.pricing.bestPrice'),
    },
  ];

  const faqs = [
    { question: t('v2.pricing.faq.q1'), answer: t('v2.pricing.faq.a1') },
    { question: t('v2.pricing.faq.q2'), answer: t('v2.pricing.faq.a2') },
    { question: t('v2.pricing.faq.q3'), answer: t('v2.pricing.faq.a3') },
    { question: t('v2.pricing.faq.q4'), answer: t('v2.pricing.faq.a4') },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <Badge variant="accent" className="mb-4">
            <Star className="mr-1 h-3 w-3" />
            {t('v2.pricing.headerBadge')}
          </Badge>
          <h1 className="mb-4 text-4xl font-bold">{t('v2.pricing.headerTitle')}</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('v2.pricing.headerSubtitle')}
          </p>
        </div>

        <div className="mb-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              variant={plan.popular ? 'elevated' : 'default'}
              className={`relative ${plan.popular ? 'border-accent border-2 shadow-xl' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="accent" className="px-4 py-1">
                    <Zap className="mr-1 h-3 w-3" />
                    {t('v2.pricing.popular')}
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
                  <span className="text-muted-foreground"> {t('v2.pricing.perPeriod', { period: plan.period })}</span>
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
                <Button variant={plan.variant} size="lg" className="w-full" asChild>
                  <Link to="/login">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-16 text-center">
          <p className="mb-6 text-muted-foreground">{t('v2.pricing.trustTitle')}</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">95%</p>
              <p className="text-sm text-muted-foreground">{t('v2.pricing.trustImproved')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">4.9/5</p>
              <p className="text-sm text-muted-foreground">{t('v2.pricing.trustRating')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">24/7</p>
              <p className="text-sm text-muted-foreground">{t('v2.pricing.trustSupport')}</p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold">{t('v2.pricing.faqTitle')}</h2>
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
