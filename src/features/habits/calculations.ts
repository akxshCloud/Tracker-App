import type { Habit, DayOfWeek } from "./types";

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[date.getDay()];
}

function isScheduledDay(habit: Habit, date: Date): boolean {
  if (habit.frequency_type === "daily") return true;

  if (habit.frequency_type === "specific_days" && habit.frequency_value) {
    const days: DayOfWeek[] = JSON.parse(habit.frequency_value);
    return days.includes(getDayOfWeek(date));
  }

  // times_per_week — every day is a potential completion day
  if (habit.frequency_type === "times_per_week") return true;

  return true;
}

export function calculateStreak(
  habit: Habit,
  completedDates: Set<string>,
  today: string,
): number {
  const todayDate = parseLocalDate(today);

  if (habit.frequency_type === "times_per_week") {
    return calculateWeeklyStreak(habit, completedDates, todayDate);
  }

  let streak = 0;
  const current = new Date(todayDate);

  // Check today first — if today is scheduled and not completed, streak starts from yesterday
  if (isScheduledDay(habit, current) && !completedDates.has(toLocalDateString(current))) {
    current.setDate(current.getDate() - 1);
  }

  while (true) {
    const dateStr = toLocalDateString(current);
    if (isScheduledDay(habit, current)) {
      if (completedDates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    current.setDate(current.getDate() - 1);

    // Safety: don't go back more than 2 years
    if (streak > 730) break;
  }

  return streak;
}

function calculateWeeklyStreak(
  habit: Habit,
  completedDates: Set<string>,
  today: Date,
): number {
  const target = habit.frequency_value ? parseInt(habit.frequency_value) : 1;
  let streak = 0;

  // Get the start of the current week (Monday)
  const current = new Date(today);
  const dayOfWeek = current.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  current.setDate(current.getDate() + mondayOffset);

  // Check current week (partial) — skip if not complete yet
  const endOfWeek = new Date(current);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  if (endOfWeek > today) {
    // Current week not over, check if already met target
    const currentWeekCount = countCompletionsInWeek(completedDates, current);
    if (currentWeekCount >= target) {
      streak++;
    }
    // Move to previous week
    current.setDate(current.getDate() - 7);
  }

  // Count consecutive completed weeks going back
  for (let i = 0; i < 104; i++) {
    const weekCount = countCompletionsInWeek(completedDates, current);
    if (weekCount >= target) {
      streak++;
      current.setDate(current.getDate() - 7);
    } else {
      break;
    }
  }

  return streak;
}

function countCompletionsInWeek(completedDates: Set<string>, weekStart: Date): number {
  let count = 0;
  const d = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    if (completedDates.has(toLocalDateString(d))) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function getCompletionRate(
  habits: Habit[],
  completedHabitIds: Set<number>,
  date: string,
): { completed: number; total: number; percentage: number } {
  const d = parseLocalDate(date);
  const scheduledHabits = habits.filter((h) => isScheduledDay(h, d));
  const total = scheduledHabits.length;
  const completed = scheduledHabits.filter((h) => completedHabitIds.has(h.id)).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

export interface HeatMapDay {
  date: string;
  count: number; // completions that day
  total: number; // scheduled habits that day
  level: 0 | 1 | 2 | 3 | 4; // intensity level for coloring
}

export function generateHeatMapData(
  habits: Habit[],
  completionsByDate: Map<string, Set<number>>, // date -> set of habit ids
  weeks: number = 52,
): HeatMapDay[] {
  const days: HeatMapDay[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7 + 1);

  // Align to Sunday (start of week for grid)
  const startDay = start.getDay();
  start.setDate(start.getDate() - startDay);

  const current = new Date(start);

  while (current <= today) {
    const dateStr = toLocalDateString(current);
    const scheduledCount = habits.filter((h) => isScheduledDay(h, current)).length;
    const completedIds = completionsByDate.get(dateStr);
    const completedCount = completedIds
      ? habits.filter((h) => isScheduledDay(h, current) && completedIds.has(h.id)).length
      : 0;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (scheduledCount > 0 && completedCount > 0) {
      const ratio = completedCount / scheduledCount;
      if (ratio >= 1) level = 4;
      else if (ratio >= 0.75) level = 3;
      else if (ratio >= 0.5) level = 2;
      else level = 1;
    }

    days.push({ date: dateStr, count: completedCount, total: scheduledCount, level });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function getScheduledHabitsForDate(habits: Habit[], dateStr: string): Habit[] {
  const date = parseLocalDate(dateStr);
  return habits.filter((h) => isScheduledDay(h, date));
}

export function getFrequencyLabel(habit: Habit): string {
  if (habit.frequency_type === "daily") return "Every day";
  if (habit.frequency_type === "specific_days" && habit.frequency_value) {
    const days: string[] = JSON.parse(habit.frequency_value);
    if (days.length === 5 && !days.includes("sat") && !days.includes("sun")) {
      return "Weekdays";
    }
    if (days.length === 2 && days.includes("sat") && days.includes("sun")) {
      return "Weekends";
    }
    return days.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ");
  }
  if (habit.frequency_type === "times_per_week" && habit.frequency_value) {
    const n = parseInt(habit.frequency_value);
    return `${n}x per week`;
  }
  return "Every day";
}
