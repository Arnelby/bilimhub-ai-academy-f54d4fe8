import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowLeft,
  Pause,
  Play,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEYS = {
  answers: "testing58_answers",
  currentPage: "testing58_currentPage",
  startTime: "testing58_startTime",
};

const TOTAL_PAGES = 7;
const TOTAL_QUESTIONS = 30;
const DEFAULT_DURATION_SECONDS = 1800; // 30 minutes

// Cyrillic to English mapping
const CYRILLIC_TO_ENGLISH: Record<string, string> = {
  "А": "A",
  "Б": "B",
  "В": "C",
  "Г": "D",
};

type AnswerOption = "A" | "B" | "C" | "D";

const Testing58Viewer = () => {
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION_SECONDS);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Get signed URL for a file in the tests bucket
  const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("tests")
      .createSignedUrl(path, 300); // 5 minutes validity
    
    if (error || !data?.signedUrl) {
      console.error("Error getting signed URL for", path, error);
      return null;
    }
    return data.signedUrl;
  }, []);

  // Load correct answers from storage and convert Cyrillic to English
  const loadCorrectAnswers = useCallback(async () => {
    try {
      const url = await getSignedUrl("answers_testing58.json");
      if (!url) {
        console.warn("answers_testing58.json not found");
        return;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        console.warn("Failed to fetch answers file");
        return;
      }
      
      const data = await res.json();
      
      // Convert Cyrillic answer keys to English
      const convertedAnswers: Record<string, string> = {};
      Object.keys(data).forEach((key) => {
        const value = data[key];
        convertedAnswers[key] = CYRILLIC_TO_ENGLISH[value] || value;
      });
      
      console.log("Loaded and converted answers:", convertedAnswers);
      setCorrectAnswers(convertedAnswers);
    } catch (err) {
      console.warn("Error loading correct answers:", err);
    }
  }, [getSignedUrl]);

  // Load image for current page
  const loadCurrentImage = useCallback(async (page: number) => {
    setImageLoading(true);
    setError(null);
    
    try {
      const url = await getSignedUrl(`${page}.png`);
      if (!url) {
        setError("Не удалось загрузить страницу");
        setImageUrl(null);
      } else {
        setImageUrl(url);
      }
    } catch (err) {
      setError("Ошибка загрузки изображения");
      setImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  }, [getSignedUrl]);

  // Initialize component
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      // Load saved state from localStorage
      const savedAnswers = localStorage.getItem(STORAGE_KEYS.answers);
      const savedPage = localStorage.getItem(STORAGE_KEYS.currentPage);
      const savedStartTime = localStorage.getItem(STORAGE_KEYS.startTime);
      
      if (savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers));
        } catch {}
      }
      
      if (savedPage) {
        const page = parseInt(savedPage, 10);
        if (!isNaN(page) && page > 0 && page <= TOTAL_PAGES) {
          setCurrentPage(page);
        }
      }
      
      // Calculate remaining time
      if (savedStartTime) {
        const startTime = parseInt(savedStartTime, 10);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = DEFAULT_DURATION_SECONDS - elapsed;
        
        if (remaining <= 0) {
          setTimeLeft(0);
          setIsFinished(true);
          setShowResults(true);
        } else {
          setTimeLeft(remaining);
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.startTime, Date.now().toString());
      }
      
      // Load correct answers
      await loadCorrectAnswers();
      
      setLoading(false);
    };
    
    init();
  }, [loadCorrectAnswers]);

  // Load image when page changes
  useEffect(() => {
    if (!isFinished) {
      loadCurrentImage(currentPage);
    }
  }, [currentPage, loadCurrentImage, isFinished]);

  // Timer countdown
  useEffect(() => {
    if (isFinished || loading || isPaused) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isFinished, loading, isPaused]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle answer selection for a specific question
  const handleSelectAnswer = (questionNum: number, option: AnswerOption) => {
    if (isFinished || isPaused) return;
    
    const newAnswers = { ...answers, [questionNum.toString()]: option };
    setAnswers(newAnswers);
    localStorage.setItem(STORAGE_KEYS.answers, JSON.stringify(newAnswers));
  };

  // Navigate to previous page
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      localStorage.setItem(STORAGE_KEYS.currentPage, newPage.toString());
    }
  };

  // Navigate to next page
  const handleNextPage = () => {
    if (currentPage < TOTAL_PAGES) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      localStorage.setItem(STORAGE_KEYS.currentPage, newPage.toString());
    }
  };

  // Finish test and show results
  const handleFinishTest = () => {
    setIsFinished(true);
    setShowResults(true);
  };

  // Calculate score
  const calculateScore = (): { correct: number; total: number } => {
    let correct = 0;
    
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      const userAnswer = answers[i.toString()];
      const correctAnswer = correctAnswers[i.toString()];
      if (userAnswer && correctAnswer && userAnswer === correctAnswer) {
        correct++;
      }
    }
    
    return { correct, total: TOTAL_QUESTIONS };
  };

  // Reset test
  const handleResetTest = () => {
    localStorage.removeItem(STORAGE_KEYS.answers);
    localStorage.removeItem(STORAGE_KEYS.currentPage);
    localStorage.removeItem(STORAGE_KEYS.startTime);
    setAnswers({});
    setCurrentPage(1);
    setTimeLeft(DEFAULT_DURATION_SECONDS);
    setIsFinished(false);
    setShowResults(false);
    setIsPaused(false);
    localStorage.setItem(STORAGE_KEYS.startTime, Date.now().toString());
  };

  // Pause/Resume test
  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка теста...</p>
        </div>
      </div>
    );
  }

  // Results view
  if (showResults) {
    const { correct, total } = calculateScore();
    const percentage = Math.round((correct / total) * 100);
    
    return (
      <div className="min-h-screen bg-background py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Результаты теста</h1>
                <div className="text-4xl font-bold text-primary mb-2">
                  {correct} / {total}
                </div>
                <Badge 
                  variant={percentage >= 70 ? "default" : percentage >= 50 ? "secondary" : "destructive"}
                  className="text-lg px-4 py-1"
                >
                  {percentage}%
                </Badge>
              </div>
              
              <div className="space-y-3">
                <h2 className="font-semibold text-lg mb-4">Детальные результаты:</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i + 1).map((qNum) => {
                    const userAnswer = answers[qNum.toString()];
                    const correctAnswer = correctAnswers[qNum.toString()];
                    const isCorrect = userAnswer === correctAnswer;
                    
                    return (
                      <div 
                        key={qNum}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg border text-sm",
                          isCorrect 
                            ? "bg-success/10 border-success/30" 
                            : "bg-destructive/10 border-destructive/30"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          <span className="font-medium">{qNum}.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-semibold",
                            isCorrect ? "text-success" : "text-destructive"
                          )}>
                            {userAnswer || "—"}
                          </span>
                          {!isCorrect && correctAnswer && (
                            <span className="text-success font-semibold">
                              ({correctAnswer})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={handleResetTest}
                >
                  <RotateCcw className="h-4 w-4" />
                  Начать заново
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate("/tests")}
                >
                  К списку тестов
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Test view
  const isTimeWarning = timeLeft < 300; // Less than 5 minutes

  return (
    <div className="min-h-screen bg-background py-4 px-2 sm:px-4">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-primary">
            Математика. 1 часть. 2 вариант
          </h1>
          <p className="text-sm text-muted-foreground">
            Количество заданий: {TOTAL_QUESTIONS} • Время: 30 минут
          </p>
        </div>
        
        {/* Test Image with Navigation */}
        <div className="relative mb-6">
          {/* Left Navigation Arrow */}
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 text-muted-foreground hover:text-foreground transition-colors",
              currentPage === 1 && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-8 w-8" />
            <span className="block text-xs">Назад</span>
          </button>

          {/* Image Container */}
          <div className="mx-12 sm:mx-16 border border-border rounded-lg bg-card overflow-hidden">
            {imageLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[400px] text-destructive">
                <p>{error}</p>
              </div>
            ) : imageUrl ? (
              <img 
                src={imageUrl} 
                alt={`Page ${currentPage}`}
                className="w-full h-auto"
              />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <p>Изображение не найдено</p>
              </div>
            )}
          </div>

          {/* Right Navigation Arrow */}
          <button
            onClick={handleNextPage}
            disabled={currentPage === TOTAL_PAGES}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 text-muted-foreground hover:text-foreground transition-colors",
              currentPage === TOTAL_PAGES && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-8 w-8" />
            <span className="block text-xs">Вперед</span>
          </button>
        </div>

        {/* Page Indicator */}
        <div className="text-center mb-6">
          <span className="text-sm text-muted-foreground">
            Страница {currentPage} из {TOTAL_PAGES}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-6"></div>

        {/* Answer Sheet Title */}
        <h2 className="text-center text-primary font-semibold mb-4">
          Математика - бланк ответов
        </h2>

        {/* Answer Sheet Grid - 30 questions */}
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i + 1).map((qNum) => {
            const selectedAnswer = answers[qNum.toString()];
            
            return (
              <div key={qNum} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-sm font-medium">{qNum}</span>
                  <div className="flex gap-0.5 text-xs text-muted-foreground">
                    <span>А</span>
                    <span>Б</span>
                    <span>В</span>
                    <span>Г</span>
                  </div>
                </div>
                <div className="flex justify-center gap-1">
                  {(["A", "B", "C", "D"] as AnswerOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelectAnswer(qNum, option)}
                      disabled={isPaused}
                      className={cn(
                        "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 text-xs font-medium transition-all",
                        selectedAnswer === option
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-foreground",
                        isPaused && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-border my-6"></div>

        {/* Timer and Controls */}
        <div className="text-center space-y-4">
          {/* Pause Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePause}
            className="gap-2"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                Продолжить
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Пауза
              </>
            )}
          </Button>
          
          {/* Timer */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Оставшееся время:</p>
            <div className={cn(
              "text-3xl sm:text-4xl font-mono font-bold",
              isPaused
                ? "text-muted-foreground"
                : isTimeWarning 
                  ? "text-destructive" 
                  : "text-foreground"
            )}>
              <Clock className="inline-block h-6 w-6 mr-2 mb-1" />
              {formatTime(timeLeft)}
              {isPaused && <span className="text-sm ml-2">(Пауза)</span>}
            </div>
          </div>

          {/* Finish Button */}
          <Button
            onClick={handleFinishTest}
            size="lg"
            className="px-8"
          >
            Закончить тест
          </Button>

          {/* Back Link */}
          <div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/tests")}
              className="gap-2 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Вернуться к тестам
            </Button>
          </div>
        </div>

        {/* Pause Modal */}
        <Dialog open={isPaused} onOpenChange={setIsPaused}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pause className="h-5 w-5" />
                Тест на паузе
              </DialogTitle>
              <DialogDescription>
                Таймер остановлен. Вы можете просмотреть свои ответы, но не можете их изменить.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-primary mb-2">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-sm text-muted-foreground">Оставшееся время</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-2">Ваши ответы:</h4>
                <div className="grid grid-cols-6 gap-2 text-sm">
                  {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i + 1).map((qNum) => {
                    const answer = answers[qNum.toString()];
                    return (
                      <div
                        key={qNum}
                        className={cn(
                          "text-center p-1 rounded font-medium",
                          answer ? "bg-primary/20 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                        )}
                      >
                        {qNum}: {answer || "—"}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <Button onClick={handleTogglePause} className="w-full gap-2">
                <Play className="h-4 w-4" />
                Продолжить тест
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Testing58Viewer;
