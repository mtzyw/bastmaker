import { ImagePlus, Layers, Music, Scissors, Video, Wand2 } from "lucide-react"

const tools = [
  { icon: Wand2, name: "视口型", desc: "AI视频风格转换" },
  { icon: ImagePlus, name: "AI扩图", desc: "智能扩展图片边界" },
  { icon: Video, name: "AI视频模板", desc: "一键套用模板" },
  { icon: Layers, name: "AI素材生成", desc: "生成视频素材" },
  { icon: Scissors, name: "AI视频剪辑", desc: "智能视频剪辑" },
  { icon: Music, name: "AI配音", desc: "智能语音合成" },
]

export function MoreTools() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">探索更多AI视频工具，释放您的创造力</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            除了AI视频生成，BestMaker AI还提供多种AI工具，帮助您完成更多创意工作。
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="bg-secondary/50 border border-border rounded-xl p-6 text-center hover:bg-secondary hover:border-amber-500/30 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <tool.icon className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="font-semibold mb-1 text-foreground">{tool.name}</h4>
              <p className="text-muted-foreground text-xs">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
