"use client";

import React, { useState } from "react";

export default function QuickStartGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/40 rounded-lg mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-accent/10 transition-colors"
        aria-expanded={open}
      >
        <span className="text-xs">{open ? "▼" : "▶"}</span>
        How to use the Agent Playground
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-border/40 space-y-3 text-xs text-muted-foreground">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
              1
            </span>
            <div>
              <strong className="text-foreground">Test an API</strong> — Go to the{" "}
              <strong className="text-foreground">API Console</strong> tab, select a provider
              and model, edit the request body, and hit <strong className="text-foreground">Run</strong>.
              Use the template dropdown to start from common request patterns.
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
              2
            </span>
            <div>
              <strong className="text-foreground">Browse & test models</strong> — Use the{" "}
              <strong className="text-foreground">Models</strong> tab to explore available
              models across providers. Click any model to send a quick test prompt and see the
              response inline.
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
              3
            </span>
            <div>
              <strong className="text-foreground">Create an agent</strong> — Fill in the{" "}
              <strong className="text-foreground">Create Agent</strong> form, preview the
              command, and launch a new agent session with one click.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
