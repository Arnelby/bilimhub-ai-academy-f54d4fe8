import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, TrendingDown, Minus, Brain, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface TopicMastery {
  id: string;
  topic_id: string;
  mastery: 'mastered' | 'in_progress' | 'weak' | 'not_attempted';
  progress_percentage: number;
  topic: {
    id: string;
    title: string;
    title_ru: string | null;
    parent_topic_id: string | null;
  };
}

const masteryConfig = {
  mastered: {
    color: 'bg-success',
    textColor: 'text-success',
    label: { en: 'Mastered', ru: 'Освоено', kg: 'Өздөштүрүлдү' },
    icon: CheckCircle,
  },
  in_progress: {
    color: 'bg-warning',
    textColor: 'text-warning',
    label: { en: 'In Progress', ru: 'В процессе', kg: 'Иштелүүдө' },
    icon: TrendingUp,
  },
  weak: {
    color: 'bg-destructive',
    textColor: 'text-destructive',
    label: { en: 'Needs Work', ru: 'Нужна работа', kg: 'Иш керек' },
    icon: AlertTriangle,
  },
  not_attempted: {
    color: 'bg-muted',
    textColor: 'text-muted-foreground',
    label: { en: 'Not Started', ru: 'Не начато', kg: 'Башталган жок' },
    icon: Minus,
  },
};

interface MasteryOverviewProps {
  compact?: boolean;
}

export function MasteryOverview({ compact = false }: MasteryOverviewProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [masteryData, setMasteryData] = useState<TopicMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    mastered: 0,
    inProgress: 0,
    weak: 0,
    notAttempted: 0,
    overallProgress: 0,
  });

  useEffect(() => {
    if (user) {
      fetchMasteryData();
    }
  }, [user]);

  async function fetchMasteryData() {
    if (!user) return;
    
    try {
      // Fetch all topics
      const { data: topics } = await supabase
        .from('topics')
        .select('id, title, title_ru, parent_topic_id')
        .eq('subject', 'mathematics')
        .order('order_index');

      // Fetch user progress
      const { data: progress } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', user.id);

      const progressMap = new Map(progress?.map(p => [p.topic_id, p]) || []);

      const combined: TopicMastery[] = (topics || []).map(topic => {
        const userProgress = progressMap.get(topic.id);
        return {
          id: userProgress?.id || topic.id,
          topic_id: topic.id,
          mastery: (userProgress?.mastery as any) || 'not_attempted',
          progress_percentage: userProgress?.progress_percentage || 0,
          topic,
        };
      });

      setMasteryData(combined);

      // Calculate stats
      const mastered = combined.filter(m => m.mastery === 'mastered').length;
      const inProgress = combined.filter(m => m.mastery === 'in_progress').length;
      const weak = combined.filter(m => m.mastery === 'weak').length;
      const notAttempted = combined.filter(m => m.mastery === 'not_attempted').length;
      const totalProgress = combined.reduce((sum, m) => sum + m.progress_percentage, 0);
      const overallProgress = combined.length > 0 ? Math.round(totalProgress / combined.length) : 0;

      setStats({ mastered, inProgress, weak, notAttempted, overallProgress });
    } catch (error) {
      console.error('Error fetching mastery data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getTopicTitle = (topic: { title: string; title_ru: string | null }) => {
    if (language === 'ru' && topic.title_ru) return topic.title_ru;
    return topic.title;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {language === 'ru' ? 'Уровень мастерства' : 'Mastery Level'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold">{stats.overallProgress}%</span>
            <div className="flex gap-2">
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {stats.mastered}
              </Badge>
              <Badge variant="warning" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.inProgress}
              </Badge>
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.weak}
              </Badge>
            </div>
          </div>
          <Progress value={stats.overallProgress} className="h-3" />
          
          {/* Top 3 weak topics */}
          {stats.weak > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Требуют внимания:' : 'Need attention:'}
              </p>
              {masteryData
                .filter(m => m.mastery === 'weak')
                .slice(0, 3)
                .map(m => (
                  <div key={m.topic_id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{getTopicTitle(m.topic)}</span>
                    <span className="text-destructive font-medium">{m.progress_percentage}%</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {language === 'ru' ? 'Дерево мастерства' : 'Mastery Tree'}
        </CardTitle>
        <CardDescription>
          {language === 'ru' 
            ? 'Ваш прогресс по всем темам математики'
            : 'Your progress across all math topics'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <p className="text-2xl font-bold text-success">{stats.mastered}</p>
            <p className="text-xs text-muted-foreground">
              {masteryConfig.mastered.label[language as keyof typeof masteryConfig.mastered.label] || masteryConfig.mastered.label.en}
            </p>
          </div>
          <div className="text-center p-3 bg-warning/10 rounded-lg">
            <p className="text-2xl font-bold text-warning">{stats.inProgress}</p>
            <p className="text-xs text-muted-foreground">
              {masteryConfig.in_progress.label[language as keyof typeof masteryConfig.in_progress.label] || masteryConfig.in_progress.label.en}
            </p>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg">
            <p className="text-2xl font-bold text-destructive">{stats.weak}</p>
            <p className="text-xs text-muted-foreground">
              {masteryConfig.weak.label[language as keyof typeof masteryConfig.weak.label] || masteryConfig.weak.label.en}
            </p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-muted-foreground">{stats.notAttempted}</p>
            <p className="text-xs text-muted-foreground">
              {masteryConfig.not_attempted.label[language as keyof typeof masteryConfig.not_attempted.label] || masteryConfig.not_attempted.label.en}
            </p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>{language === 'ru' ? 'Общий прогресс' : 'Overall Progress'}</span>
            <span className="font-bold">{stats.overallProgress}%</span>
          </div>
          <Progress value={stats.overallProgress} className="h-3" />
        </div>

        {/* Topic grid */}
        <TooltipProvider>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {masteryData.map((item) => {
              const config = masteryConfig[item.mastery];
              const Icon = config.icon;
              
              return (
                <Tooltip key={item.topic_id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`aspect-square rounded-lg ${config.color} flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-medium">{getTopicTitle(item.topic)}</p>
                      <p className="text-sm">{item.progress_percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {config.label[language as keyof typeof config.label] || config.label.en}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
          {Object.entries(masteryConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${config.color}`} />
              <span className="text-muted-foreground">
                {config.label[language as keyof typeof config.label] || config.label.en}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
