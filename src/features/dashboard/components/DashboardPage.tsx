import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  TrendingDown,
  CircleCheck,
  CheckSquare,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getHabitColor } from "@/lib/colors";
import { useDebtStore } from "@/features/debt/store";
import { useBudgetStore } from "@/features/budget/store";
import { useHabitStore } from "@/features/habits/store";
import { useGoalStore } from "@/features/goals/store";
import { useRouter } from "@/lib/router";
import { getDebtSummary, compareStrategies } from "@/features/debt/calculations";
import { getScheduledHabitsForDate } from "@/features/habits/calculations";
import { getProgressPercentage, isGoalComplete } from "@/features/goals/calculations";
import { ProgressRing } from "@/components/ui/progress-ring";
import { GreetingHeader } from "./GreetingHeader";
import { getRecentActivity, type ActivityItem } from "../activity";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DashboardPage() {
  const { debts, monthlyBudget, initialize: initDebt } = useDebtStore();
  const { breakdown, isConnected, initialize: initBudget } = useBudgetStore();
  const { habits, completions, initialize: initHabits } = useHabitStore();
  const { goals, initialize: initGoals } = useGoalStore();
  const { navigate } = useRouter();

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const promises: Promise<void>[] = [];
        if (useDebtStore.getState().isLoading) promises.push(initDebt());
        if (useBudgetStore.getState().isLoading) promises.push(initBudget());
        if (useHabitStore.getState().isLoading) promises.push(initHabits());
        if (useGoalStore.getState().isLoading) promises.push(initGoals());
        await Promise.allSettled(promises);
        try {
          const items = await getRecentActivity(10);
          setActivity(items);
        } catch { /* non-critical */ }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [initDebt, initBudget, initHabits, initGoals]);

  // Debt
  const debtSummary = useMemo(() => debts.length > 0 ? getDebtSummary(debts) : null, [debts]);
  const comparison = useMemo(() => debts.length > 0 ? compareStrategies(debts, monthlyBudget) : null, [debts, monthlyBudget]);

  // Habits
  const today = todayStr();
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const scheduledHabits = useMemo(() => getScheduledHabitsForDate(activeHabits, today), [activeHabits, today]);
  const completedToday = useMemo(() => {
    const set = new Set<number>();
    for (const c of completions) {
      if (c.completed_date === today) set.add(c.habit_id);
    }
    return set;
  }, [completions, today]);
  const habitsCompleted = scheduledHabits.filter((h) => completedToday.has(h.id)).length;
  const habitsTotal = scheduledHabits.length;
  const habitsPercent = habitsTotal === 0 ? 0 : Math.round((habitsCompleted / habitsTotal) * 100);

  // Goals
  const activeGoals = useMemo(() => goals.filter((g) => !isGoalComplete(g) && !g.archived), [goals]);
  const completedGoalCount = useMemo(() => goals.filter((g) => isGoalComplete(g)).length, [goals]);

  // Budget
  const budgetIncome = useMemo(() => breakdown.find((b) => b.category === "income")?.total ?? 0, [breakdown]);
  const budgetSpending = useMemo(
    () => breakdown.filter((b) => b.category !== "income" && b.category !== "uncategorised").reduce((sum, b) => sum + Math.abs(b.total), 0),
    [breakdown],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-8" variants={stagger} initial="initial" animate="animate">
      {/* Greeting */}
      <motion.div variants={fadeIn}>
        <GreetingHeader habitsRemaining={habitsTotal - habitsCompleted} habitsTotal={habitsTotal} />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={fadeIn} className="flex flex-wrap gap-2">
        {[
          { label: "Record payment", page: "debt" as const },
          { label: "Add habit", page: "habits" as const },
          { label: "Update goal", page: "goals" as const },
          { label: "Add debt", page: "debt" as const },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.page)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <Plus className="h-3 w-3" />
            {action.label}
          </button>
        ))}
      </motion.div>

      {/* Cards grid — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Debt Overview */}
        <motion.div variants={fadeIn}>
          <button
            onClick={() => navigate("debt")}
            className="w-full text-left rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-colors"
          >
            <h3 className="text-sm font-semibold mb-4">Debt Overview</h3>
            {debtSummary ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Remaining</p>
                    <p className="text-lg font-semibold font-mono tabular-nums">{formatCurrency(debtSummary.totalDebt)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Paid off</p>
                    <p className="text-lg font-semibold font-mono tabular-nums text-positive">{Math.round(debtSummary.percentPaid)}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Debt-free</p>
                    <p className="text-sm font-medium">{comparison?.avalanche.payoffDate ? formatDate(comparison.avalanche.payoffDate) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Monthly interest</p>
                    <p className="text-sm font-medium text-destructive">{formatCurrency(debtSummary.monthlyInterestAccruing)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No debts tracked yet.</p>
            )}
          </button>
        </motion.div>

        {/* Budget This Month */}
        <motion.div variants={fadeIn}>
          <button
            onClick={() => navigate("budget")}
            className="w-full text-left rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-colors"
          >
            <h3 className="text-sm font-semibold mb-4">
              Budget — {new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date())}
            </h3>
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Income</p>
                    <p className="text-lg font-semibold font-mono tabular-nums text-positive">{formatCurrency(budgetIncome)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground mb-0.5">Spending</p>
                    <p className="text-lg font-semibold font-mono tabular-nums text-destructive">{formatCurrency(budgetSpending)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">Net flow</span>
                  <span className={cn(
                    "text-sm font-semibold font-mono tabular-nums",
                    budgetIncome - budgetSpending >= 0 ? "text-positive" : "text-destructive",
                  )}>
                    {formatCurrency(budgetIncome - budgetSpending)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Connect your bank to see your budget.</p>
                <span className="text-xs text-primary font-medium">Connect bank →</span>
              </div>
            )}
          </button>
        </motion.div>

        {/* Today's Habits */}
        <motion.div variants={fadeIn}>
          <button
            onClick={() => navigate("habits")}
            className="w-full text-left rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-colors"
          >
            <h3 className="text-sm font-semibold mb-4">Today's Habits</h3>
            <div className="flex items-center gap-5">
              <ProgressRing progress={habitsPercent} size={64} strokeWidth={5}>
                <p className="text-xs font-semibold font-mono tabular-nums">
                  {habitsCompleted}/{habitsTotal}
                </p>
              </ProgressRing>
              <div className="flex-1 space-y-1.5">
                {scheduledHabits.slice(0, 5).map((h) => {
                  const done = completedToday.has(h.id);
                  return (
                    <div key={h.id} className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded border flex items-center justify-center shrink-0",
                        done ? "bg-primary border-primary" : "border-border"
                      )}>
                        {done && <CheckSquare className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className={cn("text-xs truncate", done && "text-muted-foreground line-through")}>
                        {h.name}
                      </span>
                    </div>
                  );
                })}
                {scheduledHabits.length > 5 && (
                  <p className="text-[11px] text-primary font-medium">show all →</p>
                )}
                {habitsTotal === 0 && (
                  <p className="text-xs text-muted-foreground">No habits scheduled today</p>
                )}
              </div>
            </div>
          </button>
        </motion.div>

        {/* Goals */}
        <motion.div variants={fadeIn}>
          <button
            onClick={() => navigate("goals")}
            className="w-full text-left rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-colors"
          >
            <h3 className="text-sm font-semibold mb-4">Goals</h3>
            {goals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No goals yet.</p>
            ) : (
              <div className="space-y-3">
                {activeGoals.slice(0, 4).map((g) => {
                  const pct = getProgressPercentage(g);
                  return (
                    <div key={g.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs truncate flex-1">{g.name}</span>
                        <span className="text-[11px] font-mono tabular-nums text-muted-foreground ml-2">{pct}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                        />
                      </div>
                    </div>
                  );
                })}
                {activeGoals.length > 4 && (
                  <p className="text-[11px] text-primary font-medium">View all →</p>
                )}
                {activeGoals.length === 0 && completedGoalCount > 0 && (
                  <p className="text-xs text-positive font-medium">All goals completed!</p>
                )}
              </div>
            )}
          </button>
        </motion.div>
      </div>

      {/* Recent Activity */}
      {activity.length > 0 && (
        <motion.div variants={fadeIn}>
          <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-1">
            {activity.map((item, i) => (
              <motion.div
                key={`${item.type}-${item.timestamp}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 py-2 border-l-2 pl-3"
                style={{ borderLeftColor: getHabitColor(item.color) }}
              >
                <div className="shrink-0">
                  {item.type === "habit" && <CircleCheck className="h-3.5 w-3.5 text-muted-foreground" />}
                  {item.type === "payment" && <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  {item.type === "goal" && <Target className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="text-xs flex-1 min-w-0 truncate">{item.description}</p>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {getRelativeTime(item.timestamp)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(timestamp);
}
