import { ArrowRight } from "lucide-react";

const SAMPLE_PROMPT = "Place the girl from the photo on a European-style fashion magazine cover.";
const ORIGINAL_IMAGE_URL =
  "https://cdn.bestmaker.ai/tasks/4afe760e-2311-4cd6-ab4b-32b2ff0888f9/1fcc26f9165b41bd97394bfbb7f8e269.png";
const RESULT_IMAGE_URL =
  "https://cdn.bestmaker.ai/tasks/3622772a-ea9d-4321-b574-81d39ff2a7d3/a9809598dd4540ebb06ec6ce3a14d57e.png";

export function ImageToImageGuestPreview() {
  return (
    <div className="w-full rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/10 p-6 md:p-8 shadow-[0_35px_120px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col items-center justify-center gap-8 lg:flex-row">
        <div className="relative flex-1 rounded-[28px] border border-white/10 bg-black/40 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
          <div className="text-sm uppercase tracking-[0.3em] text-white/60">Prompt</div>
          <p className="mt-4 text-base leading-7 text-white/85">{SAMPLE_PROMPT}</p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/15 bg-black/50">
            <img
              src={ORIGINAL_IMAGE_URL}
              alt="Image-to-image original reference portrait"
              className="h-64 w-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="absolute -right-12 top-1/2 hidden translate-y-[-50%] items-center justify-center rounded-full border border-white/20 bg-white/10 p-3 lg:flex">
            <ArrowRight className="h-6 w-6 text-white/70" />
          </div>
        </div>

        <div className="relative flex-1 rounded-[32px] border border-white/10 bg-black/30 p-3">
          <img
            className="h-[420px] w-full rounded-[26px] border border-white/15 object-cover"
            src={RESULT_IMAGE_URL}
            alt="Image-to-image magazine cover result"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

export default ImageToImageGuestPreview;
