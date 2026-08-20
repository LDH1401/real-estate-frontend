import React from 'react';
import { Home, Building2, MessageSquareText, User, Sparkles } from 'lucide-react';

export const Sidebar = () => {
  return (
    <div 
      className="glass-panel flex flex-col items-center py-8 gap-8 shrink-0"
      style={{ 
        width: '88px', 
        borderRight: '1px solid var(--border-light)', 
        zIndex: 10
      }}
    >
      <div className="logo cursor-pointer flex flex-col items-center justify-center animate-pulse-glow" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white' }}>
        <Sparkles size={24} />
      </div>
      
      <div className="flex flex-col gap-4 mt-6 w-full items-center">
        <SidebarItem icon={<Home size={22} />} label="Trang chủ" />
        <SidebarItem icon={<Building2 size={22} />} label="Dự án" />
        <SidebarItem icon={<MessageSquareText size={22} />} label="Tư vấn" active />
      </div>
      
      <div className="mt-auto">
        <SidebarItem icon={<User size={22} />} label="Tài khoản" />
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all relative"
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        color: active ? 'white' : 'var(--text-secondary)',
        background: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
        boxShadow: active ? 'inset 0 1px 1px rgba(255, 255, 255, 0.2)' : 'none',
      }}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_var(--primary)]" style={{ left: '-12px' }}></div>
      )}
      <div className={`transition-transform duration-300 ${active ? 'scale-110 text-primary' : 'hover:scale-110 hover:text-white'}`}>
        {icon}
      </div>
      <span className="font-medium" style={{ fontSize: '10px', marginTop: '2px', opacity: active ? 1 : 0.7 }}>{label}</span>
    </div>
  );
};
