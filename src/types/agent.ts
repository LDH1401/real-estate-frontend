export interface ChatRequest {
  message: string;
  thread_id: string;
  intent?: string;
}

export interface ChatResponse {
  text?: string;
  response_text?: string;
  actions: UIAction[];
  tool_calls?: any[];
  intent?: string;
  slots?: Record<string, any>;
}

export type UIAction = 
  | ActionCards 
  | ActionCTA 
  | ActionForm 
  | ActionMap 
  | ActionCompare 
  | ActionClarify 
  | ActionOverview 
  | ActionSources
  | ActionDetail
  | ActionIntro
  | ActionFollowup;

export interface ActionIntro {
  type: 'intro';
  text: string;
}

export interface ActionFollowup {
  type: 'followup';
  text: string;
}

export interface ActionCards {
  type: 'cards';
  items: any[];
  is_comparison?: boolean;
}

export interface ActionCTA {
  type: 'cta';
  items: any[];
}

export interface ActionForm {
  type: 'form';
  form: any;
}

export interface ActionMap {
  type: 'map';
  map: any;
}

export interface ActionCompare {
  type: 'compare';
  category?: 'financial_legal' | 'space_interior' | 'all';
  title?: string;
  summary?: string;
  comparison: any;
}

export interface ActionClarify {
  type: 'clarify';
  prompt: string;
  suggestions: Suggestion[];
}

export interface ActionOverview {
  type: 'overview';
  overview: any;
}

export interface ActionSources {
  type: 'sources';
  items: any[];
}

export interface ActionDetail {
  type: 'detail';
  listing: any;
}

export interface Suggestion {
  label: string;
  intent?: string;
  value?: string;
  display_text?: string;
  project_id?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  actions?: UIAction[];
  progress?: AgentProgressState;
  retry?: {
    content: string;
    intent?: string;
    displayText?: string;
  };
}

export interface ProgressUpdate {
  stage: string;
  status: 'pending' | 'active' | 'completed' | 'warning' | 'error' | 'retrying';
  message?: string;
  elapsed_ms: number;
}

export type AgentProgressStatus = 'pending' | 'active' | 'completed' | 'warning' | 'error';

export type AgentProgressStepId = 'understand' | 'plan' | 'retrieve' | 'synthesize';

export interface AgentProgressStep {
  id: AgentProgressStepId;
  status: AgentProgressStatus;
  message: string;
  activatedAt: number;
}

export interface AgentProgressState {
  steps: AgentProgressStep[];
  startedAt: number;
  lastElapsedMs: number;
  totalElapsedMs?: number;
  summaryStatus: 'running' | 'completed' | 'warning' | 'error' | 'cancelled';
  collapsed: boolean;
}
