import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "内容创作者",
    rating: 5,
    content: "BestMaker AI是我用过的最好的AI视频生成工具！生成速度快，画质清晰，非常推荐！",
    avatar: "professional woman smiling headshot",
  },
  {
    name: "Michael Brown",
    role: "营销经理",
    rating: 5,
    content: "使用BestMaker AI大大提高了我们的视频制作效率，节省了大量时间和成本。",
    avatar: "professional man business headshot",
  },
  {
    name: "Emily Wilson",
    role: "自媒体博主",
    rating: 5,
    content: "界面简洁易用，AI生成的视频效果令人惊艳，已经成为我创作的必备工具。",
    avatar: "young woman creative professional headshot",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          关于BestMaker AI视频生成器的真实用户评价
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.name}
              /* Subtle amber/warm gradient card */
              className="bg-[#21212a] border border-amber-500/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-foreground/80 mb-6">&quot;{item.content}&quot;</p>
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-semibold text-foreground">{item.name}</div>
                  <div className="text-muted-foreground text-sm">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
