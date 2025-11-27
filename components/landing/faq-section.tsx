import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "我可以用一个账号同时使用所有三种 AI 工具（视频、音乐、图像）吗？",
    answer:
      "当然可以！只需一个账号，就能完整使用我们的 AI 视频生成器、AI 音乐生成器和 AI 图像编辑器。无需切换平台，也不用重复付费，你可以在同一处轻松完成所有多媒体创作。",
  },
  {
    question: "生成的内容是否可以自由用于商业用途？",
    answer:
      "绝对可以！所有由平台生成的视频、音乐和图片均为 100% 原创，并授予完整的商业使用权。无论是 YouTube 变现、广告投放、企业项目还是客户端交付，你都可放心使用，无需支付额外版权费用。",
  },
  {
    question: "使用这些工具创作内容的速度有多快？",
    answer:
      "极快！\nAI 音乐：约 30 秒\n图像编辑：约 3–5 秒\n视频生成：只需 几分钟即可输出 4K 画质\n我们自研的高性能 AI 引擎确保等待时间最短，让创作从未如此高效。",
  },
  {
    question: "我需要具备专业技能才能使用吗？",
    answer:
      "完全不需要！只需用简单的语言描述你想要的效果，系统会自动生成专业水准的内容。任何人都能轻松上手，零基础也能创作高质量视频、音乐和图像。",
  },
  {
    question: "可以下载哪些高质量格式？",
    answer:
      "平台提供专业级输出：\n4K 超清视频\n录音棚级无损音频格式\n高分辨率图像\n所有内容均无水印，可直接用于商业和专业制作场景。",
  },
  {
    question: "不同工具生成的内容可以互相组合吗？",
    answer:
      "当然可以！你可以：\n将生成的音乐添加到你的视频中\n把静态图像转成动画视频\n先编辑图片再用于视频场景\n通过我们的一体化系统，从素材到成片都能无缝衔接。",
  },
  {
    question: "内容创作有数量限制吗？",
    answer:
      "免费方案提供高额度的每日流量，满足大部分用户需求。\n如果你有更高的产能要求，专业版可获得更大甚至无限量级的使用配额，适合工作室、创作者和企业。",
  },
  {
    question: "相比使用单独的 AI 工具，费用如何？",
    answer:
      "我们的多合一平台比分别订阅多个视频、音乐、图像工具更省钱。你只需支付接近单一工具的价格，就能获得三种 AI 创作工具的高级权限，用更低的成本完成完整的内容制作流程。",
  },
]

export function FAQSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">常见问题解答</h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-secondary/50 border border-border rounded-xl px-6 data-[state=open]:border-amber-500/30"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-amber-400 hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
