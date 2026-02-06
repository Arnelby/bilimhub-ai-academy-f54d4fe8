# BilimHub - AI-Powered ORT Exam Preparation Platform

## 📋 Summary

**BilimHub** is a gamified AI-powered learning platform designed to help students in Kyrgyzstan prepare for national ORT (Общереспубликанское тестирование) exams. It combines adaptive AI-generated lessons, personalized learning paths, and comprehensive gamification to make exam preparation engaging and effective. The platform addresses the critical gap in accessible, personalized test preparation for Kyrgyz students.

---

## 🎯 Problem Statement

Students preparing for ORT exams in Kyrgyzstan face significant challenges: limited access to quality tutoring, one-size-fits-all study materials, and lack of personalized feedback on their progress. Traditional preparation methods don't adapt to individual learning styles, leaving many students underprepared. There's no platform that combines AI-driven personalization with gamification specifically designed for the ORT exam format and local educational context.

---

## 💡 Solution Overview

### How It Works
1. **Adaptive Diagnostic Test** — New users complete an ORT-style assessment that measures math level, learning style (visual/auditory/text-based), and psychological profile
2. **AI-Generated Learning Plans** — Based on diagnostic results, the AI creates personalized study schedules with target score projections
3. **Dynamic Lessons** — Content adapts to each student's learning style (visual learners get diagrams, problem-solvers get exercises)
4. **Gamified Progress** — Streaks, badges, leaderboards, and mastery levels keep students motivated

### Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI | Lovable AI Gateway (Google Gemini 2.5 Flash) |
| Hosting | Lovable Cloud |

### Unique Features
- **5 Learning Styles**: Visual, Auditory, Text-based, Problem-solver, ADHD-friendly
- **Real ORT Format**: Actual exam structure (Part 1: 30 questions/30 min, Part 2: 30 questions/60 min)
- **Trilingual Support**: English, Russian, Kyrgyz
- **AI Homework Review**: OCR-powered feedback on uploaded assignments

---

## 🧪 How to Test the Prototype

1. **Open the App** → Navigate to the deployed URL
2. **Create Account** → Click "Регистрация" and sign up with email/password
3. **Complete Diagnostic** → Answer ORT-style questions to establish your profile
4. **Explore Dashboard** → View personalized stats, streaks, and recommendations
5. **Try a Lesson** → Go to "Уроки" → Select "Дроби" (Fractions) → Navigate through 7 tabs
6. **Take a Test** → Open "Мини-тесты" tab → Answer questions → See adaptive difficulty
7. **Chat with AI Tutor** → Use the AI Smart Tutor for personalized explanations

**Expected Outputs**: Personalized learning plan, topic mastery visualization, gamification rewards, AI-generated feedback

---

## 👥 Usage Scenarios

| User | Scenario |
|------|----------|
| **Student (Grade 10-11)** | Prepares for ORT with adaptive lessons, tracks progress via gamification, receives AI recommendations for weak topics |
| **Self-learner** | Uses AI tutor chat for instant explanations, practices with mini-tests that adjust difficulty automatically |
| **Teacher/Tutor** | Reviews student homework submissions, accesses analytics to identify class-wide knowledge gaps |
| **Admin** | Manages learning content via Admin Dashboard, uploads new topics and training datasets |

---

## 🔧 Technical Details

### Core Edge Functions (Supabase)
| Function | Purpose |
|----------|---------|
| `ai-chat-tutor` | Streaming AI tutoring with context-aware responses |
| `ai-learning-plan-v2` | Generates personalized study schedules with ORT score projections |
| `ai-mini-test` | Creates adaptive questions based on topic and difficulty |
| `ai-analyze-test` | Provides detailed performance analysis with topic breakdowns |
| `ai-homework-review` | OCR + AI feedback on uploaded assignments |
| `ai-recommendations-v2` | Weak topic detection and lesson suggestions |

### Database Schema (Key Tables)
- `profiles` — User data, gamification stats
- `user_diagnostic_profile` — Learning style, goals, psychological metrics
- `user_topic_progress` — Mastery levels per topic
- `lessons`, `tests`, `questions` — Educational content
- `ai_learning_plans_v2` — Generated study schedules

### AI Integration
All AI features use **Lovable AI Gateway** with `google/gemini-2.5-flash` model. No external API keys required.

---

## 🚀 Final Notes

**BilimHub transforms ORT preparation from a stressful, one-size-fits-all experience into an engaging, personalized learning journey.** By combining AI-driven adaptivity with gamification psychology, we're making quality education accessible to every student in Kyrgyzstan — regardless of their location or economic background.

---

*Built with ❤️ for Kyrgyzstan's future*
