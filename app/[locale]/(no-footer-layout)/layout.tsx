import React from "react";
import Header from "@/components/header/Header";
import { AISidebar } from "@/ai-sidebar/components/ai-sidebar";

export default function NoFooterGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full">
      {/* Global header */}
      <Header hideHeaderHrefs={["/#features", "/#pricing", "/flux-kontext-pro", "/multi-image-kontext-pro"]} hideHeaderIds={["pricing"]} />

      {/* Mobile: sidebar on top, below header */}
      <aside className="lg:hidden sticky top-16 z-40">
        <div className="max-w-sm w-full mx-auto px-4">
          <AISidebar />
        </div>
      </aside>

      {/* Desktop: fixed left sidebar below header; content shifted right */}
      <aside
        className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden z-40"
      >
        <AISidebar />
      </aside>

      <div className="w-full">
        <main className="flex-1 min-w-0 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
