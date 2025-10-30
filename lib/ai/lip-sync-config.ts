export type LipSyncModelConfig = {
  displayName: string;
  providerCode: string;
  creditsCost: number;
  defaultModality: "t2v";
};

const LIP_SYNC_MODEL_CONFIG: Record<string, LipSyncModelConfig> = {
  "lip-sync-default": {
    displayName: "Lip Sync",
    providerCode: "freepik",
    creditsCost: 8,
    defaultModality: "t2v",
  },
} as const;

export type LipSyncModelKey = keyof typeof LIP_SYNC_MODEL_CONFIG;

export function getLipSyncModelConfig(model: string | null | undefined): LipSyncModelConfig {
  const key = model as LipSyncModelKey | undefined;
  if (key && LIP_SYNC_MODEL_CONFIG[key]) {
    return LIP_SYNC_MODEL_CONFIG[key];
  }

  return {
    displayName: model ?? "Lip Sync",
    providerCode: "freepik",
    creditsCost: 8,
    defaultModality: "t2v",
  };
}

export const DEFAULT_LIP_SYNC_MODEL = "lip-sync-default";
