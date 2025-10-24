export type SoundEffectModelConfig = {
  displayName: string;
  providerCode: string;
  creditsCost: number;
  defaultModality: "t2a";
  defaultDurationSeconds: number;
  defaultPromptInfluence: number;
};

const SOUND_EFFECT_MODEL_CONFIG: Record<string, SoundEffectModelConfig> = {
  "sound-effects-default": {
    displayName: "Sound Effects",
    providerCode: "freepik",
    creditsCost: 4,
    defaultModality: "t2a",
    defaultDurationSeconds: 5,
    defaultPromptInfluence: 0.3,
  },
} as const;

export type SoundEffectModelKey = keyof typeof SOUND_EFFECT_MODEL_CONFIG;

export function getSoundEffectModelConfig(model: string | null | undefined): SoundEffectModelConfig {
  const key = model as SoundEffectModelKey | undefined;
  if (key && SOUND_EFFECT_MODEL_CONFIG[key]) {
    return SOUND_EFFECT_MODEL_CONFIG[key];
  }

  return {
    displayName: model ?? "Sound Effects",
    providerCode: "freepik",
    creditsCost: 4,
    defaultModality: "t2a",
    defaultDurationSeconds: 5,
    defaultPromptInfluence: 0.3,
  };
}

export const DEFAULT_SOUND_EFFECT_MODEL = "sound-effects-default";
