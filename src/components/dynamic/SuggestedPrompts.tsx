import { ArrowRight } from 'lucide-react';

export const SuggestedPrompts = ({ prompts, onSelect }: { prompts: Array<{ label: string; value?: string; intent?: string }>; onSelect: (prompt: { label: string; value?: string; intent?: string }) => void; }) => (
  <div className="suggested-prompts">
    {prompts.map((prompt, index) => (
      <button type="button" key={`${prompt.label}-${index}`} onClick={() => onSelect(prompt)}><ArrowRight size={18} /><span>{prompt.label}</span></button>
    ))}
  </div>
);
