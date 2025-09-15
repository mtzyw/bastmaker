"use client";

import React from "react";

interface ToolLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function ToolLayout({ sidebar, children }: ToolLayoutProps) {
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
        {/* Sidebar shows on all sizes; becomes sticky on lg+ */}
        <aside>
          <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] overflow-y-auto">
            {sidebar}
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </section>
  );
}
