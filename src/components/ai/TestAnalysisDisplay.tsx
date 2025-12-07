import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  TrendingUp,
  Target,
  Clock,
  Zap
} from 'lucide-react';

interface QuestionAnalysis {
  questionId: string;
  isCorrect: boolean;
  rootCause: string;
  explanation: string;
  subTopic: string;
  recommendedAction: string;
}

interface TopicMastery {
  topicId: string;
  topicName: string;
  masteryPercentage: number;
  status: string;
  weakSubTopics: string[];
  strongSubTopics: string[];
}

interface ErrorPattern {
  pattern: string;
  frequency: number;
  affectedTopics: string[];
  rootCause: string;
  solution: string;
}

interface SkillsAssessment {
  logicReasoning: number;
  problemSolving: number;
  calculationAccuracy: number;
  conceptualUnderstanding: number;
  timeManagement: number;
}

interface ImmediateAction {
  priority: number;
  action: string;
  reason: string;
  estimatedTime: string;
}

interface TestAnalysis {
  overallScore: number;
  performance: string;
  questionAnalysis: QuestionAnalysis[];
  topicMastery: TopicMastery[];
  errorPatterns: ErrorPattern[];
  skillsAssessment: SkillsAssessment;
  immediateActions: ImmediateAction[];
  strengthsIdentified: string[];
  areasForImprovement: string[];
  personalizedFeedback: string;
  motivationalMessage: string;
  nextSteps: {
    lessons: string[];
    practiceAreas: string[];
    miniTestTopics: string[];
  };
}

interface TestAnalysisDisplayProps {
  analysis: TestAnalysis;
}

const rootCauseConfig: Record<string, { label: string; color: string; icon: any }> = {
  none: { label: 'Correct', color: 'success', icon: CheckCircle },
  misunderstanding: { label: 'Misread Question', color: 'warning', icon: AlertTriangle },
  lack_of_knowledge: { label: 'Knowledge Gap', color: 'destructive', icon: XCircle },
  miscalculation: { label: 'Calculation Error', color: 'warning', icon: Zap },
  distraction: { label: 'Too Fast', color: 'secondary', icon: Clock },
  conceptual_gap: { label: 'Concept Gap', color: 'destructive', icon: Brain },
};

const performanceConfig: Record<string, { color: string; label: { en: string; ru: string } }> = {
  excellent: { color: 'success', label: { en: 'Excellent', ru: 'Отлично' } },
  good: { color: 'accent', label: { en: 'Good', ru: 'Хорошо' } },
  average: { color: 'warning', label: { en: 'Average', ru: 'Средне' } },
  weak: { color: 'destructive', label: { en: 'Needs Work', ru: 'Нужна работа' } },
};

export function TestAnalysisDisplay({ analysis }: TestAnalysisDisplayProps) {
  const { language } = useLanguage();

  const performanceInfo = performanceConfig[analysis.performance] || performanceConfig.average;

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {language === 'ru' ? 'AI Анализ теста' : 'AI Test Analysis'}
            </CardTitle>
            <Badge variant={performanceInfo.color as any}>
              {performanceInfo.label[language as keyof typeof performanceInfo.label] || performanceInfo.label.en}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold mb-2">{analysis.overallScore}%</div>
            <p className="text-muted-foreground">{analysis.personalizedFeedback}</p>
          </div>
        </CardContent>
      </Card>

      {/* Skills Assessment */}
      {analysis.skillsAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'ru' ? 'Оценка навыков' : 'Skills Assessment'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analysis.skillsAssessment).map(([skill, value]) => {
                const skillLabels: Record<string, { en: string; ru: string }> = {
                  logicReasoning: { en: 'Logic & Reasoning', ru: 'Логика и рассуждение' },
                  problemSolving: { en: 'Problem Solving', ru: 'Решение задач' },
                  calculationAccuracy: { en: 'Calculation Accuracy', ru: 'Точность вычислений' },
                  conceptualUnderstanding: { en: 'Conceptual Understanding', ru: 'Понимание концепций' },
                  timeManagement: { en: 'Time Management', ru: 'Управление временем' },
                };
                const label = skillLabels[skill] || { en: skill, ru: skill };
                
                return (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{label[language as keyof typeof label] || label.en}</span>
                      <span className="font-medium">{value}%</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Mastery */}
      {analysis.topicMastery?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              {language === 'ru' ? 'Мастерство по темам' : 'Topic Mastery'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.topicMastery.map((topic, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{topic.topicName}</span>
                    <Badge 
                      variant={
                        topic.status === 'mastered' ? 'success' : 
                        topic.status === 'in_progress' ? 'warning' : 'destructive'
                      }
                    >
                      {topic.masteryPercentage}%
                    </Badge>
                  </div>
                  <Progress value={topic.masteryPercentage} className="h-2" />
                  {topic.weakSubTopics?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {topic.weakSubTopics.map((sub, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Patterns */}
      {analysis.errorPatterns?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {language === 'ru' ? 'Паттерны ошибок' : 'Error Patterns'}
            </CardTitle>
            <CardDescription>
              {language === 'ru' 
                ? 'Повторяющиеся ошибки, на которые стоит обратить внимание'
                : 'Recurring errors to pay attention to'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {analysis.errorPatterns.map((pattern, idx) => (
                <AccordionItem key={idx} value={`pattern-${idx}`}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span>{pattern.pattern}</span>
                      <Badge variant="secondary">{pattern.frequency}x</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>{language === 'ru' ? 'Причина:' : 'Root Cause:'}</strong> {pattern.rootCause}</p>
                      <p><strong>{language === 'ru' ? 'Решение:' : 'Solution:'}</strong> {pattern.solution}</p>
                      {pattern.affectedTopics?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pattern.affectedTopics.map((topic, i) => (
                            <Badge key={i} variant="outline">{topic}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Immediate Actions */}
      {analysis.immediateActions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              {language === 'ru' ? 'Срочные действия' : 'Immediate Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.immediateActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                    {action.priority}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{action.action}</p>
                    <p className="text-sm text-muted-foreground">{action.reason}</p>
                  </div>
                  <Badge variant="outline">{action.estimatedTime}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Areas for Improvement */}
      <div className="grid md:grid-cols-2 gap-6">
        {analysis.strengthsIdentified?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                {language === 'ru' ? 'Сильные стороны' : 'Strengths'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengthsIdentified.map((strength, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysis.areasForImprovement?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-warning">
                <TrendingUp className="h-5 w-5" />
                {language === 'ru' ? 'Области для улучшения' : 'Areas for Improvement'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.areasForImprovement.map((area, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-warning" />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Motivation Message */}
      {analysis.motivationalMessage && (
        <Card className="bg-gradient-to-r from-accent/10 to-success/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Lightbulb className="h-6 w-6 text-accent flex-shrink-0" />
              <p className="text-lg font-medium">{analysis.motivationalMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
