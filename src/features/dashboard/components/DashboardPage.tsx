import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Wallet,
  Target,
  TrendingDown,
  CircleCheck,
  Dumbbell,
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
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
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
    Promise.all([
      initDebt(),
      initBudget(),
      initHabits(),
      initGoals(),
    ]).then(async () => {
      const items = await getRecentActivity(8);
      setActivity(items);
      setIsLoading(false);
    });
  }, [initDebt, initBudget, initHabits, initGoals]);

  // Debt summary
  const debtSummary = useMemo(() => {
    if (debts.length === 0) return null;
    return getDebtSummary(debts);
  }, [debts]);

  const comparison = useMemo(
    () => debts.length > 0 ? compareStrategies(debts, monthlyBudget) : null,
    [debts, monthlyBudget],
  );

  // Today's habits
  const today = todayStr();
  const scheduledHabits = useMemo(
    () => getScheduledHabitsForDate(habits, today),
    [habits, today],
  );
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
  const completedGoals = useMemo(() => goals.filter((g) => isGoalComplete(g)), [goals]);

  // Budget
  const budgetIncome = useMemo(
    () => breakdown.find((b) => b.category === "income")?.total ?? 0,
    [breakdown],
  );
  const budgetSpending = useMemo(
    () => breakdown
      .filter((b) => b.category !== "income" && b.category !== "uncategorised")
      .reduce((sum, b) => sum + Math.abs(b.total), 0),
    [breakdown],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" variants={stagger} initial="initial" animate="animate">
      {/* Greeting */}
      <motion.div variants={fadeIn}>
        <GreetingHeader habitsRemaining={habitsTotal - habitsCompleted} />
      </motion.div>

      {/* Top row: habits + goals */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Habits */}
        <button
          onClick={() => navigate("habits")}
          className="card-elevated rounded-2xl p-5 text-left transition-all hover:border-border/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Dumbbell className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Today's Habits</h3>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing progress={habitsPercent} size={72} strokeWidth={6}>
              <p className="text-sm font-bold font-mono tabular-nums">
                {habitsCompleted}/{habitsTotal}
              </p>
            </ProgressRing>
            <div className="flex-1 space-y-1.5">
              {scheduledHabits.slice(0, 4).map((h) => {
                const done = completedToday.has(h.id);
                return (
                  <div key={h.id} className="flex items-center gap-2">
                    <div
                      className={cn("h-1.5 w-1.5 rounded-full", done && "opacity-40")}
                      style={{ backgroundColor: getHabitColor(h.color) }}
                    />
                    <span className={cn(
                      "text-xs truncate",
                      done ? "text-muted-foreground line-through" : "text-foreground",
                    )}>
                      {h.name}
                    </span>
                  </div>
                );
              })}
              {scheduledHabits.length > 4 && (
                <p className="text-[10px] text-muted-foreground">
                  +{scheduledHabits.length - 4} more
                </p>
              )}
              {habitsTotal === 0 && (
                <p className="text-xs text-muted-foreground">No habits scheduled today</p>
              )}
            </div>
          </div>
        </button>

        {/* Goals Progress */}
        <button
          onClick={() => navigate("goals")}
          className="card-elevated rounded-2xl p-5 text-left transition-all hover:border-border/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Goals</h3>
          </div>
          {goals.length === 0 ? (
            <p className="text-xs text-muted-foreground">No goals yet. Add your first goal to track progress.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-bold font-mono tabular-nums">{activeGoals.length}</p>
                  <p className="text-[10px] text-muted-foreground">active</p>
                </div>
                <div className="h-8 w-px bg-border/20" />
                <div>
                  <p className="text-2xl font-bold font-mono tabular-nums text-positive">{completedGoals.length}</p>
                  <p className="text-[10px] text-muted-foreground">completed</p>
                </div>
              </div>
              {activeGoals.slice(0, 3).map((g) => {
                const pct = getProgressPercentage(g);
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate flex-1">{g.name}</span>
                      <span className="text-[10px] font-mono tabular-nums text-muted-foreground ml-2">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: getHabitColor(g.color) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </button>
      </motion.div>

      {/* Financial row: debt + budget */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Debt Overview */}
        <button
          onClick={() => navigate("debt")}
          className="lg:col-span-3 card-elevated rounded-2xl p-5 text-left transition-all hover:border-border/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Debt Overview</h3>
          </div>
          {debtSummary ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Remaining</p>
                <p className="text-lg font-bold font-mono tabular-nums">
                  {formatCurrency(debtSummary.totalDebt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid off</p>
                <p className="text-lg font-bold font-mono tabular-nums text-positive">
                  {Math.round(debtSummary.percentPaid)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Debt-free</p>
                <p className="text-sm font-medium">
                  {comparison?.avalanche.payoffDate
                    ? formatDate(comparison.avalanche.payoffDate)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly interest</p>
                <p className="text-sm font-medium text-destructive">
                  {formatCurrency(debtSummary.monthlyInterestAccruing)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No debts tracked yet.</p>
          )}
        </button>

        {/* Budget This Month */}
        <button
          onClick={() => navigate("budget")}
          className="lg:col-span-2 card-elevated rounded-2xl p-5 text-left transition-all hover:border-border/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Budget This Month</h3>
          </div>
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Income</p>
                  <p className="text-lg font-bold font-mono tabular-nums text-positive">
                    {formatCurrency(budgetIncome)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Spending</p>
                  <p className="text-lg font-bold font-mono tabular-nums text-destructive">
                    {formatCurrency(budgetSpending)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/10">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Net flow</span>
                <span className={cn(
                  "text-sm font-bold font-mono tabular-nums",
                  budgetIncome - budgetSpending >= 0 ? "text-positive" : "text-destructive",
                )}>
                  {formatCurrency(budgetIncome - budgetSpending)}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Connect your bank to see your budget.</p>
              <span className="text-xs text-primary">Connect bank →</span>
            </div>
          )}
        </button>
      </motion.div>

      {/* Recent Activity */}
      {activity.length > 0 && (
        <motion.div variants={fadeIn} className="card-elevated rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {activity.map((item, i) => (
              <motion.div
                key={`${item.type}-${item.timestamp}-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-lg bg-background/30 border border-border/10 px-3 py-2"
              >
                <div
                  className="h-6 w-6 shrink-0 rounded-md flex items-center justify-center"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${getHabitColor(item.color)} 15%, transparent)`,
                  }}
                >
                  {item.type === "habit" && (
                    <CircleCheck className="h-3 w-3" style={{ color: getHabitColor(item.color) }} />
                  )}
                  {item.type === "payment" && (
                    <TrendingDown className="h-3 w-3 text-primary" />
                  )}
                  {item.type === "goal" && (
                    <Target className="h-3 w-3" style={{ color: getHabitColor(item.color) }} />
                  )}
                </div>
                <p className="text-xs flex-1 min-w-0 truncate">{item.description}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(timestamp);
}
