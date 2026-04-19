---
name: deterministic-no-ai-runtime
description: Runtime is 100% data-driven. AI is allowed only for offline content/explanation generation. No AI calls during plan, analysis, or review.
type: constraint
---
**No AI in runtime.** All analytics, planning, recommendations, and answer review must be derived deterministically from DB columns.

Allowed AI usage (offline / user-triggered only):
- `ai-chat-tutor` — manual student chat (no autostart)
- `ai-generate-lesson`, `ai-generate-ort-test`, `ai-practice-generate`, `ai-classify-review-questions` — admin-only authoring

**Topic classification rule** (`src/lib/deterministicPlan.ts`):
- require ≥3 attempts; <50% → WEAK; <75% → MEDIUM; ≥75% → STRONG
- WEAK capped at 5, MEDIUM at 8

**Question review** uses `QuestionReview` (`src/components/review/QuestionReview.tsx`) only, fed from DB columns:
`correct_explanation`, `explanation_a..e` on `math_questions`, `math_test_questions`, `practice_questions`.

**Why:** stability, reproducibility, research integrity. AI in runtime broke determinism and inflated cost.
