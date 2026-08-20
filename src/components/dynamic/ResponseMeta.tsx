import { Check, Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

export const SourceBadge = ({ count }: { count: number }) => <span className="source-badge">{count} nguồn</span>;

export const FeedbackRow = ({ text, sourceCount = 0 }: { text: string; sourceCount?: number }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const copy = async () => { await navigator.clipboard?.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };
  return (
    <div className="response-meta">
      <div>{sourceCount > 0 && <SourceBadge count={sourceCount} />}</div>
      <div className="feedback-row">
        <button type="button" onClick={copy} aria-label="Sao chép">{copied ? <Check size={18} /> : <Copy size={18} />}</button>
        <button type="button" className={feedback === 'up' ? 'selected' : ''} onClick={() => setFeedback('up')} aria-label="Hữu ích"><ThumbsUp size={18} /></button>
        <button type="button" className={feedback === 'down' ? 'selected' : ''} onClick={() => setFeedback('down')} aria-label="Không hữu ích"><ThumbsDown size={18} /></button>
      </div>
    </div>
  );
};
