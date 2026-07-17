"use client";

import React, { useState, useCallback } from "react";
import type { AgentConfig } from "@/types/dashboard";
import { PROVIDERS, DEFAULT_AGENT_FLAGS, AMUX_API } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOOLTIP_STYLES = "relative group";
const TOOLTIP_CONTENT = "invisible group-hover:visible absolute bottom-full left-0 mb-1 w-48 p-1.5 text-[9px] bg-popover text-popover-foreground rounded border shadow-lg z-10";

interface FormErrors {
  name?: string;
  provider?: string;
  model?: string;
  dir?: string;
}

export default function CreateAgentForm() {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState(PROVIDERS[0].id);
  const [model, setModel] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant...");
  const [workingDir, setWorkingDir] = useState("~");
  const [flags, setFlags] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_AGENT_FLAGS.map(f => [f.id, f.default]))
  );
  const [extraFlags, setExtraFlags] = useState("");
  const [envVars, setEnvVars] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!name || !/^[a-zA-Z0-9_-]{2,}$/.test(name)) {
      errs.name = "Name required: 2+ chars, letters/numbers/_- only";
    }
    if (!model) errs.model = "Select a model";
    return errs;
  }, [name, model]);

  const handlePreview = useCallback(() => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const flagStr = Object.entries(flags)
      .filter(([, v]) => v)
      .map(([k]) => {
        const f = DEFAULT_AGENT_FLAGS.find(f => f.id === k);
        return f?.label ?? "";
      })
      .join(" ");
    const cmd = `amux register ${name} --dir ${workingDir} --provider ${provider} ${flagStr}
amux start ${name}`;
    setPreview(cmd);
  }, [name, provider, model, workingDir, flags, validate]);

  const handleSubmit = useCallback(async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    setResult(null);
    try {
      const config: AgentConfig = {
        name,
        provider,
        model,
        systemPrompt,
        workingDir,
        flags: Object.entries(flags).filter(([, v]) => v).map(([k]) => k),
        envVars: Object.fromEntries(
          envVars.split("\n").filter(l => l.includes("=")).map(l => {
            const [k, ...v] = l.split("=");
            return [k.trim(), v.join("=").trim()];
          })
        ),
      };
      const res = await fetch(`${AMUX_API}/sessions/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    }
    setSubmitting(false);
  }, [name, provider, model, systemPrompt, workingDir, flags, envVars, validate]);

  const fieldHelp: Record<string, string> = {
    name: "Unique identifier for your agent session. Used in the URL and CLI.",
    provider: "Which AI provider to use. Routes through the 9router proxy.",
    model: "The specific model version from the selected provider.",
    systemPrompt: "Instructions that define the agent's personality and constraints.",
    workingDir: "Working directory for file operations. Must exist on the server.",
    flags: "CLI flags that control approval mode, watchdog, and security.",
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Name */}
      <div className={TOOLTIP_STYLES}>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
          Agent Name
          <span className="text-[9px] text-destructive">*</span>
          <span className="text-[9px] text-muted-foreground cursor-help ml-1" title={fieldHelp.name}>ⓘ</span>
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className={cn(
            "w-full bg-accent/20 border rounded px-2 py-1.5 text-xs text-foreground mt-0.5",
            errors.name ? "border-destructive" : "border-border/50"
          )}
          placeholder="my-agent"
          aria-label="Agent name"
          aria-invalid={!!errors.name}
        />
        {errors.name && <span className="text-[9px] text-destructive">{errors.name}</span>}
      </div>

      {/* Provider & Model row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
            Provider <span className="text-[9px] text-muted-foreground cursor-help" title={fieldHelp.provider}>ⓘ</span>
          </label>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="w-full bg-accent/20 border border-border/50 rounded px-2 py-1.5 text-xs text-foreground mt-0.5"
            aria-label="Provider"
          >
            {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
            Model <span className="text-[9px] text-destructive">*</span>
            <span className="text-[9px] text-muted-foreground cursor-help" title={fieldHelp.model}>ⓘ</span>
          </label>
          <input
            value={model}
            onChange={e => setModel(e.target.value)}
            className={cn(
              "w-full bg-accent/20 border rounded px-2 py-1.5 text-xs text-foreground mt-0.5",
              errors.model ? "border-destructive" : "border-border/50"
            )}
            placeholder="gpt-4o"
            aria-label="Model name"
          />
          {errors.model && <span className="text-[9px] text-destructive">{errors.model}</span>}
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
          System Prompt <span className="text-[9px] text-muted-foreground cursor-help" title={fieldHelp.systemPrompt}>ⓘ</span>
        </label>
        <textarea
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          className="w-full bg-accent/20 border border-border/50 rounded px-2 py-1.5 text-xs text-foreground mt-0.5 min-h-[60px] font-mono"
          aria-label="System prompt"
        />
      </div>

      {/* Working Dir */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
          Working Directory <span className="text-[9px] text-muted-foreground cursor-help" title={fieldHelp.workingDir}>ⓘ</span>
        </label>
        <input
          value={workingDir}
          onChange={e => setWorkingDir(e.target.value)}
          className="w-full bg-accent/20 border border-border/50 rounded px-2 py-1.5 text-xs font-mono text-foreground mt-0.5"
          aria-label="Working directory"
        />
      </div>

      {/* Flags */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
          Flags <span className="text-[9px] text-muted-foreground cursor-help" title={fieldHelp.flags}>ⓘ</span>
        </label>
        <div className="flex flex-wrap gap-2 mt-1">
          {DEFAULT_AGENT_FLAGS.map(f => (
            <label key={f.id} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={flags[f.id]}
                onChange={e => setFlags(prev => ({ ...prev, [f.id]: e.target.checked }))}
                className="accent-primary"
              />
              <span className="text-[10px] text-muted-foreground">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 uppercase tracking-wider"
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? "▼" : "▶"} Advanced
        </button>
        {showAdvanced && (
          <div className="mt-2 space-y-2 pl-2 border-l border-border/40">
            <div>
              <label className="text-[9px] text-muted-foreground">Extra CLI Flags</label>
              <input
                value={extraFlags}
                onChange={e => setExtraFlags(e.target.value)}
                className="w-full bg-accent/20 border border-border/50 rounded px-2 py-1 text-[10px] font-mono text-foreground mt-0.5"
                placeholder="--verbose --debug"
                aria-label="Extra CLI flags"
              />
              <span className="text-[8px] text-warning">⚠ These flags run directly. Ensure they are safe.</span>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Environment Variables (KEY=VALUE per line)</label>
              <textarea
                value={envVars}
                onChange={e => setEnvVars(e.target.value)}
                className="w-full bg-accent/20 border border-border/50 rounded px-2 py-1 text-[10px] font-mono text-foreground mt-0.5 min-h-[40px]"
                placeholder="MY_VAR=value"
                aria-label="Environment variables"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-[10px] px-3" onClick={handlePreview}>
          Preview Command
        </Button>
        <Button size="sm" className="h-7 text-[10px] px-3" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Creating..." : "🚀 Create & Start"}
        </Button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-black/20 rounded p-2">
          <div className="text-[9px] text-muted-foreground mb-1">Command Preview:</div>
          <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap">{preview}</pre>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={cn("rounded p-2 text-xs", result.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
          {result.ok ? "✅ Agent created successfully!" : `❌ ${result.error}`}
        </div>
      )}
    </div>
  );
}
