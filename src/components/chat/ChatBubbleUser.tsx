import { Check } from 'lucide-react';

export const ChatBubbleUser = ({ content }: { content: string }) => (
  <div className="user-message">
    <div className="user-bubble">{content}</div>
    <span className="message-status"><Check size={12} /> Đã gửi</span>
  </div>
);
