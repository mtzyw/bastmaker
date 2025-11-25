import Image from "next/image";

const SAMPLE_IMAGE_URL =
  "https://static.bestmaker.ai/image-to-videos/1764058706171-dm5i29.png";
const SAMPLE_VIDEO_URL =
  "https://cdn.bestmaker.ai/tasks/a6b2238c-f36a-4cbd-99e7-33142187f37f/d49a85182db2438096206c3da3486996.mp4";

export default function ImageToVideoGuestPreview() {
  return (
    <div className="w-full rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/10 p-6 md:p-8 shadow-[0_35px_120px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col items-center justify-center gap-8 lg:flex-row">
        <div className="relative flex-1 rounded-[28px] border border-white/10 bg-black/40 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
          <div className="text-sm uppercase tracking-[0.3em] text-white/60">Source</div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={SAMPLE_IMAGE_URL}
              alt="Image reference"
              width={580}
              height={360}
              className="h-[320px] w-full object-cover"
            />
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
          >
            <source src={SAMPLE_VIDEO_URL} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
}
