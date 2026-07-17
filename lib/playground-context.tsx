"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import useSWR from "swr";
import type { Model, PlaygroundTab } from "@/types/dashboard";
import { ROUTER_API } from "@/lib/constants";

const fetcher = (url: string) => fetch(url).then(r => r.json().catch(() => ({ models: [] })));

interface PlaygroundContextType {
  activeTab: PlaygroundTab;
  setActiveTab: (tab: PlaygroundTab) => void;
  models: Model[];
  modelsLoading: boolean;
  modelsError: Error | undefined;
  theme: "dark" | "light";
  toggleTheme: () => void;
  recentRequests: string[];
  addRecentRequest: (req: string) => void;
}

const PlaygroundContext = createContext<PlaygroundContextType | null>(null);

export function PlaygroundProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<PlaygroundTab>("api");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [recentRequests, setRecentRequests] = useState<string[]>([]);

  const { data, error, isLoading } = useSWR(`${ROUTER_API}/models`, fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  });

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === "dark" ? "light" : "dark"));
  }, []);

  const addRecentRequest = useCallback((req: string) => {
    setRecentRequests(prev => [req, ...prev].slice(0, 20));
  }, []);

  return (
    <PlaygroundContext.Provider
      value={{
        activeTab,
        setActiveTab,
        models: data?.models ?? [],
        modelsLoading: isLoading,
        modelsError: error,
        theme,
        toggleTheme,
        recentRequests,
        addRecentRequest,
      }}
    >
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) throw new Error("usePlayground must be used within PlaygroundProvider");
  return ctx;
}
