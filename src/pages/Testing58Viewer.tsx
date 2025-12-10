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
  RotateCcw,
  Flag
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

const DEFAULT_DURATION_SECONDS = 1800; // 30 minutes

const FALLBACK_ANSWERS: Record<string, string> = {
  "1": "A", "2": "B", "3": "C", "4": "D", 
  "5": "A", "6": "B", "7": "C"
};

type AnswerOption = "A" | "B" | "C" | "D";

const Testing58Viewer = () => {
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
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
    
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }, []);

  // Detect total pages by listing files in storage
  const detectTotalPages = useCallback(async (): Promise<number> => {
    try {
      const { data, error } = await supabase.storage
        .from("tests")
        .list("", { limit: 100 });
      
      if (error || !data) {
        console.error("Error listing files:", error);
        return 7; // Fallback to known count
      }
      
      // Count PNG files that match numeric pattern
      const pngFiles = data.filter(file => /^\d+\.png$/.test(file.name));
      return pngFiles.length || 7;
    } catch (err) {
      console.error("Error detecting pages:", err);
      return 7; // Fallback
    }
  }, []);

  // Load correct answers from storage
  const loadCorrectAnswers = useCallback(async () => {
    try {
      const url = await getSignedUrl("answers_testing58.json");
      if (!url) {
        console.warn("answers_testing58.json not found, using fallback");
        setCorrectAnswers(FALLBACK_ANSWERS);
        return;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        console.warn("Failed to fetch answers file, using fallback");
        setCorrectAnswers(FALLBACK_ANSWERS);
        return;
      }
      
      const data = await res.json();
      setCorrectAnswers(data);
    } catch (err) {
      console.warn("Error loading correct answers, using fallback:", err);
      setCorrectAnswers(FALLBACK_ANSWERS);
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
        if (!isNaN(page) && page > 0) {
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
      
      // Detect total pages
      const pages = await detectTotalPages();
      setTotalPages(pages);
      
      // Load correct answers
      await loadCorrectAnswers();
      
      setLoading(false);
    };
    
    init();
  }, [detectTotalPages, loadCorrectAnswers]);

  // Load image when page changes
  useEffect(() => {
    if (totalPages > 0 && !isFinished) {
      loadCurrentImage(currentPage);
    }
  }, [currentPage, totalPages, loadCurrentImage, isFinished]);

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

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle answer selection
  const handleSelectAnswer = (option: AnswerOption) => {
    if (isFinished) return;
    
    const newAnswers = { ...answers, [currentPage.toString()]: option };
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
    if (currentPage < totalPages) {
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
    const total = totalPages;
    
    for (let i = 1; i <= totalPages; i++) {
      const userAnswer = answers[i.toString()];
      const correctAnswer = correctAnswers[i.toString()];
      if (userAnswer && correctAnswer && userAnswer === correctAnswer) {
        correct++;
      }
    }
    
    return { correct, total };
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

  if (totalPages === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Тест не найден</h2>
            <p className="text-muted-foreground mb-4">
              Не удалось загрузить страницы теста
            </p>
            <Button onClick={() => navigate("/tests")}>
              Вернуться к тестам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results view
  if (showResults) {
    const { correct, total } = calculateScore();
    const percentage = Math.round((correct / total) * 100);
    
    return (
      <div className="min-h-screen bg-background py-6 px-4">
        <div className="max-w-3xl mx-auto">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const userAnswer = answers[pageNum.toString()];
                  const correctAnswer = correctAnswers[pageNum.toString()];
                  const isCorrect = userAnswer === correctAnswer;
                  
                  return (
                    <div 
                      key={pageNum}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        isCorrect 
                          ? "bg-success/10 border-success/30" 
                          : "bg-destructive/10 border-destructive/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-medium">Вопрос {pageNum}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Ваш ответ: </span>
                          <span className={cn(
                            "font-semibold",
                            isCorrect ? "text-success" : "text-destructive"
                          )}>
                            {userAnswer || "—"}
                          </span>
                        </div>
                        {!isCorrect && correctAnswer && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Правильный: </span>
                            <span className="font-semibold text-success">{correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-4 mt-8">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={handleResetTest}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restart Test
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
  const selectedAnswer = answers[currentPage.toString()];
  const isTimeWarning = timeLeft < 300; // Less than 5 minutes

  return (
    <div className="min-h-screen bg-background py-4 px-4">
      <div className="max-w-[920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/tests")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePause}
              className="gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              )}
            </Button>
            
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold",
              isPaused
                ? "bg-muted text-muted-foreground"
                : isTimeWarning 
                  ? "bg-destructive/10 text-destructive" 
                  : "bg-muted text-foreground"
            )}>
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
              {isPaused && <span className="text-xs ml-1">(Paused)</span>}
            </div>
          </div>
        </div>
        
        {/* Pause Modal */}
        <Dialog open={isPaused} onOpenChange={setIsPaused}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pause className="h-5 w-5" />
                Test Paused
              </DialogTitle>
              <DialogDescription>
                The timer has been paused. You can view your current answers but cannot change them while paused.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-primary mb-2">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-sm text-muted-foreground">Time remaining</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-2">Your Answers:</h4>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const answer = answers[pageNum.toString()];
                    return (
                      <div
                        key={pageNum}
                        className={cn(
                          "text-center p-2 rounded text-sm font-medium",
                          answer ? "bg-primary/20 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                        )}
                      >
                        {pageNum}: {answer || "—"}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <Button onClick={handleTogglePause} className="gap-2">
                <Play className="h-4 w-4" />
                Resume Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Main content */}
        <Card className="mb-4">
          <CardContent className="p-4 md:p-6">
            {/* Image container */}
            <div className="relative bg-card rounded-lg overflow-hidden mb-6 min-h-[300px] flex items-center justify-center">
              {imageLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : error ? (
                <div className="text-center text-destructive">
                  <XCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => loadCurrentImage(currentPage)}
                  >
                    Повторить
                  </Button>
                </div>
              ) : imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={`Страница ${currentPage}`}
                  className="max-w-full h-auto"
                  style={{ maxHeight: "70vh" }}
                />
              ) : null}
            </div>
            
            {/* Answer buttons */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {(["A", "B", "C", "D"] as const).map((option) => (
                <Button
                  key={option}
                  variant={selectedAnswer === option ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "h-14 text-xl font-bold transition-all",
                    selectedAnswer === option && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => handleSelectAnswer(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </Button>
              
              <div className="text-center">
                <span className="text-lg font-medium">
                  Страница {currentPage} / {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="gap-2"
              >
                Далее
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Finish button */}
        <div className="text-center">
          <Button 
            size="lg"
            variant="accent"
            className="gap-2"
            onClick={handleFinishTest}
          >
            <Flag className="h-5 w-5" />
            Завершить тест
          </Button>
        </div>
        
        {/* Progress indicators */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const hasAnswer = !!answers[pageNum.toString()];
            const isCurrent = pageNum === currentPage;
            
            return (
              <button
                key={pageNum}
                onClick={() => {
                  setCurrentPage(pageNum);
                  localStorage.setItem(STORAGE_KEYS.currentPage, pageNum.toString());
                }}
                className={cn(
                  "w-10 h-10 rounded-lg font-medium transition-all",
                  isCurrent && "ring-2 ring-primary ring-offset-2",
                  hasAnswer 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Testing58Viewer;
