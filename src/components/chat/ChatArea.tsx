import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Scale } from 'lucide-react';
import type { Message, Suggestion } from '../../types/agent';
import { InlineActions } from '../dynamic/InlineActions';
import { ProjectOptionList } from '../dynamic/ProjectOptionCard';
import { PropertyCard, PropertyCarousel, type PropertyCardData } from '../dynamic/PropertyCard';
import { FeedbackRow } from '../dynamic/ResponseMeta';
import { SuggestedPrompts } from '../dynamic/SuggestedPrompts';
import { ChatBubbleUser } from './ChatBubbleUser';
import { ChatInputBar } from './ChatInputBar';
import { ChatTextAgent } from './ChatTextAgent';
import { ProgressStatus } from './ProgressStatus';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, explicitIntent?: string, displayText?: string, retryTargetMessageId?: string) => Promise<void>;
  onStop?: () => void;
}

export const ChatArea = ({ messages, isLoading, sendMessage, onStop }: ChatAreaProps) => {
  const feedRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isUserScrollingUp = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<PropertyCardData[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [activeCompareMessageId, setActiveCompareMessageId] = useState<string | null>(null);

  const handleScroll = () => {
    const feed = feedRef.current;
    if (!feed) return;
    const distanceFromBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
    const isUp = distanceFromBottom > 70;
    isUserScrollingUp.current = isUp;
    setShowScrollButton(isUp);
  };

  const scrollToBottom = (smooth = true) => {
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
      isUserScrollingUp.current = false;
      setShowScrollButton(false);
    }
  };

  useEffect(() => {
    if (!isUserScrollingUp.current && feedRef.current) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

const stripLeadingEmoji = (text: string) => {
  return text.replace(/^[\p{Extended_Pictographic}\p{Emoji}\u2000-\u3300\ufe0e\ufe0f\s]+/gu, '').trim() || text;
};

  const selectProperty = (item: PropertyCardData) => {
    setIsCompareMode(false);
    setActiveCompareMessageId(null);
    isUserScrollingUp.current = false;
    setShowScrollButton(false);
    const title = item.title || 'Bất động sản';
    const apiPayload = item.id ? `Giới thiệu chi tiết căn ${title} (${item.id})` : `Giới thiệu chi tiết ${title}`;
    void sendMessage(apiPayload, 'US3_DETAIL', `Giới thiệu chi tiết ${title}`);
    setTimeout(() => scrollToBottom(true), 50);
  };
  const propertyAction = (item: PropertyCardData, intent: string) => {
    isUserScrollingUp.current = false;
    setShowScrollButton(false);
    let label = '';
    if (intent === 'US2_1_VISIT') label = 'đặt lịch tham quan';
    else if (intent === 'US2_2_CONSULT') label = 'được tư vấn mua nhà';
    else if (intent === 'US5_MAP') label = 'xem bản đồ cùng với các tiện ích xung quanh';
    const title = item.title || 'Bất động sản';
    const apiPayload = item.id ? `Tôi muốn ${label} cho căn ${title} (${item.id})` : `Tôi muốn ${label} cho ${title}`;
    const res = sendMessage(apiPayload, intent, `Tôi muốn ${label} cho ${title}`);
    setTimeout(() => scrollToBottom(true), 50);
    return res;
  };
  const selectSuggestion = (suggestion: Suggestion, msgId?: string) => {
    if (suggestion.value === '__COMPARE_MODE__' || suggestion.label === 'So sánh các căn') {
      const targetId = msgId || lastSearchCardsMessageId;
      setIsCompareMode(true);
      setActiveCompareMessageId(targetId || null);
      setTimeout(() => {
        if (targetId) {
          const el = document.getElementById(`carousel-wrapper-${targetId}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return;
    }
    setIsCompareMode(false);
    setActiveCompareMessageId(null);
    isUserScrollingUp.current = false;
    setShowScrollButton(false);

    const rawVal = suggestion.value || suggestion.label;
    const sendVal = stripLeadingEmoji(rawVal);
    const displayVal = stripLeadingEmoji(suggestion.display_text || rawVal);

    void sendMessage(
      sendVal,
      suggestion.intent,
      displayVal
    );
    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleToggleSelect = (item: PropertyCardData) => {
    if (!item.id) return;
    setSelectedProperties((prev) => {
      const isExist = prev.some((p) => p.id === item.id);
      if (isExist) {
        return prev.filter((p) => p.id !== item.id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, item];
    });
  };

  const handleRemoveFromCompare = (item: PropertyCardData) => {
    if (!item.id) return;
    setSelectedProperties((prev) => prev.filter((p) => p.id !== item.id));
  };

  const handleClearCompare = () => {
    setSelectedProperties([]);
    setIsCompareMode(false);
    setActiveCompareMessageId(null);
  };

  const latestBot = [...messages].reverse().find(message => message.role === 'bot');
  const hasVisibleLatestProgress = Boolean(latestBot?.progress?.steps.length);
  const lastSearchCardsMessageId = [...messages].reverse().find(
    m => m.actions?.some(a => a.type === 'cards' && !a.is_comparison)
  )?.id;

  return (
    <div className="chat-layout">
      <div className="message-feed" ref={feedRef} onScroll={handleScroll}>
        {messages.map(message => {
          if (message.role === 'user') return <ChatBubbleUser key={message.id} content={message.content} />;

          const cards = message.actions?.find(action => action.type === 'cards') as any;
          const intro = message.actions?.find(action => action.type === 'intro') as any;
          const followup = message.actions?.find(action => action.type === 'followup') as any;
          const detail = message.actions?.find(action => action.type === 'detail') as any;
          const clarify = message.actions?.find(action => action.type === 'clarify') as any;
          const cta = message.actions?.find(action => action.type === 'cta') as any;
          const sources = message.actions?.find(action => action.type === 'sources') as any;
          const advanced = message.actions?.filter(action => ['form', 'map', 'compare', 'overview'].includes(action.type)) || [];
          const projectOptions = clarify?.suggestions?.filter((item: Suggestion) => item.project_id) || [];
          let promptOptions = projectOptions.length ? [] : (clarify?.suggestions || cta?.items || []);

          const isComparisonResult = Boolean(cards?.is_comparison || intro);

          // Tự động bổ sung option "So sánh các căn" nếu là kết quả tìm kiếm thông thường (không phải kết quả vừa so sánh)
          if (cards?.items?.length >= 2 && !isComparisonResult) {
            const hasCompare = promptOptions.some((p: Suggestion) =>
              p.label.toLowerCase().includes('so sánh')
            );
            if (!hasCompare) {
              promptOptions = [
                ...promptOptions,
                { label: 'So sánh các căn', value: '__COMPARE_MODE__' },
              ];
            }
          }

          const hasProgress = Boolean(message.progress?.steps.length);
          const hasResponseMeta = message.content.length > 0 || (message.actions?.length ?? 0) > 0;
          const retry = message.retry;
          const isTargetCompareMessage =
            !isComparisonResult &&
            (activeCompareMessageId
              ? message.id === activeCompareMessageId
              : message.id === lastSearchCardsMessageId);

          return (
            <section className="agent-response" key={message.id}>
              {hasProgress && message.progress && (
                <ProgressStatus
                  progress={message.progress}
                  onRetry={retry ? () => { void sendMessage(retry.content, retry.intent, retry.displayText, message.id); } : undefined}
                />
              )}

              {/* 1. Lời dẫn mở đầu (nếu có intro thì hiện intro, nếu không thì hiện message.content) */}
              {intro ? (
                <ChatTextAgent content={intro.text} />
              ) : (
                message.content && <ChatTextAgent content={message.content} />
              )}

              {/* 2. Danh sách thẻ căn hộ (Ẩn nút so sánh nếu đang ở kết quả so sánh) */}
              {cards?.items?.length > 0 && (
                <div
                  id={`carousel-wrapper-${message.id}`}
                  className="carousel-compare-wrapper"
                >
                  {isCompareMode && isTargetCompareMessage && (
                    <div className="compare-mode-guide-banner">
                      <div className="guide-text">
                        <Scale size={16} className="guide-icon" />
                        <span>
                          <strong>Chế độ so sánh:</strong> Bấm vào các thẻ để <strong>thêm hoặc bớt (2–4 căn)</strong> so sánh.
                        </span>
                      </div>
                      <button
                        type="button"
                        className="guide-dismiss-btn"
                        onClick={() => {
                          setIsCompareMode(false);
                          setActiveCompareMessageId(null);
                          setSelectedProperties([]);
                        }}
                      >
                        Thoát
                      </button>
                    </div>
                  )}

                  <PropertyCarousel
                    items={cards.items}
                    showViewAll={cards.items.length > 3}
                    onSelect={selectProperty}
                    onAction={propertyAction}
                    selectedItems={selectedProperties}
                    onToggleSelect={handleToggleSelect}
                    showCompareToggle={isTargetCompareMessage && (isCompareMode || selectedProperties.length > 0)}
                  />
                </div>
              )}

              {/* 3. Câu hỏi gợi mở sau thẻ ảnh */}
              {followup && <ChatTextAgent content={followup.text} />}

              {detail?.listing && (
                <PropertyCard
                  property={detail.listing}
                  onVisit={() => propertyAction(detail.listing, 'US2_1_VISIT')}
                  onConsult={() => propertyAction(detail.listing, 'US2_2_CONSULT')}
                  onMap={() => propertyAction(detail.listing, 'US5_MAP')}
                  showCompareToggle={false}
                />
              )}
              {projectOptions.length > 0 && <ProjectOptionList options={projectOptions} onSelect={(s) => selectSuggestion(s, message.id)} />}
              {advanced.length > 0 && <InlineActions actions={advanced} sendMessage={sendMessage} />}
              {hasResponseMeta && <FeedbackRow text={message.content} sourceCount={sources?.items?.length || 0} />}
              {promptOptions.length > 0 && <SuggestedPrompts prompts={promptOptions} onSelect={(s) => selectSuggestion(s, message.id)} />}
            </section>
          );
        })}
        {isLoading && !hasVisibleLatestProgress && <div className="typing-dots" aria-label="Đang trả lời"><span /><span /><span /></div>}
        <div ref={endRef} />
      </div>

      {showScrollButton && (
        <button
          type="button"
          className="scroll-to-bottom-btn"
          onClick={() => scrollToBottom(true)}
          aria-label="Cuộn xuống tin nhắn mới nhất"
          title="Cuộn xuống dưới"
        >
          <ArrowDown size={14} />
        </button>
      )}

      <ChatInputBar
        isLoading={isLoading}
        onStop={onStop}
        onSend={(value, intent, displayText) => {
          isUserScrollingUp.current = false;
          setShowScrollButton(false);
          void sendMessage(value, intent, displayText);
          setTimeout(() => scrollToBottom(true), 50);
        }}
        selectedProperties={selectedProperties}
        onRemoveProperty={handleRemoveFromCompare}
        onClearProperties={handleClearCompare}
      />
    </div>
  );
};
