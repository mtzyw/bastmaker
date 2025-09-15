import ToolLayout from "@/components/tooling/ToolLayout";
import TextToVideoSidebar from "@/components/tooling/TextToVideoSidebar";

export default function TextToVideoPage() {
  return (
    <ToolLayout sidebar={<TextToVideoSidebar />}>
      {/* Hero / Preview */}
      <section className="mb-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl md:text-3xl font-semibold mb-3">Text to Video</h1>
          <p className="text-muted-foreground mb-6">AI Text to Video generator — free, fast & creative.</p>
          <div className="aspect-video w-full rounded-lg border bg-muted/30" />
          <p className="mt-2 text-xs text-muted-foreground">Preview placeholder</p>
        </div>
      </section>

      {/* Examples gallery placeholder */}
      <section className="mb-12">
        <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-lg border bg-muted/30" />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-12">
        <div className="mx-auto max-w-5xl text-center mb-6">
          <h2 className="text-xl font-semibold">How to convert text into video in 3 steps</h2>
          <p className="text-muted-foreground">Simple flow: enter prompt, customize settings, generate & download.</p>
        </div>
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="rounded-lg border p-4 bg-card">
              <div className="aspect-[4/3] rounded-md bg-muted/40 mb-3" />
              <h3 className="font-medium mb-1">Step {s}</h3>
              <p className="text-sm text-muted-foreground">Description placeholder</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="mb-12">
        <div className="mx-auto max-w-5xl text-center mb-6">
          <h2 className="text-xl font-semibold">Create any video you need</h2>
        </div>
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border p-4 bg-card">
              <div className="aspect-[16/9] rounded-md bg-muted/40 mb-3" />
              <h3 className="font-medium mb-1">Use case {i + 1}</h3>
              <p className="text-sm text-muted-foreground">Short description placeholder</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="mb-12">
        <div className="mx-auto max-w-5xl text-center mb-6">
          <h2 className="text-xl font-semibold">Key advantages</h2>
        </div>
        <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-lg border p-4 bg-card">
              <div className="h-10 w-10 rounded-md bg-muted/40 mb-3" />
              <div className="font-medium mb-1">Advantage {i + 1}</div>
              <p className="text-sm text-muted-foreground">Text placeholder</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section className="mb-12">
        <div className="mx-auto max-w-5xl text-center mb-6">
          <h2 className="text-xl font-semibold">User reviews</h2>
        </div>
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border p-4 bg-card h-40" />
          ))}
        </div>
      </section>

      {/* FAQ placeholder */}
      <section className="mb-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold mb-4">FAQs</h2>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border p-4 bg-card">
                <div className="font-medium">Question {i + 1}</div>
                <p className="text-sm text-muted-foreground mt-1">Answer placeholder</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA placeholder */}
      <section className="mb-8">
        <div className="mx-auto max-w-3xl rounded-xl border p-8 text-center bg-gradient-to-br from-indigo-700/20 to-fuchsia-700/20">
          <h3 className="text-lg font-semibold mb-2">No skills needed — make your first free AI video today</h3>
          <p className="text-sm text-muted-foreground mb-4">CTA placeholder</p>
          <div className="h-10 w-40 mx-auto rounded-md border bg-background" />
        </div>
      </section>
    </ToolLayout>
  );
}

