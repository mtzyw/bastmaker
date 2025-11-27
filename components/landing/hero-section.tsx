import { Button } from "@/components/ui/button"
import { ImageIcon, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/astronaut-floating-in-space-with-earth-in-backgrou.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      <div className="relative container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-300">BestMaker AI</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight text-balance text-foreground">
          使用我们的免费在线AI视频生成器，通过文本或
          <br />
          图片创作令人惊叹的视频
        </h1>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          BestMaker AI是一款基于AI的视频生成工具，可帮助用户通过简单的文字描述或图片轻松创建高质量的AI视频。
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-medium px-8"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            AI文字生成视频
          </Button>
          <Button size="lg" variant="outline" className="border-border bg-card/50 hover:bg-card text-white hover:text-white px-8">
            <ImageIcon className="w-5 h-5 mr-2" />
            AI图片生成视频
          </Button>
        </div>
      </div>
    </section>
  )
}
