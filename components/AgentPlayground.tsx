"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import DashboardCard from "@/components/dashboard/card";
import { usePlayground, PlaygroundProvider } from "@/lib/playground-context";

const ApiConsole = dynamic(() => import("@/components/ApiConsole"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-muted-foreground text-xs">
      Loading editor...
    </div>
  ),
});

const ModelBrowser = dynamic(() => import("@/components/ModelBrowser"), {
  ssr: false,
});

const CreateAgentForm = dynamic(() => import("@/components/CreateAgentForm"), {
  ssr: false,
});

const TABS = [
  { id: "api" as const, label: "API Console", icon: "]" },
  { id: "models" as const, label: "Models", icon: "◈" },
  { id: "create-agent" as const, label: "Create Agent", icon: "✦" },
];

function PlaygroundTabs() {
  const { activeTab, setActiveTab } = usePlayground();
  return (
    <div
      className="flex gap-1 border-b border-border/50 pb-0.5 -mx-1 px-1 overflow-x-auto"
      role="tablist"
      aria-label="Playground tabs"
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-label={tab.label}
          className={`px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-t-lg transition-all ${
            activeTab === tab.id
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
          }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}

function TabContent() {
  const { activeTab } = usePlayground();
  return (
    <div role="tabpanel" className="pt-3 min-h-[300px] md:min-h-[400px]">
      {activeTab === "api" && (
        <Suspense
          fallback={
            <div className="p-4 text-center text-muted-foreground">
              Loading API Console...
            </div>
          }
        >
          <ApiConsole />
        </Suspense>
      )}
      {activeTab === "models" && (
        <Suspense
          fallback={
            <div className="p-4 text-center text-muted-foreground">
              Loading Models...
            </div>
          }
        >
          <ModelBrowser />
        </Suspense>
      )}
      {activeTab === "create-agent" && (
        <Suspense
          fallback={
            <div className="p-4 text-center text-muted-foreground">
              Loading Form...
            </div>
          }
        >
          <CreateAgentForm />
        </Suspense>
      )}
    </div>
  );
}

export default function AgentPlayground() {
  return (
    <PlaygroundProvider>
      <DashboardCard title="AGENT PLAYGROUND" intent="default" className="bg-primary/10 border-primary/20">
        <PlaygroundTabs />
        <TabContent />
      </DashboardCard>
    </PlaygroundProvider>
  );
}
