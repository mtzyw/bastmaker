import { Header } from "@/components/header"
import { ImageGenerator } from "@/components/image-generator"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ImageGenerator />
      </main>
    </div>
  )
}
