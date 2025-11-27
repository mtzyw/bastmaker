import { Eye, Lock, Shield } from "lucide-react"

export function PrivacySecurity() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">AI视频生成器的隐私与数据安全</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            BestMaker AI重视用户隐私和数据安全。我们采用先进的加密技术保护您的数据，确保您的创作内容安全可靠。
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-secondary/50 border border-border rounded-xl p-6">
              <Lock className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
              <h4 className="font-semibold mb-2 text-foreground">数据加密</h4>
              <p className="text-muted-foreground text-sm">所有数据传输均采用SSL加密</p>
            </div>
            <div className="bg-secondary/50 border border-border rounded-xl p-6">
              <Eye className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
              <h4 className="font-semibold mb-2 text-foreground">隐私保护</h4>
              <p className="text-muted-foreground text-sm">不会将您的数据用于其他用途</p>
            </div>
            <div className="bg-secondary/50 border border-border rounded-xl p-6">
              <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
              <h4 className="font-semibold mb-2 text-foreground">安全存储</h4>
              <p className="text-muted-foreground text-sm">视频文件安全存储在云端</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
