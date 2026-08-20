import type { ChatRequest, ProgressUpdate, UIAction } from '../types/agent';

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

interface StreamHandlers {
  onText: (text: string) => void;
  onAction: (action: UIAction) => void;
  onProgress: (progress: ProgressUpdate) => void;
  onDone: () => void;
  onError: (error: unknown) => void;
}

const progressStatuses = new Set<ProgressUpdate['status']>([
  'pending', 'active', 'completed', 'warning', 'error', 'retrying',
]);

export const chatAPI = {
  sendMessageStream: async (
    message: string, 
    thread_id: string, 
    intent: string | undefined,
    handlers: StreamHandlers,
    signal?: AbortSignal,
  ) => {
    const { onText, onAction, onProgress, onDone, onError } = handlers;
    try {
      const payload: ChatRequest = { message, thread_id, intent };
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Agent API ${response.status}: ${detail || response.statusText}`);
      }
      
      if (!response.body) throw new Error('No readable stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedDone = false;

      const dispatchBlock = (block: string) => {
        if (!block.trim()) return;
        const blockLines = block.split(/\r?\n/);
        const event = blockLines.find(line => line.startsWith('event:'))?.slice(6).trim();
        const dataStr = blockLines
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trimStart())
          .join('\n');
        if (!event || !dataStr) return;

        try {
          const data: unknown = JSON.parse(dataStr);
          if (!data || typeof data !== 'object') return;
          const payload = data as Record<string, unknown>;
          if (event === 'response.output_text.delta' && typeof payload.delta === 'string') {
            onText(payload.delta);
          } else if (event === 'response.action' && payload.action && typeof payload.action === 'object') {
            onAction(payload.action as UIAction);
          } else if (
            event === 'response.progress'
            && typeof payload.stage === 'string'
            && typeof payload.status === 'string'
            && progressStatuses.has(payload.status as ProgressUpdate['status'])
          ) {
            onProgress({
              stage: payload.stage,
              status: payload.status as ProgressUpdate['status'],
              message: typeof payload.message === 'string' ? payload.message : undefined,
              elapsed_ms: typeof payload.elapsed_ms === 'number' && Number.isFinite(payload.elapsed_ms)
                ? payload.elapsed_ms
                : 0,
            });
          } else if (event === 'response.done' && !receivedDone) {
            receivedDone = true;
            onDone();
          }
        } catch (error) {
          console.error('Unable to parse streaming event', error);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split(/\r?\n\r?\n/);
        buffer = lines.pop() || ''; // Keep the incomplete part

        lines.forEach(dispatchBlock);
      }
      buffer += decoder.decode();
      dispatchBlock(buffer);
      if (!receivedDone) onDone();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error communicating with Agent API:', error);
      }
      onError(error);
    }
  },
};
