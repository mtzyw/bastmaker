import { AISidebar } from "@/components/ai-sidebar"

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <AISidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto"></div>
      </main>
    </div>
  )
}
