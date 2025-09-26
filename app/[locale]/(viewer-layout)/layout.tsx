export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full header-bg text-white">
      <div className="pointer-events-none fixed inset-0 opacity-40" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(115,125,255,0.25),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(92,70,255,0.18),_transparent_60%)]" />
      </div>
      <div className="relative z-0 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
