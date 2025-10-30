import type { ComponentProps } from "react";

import TextToImageRecentTasks from "@/components/ai/TextToImageRecentTasks";

type RecentTasksProps = ComponentProps<typeof TextToImageRecentTasks>;

export default function LipSyncRecentTasks(props: RecentTasksProps) {
  return (
    <TextToImageRecentTasks
      initialCategory="视频"
      categories={["视频", "全部", "图片", "音效"] as const}
      {...props}
    />
  );
}
