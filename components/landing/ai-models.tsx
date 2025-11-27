const models = [
  { name: "Minimax", desc: "海螺AI1.1 pro" },
  { name: "Hunyuan", desc: "腾讯混元" },
  { name: "kling", desc: "可灵AI" },
  { name: "Luma", desc: "Dream Machine" },
  { name: "Pika", desc: "Pika AI" },
  { name: "Runway", desc: "Gen-3" },
  { name: "Vidu", desc: "Vidu AI" },
  { name: "Hailuo", desc: "海螺AI" },
]

export function AIModels() {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-card">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">多种前沿AI模型供您选择</h2>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {models.map((model) => (
            <div
              key={model.name}
              className="flex items-center gap-3 bg-secondary/50 border border-border rounded-full px-6 py-3 hover:bg-secondary hover:border-amber-500/30 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
                {model.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{model.name}</div>
                <div className="text-xs text-muted-foreground">{model.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
