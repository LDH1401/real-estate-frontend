import { ChevronRight } from 'lucide-react';
import type { Suggestion } from '../../types/agent';

const projectImages = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=240&q=80',
];

export const ProjectOptionCard = ({ option, index, onSelect }: { option: Suggestion & { image_url?: string; address?: string }; index: number; onSelect: () => void; }) => {
  const [name, locationFromLabel] = option.label.split(' — ');
  return (
    <button type="button" className="project-option" onClick={onSelect}>
      <img src={option.image_url || projectImages[index % projectImages.length]} alt="" />
      <span><strong>{name}</strong><small>{option.address || locationFromLabel || 'Thông tin khu vực'}</small></span>
      <ChevronRight size={18} />
    </button>
  );
};

export const ProjectOptionList = ({ options, onSelect }: { options: Array<Suggestion & { image_url?: string; address?: string }>; onSelect: (option: Suggestion) => void; }) => (
  <div className="project-option-list">
    {options.map((option, index) => <ProjectOptionCard key={option.project_id || option.value || index} option={option} index={index} onSelect={() => onSelect(option)} />)}
  </div>
);
