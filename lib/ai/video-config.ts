export type VideoModelConfig = {
  displayName: string;
  providerCode: string;
  creditsCost: number;
  defaultModality: "t2v" | "i2v";
};

const VIDEO_MODEL_CONFIGS: Record<string, VideoModelConfig> = {
  "Minimax Hailuo 2.0": {
    displayName: "Minimax Hailuo 2.0",
    providerCode: "freepik",
    creditsCost: 12,
    defaultModality: "t2v",
  },
  "Seedance 1.0 Pro": {
    displayName: "Seedance 1.0 Pro",
    providerCode: "freepik",
    creditsCost: 10,
    defaultModality: "i2v",
  },
  "Seedance 1.0 Lite": {
    displayName: "Seedance 1.0 Lite",
    providerCode: "freepik",
    creditsCost: 10,
    defaultModality: "i2v",
  },
  "wan2.2 Plus": {
    displayName: "wan2.2 Plus",
    providerCode: "freepik",
    creditsCost: 12,
    defaultModality: "i2v",
  },
  "PixVerse V5": {
    displayName: "PixVerse V5",
    providerCode: "freepik",
    creditsCost: 25,
    defaultModality: "i2v",
  },
  "PixVerse V5 Transition": {
    displayName: "PixVerse V5 Transition",
    providerCode: "freepik",
    creditsCost: 25,
    defaultModality: "i2v",
  },
  "Kling v2.1 Master": {
    displayName: "Kling v2.1 Master",
    providerCode: "freepik",
    creditsCost: 100,
    defaultModality: "i2v",
  },
  "Kling v2.5 Pro": {
    displayName: "Kling v2.5 Pro",
    providerCode: "freepik",
    creditsCost: 100,
    defaultModality: "i2v",
  },
  "Kling Std v2.1": {
    displayName: "Kling Std v2.1",
    providerCode: "freepik",
    creditsCost: 60,
    defaultModality: "i2v",
  },
} as const;

export function getVideoModelConfig(model: string): VideoModelConfig {
  return (
    VIDEO_MODEL_CONFIGS[model] ?? {
      displayName: model,
      providerCode: "freepik",
      creditsCost: 0,
      defaultModality: "t2v",
    }
  );
}

type ResolutionEndpointMap = {
  default?: string;
  byResolution?: Record<string, string>;
};

const MODEL_ENDPOINTS: Record<string, ResolutionEndpointMap> = {
  "Minimax Hailuo 2.0": {
    byResolution: {
      "768p": "minimax-hailuo-02-768p",
      "1080p": "minimax-hailuo-02-1080p",
    },
  },
  "Seedance 1.0 Pro": {
    byResolution: {
      "1080p": "seedance-pro-1080p",
      "720p": "seedance-pro-720p",
      "480p": "seedance-pro-480p",
    },
  },
  "Seedance 1.0 Lite": {
    byResolution: {
      "1080p": "seedance-lite-1080p",
      "720p": "seedance-lite-720p",
      "480p": "seedance-lite-480p",
    },
  },
  "wan2.2 Plus": {
    byResolution: {
      "720p": "wan-v2-2-720p",
      "580p": "wan-v2-2-580p",
      "480p": "wan-v2-2-480p",
    },
  },
  "PixVerse V5": {
    default: "pixverse-v5",
  },
  "PixVerse V5 Transition": {
    default: "pixverse-v5-transition",
  },
  "Kling v2.1 Master": {
    default: "kling-v2-1-master",
  },
  "Kling v2.5 Pro": {
    default: "kling-v2-5-pro",
  },
  "Kling Std v2.1": {
    default: "kling-v2-1-std",
  },
} as const;

export function resolveVideoApiModel(
  model: string,
  resolution?: string | null,
  override?: string | null
): string | null {
  if (override) {
    return override;
  }

  const mapping = MODEL_ENDPOINTS[model];
  if (!mapping) {
    return null;
  }

  if (mapping.byResolution && resolution) {
    const resolved = mapping.byResolution[resolution];
    if (resolved) {
      return resolved;
    }
  }

  if (mapping.default) {
    return mapping.default;
  }

  if (mapping.byResolution) {
    const [first] = Object.values(mapping.byResolution);
    return first ?? null;
  }

  return null;
}
