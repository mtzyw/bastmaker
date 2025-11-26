import { ArrowRight } from "lucide-react";

const SAMPLE_PROMPT =
  "Impressionist style: short, bright brushstrokes, pure vivid colors, capturing fleeting light and the beauty of sunlight.";
const SAMPLE_IMAGE_URL =
  "https://cdn.bestmaker.ai/tasks/7297d1c7-8bc2-460c-a56e-e700f62ab70c/215a007bf5de44948eda5dc7f07882b0.png";

export function TextToImageGuestPreview() {
  return (
    <div className="w-full rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/10 p-6 md:p-8 shadow-[0_35px_120px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col items-center justify-center gap-8 lg:flex-row">
        <div className="relative flex-1 rounded-[28px] border border-white/10 bg-black/35 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
          <div className="text-sm uppercase tracking-[0.3em] text-white/60">Prompt</div>
          <p className="mt-4 text-base leading-7 text-white/85">{SAMPLE_PROMPT}</p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80">
            <span>BestMaker AI</span>
            <ArrowRight className="h-4 w-4" />
          </div>

          <div className="absolute -right-12 top-1/2 hidden translate-y-[-50%] items-center justify-center rounded-full border border-white/20 bg-white/10 p-3 lg:flex">
            <ArrowRight className="h-6 w-6 text-white/70" />
          </div>
        </div>

        <div className="relative flex-1 rounded-[32px] border border-white/10 bg-black/30 p-3">
          <img
            className="h-[420px] w-full rounded-[26px] border border-white/15 object-cover"
            src={SAMPLE_IMAGE_URL}
            alt="Text-to-image impressionist painting result"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

export default TextToImageGuestPreview;
