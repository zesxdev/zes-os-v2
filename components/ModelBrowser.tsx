"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { usePlayground } from "@/lib/playground-context";
import { PROVIDERS, ROUTER_API } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CAPABILITIES = ["chat", "vision", "code", "tools"];

export default function ModelBrowser() {
  const { models, modelsLoading, modelsError } = usePlayground();

  // Search & filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const [capFilter, setCapFilter] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter models
  const filtered = useMemo(() => {
    let list = models;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q));
    }
    if (providerFilter) {
      list = list.filter(m => m.provider === providerFilter);
    }
    if (capFilter) {
      list = list.filter(m => m.capabilities.includes(capFilter));
    }
    return list;
  }, [models, debouncedSearch, providerFilter, capFilter]);

  // Quick test
  const handleTest = useCallback(async () => {
    if (!selectedModel || !testPrompt) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch(`${ROUTER_API}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, messages: [{ role: "user", content: testPrompt }], max_tokens: 100 }),
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setTestResult(`Error: ${(e as Error).message}`);
    }
    setTestLoading(false);
  }, [selectedModel, testPrompt]);

  const handleSaveExperiment = useCallback(() => {
    const event = new CustomEvent("save-experiment", {
      detail: {
        name: `Quick Test: ${selectedModel}`,
        description: `Test prompt: "${testPrompt.slice(0, 50)}..."`,
        status: "stopped",
        progress: 100,
        lastRun: "Now",
        category: "ml",
      },
    });
    window.dispatchEvent(event);
  }, [selectedModel, testPrompt]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search models..."
          className="flex-1 bg-accent/20 border border-border/50 rounded px-3 py-1.5 text-xs text-foreground"
          aria-label="Search models"
        />
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setProviderFilter(null)}
            className={cn("px-2 py-1 text-[10px] rounded border transition-all whitespace-nowrap",
              !providerFilter ? "bg-primary/20 border-primary/40 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setProviderFilter(providerFilter === p.id ? null : p.id)}
              className={cn("px-2 py-1 text-[10px] rounded border transition-all whitespace-nowrap",
                providerFilter === p.id ? "bg-primary/20 border-primary/40 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Capability filters */}
      <div className="flex gap-1">
        {CAPABILITIES.map(cap => (
          <button
            key={cap}
            onClick={() => setCapFilter(capFilter === cap ? null : cap)}
            className={cn("px-2 py-0.5 text-[9px] rounded-full border transition-all uppercase tracking-wider",
              capFilter === cap ? "bg-accent/20 border-accent/40 text-foreground" : "border-border/30 text-muted-foreground hover:text-foreground"
            )}
          >
            {cap}
          </button>
        ))}
      </div>

      {/* Model Count */}
      <div className="text-[10px] text-muted-foreground">
        {modelsLoading ? "Loading models..." : modelsError ? "Could not load models" : `${filtered.length} models`}
      </div>

      {/* Model Grid */}
      {modelsLoading ? (
        <div className="text-center text-muted-foreground py-8 text-xs">Loading models...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 text-xs">No models match your filters</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
          {filtered.map(model => {
            const provider = PROVIDERS.find(p => p.id === model.provider);
            return (
              <div
                key={model.id}
                className={cn(
                  "border border-border/30 rounded-lg p-3 cursor-pointer transition-all hover:border-accent/40",
                  selectedModel === model.name && "border-accent/60 bg-accent/5"
                )}
                onClick={() => setSelectedModel(selectedModel === model.name ? null : model.name)}
                role="button"
                tabIndex={0}
                aria-label={`Model ${model.name}`}
                onKeyDown={e => { if (e.key === "Enter") setSelectedModel(selectedModel === model.name ? null : model.name); }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {provider && (
                    <span
                      className="px-1.5 py-0.5 text-[9px] rounded font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${provider.color}20`, color: provider.color }}
                    >
                      {provider.name}
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold truncate">{model.name}</span>
                </div>
                <div className="flex gap-1 flex-wrap mb-1">
                  {model.capabilities.map(cap => (
                    <span key={cap} className="text-[8px] px-1 py-0.5 rounded bg-accent/10 text-muted-foreground uppercase">
                      {cap}
                    </span>
                  ))}
                </div>
                <div className="text-[9px] text-muted-foreground">
                  ctx: {model.contextWindow.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Test Panel */}
      {selectedModel && (
        <div className="border border-accent/30 rounded-lg p-3 bg-accent/5">
          <div className="text-xs font-bold mb-2">Quick Test: {selectedModel}</div>
          <div className="flex gap-2 mb-2">
            <input
              value={testPrompt}
              onChange={e => setTestPrompt(e.target.value)}
              placeholder="Enter a test prompt..."
              className="flex-1 bg-accent/20 border border-border/50 rounded px-2 py-1.5 text-xs text-foreground"
              aria-label="Test prompt"
              onKeyDown={e => { if (e.key === "Enter") handleTest(); }}
            />
            <Button size="sm" className="h-7 text-[10px] px-3" onClick={handleTest} disabled={testLoading || !testPrompt}>
              {testLoading ? "..." : "Send"}
            </Button>
          </div>
          {testResult && (
            <div className="space-y-1">
              <pre className="bg-black/20 rounded p-2 text-[10px] font-mono text-foreground/80 max-h-[200px] overflow-auto whitespace-pre-wrap">
                {testResult}
              </pre>
              <Button size="sm" variant="outline" className="h-6 text-[9px] px-2" onClick={handleSaveExperiment}>
                Save as Experiment
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
