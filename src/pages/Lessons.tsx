import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BookOpen, Video, Lock, Loader2, ChevronDown, ChevronRight, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { VideoEmbed } from '@/components/lessons/storage/VideoEmbed';
import { TEST_CONFIG } from '@/lib/mathTestConfig';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface VideoSolution {
  id: string;
  test_id: string;
  question_number: number;
  youtube_url: string;
}

const VARIANT_CONFIG = [
  { variantKey: 'variant1', testConfigId: 1, label: 'Математика тест вариант 1' },
  { variantKey: 'variant2', testConfigId: 2, label: 'Математика тест вариант 2' },
  { variantKey: 'variant3', testConfigId: 3, label: 'Математика тест вариант 3' },
  { variantKey: 'variant4', testConfigId: 4, label: 'Математика тест вариант 4' },
];

// Map math_test_X → variantX
function testIdToVariantKey(testId: string): string | null {
  const match = testId.match(/^math_test_(\d+)$/);
  if (match) return `variant${match[1]}`;
  // Also check UUID-based test_ids from TEST_CONFIG
  for (const [num, cfg] of Object.entries(TEST_CONFIG)) {
    if (cfg.uuid === testId) return `variant${num}`;
  }
  return null;
}

export default function Lessons() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoSolution[]>([]);
  const [completedVariants, setCompletedVariants] = useState<Set<string>>(new Set());
  const [openVariant, setOpenVariant] = useState<string>('');
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Read scroll-to params from URL
  const scrollVariant = searchParams.get('variant');
  const scrollQuestion = searchParams.get('question');

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function fetchData() {
      const [videosRes, testsRes] = await Promise.all([
        supabase.from('video_solutions').select('*').order('question_number'),
        supabase.from('user_tests').select('test_id').eq('user_id', user!.id).not('completed_at', 'is', null),
      ]);

      setVideos((videosRes.data as VideoSolution[]) || []);

      // Also check user_answers for math_test_X completions
      const { data: answerTests } = await supabase
        .from('user_answers')
        .select('test_id')
        .eq('user_id', user!.id);

      const completed = new Set<string>();
      
      // From user_tests (UUID-based)
      for (const t of (testsRes.data || [])) {
        const vk = testIdToVariantKey(t.test_id);
        if (vk) completed.add(vk);
      }
      
      // From user_answers (math_test_X based)
      const answerTestIds = new Set((answerTests || []).map(a => a.test_id));
      for (const tid of answerTestIds) {
        const vk = testIdToVariantKey(tid);
        if (vk) completed.add(vk);
      }

      setCompletedVariants(completed);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  // Auto-open and scroll to specific question
  useEffect(() => {
    if (scrollVariant && !loading) {
      setOpenVariant(scrollVariant);
      
      if (scrollQuestion) {
        const refKey = `${scrollVariant}-${scrollQuestion}`;
        setTimeout(() => {
          questionRefs.current[refKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
      }
    }
  }, [scrollVariant, scrollQuestion, loading]);

  const getVideosForVariant = (variantKey: string) => {
    return videos.filter(v => v.test_id === variantKey).sort((a, b) => a.question_number - b.question_number);
  };

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
            {language === 'ru' ? 'Видеоразборы' : language === 'kg' ? 'Видео чечмелер' : 'Video Solutions'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ru' 
              ? 'Пройдите тест, чтобы разблокировать видеоразборы задач' 
              : language === 'kg' 
                ? 'Видео чечмелерди ачуу үчүн тестти тапшырыңыз' 
                : 'Complete a test to unlock video explanations'}
          </p>
        </div>

        <Accordion 
          type="single" 
          collapsible 
          value={openVariant} 
          onValueChange={setOpenVariant}
          className="space-y-4"
        >
          {VARIANT_CONFIG.map(({ variantKey, testConfigId, label }) => {
            const isUnlocked = completedVariants.has(variantKey);
            const variantVideos = getVideosForVariant(variantKey);
            const hasVideos = variantVideos.length > 0;

            return (
              <AccordionItem key={variantKey} value={variantKey} className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={`px-6 py-4 hover:no-underline ${!isUnlocked ? 'opacity-60' : ''}`}
                  disabled={!isUnlocked}
                >
                  <div className="flex items-center gap-3 text-left">
                    {isUnlocked ? (
                      <Video className="h-5 w-5 text-accent shrink-0" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-base">{label}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {isUnlocked ? (
                          <Badge variant="secondary" className="text-xs">
                            {hasVideos ? `${variantVideos.length} видео` : 'Скоро'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {language === 'ru' ? 'Пройдите тест' : 'Complete test'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                {isUnlocked && (
                  <AccordionContent className="px-6 pb-6">
                    {hasVideos ? (
                      <div className="space-y-6">
                        {variantVideos.map((video) => (
                          <div 
                            key={video.id}
                            ref={(el) => { questionRefs.current[`${variantKey}-${video.question_number}`] = el; }}
                            className={`rounded-lg border p-4 ${
                              scrollVariant === variantKey && scrollQuestion === String(video.question_number)
                                ? 'ring-2 ring-accent'
                                : ''
                            }`}
                          >
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                              <Play className="h-4 w-4 text-accent" />
                              {language === 'ru' ? 'Задача' : 'Question'} {video.question_number}
                            </h3>
                            <VideoEmbed url={video.youtube_url} title={`${label} — Задача ${video.question_number}`} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Video className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>{language === 'ru' ? 'Видеоразборы скоро будут добавлены' : 'Video solutions coming soon'}</p>
                      </div>
                    )}
                  </AccordionContent>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </Layout>
  );
}
