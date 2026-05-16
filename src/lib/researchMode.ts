/**
 * RESEARCH_MODE — Temporary academic / research configuration.
 *
 * When true:
 *  - All paid features are unlocked for every authenticated user.
 *  - Pricing, billing, subscription and upgrade UI is hidden.
 *  - No payment prompts, no plan comparison, no Pro/Premium badges.
 *
 * To re-enable monetization later, set this to false (and restore the
 * /pricing route + nav links — the underlying code is preserved).
 */
export const RESEARCH_MODE = true;
