import { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import type { AgentProgressState, AgentProgressStep } from '../../types/agent';

interface ProgressStatusProps {
  progress: AgentProgressState;
  onRetry?: () => void;
}

const formatDuration = (milliseconds?: number) => {
  if (!milliseconds || milliseconds < 100) return '';
  return (milliseconds / 1_000).toLocaleString('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

const StepIcon = ({ step }: { step: AgentProgressStep }) => {
  if (step.status === 'active') return <LoaderCircle aria-hidden="true" size={16} />;
  if (step.status === 'pending') return <Circle aria-hidden="true" size={13} />;
  if (step.status === 'warning') return <AlertCircle aria-hidden="true" size={16} />;
  if (step.status === 'error') return <XCircle aria-hidden="true" size={16} />;
  return <Check aria-hidden="true" size={16} />;
};

export const ProgressStatus = ({ progress, onRetry }: ProgressStatusProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const showSteps = !progress.collapsed || detailsOpen;
  const duration = formatDuration(progress.totalElapsedMs);

  if (progress.steps.length === 0) return null;

  const summary = progress.summaryStatus === 'completed'
    ? `Đã hoàn tất tra cứu${duration ? ` trong ${duration} giây` : ''}`
    : progress.summaryStatus === 'error'
      ? 'Chưa thể hoàn tất việc tra cứu'
      : progress.summaryStatus === 'cancelled'
        ? 'Đã dừng xử lý'
        : progress.summaryStatus === 'warning'
          ? 'Chưa tìm thấy đầy đủ thông tin'
          : 'Đang xử lý yêu cầu...';

  return (
    <section className={`progress-status ${progress.collapsed && !detailsOpen ? 'collapsed' : ''}`} aria-label="Tiến độ xử lý">
      {progress.collapsed && (
        <div className={`progress-summary ${progress.summaryStatus}`} aria-live="polite">
          <span className="progress-summary-icon">
            {progress.summaryStatus === 'completed'
              ? <CheckCircle2 aria-hidden="true" size={17} />
              : progress.summaryStatus === 'error'
                ? <XCircle aria-hidden="true" size={17} />
                : <AlertCircle aria-hidden="true" size={17} />}
          </span>
          <span>{summary}</span>
          <div className="progress-summary-actions">
            {(progress.summaryStatus === 'error' || progress.summaryStatus === 'cancelled') && onRetry && (
              <button className="progress-retry" type="button" onClick={onRetry}>
                <RefreshCw aria-hidden="true" size={14} />
                Thử lại
              </button>
            )}
            <button
              className="progress-details-toggle"
              type="button"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen(open => !open)}
            >
              {detailsOpen ? 'Thu gọn' : 'Xem chi tiết'}
              {detailsOpen ? <ChevronUp aria-hidden="true" size={14} /> : <ChevronDown aria-hidden="true" size={14} />}
            </button>
          </div>
        </div>
      )}

      {showSteps && (
        <ol className="progress-steps">
          {progress.steps.map(step => (
            <li
              className={`progress-step ${step.status}`}
              aria-current={step.status === 'active' ? 'step' : undefined}
              key={step.id}
            >
              <span className="progress-step-icon"><StepIcon step={step} /></span>
              <span>{step.message}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
