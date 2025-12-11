import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, ImageIcon, RotateCcw, Trophy } from 'lucide-react';
import { MiniTestQuestion } from '@/data/mathLessonsData';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdaptiveMiniTestContentProps {
  questions: MiniTestQuestion[];
  topicTitle: string;
}

export function AdaptiveMiniTestContent({ questions, topicTitle }: AdaptiveMiniTestContentProps) {
  const { language } = useLanguage();
  const [currentDifficulty, setCurrentDifficulty] = useState<1 | 2 | 3>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => q.difficulty === currentDifficulty);
  }, [questions, currentDifficulty]);

  const currentQuestion = filteredQuestions[currentIndex % filteredQuestions.length];

  const t = {
    title: language === 'ru' ? 'Адаптивный мини-тест' : language === 'kg' ? 'Адаптивдүү мини-тест' : 'Adaptive Mini-Test',
    question: language === 'ru' ? 'Вопрос' : language === 'kg' ? 'Суроо' : 'Question',
    difficulty: language === 'ru' ? 'Сложность' : language === 'kg' ? 'Татаалдык' : 'Difficulty',
    easy: language === 'ru' ? 'Легко' : language === 'kg' ? 'Жеңил' : 'Easy',
    medium: language === 'ru' ? 'Средне' : language === 'kg' ? 'Орточо' : 'Medium',
    hard: language === 'ru' ? 'Сложно' : language === 'kg' ? 'Татаал' : 'Hard',
    checkAnswer: language === 'ru' ? 'Проверить' : language === 'kg' ? 'Текшерүү' : 'Check Answer',
    next: language === 'ru' ? 'Далее' : language === 'kg' ? 'Кийинки' : 'Next',
    correct: language === 'ru' ? 'Правильно!' : language === 'kg' ? 'Туура!' : 'Correct!',
    incorrect: language === 'ru' ? 'Неправильно' : language === 'kg' ? 'Туура эмес' : 'Incorrect',
    score: language === 'ru' ? 'Счет' : language === 'kg' ? 'Упай' : 'Score',
    restart: language === 'ru' ? 'Начать заново' : language === 'kg' ? 'Кайра баштоо' : 'Start Over',
    complete: language === 'ru' ? 'Тест завершен!' : language === 'kg' ? 'Тест аяктады!' : 'Test Complete!',
  };

  const difficultyLabels: Record<1 | 2 | 3, string> = {
    1: t.easy,
    2: t.medium,
    3: t.hard,
  };

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    setTotalAnswered(prev => prev + 1);

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      // Increase difficulty if doing well
      if (currentDifficulty < 3 && score > 0 && score % 2 === 0) {
        setCurrentDifficulty(prev => Math.min(3, prev + 1) as 1 | 2 | 3);
      }
    } else {
      // Decrease difficulty if struggling
      if (currentDifficulty > 1) {
        setCurrentDifficulty(prev => Math.max(1, prev - 1) as 1 | 2 | 3);
      }
    }
  };

  const nextQuestion = () => {
    if (totalAnswered >= 8) {
      setIsComplete(true);
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const restart = () => {
    setCurrentDifficulty(1);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setTotalAnswered(0);
    setIsComplete(false);
  };

  if (isComplete) {
    const percentage = Math.round((score / totalAnswered) * 100);
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <Trophy className="h-16 w-16 mx-auto text-warning" />
            <h2 className="text-2xl font-bold">{t.complete}</h2>
            <div className="text-4xl font-bold text-primary">
              {score} / {totalAnswered}
            </div>
            <p className="text-muted-foreground">{percentage}%</p>
            <Progress value={percentage} className="max-w-xs mx-auto" />
            <Button onClick={restart} className="mt-4">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t.restart}
            </Button>
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
          <Badge variant="outline">{t.score}: {score}/{totalAnswered}</Badge>
          <Badge 
            variant={currentDifficulty === 1 ? 'secondary' : currentDifficulty === 2 ? 'default' : 'destructive'}
          >
            {t.difficulty}: {difficultyLabels[currentDifficulty]}
          </Badge>
        </div>
      </div>

      <Progress value={(totalAnswered / 8) * 100} className="h-2" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t.question} {totalAnswered + 1}</span>
            <Badge variant="outline">
              {t.difficulty} {currentDifficulty}/3
            </Badge>
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
                variant={selectedAnswer === index ? 'default' : 'outline'}
                className={`justify-start h-auto py-3 px-4 ${
                  showResult && index === currentQuestion.correctAnswer
                    ? 'border-success bg-success/10'
                    : showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer
                    ? 'border-destructive bg-destructive/10'
                    : ''
                }`}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </div>

          {selectedAnswer !== null && !showResult && (
            <Button onClick={checkAnswer} className="w-full">
              {t.checkAnswer}
            </Button>
          )}

          {showResult && (
            <>
              <div className={`p-4 rounded-lg ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? 'bg-success/10 border border-success'
                  : 'bg-destructive/10 border border-destructive'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {selectedAnswer === currentQuestion.correctAnswer ? (
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
                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
              </div>
              <Button onClick={nextQuestion} className="w-full">
                {t.next}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
