"use client";

import React, { useState, useCallback } from "react";
import type { ApiRequest, ApiResponse, ExampleTemplate } from "@/types/dashboard";
import { PROVIDERS, EXAMPLE_TEMPLATES, ROUTER_API } from "@/lib/constants";
import { usePlayground } from "@/lib/playground-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
function substituteVars(body: string, model: string, provider: string): string {
  return body.replace(/\{\{MODEL\}\}/g, model).replace(/\{\{PROVIDER\}\}/g, provider);
}

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

function JsonEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-[200px] bg-accent/20 border border-border/30 rounded-lg p-3 font-mono text-xs text-foreground resize-y"
      aria-label="Request body editor"
    />
  );
}

export default function ApiConsole() {
  const { addRecentRequest } = usePlayground();

  const [method, setMethod] = useState("POST");
  const [endpoint, setEndpoint] = useState("/v1/chat/completions");
  const [provider, setProvider] = useState(PROVIDERS[0].id);
  const [model, setModel] = useState("");
  const [body, setBody] = useState(EXAMPLE_TEMPLATES[0].body);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulateError, setSimulateError] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(EXAMPLE_TEMPLATES[0].name);

  const handleTemplateSelect = useCallback((name: string) => {
    const tpl = EXAMPLE_TEMPLATES.find(t => t.name === name);
    if (!tpl) return;
    setSelectedTemplate(name);
    setMethod(tpl.method);
    setEndpoint(tpl.endpoint);
    setBody(tpl.body);
  }, []);

  const handleRun = useCallback(async () => {
    if (simulateError) {
      const errors: ApiResponse[] = [
        { status: 500, statusText: "Internal Server Error", body: JSON.stringify({ error: { message: "Simulated server error", type: "server_error" } }, null, 2), timing: 1200 },
        { status: 429, statusText: "Too Many Requests", body: JSON.stringify({ error: { message: "Rate limit exceeded", type: "rate_limit" } }, null, 2), timing: 340 },
        { status: 503, statusText: "Service Unavailable", body: JSON.stringify({ error: { message: "Service temporarily unavailable", type: "unavailable" } }, null, 2), timing: 5100 },
      ];
      setResponse(errors[Math.floor(Math.random() * errors.length)]);
      return;
    }

    setLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      const resolvedBody = substituteVars(body, model, provider);
      const res = await fetch(`${ROUTER_API}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method !== "GET" ? resolvedBody : undefined,
      });
      const timing = Math.round(performance.now() - start);
      const text = await res.text();
      let tokenUsage: ApiResponse["tokenUsage"];
      try {
        const j = JSON.parse(text);
        if (j.usage) tokenUsage = j.usage;
      } catch {}
      const resp: ApiResponse = { status: res.status, statusText: res.statusText, body: text, timing, tokenUsage };
      setResponse(resp);
      addRecentRequest(`${method} ${endpoint} → ${res.status}`);
    } catch (e) {
      setResponse({ status: 0, statusText: (e as Error).message, body: "", timing: 0 });
    }
    setLoading(false);
  }, [method, endpoint, provider, model, body, simulateError, addRecentRequest]);

  const handleCopyCurl = useCallback(() => {
    const curl = `curl -X ${method} '${ROUTER_API}${endpoint}' -H 'Content-Type: application/json' -d '${body}'`;
    navigator.clipboard.writeText(curl).catch(() => {});
  }, [method, endpoint, body]);

  const handleSaveExperiment = useCallback(() => {
    const event = new CustomEvent("save-experiment", {
      detail: {
        name: response ? `API: ${method} ${endpoint}` : `API Test: ${method} ${endpoint}`,
        description: response ? `${provider}/${model} → ${response.status}` : `Test setup for ${provider}/${model}`,
        status: response && response.status < 400 ? "running" : "stopped",
        progress: response ? 100 : 0,
        lastRun: "Now",
        category: "network",
      },
    });
    window.dispatchEvent(event);
  }, [method, endpoint, provider, model, response]);

  return (
    <div className="flex flex-col gap-3">
      {/* Method & Endpoint Row */}
      <div className="flex flex-col md:flex-row gap-2">
        <select
          value={method}
          onChange={e => setMethod(e.target.value)}
          className="bg-accent/20 border border-border/50 rounded px-2 py-1.5 text-xs font-mono text-foreground w-20"
          aria-label="HTTP method"
        >
          {METHODS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <input
          value={endpoint}
          onChange={e => setEndpoint(e.target.value)}
          className="flex-1 bg-accent/20 border border-border/50 rounded px-2 py-1.5 text-xs font-mono text-foreground min-w-0"
          placeholder="/v1/chat/completions"
          aria-label="API endpoint"
        />

        <select
          value={provider}
          onChange={e => setProvider(e.target.value)}
          className="bg-accent/20 border border-border/50 rounded px-2 py-1.5 text-xs text-foreground w-28"
          aria-label="Provider"
        >
          {PROVIDERS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <input
          value={model}
          onChange={e => setModel(e.target.value)}
          className="bg-accent/20 border border-border/50 rounded px-2 py-1.5 text-xs font-mono text-foreground w-32"
          placeholder="gpt-4o"
          aria-label="Model name"
        />
      </div>

      {/* Template Selector */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Template:</span>
        <select
          value={selectedTemplate}
          onChange={e => handleTemplateSelect(e.target.value)}
          className="bg-accent/20 border border-border/50 rounded px-2 py-1 text-[10px] text-foreground"
          aria-label="Request template"
        >
          {EXAMPLE_TEMPLATES.map(t => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Editor & Response */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Editor */}
        <div className="flex-1 min-h-[200px]">
          <JsonEditor value={body} onChange={setBody} />
        </div>

        {/* Response Panel */}
        <div className="flex-1 min-h-[200px] border border-border/30 rounded-lg bg-accent/5 p-3 overflow-auto font-mono text-xs">
          {!response && !loading && (
            <div className="text-muted-foreground italic">Run a request to see the response...</div>
          )}
          {loading && <div className="text-muted-foreground animate-pulse">Sending...</div>}
          {response && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold",
                  response.status < 300 ? "bg-success/20 text-success" :
                  response.status < 500 ? "bg-warning/20 text-warning" :
                  "bg-destructive/20 text-destructive"
                )}>
                  {response.status} {response.statusText}
                </span>
                {response.timing > 0 && <span className="text-muted-foreground">{response.timing}ms</span>}
                {response.tokenUsage && (
                  <span className="text-muted-foreground text-[9px]">
                    ↑{response.tokenUsage.prompt} ↓{response.tokenUsage.completion}
                  </span>
                )}
              </div>
              <pre className="whitespace-pre-wrap break-all text-foreground/80 max-h-[300px] overflow-y-auto">
                {(() => {
                  try { return JSON.stringify(JSON.parse(response.body), null, 2); }
                  catch { return response.body || "(no body)"; }
                })()}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" className="h-7 text-[10px] px-3" onClick={handleRun} disabled={loading}>
          {loading ? "SENDING..." : "▶ RUN"}
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] px-3" onClick={() => setBody(EXAMPLE_TEMPLATES[0].body)}>
          Clear
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] px-3" onClick={handleCopyCurl}>
          Copy cURL
        </Button>
        <Button
          size="sm"
          variant={simulateError ? "destructive" : "outline"}
          className="h-7 text-[10px] px-3"
          onClick={() => setSimulateError(!simulateError)}
        >
          {simulateError ? "⚠ ERROR MODE ON" : "Simulate Error"}
        </Button>
        {response && (
          <Button size="sm" variant="outline" className="h-7 text-[10px] px-3" onClick={handleSaveExperiment}>
            Save as Experiment
          </Button>
        )}
      </div>

      {/* Recent label */}
      {response && (
        <div className="text-[9px] text-muted-foreground text-right">
          {new Date().toLocaleTimeString()} · {provider}/{model || "(no model)"}
        </div>
      )}
    </div>
  );
}
