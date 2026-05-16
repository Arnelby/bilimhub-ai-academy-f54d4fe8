# RESEARCH_MODE

BilimHub is temporarily running as a fully free, non-commercial research
platform for academic testing, screenshots, and publication.

## Flag

`src/lib/researchMode.ts`

```ts
export const RESEARCH_MODE = true;
```

When `true`:

- All features are available to every authenticated user.
- No pricing, billing, subscription, upgrade, or payment UI is shown.
- All users are treated as having full access (no `isPro` / `isPremium`
  / `hasActiveSubscription` checks gate any feature).

## What is hidden

| Area | Change |
|------|--------|
| `/pricing` route | Redirects to `/dashboard` (component preserved in git history). |
| Footer navigation | Removed "Pricing" link. |
| Profile page | Removed "Upgrade to Pro" quick action. |
| Marketing copy | No "Free trial", "Upgrade now", "Premium", "Choose your plan" surfaces remain visible. |

## What is unlocked

All authenticated users receive full access to:

- Lessons, Practice, Tests, Diagnostic
- AI Tutor and Learning Plan (already gated only by `useUserGroup`, not
  by subscription)
- Leaderboard, Achievements, Gamification

There is no subscription-based feature gating in the current codebase
(`useUserGroup` is research-group based, not payment based), so no
runtime checks needed to be bypassed.

## Code that was preserved (not deleted)

- `src/pages/Pricing.tsx` — full pricing page UI lives in git history;
  the current file is a thin redirect.
- All `v2.pricing.*` translation keys in `src/locales/{en,ru,kg}.json`.
- Any backend subscription logic (none currently active).

## How to restore monetization

1. Set `RESEARCH_MODE = false` in `src/lib/researchMode.ts`.
2. Restore `src/pages/Pricing.tsx` from git history.
3. Restore the footer `Pricing` link in `src/components/layout/Footer.tsx`.
4. Restore the "Upgrade to Pro" button in `src/pages/Profile.tsx`.
5. Re-enable any payment provider (Stripe / Paddle) via Lovable Payments.
