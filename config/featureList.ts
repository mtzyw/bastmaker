import { z } from "zod";

export type FunctionMapping = {
  model: string;
  name: string;
  description: string;
  schema: z.ZodObject<any, "strip", z.ZodTypeAny, { [x: string]: any; }, { [x: string]: any; }>;
  default_seed?: number;
  creditsCost: number;
};

export type FunctionMappings = Record<string, FunctionMapping>;

export const featureList: FunctionMappings = {
  'flux_kontext_pro': {
    model: 'black-forest-labs/flux-kontext-pro',
    name: 'Flux Kontext Pro',
    description: 'Flux Kontext Pro is a powerful AI model that can generate realistic images based on a text prompt.',
    creditsCost: 10,
    schema: z.object({
      prompt: z.string().min(1, "Prompt cannot be empty.").max(1000, "Prompt is too long."),
      input_image: z.string().url({ message: "Invalid URL for Image 2" }),
      aspect_ratio: z.enum(['match_input_image', "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "1:2", "2:1", "4:5", "5:4", "21:9", "9:21"]).optional().default('match_input_image'),
      output_format: z.enum(['png', 'jpg']).optional().default('png'),
    })
  },
  'flux_kontext_max': {
    model: 'black-forest-labs/flux-kontext-max',
    name: 'Flux Kontext Max',
    description: 'Flux Kontext Max is a powerful AI model that can generate realistic images based on a text prompt.',
    creditsCost: 20,
    schema: z.object({
      prompt: z.string().min(1, "Prompt cannot be empty.").max(1000, "Prompt is too long."),
      input_image: z.string().url({ message: "Invalid URL for Image 2" }),
      aspect_ratio: z.enum(['match_input_image', "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "1:2", "2:1", "4:5", "5:4", "21:9", "9:21"]).optional().default('match_input_image'),
      output_format: z.enum(['png', 'jpg']).optional().default('png'),
    })
  },
  'multi_image_kontext_pro': {
    model: 'flux-kontext-apps/multi-image-kontext-pro',
    name: 'Multi Image Kontext Pro',
    description: 'Multi Image Kontext Pro is a powerful AI model that can generate realistic images based on a text prompt.',
    creditsCost: 10,
    schema: z.object({
      prompt: z.string().min(1, "Prompt cannot be empty.").max(1000, "Prompt is too long."),
      input_image_1: z.string().url({ message: "Invalid URL for Image 1" }),
      input_image_2: z.string().url({ message: "Invalid URL for Image 2" }),
      aspect_ratio: z.enum(['match_input_image', "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "1:2", "2:1", "4:5", "5:4", "21:9", "9:21"]).optional().default('match_input_image'),
      output_format: z.enum(['png', 'jpg']).optional().default('png'),
    })
  },
  'multi_image_kontext_max': {
    model: 'flux-kontext-apps/multi-image-kontext-max',
    name: 'Multi Image Kontext Max',
    description: 'Multi Image Kontext Max is a powerful AI model that can generate realistic images based on a text prompt.',
    creditsCost: 20,
    schema: z.object({
      prompt: z.string().min(1, "Prompt cannot be empty.").max(1000, "Prompt is too long."),
      input_image_1: z.string().url({ message: "Invalid URL for Image 1" }),
      input_image_2: z.string().url({ message: "Invalid URL for Image 2" }),
      aspect_ratio: z.enum(['match_input_image', "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "1:2", "2:1", "4:5", "5:4", "21:9", "9:21"]).optional().default('match_input_image'),
      output_format: z.enum(['png', 'jpg']).optional().default('png'),
    })
  },
  // 'restore_image': {
  //   model: 'flux-kontext-apps/restore-image',
  //   name: 'Restore Image',
  //   description: 'Restore Image is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'change_haircut': {
  //   model: 'flux-kontext-apps/change-haircut',
  //   name: 'Change Haircut',
  //   description: 'Change Haircut is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'professional_headshot': {
  //   model: 'flux-kontext-apps/professional-headshot',
  //   name: 'Professional Headshot',
  //   description: 'Professional Headshot is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'portrait_series': {
  //   model: 'flux-kontext-apps/portrait-series',
  //   name: 'Portrait Series',
  //   description: 'Portrait Series is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'multi_image_list': {
  //   model: 'flux-kontext-apps/multi-image-list',
  //   name: 'Multi Image List',
  //   description: 'Multi Image List is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'impossible_scenarios': {
  //   model: 'flux-kontext-apps/impossible-scenarios',
  //   name: 'Impossible Scenarios',
  //   description: 'Impossible Scenarios is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'cartoonify': {
  //   model: 'flux-kontext-apps/cartoonify',
  //   name: 'Cartoonify',
  //   description: 'Cartoonify is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'iconic_locations': {
  //   model: 'flux-kontext-apps/iconic-locations',
  //   name: 'Iconic Locations',
  //   description: 'Iconic Locations is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'renaissance': {
  //   model: 'flux-kontext-apps/renaissance',
  //   name: 'Renaissance',
  //   description: 'Renaissance is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'depth_of_field': {
  //   model: 'flux-kontext-apps/depth-of-field',
  //   name: 'Depth of Field',
  //   description: 'Depth of Field is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'filters': {
  //   model: 'flux-kontext-apps/filters',
  //   name: 'Filters',
  //   description: 'Filters is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'face_to_many_kontext': {
  //   model: 'flux-kontext-apps/face-to-many-kontext',
  //   name: 'Face to Many Kontext',
  //   description: 'Face to Many Kontext is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
  // 'text_removal': {
  //   model: 'flux-kontext-apps/text-removal',
  //   name: 'Text Removal',
  //   description: 'Text Removal is a powerful AI model that can generate realistic images based on a text prompt.',
  // },
}