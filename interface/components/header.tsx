import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-xl font-bold text-foreground">
              Pollo<span className="text-primary">.ai</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Home
              </a>
              <div className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors cursor-pointer">
                <span>Video AI</span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <div className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors cursor-pointer">
                <span>Image AI</span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <div className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors cursor-pointer">
                <span>Effects</span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <div className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors cursor-pointer">
                <span>AI Tools</span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                API
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Pricing
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              Login
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Start for Free</Button>
          </div>
        </div>
      </div>
    </header>
  )
}
