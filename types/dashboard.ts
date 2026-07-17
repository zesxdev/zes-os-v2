export interface DashboardStat {
  label: string;
  value: string;
  description: string;
  intent: "positive" | "negative" | "neutral";
  icon: string;
  tag?: string;
  direction?: "up" | "down";
}

export interface ChartDataPoint {
  date: string;
  spendings: number;
  sales: number;
  coffee: number;
}

export interface ChartData {
  week: ChartDataPoint[];
  month: ChartDataPoint[];
  year: ChartDataPoint[];
}

export interface RebelRanking {
  id: number;
  name: string;
  handle: string;
  streak: string;
  points: number;
  avatar: string;
  featured?: boolean;
  subtitle?: string;
}

export interface SecurityStatus {
  title: string;
  value: string;
  status: string;
  variant: "success" | "warning" | "destructive";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  priority: "low" | "medium" | "high";
}

export interface WidgetData {
  location: string;
  timezone: string;
  temperature: string;
  weather: string;
  date: string;
}

export interface MockData {
  dashboardStats: DashboardStat[];
  chartData: ChartData;
  rebelsRanking: RebelRanking[];
  securityStatus: SecurityStatus[];
  notifications: Notification[];
  widgetData: WidgetData;
}

export type TimePeriod = "week" | "month" | "year";

// ── Agent Playground ──

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  color: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  contextWindow: number;
  available: boolean;
}

export interface AgentConfig {
  name: string;
  provider: string;
  model: string;
  systemPrompt: string;
  workingDir: string;
  flags: string[];
  envVars: Record<string, string>;
}

export interface ApiRequest {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  provider: string;
  model: string;
  body: string;
  headers: Record<string, string>;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  body: string;
  timing: number;
  tokenUsage?: { prompt: number; completion: number; total: number };
}

export type PlaygroundTab = "api" | "models" | "create-agent";

export interface ExampleTemplate {
  name: string;
  description: string;
  method: string;
  endpoint: string;
  body: string;
}
