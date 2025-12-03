import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import LessonViewer from "./pages/LessonViewer";
import Tests from "./pages/Tests";
import TestTaking from "./pages/TestTaking";
import TestResults from "./pages/TestResults";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import DiagnosticTest from "./pages/DiagnosticTest";
import LearningPlanV2 from "./pages/LearningPlanV2";
import AISmartTutor from "./pages/AISmartTutor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
                <Route path="/lessons/:lessonId" element={<ProtectedRoute><LessonViewer /></ProtectedRoute>} />
                <Route path="/tests" element={<ProtectedRoute><Tests /></ProtectedRoute>} />
                <Route path="/tests/:testId" element={<ProtectedRoute><TestTaking /></ProtectedRoute>} />
                <Route path="/tests/:testId/results/:attemptId" element={<ProtectedRoute><TestResults /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/diagnostic-test" element={<ProtectedRoute skipDiagnosticCheck><DiagnosticTest /></ProtectedRoute>} />
                <Route path="/learning-plan" element={<ProtectedRoute><LearningPlanV2 /></ProtectedRoute>} />
                <Route path="/ai-tutor" element={<ProtectedRoute><AISmartTutor /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
