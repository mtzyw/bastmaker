const UI_TO_FREEPIK_ASPECT_RATIO: Record<string, string> = {
  "1:1": "square_1_1",
  "16:9": "widescreen_16_9",
  "9:16": "social_story_9_16",
  "3:4": "traditional_3_4",
  "4:3": "classic_4_3",
  "3:2": "standard_3_2",
  "2:3": "portrait_2_3",
  "1:2": "vertical_1_2",
  "2:1": "horizontal_2_1",
  "4:5": "social_post_4_5",
};

const FREEPIK_TO_UI_ASPECT_RATIO: Record<string, string> = Object.entries(
  UI_TO_FREEPIK_ASPECT_RATIO
).reduce<Record<string, string>>((acc, [uiValue, apiValue]) => {
  acc[apiValue] = uiValue;
  return acc;
}, {});

/**
 * 将界面展示的长宽比字符串转换为 Freepik API 可识别的枚举值。
 * 未包含在映射表中的值会原样返回，确保向后兼容。
 */
export function toFreepikAspectRatio(value: string): string {
  return UI_TO_FREEPIK_ASPECT_RATIO[value] ?? value;
}

/**
 * 将 Freepik 返回的长宽比枚举值转换为界面展示用的字符串。
 * 未包含在映射表中的值会原样返回。
 */
export function fromFreepikAspectRatio(value: string): string {
  return FREEPIK_TO_UI_ASPECT_RATIO[value] ?? value;
}

const TEXT_TO_IMAGE_MODEL_API_MAP: Record<string, string> = {
  "Nano Banana": "seedream-v4",
  "Flux Dev": "flux-dev",
  "Flux Pro 1.1": "flux-pro-v1-1",
  Hyperflux: "hyperflux",
  "Google Imagen4": "imagen3",
  "Seedream 4": "seedream-v4",
  "Seedream 4 Edit": "seedream-v4-edit",
};

/**
 * 将界面选择的模型名称映射为实际请求使用的模型标识。
 * 未在映射中出现的模型会回退为原值。
 */
export function toFreepikModelValue(value: string): string {
  return TEXT_TO_IMAGE_MODEL_API_MAP[value] ?? value;
}

/**
 * 暴露映射表，方便其他模块（例如下拉选项）读取或扩展。
 */
export const FREEPIK_ASPECT_RATIO_UI_MAP = UI_TO_FREEPIK_ASPECT_RATIO;
export const FREEPIK_MODEL_MAP = TEXT_TO_IMAGE_MODEL_API_MAP;
