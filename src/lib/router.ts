import { create } from "zustand";

export type Page = "dashboard" | "debt" | "schedule" | "budget" | "payments" | "habits" | "goals" | "settings";

interface RouterStore {
  page: Page;
  navigate: (page: Page) => void;
}

export const useRouter = create<RouterStore>((set) => ({
  page: "dashboard",
  navigate: (page) => set({ page }),
}));
