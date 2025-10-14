export type FreepikModelParameterOptions = {
  resolutions: readonly string[];
  durations: readonly (string | number)[];
};

export type FreepikModelDefinition = {
  // User-facing display name, used as the primary ID in the form
  displayName: string;

  // The actual API endpoint ID, which might depend on resolution
  // This can be a string or a map from resolution to ID
  providerModelMap: string | Record<string, string>;

  // The parameters the user can select in the form
  options: FreepikModelParameterOptions;

  // Other metadata
  credits: number;
  provider: "freepik";
};

// This is the new single source of truth, consolidating data from multiple old files.
export const FREepik_MODELS: readonly FreepikModelDefinition[] = [
  {
    displayName: "Seedance 1.0 Pro",
    providerModelMap: {
      "1080p": "seedance-pro-1080p",
      "720p": "seedance-pro-720p",
      "480p": "seedance-pro-480p",
    },
    options: {
      resolutions: ["1080p", "720p", "480p"],
      durations: ["5", "10"],
    },
    credits: 10,
    provider: "freepik",
  },
  {
    displayName: "Seedance 1.0 Lite",
    providerModelMap: {
      "1080p": "seedance-lite-1080p",
      "720p": "seedance-lite-720p",
      "480p": "seedance-lite-480p",
    },
    options: {
      resolutions: ["1080p", "720p", "480p"],
      durations: ["5", "10"],
    },
    credits: 10,
    provider: "freepik",
  },
  {
    displayName: "wan2.2 Plus",
    providerModelMap: {
      "720p": "wan-v2-2-720p",
      "580p": "wan-v2-2-580p",
      "480p": "wan-v2-2-480p",
    },
    options: {
      resolutions: ["720p", "580p", "480p"],
      durations: ["5", "10"],
    },
    credits: 12,
    provider: "freepik",
  },
  {
    displayName: "PixVerse V5",
    providerModelMap: "pixverse-v5",
    options: {
      resolutions: ["360p", "540p", "720p", "1080p"],
      durations: [5, 8],
    },
    credits: 25,
    provider: "freepik",
  },
  {
    displayName: "Minimax Hailuo 2.0",
    providerModelMap: {
      "768p": "minimax-hailuo-02-768p",
      "1080p": "minimax-hailuo-02-1080p",
    },
    options: {
      resolutions: ["768p", "1080p"],
      durations: [6, 10],
    },
    credits: 12,
    provider: "freepik",
  },
  {
    displayName: "Kling v2.1 Master",
    providerModelMap: "kling-v2-1-master",
    options: {
      resolutions: ["720p", "1080p"],
      durations: ["5", "10"],
    },
    credits: 100,
    provider: "freepik",
  },
  {
    displayName: "Kling v2.5 Pro",
    providerModelMap: "kling-v2-5-pro",
    options: {
      resolutions: ["720p", "1080p"],
      durations: ["5", "10"],
    },
    credits: 100,
    provider: "freepik",
  },
  {
    displayName: "Kling Std v2.1",
    providerModelMap: "kling-v2-1-std",
    options: {
      resolutions: ["360p", "540p", "720p", "1080p"],
      durations: ["5", "10"],
    },
    credits: 60,
    provider: "freepik",
  },
];
