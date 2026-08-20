import React from 'react';

// Hàm phân tích markdown cơ bản (**in đậm**)
const renderFormattedText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export const ChatTextAgent = ({ content }: { content: string }) => (
  <div className="agent-text">
    {content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {renderFormattedText(line)}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ))}
  </div>
);
