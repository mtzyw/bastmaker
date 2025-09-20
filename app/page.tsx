"use client";

import { useState } from "react";
import { AIModelDropdown } from "@/components/ai-model-dropdown";
import {
  DEFAULT_VIDEO_MODEL,
  VIDEO_MODEL_SELECT_OPTIONS,
} from "@/components/ai/video-models";

export default function Home() {
  const [model, setModel] = useState(DEFAULT_VIDEO_MODEL);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-8">AI Model Selection</h1>
        <AIModelDropdown
          options={VIDEO_MODEL_SELECT_OPTIONS}
          value={model}
          onChange={setModel}
          defaultOpen
          showSearchIcon
        />
      </div>
    </div>
  );
}
