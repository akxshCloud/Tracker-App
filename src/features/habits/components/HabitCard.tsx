import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Check, MoreHorizontal, Pencil, Trash2, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHabitColor } from "@/lib/colors";
import { calculateStreak, getFrequencyLabel } from "../calculations";
import { useHabitStore } from "../store";
import type { Habit } from "../types";
import { HabitIcon } from "./HabitIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  completedDatesForHabit: Set<string>;
  selectedDate: string;
  onEdit: (habit: Habit) => void;
}

export function HabitCard({
  habit,
  isCompleted,
  completedDatesForHabit,
  selectedDate,
  onEdit,
}: HabitCardProps) {
  const { toggleCompletion, removeHabit, archiveHabit } = useHabitStore();
  const [isToggling, setIsToggling] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const color = getHabitColor(habit.color);
  const streak = useMemo(
    () => calculateStreak(habit, completedDatesForHabit, selectedDate),
    [habit, completedDatesForHabit, selectedDate],
  );

  async function handleToggle() {
    if (isToggling) return;
    setIsToggling(true);
    try {
      const completed = await toggleCompletion(habit.id, selectedDate);
      if (completed) {
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 600);
      }
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <motion.div
      layout
      className={cn(
        "group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-300",
        isCompleted
          ? "border-border/10 bg-background/20"
          : "border-border/20 bg-background/40 hover:border-border/30",
      )}
    >
      {/* Icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
        }}
      >
        <HabitIcon
          name={habit.icon}
          className="h-4 w-4"
          style={{ color }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium transition-all duration-300",
            isCompleted && "text-muted-foreground line-through decoration-muted-foreground/30",
          )}
        >
          {habit.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">
            {getFrequencyLabel(habit)}
          </span>
          {streak > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] font-medium" style={{ color }}>
              <Flame className="h-3 w-3" />
              {streak}
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-background/60 opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        <AnimatePresence>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-8 z-50 w-36 rounded-lg border border-border/30 bg-card shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => { onEdit(habit); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => { archiveHabit(habit.id); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
                >
                  <Archive className="h-3 w-3" /> Archive
                </button>
                <button
                  onClick={() => { removeHabit(habit.id); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Completion toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className="relative h-8 w-8 shrink-0"
          >
            {/* Track circle */}
            <svg viewBox="0 0 32 32" className="absolute inset-0">
              <circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke={isCompleted ? color : "oklch(0.25 0.01 260)"}
                strokeWidth="2"
                className="transition-colors duration-300"
              />
            </svg>

            {/* Fill + Check animation */}
            <AnimatePresence>
              {isCompleted && (
                <>
                  <motion.svg
                    viewBox="0 0 32 32"
                    className="absolute inset-0"
                    initial={justCompleted ? { scale: 0.8 } : false}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <motion.circle
                      cx="16"
                      cy="16"
                      r="13"
                      fill={color}
                      initial={justCompleted ? { scale: 0, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.svg>
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={justCompleted ? { scale: 0 } : false}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.15, delay: justCompleted ? 0.1 : 0 }}
                  >
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Scale bounce on just completed */}
            {justCompleted && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${color}` }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          {isCompleted ? "Mark incomplete" : "Mark complete"}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
}
