import Link from "next/link";

type Stat = {
  label: string;
  value: string;
  helper: string;
};

type CreationMode = {
  title: string;
  description: string;
  bullets: string[];
  accent: string;
  dotColor: string;
  previewLabel: string;
};

type FeatureHighlight = {
  title: string;
  description: string;
  tags: string[];
  icon: string;
};

type WorkflowStep = {
  title: string;
  description: string;
  duration: string;
};

type UseCase = {
  title: string;
  industry: string;
  description: string;
  metric: string;
};

type Integration = {
  name: string;
  category: string;
};

const stats: Stat[] = [
  { label: "Unified outputs", value: "4.1M", helper: "Images, video, audio, and docs shipped" },
  { label: "Teams in production", value: "12.6K", helper: "Product, growth, and creative squads" },
  { label: "Avg. handoff time", value: "32m", helper: "Brief to approved delivery" },
];

const creationModes: CreationMode[] = [
  {
    title: "Visual Foundry",
    description:
      "Photoreal, stylized, UI, or 3D-ready renders driven by multi-modal prompts, layout guards, and reference capture.",
    bullets: ["Prompt blender for image/UI/3D", "Structure refs + depth & pose", "Smart masking, paint, and variant stitching"],
    accent: "from-amber-500/20 via-rose-500/10 to-slate-900/40",
    dotColor: "bg-amber-400",
    previewLabel: "Images + UI",
  },
  {
    title: "Motion Suite",
    description:
      "Turn boards into motion with adaptive camera paths, voice-to-beat cues, and timeline-safe temporal controls.",
    bullets: ["Storyboard-to-clip tracks", "Audio reactive transitions", "Temporal stabilizer + camera lock"],
    accent: "from-sky-500/20 via-cyan-500/10 to-slate-900/40",
    dotColor: "bg-sky-400",
    previewLabel: "Video + 3D",
  },
  {
    title: "Narrative & Audio",
    description:
      "Draft copy, scripts, and multilingual voiceover in the same workspace, complete with CTA-aware templates.",
    bullets: ["Docs + script layouts", "Voice + SFX pairing", "Auto captions & CTA suggestions"],
    accent: "from-emerald-500/20 via-lime-500/10 to-slate-900/40",
    dotColor: "bg-emerald-400",
    previewLabel: "Text + Sound",
  },
];

const featureHighlights: FeatureHighlight[] = [
  {
    title: "Omni-modal prompt graph",
    description: "Design once, reuse across text, design, motion, and audio with contextual memory.",
    tags: ["Shared context", "Prompt memory"],
    icon: "🌐",
  },
  {
    title: "Realtime guardrails",
    description: "Continuity lock, watermark scanning, and compliance logs keep every modality production-safe.",
    tags: ["Continuity lock", "Audit trails"],
    icon: "🛡️",
  },
  {
    title: "Multi-team workspaces",
    description: "Invite PMs, marketers, and editors to comment, approve, and remix from one surface.",
    tags: ["Annotations", "Approvals"],
    icon: "🤝",
  },
  {
    title: "Bring-your-model mesh",
    description: "Blend Beastmaker engines with Flux, Runway, ElevenLabs, or custom checkpoints per layer.",
    tags: ["Model routing", "Auto-scaling"],
    icon: "🌀",
  },
];

const workflowSteps: WorkflowStep[] = [
  {
    title: "Capture every brief",
    description: "Drop decks, prompts, or scripts. Beastmaker structures them into tasks for each modality.",
    duration: "≈1 min",
  },
  {
    title: "Map modalities",
    description: "Pair look DNA with motion cues, sound notes, and copy tone using a shared reference board.",
    duration: "≈3 min",
  },
  {
    title: "Generate & sync",
    description: "Spin up simultaneous text, image, video, and audio passes, then polish with track-aware tools.",
    duration: "Realtime",
  },
  {
    title: "Publish anywhere",
    description: "Deliver PSD, ProRes, MP3, DOCX, or Web outputs plus prompt specs for reproducibility.",
    duration: "Export",
  },
];

const useCases: UseCase[] = [
  {
    title: "Launch campaigns",
    industry: "Growth",
    description: "Hero visuals, motion spots, and CTA copy synced for omni-channel drops.",
    metric: "72% faster go-lives",
  },
  {
    title: "Product education",
    industry: "Product",
    description: "Screens, explainers, and narration stitched into interactive walkthroughs.",
    metric: "+38% completion rate",
  },
  {
    title: "Community studios",
    industry: "Creators",
    description: "Spin short-form video, merch art, and newsletters from a single style bible.",
    metric: "4x content velocity",
  },
];

