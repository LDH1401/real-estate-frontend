import type {
  AgentProgressState,
  AgentProgressStatus,
  AgentProgressStep,
  AgentProgressStepId,
  ProgressUpdate,
} from '../types/agent';

interface PhaseDefinition {
  id: AgentProgressStepId;
  active: string;
  completed: string;
}

const PHASES: Record<AgentProgressStepId, PhaseDefinition> = {
  understand: {
    id: 'understand',
    active: 'Đang phân tích yêu cầu của bạn...',
    completed: 'Đã hiểu yêu cầu',
  },
  plan: {
    id: 'plan',
    active: 'Đang xác định thông tin cần tìm...',
    completed: 'Đã xác định các tiêu chí cần phân tích',
  },
  retrieve: {
    id: 'retrieve',
    active: 'Đang tra cứu dữ liệu...',
    completed: 'Đã tra cứu dữ liệu cần thiết',
  },
  synthesize: {
    id: 'synthesize',
    active: 'Đang đối chiếu và phân tích kết quả...',
    completed: 'Đã hoàn tất phân tích',
  },
};

const STAGE_TO_PHASE: Record<string, AgentProgressStepId> = {
  request: 'understand',
  normalize: 'understand',
  intent: 'understand',
  entities: 'plan',
  conversation: 'plan',
  tools: 'retrieve',
  compose: 'synthesize',
};

const TERMINAL_STAGE: Partial<Record<string, AgentProgressStepId>> = {
  intent: 'understand',
  conversation: 'plan',
  tools: 'retrieve',
};

export const createAgentProgress = (startedAt = Date.now()): AgentProgressState => ({
  steps: [{
    id: 'understand',
    status: 'active',
    message: PHASES.understand.active,
    activatedAt: startedAt,
  }],
  startedAt,
  lastElapsedMs: 0,
  summaryStatus: 'running',
  collapsed: false,
});

const completedMessage = (id: AgentProgressStepId) => PHASES[id].completed;

const upsertStep = (
  state: AgentProgressState,
  id: AgentProgressStepId,
  status: AgentProgressStatus,
  message: string,
  now: number,
): AgentProgressStep[] => {
  const existing = state.steps.find(step => step.id === id);
  const nextStep: AgentProgressStep = {
    id,
    status,
    message,
    activatedAt: existing?.activatedAt ?? now,
  };

  return [
    ...state.steps
      .filter(step => step.id !== id)
      .map(step => step.status === 'active' && status !== 'pending'
        ? { ...step, status: 'completed' as const, message: completedMessage(step.id) }
        : step),
    nextStep,
  ].slice(-4);
};

const friendlyProblemMessage = (
  status: ProgressUpdate['status'],
  phase: AgentProgressStepId,
): string => {
  if (status === 'retrying') return 'Kết nối chưa ổn định, đang thử lại...';
  if (status === 'warning') return 'Chưa tìm thấy đầy đủ thông tin';
  if (status === 'error') return 'Chưa thể hoàn tất việc tra cứu';
  return PHASES[phase].active;
};

/** Maps technical backend stages to the four user-facing phases. */
export const reduceProgressEvent = (
  state: AgentProgressState,
  event: ProgressUpdate,
  now = Date.now(),
): AgentProgressState => {
  const phaseId = STAGE_TO_PHASE[event.stage];
  if (!phaseId || state.summaryStatus !== 'running') return state;

  const elapsed = Number.isFinite(event.elapsed_ms) && event.elapsed_ms >= 0
    ? event.elapsed_ms
    : state.lastElapsedMs;

  if (event.status === 'warning' || event.status === 'error' || event.status === 'retrying') {
    const stepStatus: AgentProgressStatus = event.status === 'error' ? 'error' : event.status === 'warning' ? 'warning' : 'active';
    return {
      ...state,
      steps: upsertStep(state, phaseId, stepStatus, friendlyProblemMessage(event.status, phaseId), now),
      lastElapsedMs: Math.max(state.lastElapsedMs, elapsed),
      summaryStatus: event.status === 'error' ? 'error' : 'running',
      collapsed: event.status === 'error',
    };
  }

  const phaseIsComplete = event.status === 'completed' && TERMINAL_STAGE[event.stage] === phaseId;
  const preparingAnswer = event.stage === 'compose' && event.status === 'completed';
  const status: AgentProgressStatus = event.status === 'pending'
    ? 'pending'
    : phaseIsComplete
      ? 'completed'
      : 'active';
  const existing = state.steps.find(step => step.id === phaseId);
  if (existing?.status === 'completed' && status !== 'completed') return state;
  const message = preparingAnswer
    ? 'Đang chuẩn bị câu trả lời...'
    : status === 'completed'
      ? PHASES[phaseId].completed
      : PHASES[phaseId].active;

  return {
    ...state,
    steps: upsertStep(state, phaseId, status, message, now),
    lastElapsedMs: Math.max(state.lastElapsedMs, elapsed),
  };
};

/** Updates only slow retrieval copy; it never delays the actual response. */
export const updateProgressClock = (
  state: AgentProgressState,
  now = Date.now(),
): AgentProgressState => {
  if (state.summaryStatus !== 'running') return state;
  const active = state.steps.find(step => step.status === 'active');
  if (!active || active.id !== 'retrieve') return state;
  const waitingMs = now - active.activatedAt;
  const message = waitingMs >= 15_000
    ? 'Quá trình tra cứu đang mất nhiều thời gian hơn dự kiến...'
    : waitingMs >= 7_000
      ? 'Đang chờ dữ liệu từ hệ thống...'
      : PHASES.retrieve.active;
  if (message === active.message) return state;
  return {
    ...state,
    steps: state.steps.map(step => step.id === active.id ? { ...step, message } : step),
  };
};

export const completeAgentProgress = (
  state: AgentProgressState,
  now = Date.now(),
): AgentProgressState => {
  if (state.summaryStatus === 'completed' || state.summaryStatus === 'error' || state.summaryStatus === 'cancelled') return state;
  const elapsed = Math.max(state.lastElapsedMs, now - state.startedAt);
  return {
    ...state,
    steps: state.steps.map(step => step.status === 'active'
      ? { ...step, status: 'completed' as const, message: completedMessage(step.id) }
      : step),
    lastElapsedMs: elapsed,
    totalElapsedMs: elapsed,
    summaryStatus: 'completed',
    collapsed: true,
  };
};

export const failAgentProgress = (
  state: AgentProgressState,
  now = Date.now(),
): AgentProgressState => ({
  ...state,
  steps: state.steps.map(step => step.status === 'active'
    ? { ...step, status: 'error' as const, message: 'Chưa thể hoàn tất việc tra cứu' }
    : step),
  totalElapsedMs: Math.max(state.lastElapsedMs, now - state.startedAt),
  summaryStatus: 'error',
  collapsed: true,
});

export const cancelAgentProgress = (state: AgentProgressState): AgentProgressState => ({
  ...state,
  steps: state.steps.map(step => step.status === 'active'
    ? { ...step, status: 'warning' as const, message: 'Đã dừng yêu cầu trước' }
    : step),
  summaryStatus: 'cancelled',
  collapsed: true,
});
