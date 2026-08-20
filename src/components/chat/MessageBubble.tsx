import React from 'react';
import { User, Sparkles } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'bot';
  content: string;
}

export const MessageBubble = ({ role, content }: MessageBubbleProps) => {
  const isBot = role === 'bot';
  
  return (
    <div className={`flex w-full mb-6 animate-fade-in ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[80%] ${isBot ? 'flex-row' : 'flex-row-reverse'} gap-4 items-end`}>
        {/* Avatar */}
        <div 
          className="flex-shrink-0 flex items-center justify-center rounded-full shadow-lg relative"
          style={{
            width: '36px', height: '36px',
            background: isBot ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'rgba(255, 255, 255, 0.1)',
            color: isBot ? 'white' : 'var(--text-primary)'
          }}
        >
          {isBot && <div className="absolute inset-0 rounded-full animate-pulse-glow"></div>}
          {isBot ? <Sparkles size={18} className="relative z-10" /> : <User size={18} />}
        </div>
        
        {/* Bubble */}
        <div 
          style={{
            padding: '16px 20px',
            background: isBot ? 'var(--bg-bot-bubble)' : 'var(--bg-user-bubble)',
            color: isBot ? 'var(--text-primary)' : 'white',
            borderRadius: isBot ? '24px 24px 24px 4px' : '24px 24px 4px 24px',
            boxShadow: isBot ? 'var(--shadow-sm)' : 'var(--shadow-md)',
            border: isBot ? '1px solid var(--border-light)' : 'none',
            backdropFilter: isBot ? 'blur(10px)' : 'none',
            fontSize: '15px',
            lineHeight: '1.6'
          }}
        >
          {content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
