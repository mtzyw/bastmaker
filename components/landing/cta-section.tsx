import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export function CTASection() {
  return (
    /* Warm amber/orange gradient background */
    <section
      className="py-20 border-y border-amber-500/10 bg-[#21212a]"
    >
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">想用AI视频生成器创作惊艳的视频吗？</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">立即开始使用BestMaker AI，体验AI视频生成的魅力。</p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium px-8"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          免费开始创作
        </Button>
      </div>
    </section>
  )
}
