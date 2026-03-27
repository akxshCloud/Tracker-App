export const CATEGORY_COLORS: Record<string, string> = {
  health: "oklch(0.65 0.18 155)",
  fitness: "oklch(0.68 0.16 250)",
  mindfulness: "oklch(0.58 0.16 300)",
  productivity: "oklch(0.7 0.14 50)",
  learning: "oklch(0.6 0.15 200)",
  finance: "oklch(0.68 0.16 250)",
  career: "oklch(0.7 0.14 50)",
  personal: "oklch(0.58 0.16 300)",
  social: "oklch(0.65 0.12 155)",
  general: "oklch(0.58 0.01 260)",
  relationships: "oklch(0.6 0.2 25)",
};

export const HABIT_COLOR_MAP: Record<string, string> = {
  blue: "oklch(0.68 0.16 250)",
  green: "oklch(0.65 0.18 155)",
  purple: "oklch(0.58 0.16 300)",
  amber: "oklch(0.7 0.14 50)",
  teal: "oklch(0.6 0.15 200)",
  red: "oklch(0.6 0.2 25)",
  pink: "oklch(0.65 0.18 350)",
  cyan: "oklch(0.7 0.12 220)",
};

export function getHabitColor(color: string): string {
  return HABIT_COLOR_MAP[color] ?? HABIT_COLOR_MAP.blue;
}
