import type { ComponentProps } from "react";

import TextToImageRecentTasks from "@/components/ai/TextToImageRecentTasks";

type TextToImageRecentTasksProps = ComponentProps<typeof TextToImageRecentTasks>;

export default function SoundGenerationRecentTasks(props: TextToImageRecentTasksProps) {
  return (
    <TextToImageRecentTasks
      initialCategory="音效"
      categories={["音效", "全部", "视频", "图片"] as const}
      {...props}
    />
  );
}
