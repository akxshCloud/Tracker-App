export type GoalCategory =
  | "financial"
  | "health"
  | "career"
  | "personal"
  | "fitness"
  | "learning"
  | "relationships";

export type TargetType = "percentage" | "numeric" | "currency" | "boolean";

export interface Goal {
  id: number;
  name: string;
  description: string | null;
  category: GoalCategory;
  icon: string;
  color: string;
  target_type: TargetType;
  target_value: number;
  current_value: number;
  unit: string | null;
  target_date: string | null; // YYYY-MM-DD
  started_at: string;
  completed_at: string | null;
  archived: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GoalMilestone {
  id: number;
  goal_id: number;
  name: string;
  target_value: number;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface GoalUpdate {
  id: number;
  goal_id: number;
  previous_value: number;
  new_value: number;
  notes: string | null;
  update_date: string;
  created_at: string;
}

export interface GoalFormData {
  name: string;
  description: string;
  category: GoalCategory;
  icon: string;
  color: string;
  target_type: TargetType;
  target_value: number;
  unit: string;
  target_date: string;
}

export const GOAL_CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: "financial", label: "Financial" },
  { value: "health", label: "Health" },
  { value: "career", label: "Career" },
  { value: "personal", label: "Personal" },
  { value: "fitness", label: "Fitness" },
  { value: "learning", label: "Learning" },
  { value: "relationships", label: "Relationships" },
];

export const TARGET_TYPES: { value: TargetType; label: string; description: string }[] = [
  { value: "percentage", label: "Percentage", description: "0-100% progress" },
  { value: "numeric", label: "Numeric", description: "Count towards a target number" },
  { value: "currency", label: "Currency (£)", description: "Save or earn a target amount" },
  { value: "boolean", label: "Yes/No", description: "Simple done or not done" },
];

export const GOAL_ICONS: { value: string; label: string }[] = [
  { value: "target", label: "Target" },
  { value: "trophy", label: "Trophy" },
  { value: "star", label: "Star" },
  { value: "rocket", label: "Rocket" },
  { value: "piggy-bank", label: "Savings" },
  { value: "graduation-cap", label: "Education" },
  { value: "heart-pulse", label: "Health" },
  { value: "briefcase", label: "Career" },
  { value: "mountain", label: "Adventure" },
  { value: "book-open", label: "Reading" },
  { value: "dumbbell", label: "Fitness" },
  { value: "home", label: "Home" },
];

export const GOAL_COLORS: { value: string; label: string; css: string }[] = [
  { value: "blue", label: "Blue", css: "oklch(0.68 0.16 250)" },
  { value: "green", label: "Green", css: "oklch(0.65 0.18 155)" },
  { value: "purple", label: "Purple", css: "oklch(0.58 0.16 300)" },
  { value: "amber", label: "Amber", css: "oklch(0.7 0.14 50)" },
  { value: "teal", label: "Teal", css: "oklch(0.6 0.15 200)" },
  { value: "red", label: "Red", css: "oklch(0.6 0.2 25)" },
  { value: "pink", label: "Pink", css: "oklch(0.65 0.18 350)" },
  { value: "cyan", label: "Cyan", css: "oklch(0.7 0.12 220)" },
];
