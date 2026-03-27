import { create } from "zustand";
import type { Habit, HabitFormData, HabitCompletion } from "./types";
import * as db from "./db";

interface HabitStore {
  habits: Habit[];
  completions: HabitCompletion[];
  selectedDate: string; // YYYY-MM-DD
  viewMode: "today" | "calendar";
  isLoading: boolean;

  initialize: () => Promise<void>;
  loadHabits: () => Promise<void>;
  loadCompletions: (from: string, to: string) => Promise<void>;

  addHabit: (data: HabitFormData) => Promise<void>;
  updateHabit: (id: number, data: Partial<HabitFormData>) => Promise<void>;
  removeHabit: (id: number) => Promise<void>;
  archiveHabit: (id: number) => Promise<void>;

  toggleCompletion: (habitId: number, date: string) => Promise<boolean>;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: "today" | "calendar") => void;

  reload: () => Promise<void>;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yearAgoStr(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  completions: [],
  selectedDate: todayStr(),
  viewMode: "today",
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });
    const habits = await db.getAllHabits();
    const completions = await db.getCompletionsForRange(yearAgoStr(), todayStr());
    set({ habits, completions, isLoading: false });
  },

  loadHabits: async () => {
    const habits = await db.getAllHabits();
    set({ habits });
  },

  loadCompletions: async (from, to) => {
    const completions = await db.getCompletionsForRange(from, to);
    set({ completions });
  },

  addHabit: async (data) => {
    await db.createHabit(data);
    await get().loadHabits();
  },

  updateHabit: async (id, data) => {
    await db.updateHabit(id, data);
    await get().loadHabits();
  },

  removeHabit: async (id) => {
    await db.deleteHabit(id);
    await get().loadHabits();
  },

  archiveHabit: async (id) => {
    await db.archiveHabit(id);
    await get().loadHabits();
  },

  toggleCompletion: async (habitId, date) => {
    const completed = await db.toggleCompletion(habitId, date);
    // Reload completions for the full range
    const completions = await db.getCompletionsForRange(yearAgoStr(), todayStr());
    set({ completions });
    return completed;
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),

  reload: async () => {
    const habits = await db.getAllHabits();
    const completions = await db.getCompletionsForRange(yearAgoStr(), todayStr());
    set({ habits, completions });
  },
}));
