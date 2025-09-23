const TEXT_TO_IMAGE_MODEL_CONFIG = {
  "gemini-2-5-flash-image-preview": {
    displayName: "Nano Banana Free",
    providerCode: "freepik",
    creditsCost: 0,
    defaultModality: "t2i",
  },
  "flux-dev": {
    displayName: "Flux Dev",
    providerCode: "freepik",
    creditsCost: 4,
    defaultModality: "t2i",
  },
  "hyperflux": {
    displayName: "Hyperflux",
    providerCode: "freepik",
    creditsCost: 6,
    defaultModality: "t2i",
  },
  "imagen3": {
    displayName: "Google Imagen4",
    providerCode: "freepik",
    creditsCost: 8,
    defaultModality: "t2i",
  },
  "seedream-v4": {
    displayName: "Seedream 4",
    providerCode: "freepik",
    creditsCost: 5,
    defaultModality: "t2i",
  },
  "seedream-v4-edit": {
    displayName: "Seedream 4 Edit",
    providerCode: "freepik",
    creditsCost: 5,
    defaultModality: "i2i",
  },
} as const;

export type TextToImageModelKey = keyof typeof TEXT_TO_IMAGE_MODEL_CONFIG;

export type TextToImageModelConfig = {
  displayName: string;
  providerCode: string;
  creditsCost: number;
  defaultModality: "t2i" | "i2i";
};

export function getTextToImageModelConfig(model: string): TextToImageModelConfig {
  const config = TEXT_TO_IMAGE_MODEL_CONFIG[model as TextToImageModelKey];
  if (config) {
    return config;
  }

  return {
    displayName: model,
    providerCode: "freepik",
    creditsCost: 0,
    defaultModality: "t2i",
  };
}
