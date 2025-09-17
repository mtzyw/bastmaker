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
      <Header hideHeaderHrefs={["/#features", "/#pricing", "/flux-kontext-pro", "/multi-image-kontext-pro"]} hideHeaderIds={["pricing"]} enableSidebarSheet />

      {/* Mobile: sidebar hidden; use Header menu to open floating sheet */}

      {/* Desktop: fixed left sidebar below header; content shifted right */}
      <aside
        className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] overflow-hidden z-40 header-bg"
      >
        <AISidebar className="bg-transparent" />
      </aside>

      <div className="w-full">
        <main className="flex-1 min-w-0 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
