import { useCallback, useEffect, useRef, useState } from 'react';
import { chatAPI } from '../services/api';
import type { Message } from '../types/agent';
import {
  cancelAgentProgress,
  completeAgentProgress,
  createAgentProgress,
  failAgentProgress,
  reduceProgressEvent,
  updateProgressClock,
} from '../utils/agentProgress';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: 'bot',
      content: 'Xin chào! Tôi là Trợ Lý Bất Động Sản AI. Tôi có thể tìm kiếm thông tin, dự án, hoặc tư vấn về nhà đất. Bạn đang quan tâm đến điều gì?',
      actions: [
        { type: 'clarify', prompt: '', suggestions: [
          { label: '🏠 Tìm mua nhà', value: 'Tìm mua nhà', display_text: 'Tìm mua nhà', intent: 'US1_SEARCH' },
          { label: '🏢 Thuê căn hộ', value: 'Thuê căn hộ', display_text: 'Thuê căn hộ', intent: 'US1_SEARCH' },
          { label: '✨ Đặt lịch tham quan', value: 'Đặt lịch tham quan', display_text: 'Đặt lịch tham quan', intent: 'US2_1_VISIT' },
          { label: '⚖️ Tư vấn chuyên sâu', value: 'Tư vấn chuyên sâu', display_text: 'Tư vấn chuyên sâu', intent: 'US2_2_CONSULT' },
        ] },
      ],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const threadId = useRef<string>(`session_${generateId()}`);
  const activeRequest = useRef<{
    id: string;
    botMessageId: string;
    requestContent: string;
    explicitIntent?: string;
    displayText?: string;
    controller: AbortController;
    progressTimer: ReturnType<typeof setInterval>;
  } | null>(null);

  const stopActiveRequest = useCallback((markCancelled: boolean) => {
    const request = activeRequest.current;
    if (!request) return;
    clearInterval(request.progressTimer);
    request.controller.abort();
    setIsLoading(false);
    if (markCancelled) {
      setMessages(previous => previous.map(message => message.id === request.botMessageId && message.progress?.summaryStatus === 'running'
        ? {
            ...message,
            progress: cancelAgentProgress(message.progress),
            retry: {
              content: request.requestContent,
              intent: request.explicitIntent,
              displayText: request.displayText || request.requestContent,
            },
          }
        : message));
    }
    activeRequest.current = null;
  }, []);

  useEffect(() => () => stopActiveRequest(false), [stopActiveRequest]);

  const sendMessage = useCallback(async (content: string, explicitIntent?: string, displayText?: string, retryTargetMessageId?: string) => {
    if (!content.trim() && !explicitIntent) return;

    stopActiveRequest(true);

    const requestContent = content || explicitIntent || '';
    const isRetry = Boolean(retryTargetMessageId);
    const botMessageId = retryTargetMessageId || generateId();

    if (isRetry) {
      // In-place retry: Reset the existing failed bot message without adding a duplicate user bubble
      setMessages(previous => previous.map(m => m.id === botMessageId
        ? {
            ...m,
            content: '',
            actions: [],
            progress: createAgentProgress(),
            retry: undefined,
          }
        : m
      ));
    } else {
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: displayText || requestContent,
      };
      setMessages(previous => [
        ...previous,
        userMessage,
        {
          id: botMessageId,
          role: 'bot',
          content: '',
          actions: [],
          progress: createAgentProgress(),
        },
      ]);
    }
    setIsLoading(true);

    const requestId = generateId();
    const controller = new AbortController();
    const progressTimer = setInterval(() => {
      if (activeRequest.current?.id !== requestId) return;
      setMessages(previous => previous.map(message => message.id === botMessageId && message.progress
        ? { ...message, progress: updateProgressClock(message.progress) }
        : message));
    }, 1_000);
    activeRequest.current = {
      id: requestId,
      botMessageId,
      requestContent,
      explicitIntent,
      displayText: displayText || requestContent,
      controller,
      progressTimer,
    };

    const isCurrentRequest = () => activeRequest.current?.id === requestId;
    const finishRequest = () => {
      if (!isCurrentRequest()) return false;
      clearInterval(progressTimer);
      activeRequest.current = null;
      return true;
    };

    try {
      await chatAPI.sendMessageStream(
        requestContent,
        threadId.current,
        explicitIntent,
        {
          onText: (textDelta) => {
            if (!isCurrentRequest()) return;
            setMessages(previous => previous.map(message => message.id === botMessageId
              ? {
                  ...message,
                  content: message.content + textDelta,
                  progress: message.progress ? completeAgentProgress(message.progress) : undefined,
                }
              : message));
          },
          onAction: (action) => {
            if (!isCurrentRequest()) return;
            setMessages(previous => previous.map(message => message.id === botMessageId
              ? { ...message, actions: [...(message.actions || []), action] }
              : message));
          },
          onProgress: (event) => {
            if (!isCurrentRequest()) return;
            setMessages(previous => previous.map(message => message.id === botMessageId && message.progress
              ? { ...message, progress: reduceProgressEvent(message.progress, event) }
              : message));
          },
          onDone: () => {
            if (!finishRequest()) return;
            setMessages(previous => previous.map(message => message.id === botMessageId && message.progress
              ? { ...message, progress: completeAgentProgress(message.progress) }
              : message));
            setIsLoading(false);
          },
          onError: (error) => {
            if (!finishRequest()) return;
            if (error instanceof DOMException && error.name === 'AbortError') {
              setIsLoading(false);
              return;
            }
            setMessages(previous => previous.map(message => message.id === botMessageId && message.progress
              ? {
                  ...message,
                  progress: failAgentProgress(message.progress),
                  retry: {
                    content: requestContent,
                    intent: explicitIntent,
                    displayText: displayText || requestContent,
                  },
                }
              : message));
            setIsLoading(false);
          },
        },
        controller.signal,
      );
    } catch {
      // Stream errors are handled by the callback above.
    }
  }, [stopActiveRequest]);

  return {
    messages,
    isLoading,
    sendMessage,
    stopActiveRequest: () => stopActiveRequest(true),
  };
};
