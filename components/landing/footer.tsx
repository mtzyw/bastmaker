import { Mail, Video } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="py-16 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-lg text-foreground">BestMaker AI</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">AI驱动的视频生成平台，让创作更简单。</p>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Mail className="w-4 h-4" />
              contact@bestmaker.ai
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">产品</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  AI视频生成器
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  AI图片生成视频
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  AI视频模板
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  定价
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">资源</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  帮助中心
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  博客
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  教程
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  API文档
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">关于我们</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  公司简介
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  联系我们
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-amber-400 transition-colors">
                  服务条款
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">© 2025 BestMaker AI. All rights reserved.</p>
          <div className="flex gap-6 text-muted-foreground text-sm">
            <Link href="#" className="hover:text-amber-400 transition-colors">
              隐私政策
            </Link>
            <Link href="#" className="hover:text-amber-400 transition-colors">
              服务条款
            </Link>
            <Link href="#" className="hover:text-amber-400 transition-colors">
              Cookie设置
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
