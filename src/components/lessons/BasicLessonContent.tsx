import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ImageIcon } from 'lucide-react';
import { BasicLessonContent as BasicLessonData } from '@/data/mathLessonsData';
import { useLanguage } from '@/contexts/LanguageContext';

interface BasicLessonContentProps {
  content: BasicLessonData;
  topicTitle: string;
}

export function BasicLessonContent({ content, topicTitle }: BasicLessonContentProps) {
  const { language } = useLanguage();
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number | null>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setPracticeAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const checkAnswer = (questionId: string) => {
    setShowResults(prev => ({ ...prev, [questionId]: true }));
  };

  const t = {
    theory: language === 'ru' ? 'Теория' : language === 'kg' ? 'Теория' : 'Theory',
    examples: language === 'ru' ? 'Примеры' : language === 'kg' ? 'Мисалдар' : 'Examples',
    practice: language === 'ru' ? 'Практика' : language === 'kg' ? 'Практика' : 'Practice',
    checkAnswer: language === 'ru' ? 'Проверить' : language === 'kg' ? 'Текшерүү' : 'Check Answer',
    correct: language === 'ru' ? 'Правильно!' : language === 'kg' ? 'Туура!' : 'Correct!',
    incorrect: language === 'ru' ? 'Неправильно' : language === 'kg' ? 'Туура эмес' : 'Incorrect',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{topicTitle}</h2>
        <Badge variant="secondary">📚 {t.theory}</Badge>
      </div>

      <Tabs defaultValue="theory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="theory">{t.theory}</TabsTrigger>
          <TabsTrigger value="examples">{t.examples}</TabsTrigger>
          <TabsTrigger value="practice">{t.practice}</TabsTrigger>
        </TabsList>

        <TabsContent value="theory" className="space-y-4 mt-4">
          {content.theory.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground whitespace-pre-line">{section.content}</p>
                {section.imagePlaceholder && (
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/20">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{section.imagePlaceholder}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="examples" className="space-y-4 mt-4">
          {content.examples.map((example) => (
            <Card key={example.id}>
              <CardHeader>
                <CardTitle className="text-lg">{example.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
                  {example.content}
                </pre>
                {example.imagePlaceholder && (
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/20">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{example.imagePlaceholder}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="practice" className="space-y-4 mt-4">
          {content.practiceQuestions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {language === 'ru' ? 'Вопрос' : language === 'kg' ? 'Суроо' : 'Question'} {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium">{question.question}</p>
                {question.imagePlaceholder && (
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center bg-muted/20">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">{question.imagePlaceholder}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {question.options.map((option, optIndex) => (
                    <Button
                      key={optIndex}
                      variant={practiceAnswers[question.id] === optIndex ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => handleAnswer(question.id, optIndex)}
                      disabled={showResults[question.id]}
                    >
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </Button>
                  ))}
                </div>
                {practiceAnswers[question.id] !== undefined && !showResults[question.id] && (
                  <Button onClick={() => checkAnswer(question.id)} className="w-full">
                    {t.checkAnswer}
                  </Button>
                )}
                {showResults[question.id] && (
                  <div className={`p-4 rounded-lg ${
                    practiceAnswers[question.id] === question.correctAnswer
                      ? 'bg-success/10 border border-success'
                      : 'bg-destructive/10 border border-destructive'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {practiceAnswers[question.id] === question.correctAnswer ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="font-medium text-success">{t.correct}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-destructive" />
                          <span className="font-medium text-destructive">{t.incorrect}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
