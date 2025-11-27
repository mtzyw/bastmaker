import { Button } from "@/components/ui/button"
import { ChevronDown, Globe, Video } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg text-foreground">BestMaker AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              AI视频 <ChevronDown className="w-4 h-4" />
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              功能 <ChevronDown className="w-4 h-4" />
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              价格
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              探索 <ChevronDown className="w-4 h-4" />
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Globe className="w-4 h-4" />
            中文
            <ChevronDown className="w-4 h-4" />
          </button>
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            登录
          </Button>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-medium">
            免费试用
          </Button>
        </div>
      </div>
    </header>
  )
}
