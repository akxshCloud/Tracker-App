import { create } from "zustand";
import type { Goal, GoalFormData, GoalMilestone, GoalUpdate } from "./types";
import * as db from "./db";

type GoalFilter = "active" | "completed" | "all";

interface GoalStore {
  goals: Goal[];
  milestones: Record<number, GoalMilestone[]>;
  updates: Record<number, GoalUpdate[]>;
  filter: GoalFilter;
  isLoading: boolean;

  initialize: () => Promise<void>;
  loadGoals: () => Promise<void>;

  addGoal: (data: GoalFormData) => Promise<void>;
  updateGoal: (id: number, data: Partial<GoalFormData>) => Promise<void>;
  removeGoal: (id: number) => Promise<void>;
  archiveGoal: (id: number) => Promise<void>;
  completeGoal: (id: number) => Promise<void>;

  addMilestone: (goalId: number, name: string, targetValue: number) => Promise<void>;
  removeMilestone: (id: number, goalId: number) => Promise<void>;

  updateProgress: (goalId: number, newValue: number, notes?: string) => Promise<void>;
  loadGoalDetails: (goalId: number) => Promise<void>;

  setFilter: (filter: GoalFilter) => void;
  reload: () => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  milestones: {},
  updates: {},
  filter: "active",
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });
    const goals = await db.getAllGoals();
    const allMilestones = await db.getAllMilestones();

    // Group milestones by goal_id
    const milestones: Record<number, GoalMilestone[]> = {};
    for (const m of allMilestones) {
      if (!milestones[m.goal_id]) milestones[m.goal_id] = [];
      milestones[m.goal_id].push(m);
    }

    set({ goals, milestones, isLoading: false });
  },

  loadGoals: async () => {
    const goals = await db.getAllGoals();
    const allMilestones = await db.getAllMilestones();
    const milestones: Record<number, GoalMilestone[]> = {};
    for (const m of allMilestones) {
      if (!milestones[m.goal_id]) milestones[m.goal_id] = [];
      milestones[m.goal_id].push(m);
    }
    set({ goals, milestones });
  },

  addGoal: async (data) => {
    await db.createGoal(data);
    await get().loadGoals();
  },

  updateGoal: async (id, data) => {
    await db.updateGoal(id, data);
    await get().loadGoals();
  },

  removeGoal: async (id) => {
    await db.deleteGoal(id);
    const updates = { ...get().updates };
    delete updates[id];
    const milestones = { ...get().milestones };
    delete milestones[id];
    set({ updates, milestones });
    await get().loadGoals();
  },

  archiveGoal: async (id) => {
    await db.archiveGoal(id);
    await get().loadGoals();
  },

  completeGoal: async (id) => {
    await db.completeGoal(id);
    await get().loadGoals();
  },

  addMilestone: async (goalId, name, targetValue) => {
    await db.addMilestone(goalId, name, targetValue);
    await get().loadGoalDetails(goalId);
  },

  removeMilestone: async (id, goalId) => {
    await db.deleteMilestone(id);
    await get().loadGoalDetails(goalId);
  },

  updateProgress: async (goalId, newValue, notes) => {
    await db.updateProgress(goalId, newValue, notes);
    await get().loadGoals();
    await get().loadGoalDetails(goalId);
  },

  loadGoalDetails: async (goalId) => {
    const [milestones, updates] = await Promise.all([
      db.getMilestones(goalId),
      db.getGoalUpdates(goalId),
    ]);
    set({
      milestones: { ...get().milestones, [goalId]: milestones },
      updates: { ...get().updates, [goalId]: updates },
    });
  },

  setFilter: (filter) => set({ filter }),

  reload: async () => {
    const goals = await db.getAllGoals();
    const allMilestones = await db.getAllMilestones();
    const milestones: Record<number, GoalMilestone[]> = {};
    for (const m of allMilestones) {
      if (!milestones[m.goal_id]) milestones[m.goal_id] = [];
      milestones[m.goal_id].push(m);
    }
    set({ goals, milestones });
  },
}));
