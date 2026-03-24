import { create } from "zustand";

export type Page = "debt" | "payments" | "settings";

interface RouterStore {
  page: Page;
  navigate: (page: Page) => void;
}

export const useRouter = create<RouterStore>((set) => ({
  page: "debt",
  navigate: (page) => set({ page }),
}));
