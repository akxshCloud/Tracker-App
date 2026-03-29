import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useHabitStore } from "../store";
import { getScheduledHabitsForDate, calculateStreak } from "../calculations";
import { getHabitColor } from "@/lib/colors";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { HabitCard } from "./HabitCard";
import { AddHabitDialog } from "./AddHabitDialog";
import { EditHabitDialog } from "./EditHabitDialog";
import { HabitCalendar } from "./HabitCalendar";
import type { Habit } from "../types";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const todayStr = toDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === todayStr) return "Today";
  if (dateStr === toDateStr(yesterday)) return "Yesterday";

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function HabitsPage() {
  const {
    habits,
    completions,
    selectedDate,
    viewMode,
    isLoading,
    initialize,
    setSelectedDate,
    setViewMode,
  } = useHabitStore();

  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Build a set of completed habit IDs for the selected date
  const completedOnDate = useMemo(() => {
    const set = new Set<number>();
    for (const c of completions) {
      if (c.completed_date === selectedDate) {
        set.add(c.habit_id);
      }
    }
    return set;
  }, [completions, selectedDate]);

  // Build per-habit completion date sets (for streak calculation)
  const completionsByHabit = useMemo(() => {
    const map = new Map<number, Set<string>>();
    for (const c of completions) {
      const existing = map.get(c.habit_id);
      if (existing) {
        existing.add(c.completed_date);
      } else {
        map.set(c.habit_id, new Set([c.completed_date]));
      }
    }
    return map;
  }, [completions]);

  const scheduledHabits = useMemo(
    () => getScheduledHabitsForDate(habits, selectedDate),
    [habits, selectedDate],
  );

  const completedCount = scheduledHabits.filter((h) => completedOnDate.has(h.id)).length;
  const totalCount = scheduledHabits.length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Top streaks across all habits
  const topStreaks = useMemo(() => {
    return habits
      .map((h) => ({
        habit: h,
        streak: calculateStreak(h, completionsByHabit.get(h.id) ?? new Set(), selectedDate),
      }))
      .filter((s) => s.streak > 0)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3);
  }, [habits, completionsByHabit, selectedDate]);

  // Sort: incomplete first, then completed
  const sortedHabits = useMemo(() => {
    return [...scheduledHabits].sort((a, b) => {
      const aComplete = completedOnDate.has(a.id) ? 1 : 0;
      const bComplete = completedOnDate.has(b.id) ? 1 : 0;
      return aComplete - bComplete;
    });
  }, [scheduledHabits, completedOnDate]);

  function navigateDate(offset: number) {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    setSelectedDate(toDateStr(date));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-8" variants={stagger} initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
        </div>
        <div className="flex items-center gap-2">
          <AddHabitDialog />
        </div>
      </motion.div>

      {/* View toggle */}
      <motion.div variants={fadeIn}>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "today" | "calendar")}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {viewMode === "today" ? (
        <>
          {/* Date selector */}
          <motion.div variants={fadeIn} className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => navigateDate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              onClick={() => setSelectedDate(toDateStr(new Date()))}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {formatDisplayDate(selectedDate)}
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => navigateDate(1)}
              disabled={selectedDate === toDateStr(new Date())}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          {habits.length === 0 ? (
            <motion.div
              variants={fadeIn}
              className="card-elevated rounded-lg p-12 text-center"
            >
              <p className="text-muted-foreground">No habits yet. Add your first habit to get started.</p>
            </motion.div>
          ) : (
            <>
              {/* Summary ring + habit list */}
              <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Progress ring */}
                <div className="card-hero rounded-lg p-6 flex flex-col items-center justify-center gap-3">
                  <ProgressRing progress={percentage} size={100} strokeWidth={7}>
                    <div className="text-center">
                      <p className="text-2xl font-bold font-mono tabular-nums">
                        {completedCount}/{totalCount}
                      </p>
                    </div>
                  </ProgressRing>
                  <p className="text-xs text-muted-foreground">
                    {percentage === 100
                      ? "All done!"
                      : `${totalCount - completedCount} remaining`}
                  </p>
                </div>

                {/* Habits list */}
                <div className="lg:col-span-3 space-y-2">
                  {sortedHabits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      isCompleted={completedOnDate.has(habit.id)}
                      completedDatesForHabit={completionsByHabit.get(habit.id) ?? new Set()}
                      selectedDate={selectedDate}
                      onEdit={setEditingHabit}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Top streaks */}
              {topStreaks.length > 0 && (
                <motion.div variants={fadeIn}>
                  <h3 className="text-sm font-semibold mb-3">Top Streaks</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {topStreaks.map(({ habit, streak }) => (
                      <div
                        key={habit.id}
                        className="card-elevated rounded-xl px-4 py-3 flex items-center gap-3"
                      >
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${getHabitColor(habit.color)} 20%, transparent)`,
                          }}
                        >
                          <Flame
                            className="h-4 w-4"
                            style={{ color: getHabitColor(habit.color) }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{habit.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {streak} day{streak !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span
                          className="text-xl font-bold font-mono tabular-nums"
                          style={{ color: getHabitColor(habit.color) }}
                        >
                          {streak}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </>
      ) : (
        /* Calendar view */
        <motion.div variants={fadeIn}>
          <HabitCalendar />
        </motion.div>
      )}

      <EditHabitDialog habit={editingHabit} onClose={() => setEditingHabit(null)} />
    </motion.div>
  );
}
