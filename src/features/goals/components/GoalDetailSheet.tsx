import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getHabitColor } from "@/lib/colors";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getProgressPercentage,
  getProgressLabel,
  getTargetLabel,
  getDaysRemaining,
  getCountdownLabel,
} from "../calculations";
import { useGoalStore } from "../store";
import type { Goal } from "../types";
import { GoalIcon } from "./GoalIcon";

interface GoalDetailSheetProps {
  goal: Goal | null;
  onClose: () => void;
  onUpdateProgress: (goal: Goal) => void;
}

export function GoalDetailSheet({ goal, onClose, onUpdateProgress }: GoalDetailSheetProps) {
  const { milestones, updates, loadGoalDetails } = useGoalStore();

  useEffect(() => {
    if (goal) {
      loadGoalDetails(goal.id);
    }
  }, [goal, loadGoalDetails]);

  if (!goal) return null;

  const color = getHabitColor(goal.color);
  const percentage = getProgressPercentage(goal);
  const goalMilestones = milestones[goal.id] ?? [];
  const goalUpdates = updates[goal.id] ?? [];
  const daysRemaining = getDaysRemaining(goal);

  function formatUpdateValue(value: number): string {
    if (goal!.target_type === "currency") return formatCurrency(value);
    if (goal!.target_type === "percentage") return `${Math.round(value)}%`;
    const unit = goal!.unit ? ` ${goal!.unit}` : "";
    return `${value}${unit}`;
  }

  return (
    <Sheet open={!!goal} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)` }}
            >
              <GoalIcon name={goal.icon} className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <SheetTitle className="text-left">{goal.name}</SheetTitle>
              {goal.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Progress ring */}
          <div className="flex flex-col items-center gap-3 py-4">
            <ProgressRing progress={percentage} size={120} strokeWidth={8} color={color}>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono tabular-nums">{percentage}%</p>
                <p className="text-[10px] text-muted-foreground">
                  {getProgressLabel(goal)} / {getTargetLabel(goal)}
                </p>
              </div>
            </ProgressRing>

            {daysRemaining !== null && (
              <span className={cn(
                "flex items-center gap-1 text-xs",
                daysRemaining < 0 ? "text-destructive" : "text-muted-foreground",
              )}>
                <Calendar className="h-3 w-3" />
                {getCountdownLabel(daysRemaining)}
              </span>
            )}

            {goal.target_type !== "boolean" && !goal.completed_at && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => onUpdateProgress(goal)}
              >
                Update Progress
              </Button>
            )}
          </div>

          {/* Milestones */}
          {goalMilestones.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Milestones
              </h4>
              <div className="space-y-0">
                {goalMilestones.map((m, i) => (
                  <div key={m.id} className="flex items-start gap-3">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      {m.completed_at ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color }} />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-muted-foreground/30" />
                      )}
                      {i < goalMilestones.length - 1 && (
                        <div className="w-px h-8 bg-border/30" />
                      )}
                    </div>

                    <div className="pb-4">
                      <p className={cn(
                        "text-sm font-medium",
                        m.completed_at && "text-muted-foreground line-through decoration-muted-foreground/30",
                      )}>
                        {m.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        at {formatUpdateValue(m.target_value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update history */}
          {goalUpdates.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                History
              </h4>
              <div className="space-y-2">
                {goalUpdates.map((u) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 rounded-lg bg-background/30 border border-border/10 px-3 py-2"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
                      <span className="text-muted-foreground">{formatUpdateValue(u.previous_value)}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                      <span style={{ color }}>{formatUpdateValue(u.new_value)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {u.notes && (
                        <p className="text-[10px] text-muted-foreground truncate">{u.notes}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDate(u.update_date)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Started date */}
          <p className="text-[10px] text-muted-foreground text-center">
            Started {formatDate(goal.started_at)}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
