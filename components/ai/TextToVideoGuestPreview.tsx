import { ArrowRight } from "lucide-react";

const SAMPLE_PROMPT =
  "柔光舞室中，一位身着浅色飘逸舞裙的女子优雅起舞。镜头从全身到足部切换，慢动作突出跳跃与旋转。镜面映出层叠舞姿，音乐柔和、节奏与动作同步，整体氛围宁静唯美。";

const SAMPLE_VIDEO_URL =
  "https://cdn.bestmaker.ai/tasks/a53678c3-ac64-424a-930c-f2762ca89676/d37dae072a10474ab878bcce2b6bfe82.mp4";

export function TextToVideoGuestPreview() {
  return (
    <div className="w-full rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/10 p-6 md:p-8 shadow-[0_35px_120px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col items-center justify-center gap-8 lg:flex-row">
        <div className="relative flex-1 rounded-[28px] border border-white/10 bg-black/40 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
          <div className="text-sm uppercase tracking-[0.3em] text-white/60">
            Prompt
          </div>
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
          <span className="absolute left-8 top-8 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Video
          </span>
          <video
            className="h-[420px] w-full rounded-[26px] border border-white/15 object-cover"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            poster="https://cdn.bestmaker.ai/static/placeholders/video-effect-preview.jpg"
          >
            <source src={SAMPLE_VIDEO_URL} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
}

export default TextToVideoGuestPreview;
