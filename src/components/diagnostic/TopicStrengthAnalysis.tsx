import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

interface TopicScore {
  topic: string;
  score: number; // 0-100%
  questionsTotal: number;
  questionsCorrect: number;
}

interface TopicStrengthAnalysisProps {
  topicScores: TopicScore[];
}

export function TopicStrengthAnalysis({ topicScores }: TopicStrengthAnalysisProps) {
  // Сортировка: слабые сначала
  const sortedTopics = [...topicScores].sort((a, b) => a.score - b.score);
  
  const weakTopics = sortedTopics.filter(t => t.score < 60);
  const mediumTopics = sortedTopics.filter(t => t.score >= 60 && t.score < 80);
  const strongTopics = sortedTopics.filter(t => t.score >= 80);

  const getIcon = (score: number) => {
    if (score < 60) return <TrendingDown className="h-5 w-5 text-destructive" />;
    if (score < 80) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return <TrendingUp className="h-5 w-5 text-green-500" />;
  };

  const getColorClass = (score: number) => {
    if (score < 60) return 'text-destructive';
    if (score < 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (score: number) => {
    if (score < 60) return 'bg-destructive';
    if (score < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Слабые темы */}
      {weakTopics.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <TrendingDown className="h-5 w-5" />
              📉 Слабые темы (требуют внимания)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weakTopics.map((topic, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getIcon(topic.score)}
                    <span className="font-medium">{topic.topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {topic.questionsCorrect}/{topic.questionsTotal}
                    </span>
                    <span className={`font-bold ${getColorClass(topic.score)}`}>
                      {topic.score}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={topic.score} 
                  className={`h-2 ${getProgressColor(topic.score)}`}
                />
              </div>
            ))}
            <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Эти темы будут приоритетом в вашем учебном плане
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Средние темы */}
      {mediumTopics.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              ⚠️ Средний уровень (нужна практика)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mediumTopics.map((topic, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getIcon(topic.score)}
                    <span className="font-medium">{topic.topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {topic.questionsCorrect}/{topic.questionsTotal}
                    </span>
                    <span className={`font-bold ${getColorClass(topic.score)}`}>
                      {topic.score}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={topic.score} 
                  className={`h-2 ${getProgressColor(topic.score)}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Сильные темы */}
      {strongTopics.length > 0 && (
        <Card className="border-green-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              📈 Сильные темы (хорошее владение)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strongTopics.map((topic, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getIcon(topic.score)}
                    <span className="font-medium">{topic.topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {topic.questionsCorrect}/{topic.questionsTotal}
                    </span>
                    <span className={`font-bold ${getColorClass(topic.score)}`}>
                      {topic.score}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={topic.score} 
                  className={`h-2 ${getProgressColor(topic.score)}`}
                />
              </div>
            ))}
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                ✅ Эти темы можно закрепить практикой
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Общая статистика */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Общая статистика</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{weakTopics.length}</div>
            <div className="text-sm text-muted-foreground">Слабых тем</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{mediumTopics.length}</div>
            <div className="text-sm text-muted-foreground">Средний уровень</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{strongTopics.length}</div>
            <div className="text-sm text-muted-foreground">Сильных тем</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