const integrations: Integration[] = [
  { name: "Flux Pro", category: "Visual" },
  { name: "Runway Gen-3", category: "Video" },
  { name: "Pika Motion", category: "Video" },
  { name: "ElevenLabs", category: "Audio" },
  { name: "Notion", category: "Docs" },
  { name: "Figma", category: "Handoff" },
];

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-24 pt-20 sm:px-6 lg:px-0">
        <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-8 py-16 text-white shadow-2xl dark:border-white/5">
          <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
            <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/30 blur-[120px]" />
            <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[140px]" />
          </div>
          <div className="relative z-10 flex flex-col gap-8">
            <div className="max-w-3xl space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
                Beastmaker
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Generate images, video, audio, and copy from one command deck.
              </h1>
              <p className="text-lg text-white/70">
                Beastmaker is the all-in-one creation OS for every modality—image, UI, motion, voice, and docs. Route any
                prompt through shared workflows, collaborate live, and handoff production-ready files without juggling apps.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90"
              >
                Launch studio
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
              >
                See workflows
              </Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Realtime preview</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                    Flux · Runway · ElevenLabs
                  </span>
                </div>
                <div className="mt-5 aspect-[3/2] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-400/50 via-transparent to-indigo-500/30 shadow-inner">
                  <div className="h-full w-full animate-[pulse_6s_ease-in-out_infinite] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-white/70">
                  <span>Prompt cohesion 98%</span>
                  <span>Modal sync on</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-widest text-white/60">Daily signal</p>
                <ul className="mt-4 space-y-4 text-white/80">
                  <li className="flex items-center justify-between text-sm">
                    <span>Generations queued</span>
                    <span className="font-semibold">412</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span>Cross-modal success</span>
                    <span className="font-semibold text-emerald-300">99.2%</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span>Avg. revision cycles</span>
                    <span className="font-semibold">1.1x</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span>Export bandwidth</span>
                    <span className="font-semibold text-sky-300">8.2 TB</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 rounded-3xl border border-border bg-card/80 p-8 shadow-sm sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-semibold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.helper}</p>
            </div>
          ))}
        </section>

        <section className="mt-24 space-y-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Creation modes</p>
              <h2 className="text-3xl font-semibold tracking-tight">Every modality on a shared timeline.</h2>
            </div>
            <p className="max-w-xl text-muted-foreground">
              Swap between image canvases, edit-friendly clips, audio beds, and docs without breaking flow. Beastmaker
              keeps color, cadence, and prompts synced across the stack.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {creationModes.map((mode) => (
              <article
                key={mode.title}
                className="relative overflow-hidden rounded-3xl border border-border bg-card/90 p-8 shadow-lg"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.accent} opacity-50`} />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold">{mode.title}</h3>
                    <span className="text-sm font-medium text-muted-foreground">{mode.previewLabel}</span>
                  </div>
                  <p className="text-muted-foreground">{mode.description}</p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {mode.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${mode.dotColor}`} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/80 backdrop-blur">
                    Linked render lanes keep every revision aligned across image, motion, audio, and copy exports.
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 space-y-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Feature stack</p>
              <h2 className="text-3xl font-semibold tracking-tight">What powers Beastmaker.</h2>
            </div>
            <Link href="/docs" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              Explore the platform →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featureHighlights.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{feature.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 rounded-3xl border border-border bg-card/70 p-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Workflow</p>
              <h2 className="text-3xl font-semibold tracking-tight">From prompt spark to multi-format delivery.</h2>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              Watch a live orchestration →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="flex gap-4 rounded-2xl border border-dashed border-border/70 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-base font-semibold text-primary">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{step.duration}</span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 space-y-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Use cases</p>
              <h2 className="text-3xl font-semibold tracking-tight">Built for any team shipping multi-format stories.</h2>
            </div>
            <p className="max-w-lg text-muted-foreground">
              Beastmaker adapts to growth, product, and community workflows—turn every brief into visuals, motion, copy,
              and sound without leaving the canvas.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {useCases.map((useCase) => (
              <article key={useCase.title} className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{useCase.industry}</p>
                <h3 className="mt-3 text-xl font-semibold">{useCase.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{useCase.description}</p>
                <p className="mt-6 text-sm font-semibold text-emerald-500">{useCase.metric}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 rounded-3xl border border-border bg-card/80 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Plug-ins</p>
              <h2 className="text-2xl font-semibold">Bring your favorite engines, editors, and doc stacks.</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Blend Beastmaker-native generators with third-party models, NLEs, audio labs, and doc workflows through lightweight connectors.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {integrations.map((integration) => (
                <span
                  key={integration.name}
                  className="inline-flex flex-col rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground"
                >
                  <span className="font-semibold text-foreground">{integration.name}</span>
                  <span className="text-xs uppercase tracking-widest">{integration.category}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-24 rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 via-transparent to-foreground/5 px-8 py-14 text-center shadow-lg">
          <h3 className="text-3xl font-semibold tracking-tight">Ready to run every generative workflow in one place?</h3>
          <p className="mt-4 text-muted-foreground">
            Secure early access, invite your team, and start generating hero art, motion edits, scripts, and narration
            from the same shared canvas.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
            >
              Create account
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:border-foreground"
            >
              Book a demo
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
