import { CreationItem, CreationOutput } from "@/lib/ai/creations";
import { create } from "zustand";

function sortItems(items: CreationItem[]) {
  return items
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      const isNaA = Number.isNaN(dateA);
      const isNaB = Number.isNaN(dateB);
      if (isNaA && isNaB) return 0;
      if (isNaA) return 1;
      if (isNaB) return -1;
      return dateB - dateA;
    })
    .slice(0, 100);
}

function buildFingerprint(item: CreationItem) {
  const source = item.metadata?.source ?? null;
  const modality = item.modalityCode ?? item.metadata?.modality_code ?? null;
  const model = item.inputParams?.model ?? item.modelSlug ?? null;
  const prompt = item.inputParams?.prompt ?? item.metadata?.prompt ?? null;
  const aspectRatio = item.inputParams?.aspect_ratio ?? item.metadata?.aspect_ratio ?? null;
  const resolution = item.inputParams?.resolution ?? item.metadata?.resolution ?? null;
  const mode = item.metadata?.mode ?? item.inputParams?.mode ?? null;
  const referenceCount = item.referenceImageCount ?? item.metadata?.reference_image_count ?? null;

  return JSON.stringify({
    source,
    modality,
    model,
    prompt,
    aspectRatio,
    resolution,
    mode,
    referenceCount,
  });
}

type CreationHistoryState = {
  items: CreationItem[];
  mergeItems: (incoming: CreationItem[]) => void;
  upsertItem: (item: CreationItem) => void;
  updateItem: (jobId: string, updater: (item: CreationItem) => CreationItem) => void;
  appendOutput: (jobId: string, output: CreationOutput) => void;
  removeItem: (jobId: string) => void;
  clear: () => void;
};

export const useCreationHistoryStore = create<CreationHistoryState>((set) => ({
  items: [],
  mergeItems: (incoming) =>
    set((state) => {
      if (!incoming || incoming.length === 0) {
        return state;
      }

      const map = new Map<string, CreationItem>();
      state.items.forEach((item) => {
        map.set(item.jobId, item);
      });

      const tempFingerprints = new Map<string, string>();
      state.items.forEach((item) => {
        if (item.jobId.startsWith("temp-")) {
          tempFingerprints.set(item.jobId, buildFingerprint(item));
        }
      });

      incoming.forEach((item) => {
        const fingerprint = buildFingerprint(item);
        for (const [tempId, tempFingerprint] of tempFingerprints.entries()) {
          if (tempFingerprint === fingerprint) {
            map.delete(tempId);
            tempFingerprints.delete(tempId);
            break;
          }
        }

        const existing = map.get(item.jobId);
        if (existing) {
          map.set(item.jobId, {
            ...existing,
            ...item,
            outputs:
              item.outputs && item.outputs.length > 0
                ? item.outputs
                : existing.outputs,
          });
        }

        map.set(item.jobId, item);
      });

      return { items: sortItems(Array.from(map.values())) };
    }),
  upsertItem: (item) =>
    set((state) => {
      const index = state.items.findIndex((it) => it.jobId === item.jobId);
      if (index === -1) {
        return { items: sortItems([item, ...state.items]) };
      }

      const next = [...state.items];
      const existing = next[index];
      next[index] = {
        ...existing,
        ...item,
        outputs:
          item.outputs && item.outputs.length > 0
            ? item.outputs
            : existing.outputs,
      };

      return { items: sortItems(next) };
    }),
  updateItem: (jobId, updater) =>
    set((state) => {
      const index = state.items.findIndex((item) => item.jobId === jobId);
      if (index === -1) {
        return state;
      }

      const next = [...state.items];
      next[index] = updater(next[index]);
      return { items: sortItems(next) };
    }),
  appendOutput: (jobId, output) =>
    set((state) => {
      const index = state.items.findIndex((item) => item.jobId === jobId);
      if (index === -1) {
        return state;
      }

      const next = [...state.items];
      const outputs = next[index].outputs ?? [];
      if (outputs.some((item) => item.url === output.url)) {
        return state;
      }

      next[index] = {
        ...next[index],
        outputs: [...outputs, output],
      };

      return { items: sortItems(next) };
    }),
  removeItem: (jobId) =>
    set((state) => ({
      items: state.items.filter((item) => item.jobId !== jobId),
    })),
  clear: () => set({ items: [] }),
}));
