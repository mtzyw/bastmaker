import { DollarSign, FileVideo, Globe, Sparkles, Users, Zap } from "lucide-react"

const features = [
  { icon: Zap, title: "免费使用", desc: "每天免费获得积分，无需付费即可体验AI视频生成" },
  { icon: DollarSign, title: "高达4K分辨率", desc: "生成高清4K分辨率视频，画质清晰细腻" },
  { icon: Globe, title: "多种AI模型支持", desc: "支持多种主流AI模型，满足不同创作需求" },
  { icon: Sparkles, title: "零学习成本", desc: "简单易用的界面，无需专业技能即可上手" },
  { icon: FileVideo, title: "完成任意风格", desc: "支持多种视频风格，从写实到动画应有尽有" },
  { icon: Users, title: "海量模板", desc: "丰富的视频模板库，快速启动您的创作" },
]

export function WhyChoose() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">为什么选择BestMaker AI视频生成器？</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            BestMaker AI是一款功能强大且易于使用的AI视频生成平台。无论您是内容创作者、营销人员还是普通用户，BestMaker AI都能帮助您快速创建专业级别的AI视频。
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-secondary/50 border border-border rounded-2xl p-6 hover:bg-secondary hover:border-amber-500/30 transition-colors"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
