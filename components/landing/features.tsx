import { Play } from "lucide-react"

export function Features() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-4 py-1 text-sm">
            <Play className="w-4 h-4" />
            AI视频生成器的功能介绍
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
          BestMaker AI视频生成器有哪些功能？
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-foreground">免费AI文字转视频生成器，前沿通过文本创作视频</h3>
            <p className="text-muted-foreground mb-6">
              BestMaker AI的AI文字转视频功能让您只需输入文字描述，即可生成高质量的AI视频。支持多种AI模型，包括Minimax、Hunyuan、Kling、Pika等，为您提供多样化的创作选择。
            </p>
            <ul className="space-y-3 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span>支持多种主流AI视频模型</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span>高达4K分辨率输出</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span>每日免费积分，无需付费即可体验</span>
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="bg-[#21212a] border border-amber-500/20 rounded-2xl p-4">
              <img src="https://static.bestmaker.ai/image-to-videos/1764215701846-td5k5y.png" alt="AI文字转视频" className="rounded-xl w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
