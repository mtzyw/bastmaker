import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

const videos = [
  { id: 1, src: "https://cdn.bestmaker.ai/tasks/c79eec6b-eb10-4b72-b9fa-f28d7a0e73af/99737affd67f4951913830bd1a821c8b.mp4", label: "视频案例" },
  { id: 2, src: "https://cdn.bestmaker.ai/tasks/d102f9f6-7f72-4c04-bb1f-14b32c276799/dfc452c511aa4800a6194ef84da6c3a2.mp4", label: "视频案例" },
  { id: 3, src: "https://cdn.bestmaker.ai/tasks/230db99f-218e-444e-b68f-efc1041ee5c3/fb92412e930e4280b103625ffe06e0d9.mp4", label: "视频案例" },
  { id: 4, src: "https://cdn.bestmaker.ai/tasks/03b82069-e12e-40c4-9838-a4db084df815/fa157934635543b9885ac86ab73b579a.mp4", label: "视频案例" },
  { id: 5, src: "https://cdn.bestmaker.ai/tasks/c7a012a6-a557-45e4-af3a-ddc69f7f6b6d/b6c6025f82ad4e1d9c908be29fd82007.mp4", label: "视频案例" },
  { id: 6, src: "https://cdn.bestmaker.ai/tasks/544ca1c8-6e3b-42ce-bb27-4c02dcfdc1d3/3a0035a91af844008ce1c60e17977106.mp4", label: "视频案例" },
  { id: 7, src: "https://cdn.bestmaker.ai/tasks/436bd64c-1c9e-4376-833d-dfe7411f5071/2cc1878eedc848d3847959b2979c3065.mp4", label: "视频案例" },
  { id: 8, src: "https://cdn.bestmaker.ai/tasks/a6b2238c-f36a-4cbd-99e7-33142187f37f/d49a85182db2438096206c3da3486996.mp4", label: "视频案例" },
]

export function VideoGallery() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            使用这些热门AI视频特效，将文本和图片转换为视频
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            BestMaker AI提供多种AI视频生成功能，包括文字转视频、图片转视频等。浏览下方的AI视频案例，了解我们的AI视频生成器可以创建哪些类型的内容。
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="relative group rounded-xl overflow-hidden aspect-square border border-border"
            >
              <video
                src={video.src}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 bg-amber-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-amber-500/30">
                  <Play className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                <span className="text-xs text-foreground/80 bg-background/70 backdrop-blur-sm px-2 py-1 rounded">
                  AI生成视频
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button
            variant="outline"
            className="border-border bg-secondary/50 hover:bg-secondary hover:border-amber-500/30 text-foreground"
          >
            开始AI生成视频 →
          </Button>
        </div>
      </div>
    </section>
  )
}
