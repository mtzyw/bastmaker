import { create } from "zustand";

import type { RepromptDraft } from "@/lib/ai/creation-retry";

type RepromptStoreState = {
  draft: RepromptDraft | null;
  setDraft: (draft: RepromptDraft) => void;
  clearDraft: () => void;
};

export const useRepromptStore = create<RepromptStoreState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
