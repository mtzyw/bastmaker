import { AIModelDropdown } from "@/components/ai-model-dropdown"

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-8">AI Model Selection</h1>
        <AIModelDropdown />
      </div>
    </div>
  )
}
