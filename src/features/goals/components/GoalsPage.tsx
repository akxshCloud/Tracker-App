import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useGoalStore } from "../store";
import { isGoalComplete } from "../calculations";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalCard } from "./GoalCard";
import { AddGoalDialog } from "./AddGoalDialog";
import { EditGoalDialog } from "./EditGoalDialog";
import { UpdateProgressDialog } from "./UpdateProgressDialog";
import { GoalDetailSheet } from "./GoalDetailSheet";
import type { Goal } from "../types";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export function GoalsPage() {
  const { goals, milestones, filter, isLoading, initialize, setFilter } = useGoalStore();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [updatingGoal, setUpdatingGoal] = useState<Goal | null>(null);
  const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const filteredGoals = useMemo(() => {
    switch (filter) {
      case "active":
        return goals.filter((g) => !isGoalComplete(g));
      case "completed":
        return goals.filter((g) => isGoalComplete(g));
      case "all":
      default:
        return goals;
    }
  }, [goals, filter]);

  const activeCount = goals.filter((g) => !isGoalComplete(g)).length;
  const completedCount = goals.filter((g) => isGoalComplete(g)).length;

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
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
        </div>
        <div className="flex items-center gap-2">
          <AddGoalDialog />
        </div>
      </motion.div>

      {/* Filter tabs */}
      <motion.div variants={fadeIn}>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "active" | "completed" | "all")}>
          <TabsList>
            <TabsTrigger value="active">
              Active{activeCount > 0 && ` (${activeCount})`}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed{completedCount > 0 && ` (${completedCount})`}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Goals grid */}
      {filteredGoals.length === 0 ? (
        <motion.div variants={fadeIn} className="card-elevated rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {filter === "active" && goals.length > 0
              ? "All goals completed! Add a new goal to keep going."
              : filter === "completed"
                ? "No completed goals yet. Keep working towards your goals."
                : "No goals yet. Add your first goal to get started."}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              milestones={milestones[goal.id] ?? []}
              onEdit={setEditingGoal}
              onUpdateProgress={setUpdatingGoal}
              onViewDetails={setViewingGoal}
            />
          ))}
        </motion.div>
      )}

      <EditGoalDialog goal={editingGoal} onClose={() => setEditingGoal(null)} />
      <UpdateProgressDialog goal={updatingGoal} onClose={() => setUpdatingGoal(null)} />
      <GoalDetailSheet
        goal={viewingGoal}
        onClose={() => setViewingGoal(null)}
        onUpdateProgress={(g) => { setViewingGoal(null); setUpdatingGoal(g); }}
      />
    </motion.div>
  );
}
