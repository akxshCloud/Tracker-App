export type HabitCategory =
  | "health"
  | "fitness"
  | "mindfulness"
  | "productivity"
  | "learning"
  | "finance"
  | "social"
  | "general";

export type FrequencyType = "daily" | "specific_days" | "times_per_week";

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface Habit {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency_type: FrequencyType;
  frequency_value: string | null; // JSON: null for daily, '["mon","wed"]' for specific_days, '3' for times_per_week
  category: HabitCategory;
  sort_order: number;
  archived: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: number;
  habit_id: number;
  completed_date: string; // YYYY-MM-DD
  notes: string | null;
  created_at: string;
}

export interface HabitFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  frequency_type: FrequencyType;
  frequency_value: string | null;
  category: HabitCategory;
}

export const HABIT_CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: "health", label: "Health" },
  { value: "fitness", label: "Fitness" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "productivity", label: "Productivity" },
  { value: "learning", label: "Learning" },
  { value: "finance", label: "Finance" },
  { value: "social", label: "Social" },
  { value: "general", label: "General" },
];

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: "mon", label: "Monday", short: "M" },
  { value: "tue", label: "Tuesday", short: "T" },
  { value: "wed", label: "Wednesday", short: "W" },
  { value: "thu", label: "Thursday", short: "T" },
  { value: "fri", label: "Friday", short: "F" },
  { value: "sat", label: "Saturday", short: "S" },
  { value: "sun", label: "Sunday", short: "S" },
];

export const HABIT_COLORS: { value: string; label: string; css: string }[] = [
  { value: "blue", label: "Blue", css: "oklch(0.68 0.16 250)" },
  { value: "green", label: "Green", css: "oklch(0.65 0.18 155)" },
  { value: "purple", label: "Purple", css: "oklch(0.58 0.16 300)" },
  { value: "amber", label: "Amber", css: "oklch(0.7 0.14 50)" },
  { value: "teal", label: "Teal", css: "oklch(0.6 0.15 200)" },
  { value: "red", label: "Red", css: "oklch(0.6 0.2 25)" },
  { value: "pink", label: "Pink", css: "oklch(0.65 0.18 350)" },
  { value: "cyan", label: "Cyan", css: "oklch(0.7 0.12 220)" },
];

export const HABIT_ICONS: { value: string; label: string }[] = [
  { value: "circle-check", label: "Check" },
  { value: "dumbbell", label: "Exercise" },
  { value: "book-open", label: "Reading" },
  { value: "brain", label: "Mindfulness" },
  { value: "droplets", label: "Water" },
  { value: "moon", label: "Sleep" },
  { value: "pencil", label: "Writing" },
  { value: "music", label: "Music" },
  { value: "heart", label: "Health" },
  { value: "code", label: "Coding" },
  { value: "wallet", label: "Finance" },
  { value: "users", label: "Social" },
  { value: "salad", label: "Nutrition" },
  { value: "footprints", label: "Walking" },
  { value: "pill", label: "Medication" },
  { value: "sun", label: "Morning" },
];
