import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, ImageIcon, Trophy, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { FullTestQuestion } from '@/data/mathLessonsData';
import { useLanguage } from '@/contexts/LanguageContext';

interface FullTestContentProps {
  questions: FullTestQuestion[];
  topicTitle: string;
}

export function FullTestContent({ questions, topicTitle }: FullTestContentProps) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const t = {
    title: language === 'ru' ? 'Полный тест' : language === 'kg' ? 'Толук тест' : 'Full Test',
    question: language === 'ru' ? 'Вопрос' : language === 'kg' ? 'Суроо' : 'Question',
    submit: language === 'ru' ? 'Завершить тест' : language === 'kg' ? 'Тестти аяктоо' : 'Submit Test',
    results: language === 'ru' ? 'Результаты' : language === 'kg' ? 'Жыйынтыктар' : 'Results',
    score: language === 'ru' ? 'Ваш балл' : language === 'kg' ? 'Сиздин упай' : 'Your Score',
    recommendations: language === 'ru' ? 'Рекомендации' : language === 'kg' ? 'Сунуштар' : 'Recommendations',
    reviewAnswers: language === 'ru' ? 'Просмотр ответов' : language === 'kg' ? 'Жоопторду көрүү' : 'Review Answers',
    prev: language === 'ru' ? 'Назад' : language === 'kg' ? 'Артка' : 'Previous',
    next: language === 'ru' ? 'Далее' : language === 'kg' ? 'Кийинки' : 'Next',
    answered: language === 'ru' ? 'Отвечено' : language === 'kg' ? 'Жооп берилди' : 'Answered',
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctAnswer ? 1 : 0), 0);

  const handleAnswer = (answerIndex: number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answerIndex }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    const percentage = Math.round((score / questions.length) * 100);
    const wrongTopics = questions
      .filter(q => answers[q.id] !== q.correctAnswer)
      .map(q => q.topic);
    const uniqueWrongTopics = [...new Set(wrongTopics)];

    return (
      <div className="space-y-6">
        <Card className="text-center py-8">
          <CardContent className="space-y-6">
            <Trophy className={`h-16 w-16 mx-auto ${percentage >= 70 ? 'text-warning' : 'text-muted-foreground'}`} />
            <h2 className="text-2xl font-bold">{t.results}</h2>
            <div className="text-4xl font-bold text-primary">
              {score} / {questions.length}
            </div>
            <p className="text-muted-foreground">{percentage}%</p>
            <Progress value={percentage} className="max-w-xs mx-auto" />
          </CardContent>
        </Card>

        {uniqueWrongTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.recommendations}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                {language === 'ru' 
                  ? 'Рекомендуем повторить следующие темы:' 
                  : 'We recommend reviewing these topics:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {uniqueWrongTopics.map((topic, index) => (
                  <Badge key={index} variant="destructive">{topic}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t.reviewAnswers}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, index) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">{index + 1}. {q.question}</p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ru' ? 'Ваш ответ:' : 'Your answer:'} {q.options[answers[q.id]] || '-'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-success mt-1">
                          {language === 'ru' ? 'Правильный ответ:' : 'Correct answer:'} {q.options[q.correctAnswer]}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{topicTitle}: {t.title}</h2>
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            <Clock className="h-3.5 w-3.5 mr-1" />
            30:00
          </Badge>
          <Badge variant="secondary">
            {t.answered}: {answeredCount}/{questions.length}
          </Badge>
        </div>
      </div>

      <Progress value={(answeredCount / questions.length) * 100} className="h-2" />

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, index) => (
          <Button
            key={q.id}
            variant={currentIndex === index ? 'default' : answers[q.id] !== undefined ? 'secondary' : 'outline'}
            size="sm"
            className="w-8 h-8 p-0"
            onClick={() => setCurrentIndex(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t.question} {currentIndex + 1} / {questions.length}</span>
            <Badge variant="outline">{currentQuestion.topic}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-medium">{currentQuestion.question}</p>
          
          {currentQuestion.imagePlaceholder && (
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center bg-muted/20">
              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">{currentQuestion.imagePlaceholder}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={answers[currentQuestion.id] === index ? 'default' : 'outline'}
                className="justify-start h-auto py-3 px-4"
                onClick={() => handleAnswer(index)}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t.prev}
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentIndex(prev => prev + 1)}
              >
                {t.next}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={answeredCount < questions.length}>
                {t.submit}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
