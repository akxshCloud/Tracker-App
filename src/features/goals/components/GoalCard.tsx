import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MoreHorizontal, Pencil, Trash2, Archive, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHabitColor } from "@/lib/colors";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getProgressPercentage,
  getProgressLabel,
  getTargetLabel,
  getDaysRemaining,
  getCountdownLabel,
  isGoalComplete,
} from "../calculations";
import { useGoalStore } from "../store";
import type { Goal, GoalMilestone } from "../types";
import { GoalIcon } from "./GoalIcon";

interface GoalCardProps {
  goal: Goal;
  milestones: GoalMilestone[];
  onEdit: (goal: Goal) => void;
  onUpdateProgress: (goal: Goal) => void;
  onViewDetails: (goal: Goal) => void;
}

export function GoalCard({ goal, milestones, onEdit, onUpdateProgress, onViewDetails }: GoalCardProps) {
  const { removeGoal, archiveGoal, completeGoal } = useGoalStore();
  const [showMenu, setShowMenu] = useState(false);

  const color = getHabitColor(goal.color);
  const percentage = getProgressPercentage(goal);
  const progressLabel = getProgressLabel(goal);
  const targetLabel = getTargetLabel(goal);
  const daysRemaining = getDaysRemaining(goal);
  const complete = isGoalComplete(goal);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "card-elevated rounded-lg p-6 flex flex-col gap-4 cursor-pointer transition-all hover:border-border/30",
        complete && "ring-1",
      )}
      style={complete ? { "--tw-ring-color": "oklch(0.65 0.18 155)" } as React.CSSProperties : undefined}
      onClick={() => onViewDetails(goal)}
    >
      {/* Top: category + name + menu */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)` }}
          >
            <GoalIcon name={goal.icon} className="h-4 w-4" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{goal.name}</p>
            <Badge variant="outline" className="text-[10px] mt-0.5" style={{ borderColor: `color-mix(in oklch, ${color} 30%, transparent)`, color }}>
              {goal.category}
            </Badge>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-background/60 transition-all"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-8 z-50 w-40 rounded-lg border border-border/30 bg-card shadow-lg overflow-hidden"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(goal); setShowMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  {!complete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); completeGoal(goal.id); setShowMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Mark Complete
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); archiveGoal(goal.id); setShowMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
                  >
                    <Archive className="h-3 w-3" /> Archive
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeGoal(goal.id); setShowMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress ring */}
      <div className="flex flex-col items-center gap-2 py-2">
        <ProgressRing progress={percentage} size={100} strokeWidth={7} color={color}>
          <div className="text-center">
            {goal.target_type === "boolean" ? (
              <p className="text-lg font-bold">{complete ? "Done" : "—"}</p>
            ) : (
              <>
                <p className="text-lg font-bold font-mono tabular-nums">{percentage}%</p>
              </>
            )}
          </div>
        </ProgressRing>

        {goal.target_type !== "boolean" && (
          <p className="text-[11px] text-muted-foreground">
            {progressLabel} / {targetLabel}
          </p>
        )}
      </div>

      {/* Milestone progress bar */}
      {milestones.length > 0 && (
        <div className="relative h-1.5 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          />
          {milestones.map((m) => {
            const pos = goal.target_value > 0 ? (m.target_value / goal.target_value) * 100 : 0;
            return (
              <div
                key={m.id}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border-2 border-card",
                  m.completed_at ? "bg-white/80" : "bg-muted/40",
                )}
                style={{ left: `${Math.min(pos, 97)}%` }}
              />
            );
          })}
        </div>
      )}

      {/* Bottom: countdown + update */}
      <div className="flex items-center justify-between">
        {daysRemaining !== null ? (
          <span className={cn(
            "flex items-center gap-1 text-[11px]",
            daysRemaining < 0 ? "text-destructive" : "text-muted-foreground",
          )}>
            <Calendar className="h-3 w-3" />
            {getCountdownLabel(daysRemaining)}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">No deadline</span>
        )}

        {!complete && goal.target_type !== "boolean" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] gap-1"
            onClick={(e) => { e.stopPropagation(); onUpdateProgress(goal); }}
          >
            <TrendingUp className="h-3 w-3" /> Update
          </Button>
        )}

        {complete && (
          <Badge variant="outline" className="text-[10px] border-positive/30 text-positive">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
