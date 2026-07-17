"use client";

import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import DashboardChart from "@/components/dashboard/chart";
import AtomIcon from "@/components/icons/atom";
import AgentPlayground from "@/components/AgentPlayground";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSystemInfo, type SystemInfo } from "@/lib/api-client";

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "running" | "stopped" | "error";
  progress: number;
  lastRun: string;
  category: "ml" | "network" | "system" | "monitor";
}

const defaultExperiments: Experiment[] = [
  { id: "exp-1", name: "Neural Scan", description: "Pattern recognition & anomaly detection", status: "running", progress: 78, lastRun: "Now", category: "ml" },
  { id: "exp-2", name: "Packet Analyzer", description: "Real-time network traffic analysis", status: "running", progress: 45, lastRun: "Now", category: "network" },
  { id: "exp-3", name: "Memory Weaver", description: "Distributed memory compression", status: "stopped", progress: 100, lastRun: "2h ago", category: "system" },
  { id: "exp-4", name: "Guardian AI", description: "Autonomous threat response", status: "stopped", progress: 62, lastRun: "5h ago", category: "ml" },
  { id: "exp-5", name: "Mesh Topology", description: "Network mesh discovery & mapping", status: "running", progress: 33, lastRun: "Now", category: "network" },
  { id: "exp-6", name: "Resource Optimizer", description: "Dynamic resource allocation engine", status: "error", progress: 89, lastRun: "Failed", category: "system" },
];

const MOCK_SYSINFO: SystemInfo = {
  memory: { total: "7.5G", used: "4.2G", percent: 56 },
  disk: { total: "64G", used: "23G", percent: 36 },
  uptime: "3d 14h 22m",
  hostname: "zes-mobile",
  load: [1.2, 1.0, 0.8],
};

const categoryColors: Record<string, string> = {
  ml: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  network: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  system: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  monitor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function LaboratoryPage() {
  const [experiments, setExperiments] = useState<Experiment[]>(defaultExperiments);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const system = await getSystemInfo();
      if (system) setSysInfo(system);
      else setSysInfo(MOCK_SYSINFO);
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleExperiment = (id: string) => {
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === id
          ? { ...exp, status: exp.status === "running" ? "stopped" : "running", lastRun: "Now" }
          : exp
      )
    );
  };

  const activeExpCount = experiments.filter((e) => e.status === "running").length;

  return (
    <DashboardPageLayout
      header={{
        title: "Laboratory",
        description: "Experiments · Monitors · Research",
        icon: AtomIcon,
      }}
    >

      <div className="mb-6">
        <AgentPlayground />
      </div>

      {/* Active Experiments */}
      <DashboardCard
        title="ACTIVE EXPERIMENTS"
        intent={activeExpCount > 0 ? "success" : "default"}
        addon={
          <Badge variant={activeExpCount > 0 ? "default" : "secondary"}>
            <span className={cn("inline-block size-1.5 rounded-full mr-1.5", activeExpCount > 0 ? "bg-success" : "bg-muted-foreground")} />
            {activeExpCount} RUNNING
          </Badge>
        }
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className={cn(
                "rounded-lg border p-4 transition-all duration-300 hover:border-primary/30",
                exp.status === "running"
                  ? "border-success/30 bg-success/5"
                  : exp.status === "error"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border/40 bg-accent/10"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bullet
                    variant={
                      exp.status === "running"
                        ? "success"
                        : exp.status === "error"
                        ? "destructive"
                        : "default"
                    }
                  />
                  <span className="font-display text-sm">{exp.name}</span>
                </div>
                <Badge variant="outline" className={cn("text-[9px] uppercase", categoryColors[exp.category])}>
                  {exp.category}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground mb-3">{exp.description}</p>

              {/* Progress Bar */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Progress</span>
                  <span className={cn(
                    "font-mono font-bold",
                    exp.status === "running" ? "text-success" : exp.status === "error" ? "text-destructive" : "text-muted-foreground"
                  )}>{exp.progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      exp.status === "running"
                        ? "bg-success"
                        : exp.status === "error"
                        ? "bg-destructive"
                        : "bg-muted-foreground/30"
                    )}
                    style={{ width: `${exp.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-mono">
                  Last: {exp.lastRun}
                </span>
                <Button
                  variant={exp.status === "running" ? "outline" : "default"}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => toggleExperiment(exp.id)}
                  disabled={exp.status === "error"}
                >
                  {exp.status === "running" ? "STOP" : exp.status === "error" ? "FAILED" : "START"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Chart */}
      <div className="mb-6">
        <DashboardChart />
      </div>

      {/* System Monitor */}
      <DashboardCard title="SYSTEM MONITOR" intent="default">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU */}
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">CPU</span>
              <Bullet variant={sysInfo && sysInfo.load[0] > 2 ? "destructive" : "success"} />
            </div>
            <div className="text-2xl font-display font-bold mb-1">
              {sysInfo ? `${sysInfo.load[0]?.toFixed(1) ?? "0.0"}` : "---"}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              load average
            </div>
          </div>

          {/* Memory */}
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">MEMORY</span>
              <Bullet variant={sysInfo && sysInfo.memory.percent > 80 ? "destructive" : sysInfo && sysInfo.memory.percent > 60 ? "warning" : "success"} />
            </div>
            <div className="text-2xl font-display font-bold mb-1">
              {sysInfo?.memory.used ?? "---"}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              of {sysInfo?.memory.total ?? "---"} total
            </div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  sysInfo && sysInfo.memory.percent > 80 ? "bg-destructive" : sysInfo && sysInfo.memory.percent > 60 ? "bg-warning" : "bg-success"
                )}
                style={{ width: `${sysInfo?.memory.percent ?? 0}%` }}
              />
            </div>
          </div>

          {/* Disk */}
          <div className="bg-accent/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">DISK</span>
              <Bullet variant={sysInfo && sysInfo.disk.percent > 85 ? "destructive" : sysInfo && sysInfo.disk.percent > 70 ? "warning" : "success"} />
            </div>
            <div className="text-2xl font-display font-bold mb-1">
              {sysInfo?.disk.used ?? "---"}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              of {sysInfo?.disk.total ?? "---"} total
            </div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  sysInfo && sysInfo.disk.percent > 85 ? "bg-destructive" : sysInfo && sysInfo.disk.percent > 70 ? "bg-warning" : "bg-success"
                )}
                style={{ width: `${sysInfo?.disk.percent ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </DashboardCard>
    </DashboardPageLayout>
  );
}
