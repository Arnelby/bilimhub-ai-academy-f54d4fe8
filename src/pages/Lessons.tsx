import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Lock, Loader2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TEST_CONFIG } from '@/lib/mathTestConfig';

interface VideoCount {
  test_id: string;
  count: number;
}

const VARIANT_CONFIG = [
  { variantKey: 'variant1', testConfigId: 1, label: 'Математика тест вариант 1' },
  { variantKey: 'variant2', testConfigId: 2, label: 'Математика тест вариант 2' },
  { variantKey: 'variant3', testConfigId: 3, label: 'Математика тест вариант 3' },
  { variantKey: 'variant4', testConfigId: 4, label: 'Математика тест вариант 4' },
];

function testIdToVariantKey(testId: string): string | null {
  const match = testId.match(/^math_test_(\d+)$/);
  if (match) return `variant${match[1]}`;
  for (const [num, cfg] of Object.entries(TEST_CONFIG)) {
    if (cfg.uuid === testId) return `variant${num}`;
  }
  return null;
}

export default function Lessons() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});
  const [completedVariants, setCompletedVariants] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function fetchData() {
      const [videosRes, testsRes, answersRes] = await Promise.all([
        supabase.from('video_solutions').select('test_id'),
        supabase.from('user_tests').select('test_id').eq('user_id', user!.id).not('completed_at', 'is', null),
        supabase.from('user_answers').select('test_id').eq('user_id', user!.id),
      ]);

      // Count videos per variant
      const counts: Record<string, number> = {};
      for (const v of (videosRes.data || [])) {
        counts[v.test_id] = (counts[v.test_id] || 0) + 1;
      }
      setVideoCounts(counts);

      // Determine completed variants
      const completed = new Set<string>();
      for (const t of (testsRes.data || [])) {
        const vk = testIdToVariantKey(t.test_id);
        if (vk) completed.add(vk);
      }
      const answerTestIds = new Set((answersRes.data || []).map(a => a.test_id));
      for (const tid of answerTestIds) {
        const vk = testIdToVariantKey(tid);
        if (vk) completed.add(vk);
      }
      setCompletedVariants(completed);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {language === 'ru' ? 'Видеоразборы задач' : language === 'kg' ? 'Тапшырмалардын видео чечмелери' : 'Video Solutions'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ru'
              ? 'Пройдите тест, чтобы разблокировать видеоразборы'
              : language === 'kg'
                ? 'Видео чечмелерди ачуу үчүн тестти тапшырыңыз'
                : 'Complete a test to unlock video solutions'}
          </p>
        </div>

        <div className="space-y-4">
          {VARIANT_CONFIG.map(({ variantKey, label }) => {
            const isUnlocked = completedVariants.has(variantKey);
            const count = videoCounts[variantKey] || 0;

            return (
              <Card
                key={variantKey}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${!isUnlocked ? 'opacity-60' : ''}`}
                onClick={() => navigate(`/lessons/${variantKey}`)}
              >
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    {isUnlocked ? (
                      <Video className="h-6 w-6 text-accent shrink-0" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-base">{label}</p>
                      <Badge variant={isUnlocked ? 'secondary' : 'outline'} className="text-xs mt-1">
                        {isUnlocked
                          ? (count > 0 ? `${count} видеоразборов` : 'Скоро')
                          : (language === 'ru' ? 'Пройдите тест' : 'Complete test')}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
