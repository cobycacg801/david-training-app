// ─── Plan tier utilities ──────────────────────────────────────
// Used across VideoLibrary, NutritionLibrary, and any future gated content.

export const PLAN_RANK: Record<string, number> = {
  base:  0,
  pro:   1,
  elite: 2,
};

export const PLAN_PRICE: Record<string, string> = {
  base:  "$19/mo",
  pro:   "$39/mo",
  elite: "$79/mo",
};

export const PLAN_COLOR: Record<string, string> = {
  base:  "#a1a1aa",
  pro:   "#c9a84c",
  elite: "#e8d5a3",
};

export const PLAN_PERKS: Record<string, string[]> = {
  pro: [
    "Full workout video library",
    "All meal plans & nutrition guides",
    "Pro group member chat",
    "Early access to new content",
  ],
  elite: [
    "Everything in Pro",
    "Private 1:1 coaching chat with David",
    "Monthly personal coaching session",
    "Priority session scheduling",
  ],
};

/** Returns true if the user's plan meets or exceeds the required min plan. */
export function canAccess(
  userPlan: string | null | undefined,
  minPlan: string | null | undefined
): boolean {
  const userRank = PLAN_RANK[userPlan ?? "base"] ?? 0;
  const minRank  = PLAN_RANK[minPlan  ?? "base"] ?? 0;
  return userRank >= minRank;
}

/** Capitalizes the first letter of a plan name. */
export function planLabel(plan: string | null | undefined): string {
  const p = plan ?? "base";
  return p.charAt(0).toUpperCase() + p.slice(1);
}
