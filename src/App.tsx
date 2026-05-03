import { Toaster } from "@/components/ui/toaster";
import Testing58Viewer from "./pages/Testing58Viewer";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GamificationProvider } from "@/hooks/useGamificationEvents";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import LessonVariant from "./pages/LessonVariant";
import LessonViewer from "./pages/LessonViewer";
import Tests from "./pages/Tests";
import TestTaking from "./pages/TestTaking";
import TestResults from "./pages/TestResults";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";


import NotFound from "./pages/NotFound";
import DiagnosticTest from "./pages/DiagnosticTest";
import LearningPlanV2 from "./pages/LearningPlanV2";
import AISmartTutor from "./pages/AISmartTutor";

import MathLessons from "./pages/MathLessons";
import FractionsLesson from "./pages/FractionsLesson";
import DynamicLessonViewer from "./pages/DynamicLessonViewer";
import MathTestTaking from "./pages/MathTestTaking";
import Practice from "./pages/Practice";
import NextStep from "./pages/NextStep";
import ForcedLearn from "./pages/ForcedLearn";
import LeaderboardPage from "./pages/Leaderboard";
import BasicVideoPage from "./pages/BasicVideoPage";
import { ForcedLearningProvider } from "@/hooks/useForcedLearning";
import { ForcedModeGuard } from "@/components/forced/ForcedModeGuard";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import TopicsManager from "./pages/admin/TopicsManager";
import DatasetManager from "./pages/admin/DatasetManager";
import TestBuilder from "./pages/admin/TestBuilder";
import LearningPlanConstructor from "./pages/admin/LearningPlanConstructor";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import PracticeQualityReview from "./pages/admin/PracticeQualityReview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <AuthProvider>
          <ForcedLearningProvider>
          <GamificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ForcedModeGuard />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  
                  <Route path="/signup" element={<Login />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
                  <Route path="/lessons/video/:variantId" element={<ProtectedRoute><LessonVariant /></ProtectedRoute>} />
                  <Route path="/lessons/:lessonId" element={<ProtectedRoute><LessonViewer /></ProtectedRoute>} />
                  <Route path="/tests" element={<ProtectedRoute><Tests /></ProtectedRoute>} />
                  <Route path="/tests/:testId" element={<ProtectedRoute><TestTaking /></ProtectedRoute>} />
                  <Route path="/tests/:testId/results/:attemptId" element={<ProtectedRoute><TestResults /></ProtectedRoute>} />
                 <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                 <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
                  <Route path="/diagnostic-test" element={<ProtectedRoute skipDiagnosticCheck><DiagnosticTest /></ProtectedRoute>} />
                  <Route path="/learning-plan" element={<ProtectedRoute requireAI><LearningPlanV2 /></ProtectedRoute>} />
                  <Route path="/ai-tutor" element={<ProtectedRoute requireAI><AISmartTutor /></ProtectedRoute>} />
                  
                  <Route path="/tests/testing58" element={<ProtectedRoute><Testing58Viewer /></ProtectedRoute>} />
                  <Route path="/tests/math-test/:testId" element={<ProtectedRoute skipDiagnosticCheck><MathTestTaking /></ProtectedRoute>} />
                  <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
                  <Route path="/next" element={<ProtectedRoute><NextStep /></ProtectedRoute>} />
                  <Route path="/learn" element={<ProtectedRoute><ForcedLearn /></ProtectedRoute>} />
                  <Route path="/math-lessons" element={<ProtectedRoute requireAI><MathLessons /></ProtectedRoute>} />
                  <Route path="/lessons/fractions" element={<ProtectedRoute requireAI><FractionsLesson /></ProtectedRoute>} />
                  <Route path="/lessons/topic/:topicId" element={<ProtectedRoute requireAI><DynamicLessonViewer /></ProtectedRoute>} />
                  <Route path="/video/:videoId" element={<ProtectedRoute><BasicVideoPage /></ProtectedRoute>} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="topics" element={<TopicsManager />} />
                    <Route path="datasets" element={<DatasetManager />} />
                    <Route path="test-builder" element={<TestBuilder />} />
                    <Route path="learning-plans" element={<LearningPlanConstructor />} />
                    <Route path="analytics" element={<AnalyticsDashboard />} />
                    <Route path="practice-quality" element={<PracticeQualityReview />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </GamificationProvider>
          </ForcedLearningProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
