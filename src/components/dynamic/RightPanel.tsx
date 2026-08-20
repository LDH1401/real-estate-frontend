import { MapPin, Building, BedDouble, CircleDollarSign } from 'lucide-react';
import type { UIAction, ActionMap, ActionCards, ActionForm, ActionDetail, ActionCompare } from '../../types/agent';

import { MapView } from './MapView';
import { ComparisonTable } from './ComparisonTable';

interface RightPanelProps {
  actions: UIAction[];
  sendMessage?: (content: string, explicitIntent?: string, displayText?: string) => Promise<void>;
}

export const RightPanel = ({ actions, sendMessage }: RightPanelProps) => {
  // Extract actions
  const mapAction = actions.find(a => a.type === 'map') as ActionMap;
  const cardsAction = actions.find(a => a.type === 'cards') as ActionCards;
  const formAction = actions.find(a => a.type === 'form') as ActionForm;
  const detailAction = actions.find(a => a.type === 'detail') as ActionDetail;
  const compareAction = actions.find(a => a.type === 'compare') as ActionCompare;

  return (
    <div 
      className="glass-panel flex flex-col shrink-0 overflow-y-auto"
      style={{ width: '400px', borderLeft: '1px solid var(--border-light)', zIndex: 10 }}
    >
      
      {/* Map Section */}
      {mapAction && (
        <MapView 
          mapData={
            detailAction?.listing && (detailAction.listing.lat || detailAction.listing.latitude) 
              ? { points: [detailAction.listing] } 
              : mapAction.map
          } 
        />
      )}
      
      {/* Search Parameters Section */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
         <h3 className="font-bold text-sm mb-4 text-white">Thông số tìm kiếm</h3>
         <ul className="text-sm" style={{ listStyle: 'none', color: 'var(--text-secondary)' }}>
           <li className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><MapPin size={16} /></div>
             <span className="font-medium text-slate-300">Quận 2, TP.HCM</span>
           </li>
           <li className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Building size={16} /></div>
             <span className="font-medium text-slate-300">Căn hộ</span>
           </li>
           <li className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-green-500/10 text-green-400"><BedDouble size={16} /></div>
             <span className="font-medium text-slate-300">2 phòng ngủ</span>
           </li>
           <li className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><CircleDollarSign size={16} /></div>
             <span className="font-medium text-slate-300">~4 tỷ VND</span>
           </li>
         </ul>
      </div>

      {/* Relevant Project Snippets Section */}
      {cardsAction && cardsAction.items && cardsAction.items.length > 0 && (
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
           <h3 className="font-bold text-sm mb-4 text-white">Dự án liên quan ({cardsAction.items.length})</h3>
           <div className="flex flex-col gap-4">
             {cardsAction.items.map((item, idx) => (
               <div 
                 key={idx} 
                 className="glass-card flex gap-4 p-3 rounded-2xl cursor-pointer transition-transform hover:scale-[1.02]"
                 onClick={() => {
                   if (!sendMessage) return;
                   const title = item.title || 'Bất động sản';
                   const apiPayload = item.id ? `Bạn có thể giới thiệu chi tiết cho tôi về căn ${title} (${item.id}) được không?` : `Bạn có thể giới thiệu chi tiết cho tôi về ${title} được không?`;
                   void sendMessage(apiPayload, 'US3_DETAIL', `Giới thiệu chi tiết ${title}`);
                 }}
               >
                 <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-slate-800">
                   <img 
                     src={item.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"} 
                     alt="" 
                     className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                     onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" }}
                   />
                 </div>
                 <div className="flex-1 min-w-0 flex flex-col justify-center">
                   <div className="font-bold text-sm truncate text-white mb-1" title={item.title}>{item.title}</div>
                   <div className="text-xs text-slate-400 line-clamp-2" title={item.subtitle} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                     {item.subtitle}
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
      
      {/* Booking Form Section */}
      {formAction && formAction.form && (
        <div style={{ padding: '24px' }}>
          <h3 className="font-bold text-sm mb-2 text-white flex items-center gap-2">
            <span className="text-primary">📝</span> {formAction.form.title || 'Đặt lịch hẹn'}
          </h3>
          <p className="text-xs text-slate-400 mb-5">{formAction.form.description}</p>
          <div className="flex flex-col gap-4">
            {formAction.form.fields?.map((field: any, idx: number) => (
              <input 
                key={idx} 
                type={field.type === 'datetime' ? 'datetime-local' : 'text'} 
                placeholder={field.label} 
                className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none transition-all" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-light)',
                  color: 'white'
                }} 
              />
            ))}
            <button className="w-full py-3 mt-2 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}>
              Gửi yêu cầu
            </button>
          </div>
        </div>
      )}

      {/* Detail Section */}
      {detailAction && detailAction.listing && (
        <div style={{ padding: '24px' }}>
          <h3 className="font-bold text-lg mb-2 text-white">{detailAction.listing.title}</h3>
          <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-4 shadow-lg shadow-black/20">
            <img 
              src={detailAction.listing.thumbnail || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"} 
              alt="Listing Thumbnail" 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Giá:</span>
              <span className="font-bold text-primary">{detailAction.listing.price_vnd ? `${(detailAction.listing.price_vnd / 1e9).toFixed(1)} Tỷ VND` : 'Liên hệ'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Diện tích:</span>
              <span className="text-slate-200 font-medium">{detailAction.listing.area_m2} m²</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Tầng:</span>
              <span className="text-slate-200 font-medium">{detailAction.listing.floor_num || detailAction.listing.floor_band || 'Đang cập nhật'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Hướng:</span>
              <span className="text-slate-200 font-medium">{detailAction.listing.direction_balcony || 'Đang cập nhật'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Tầm nhìn:</span>
              <span className="text-slate-200 font-medium">{detailAction.listing.view || 'Đang cập nhật'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Bàn giao:</span>
              <span className="text-slate-200 font-medium">{detailAction.listing.furnishing || 'Cơ bản'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Pháp lý:</span>
              <span className="text-slate-200 font-medium">{detailAction.listing.legal_status || 'Hợp đồng mua bán'}</span>
            </div>
          </div>
          <button 
            className="w-full py-3 mt-6 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25" 
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}
            onClick={() => sendMessage && sendMessage(`Tôi muốn đặt lịch xem căn này`, 'US2_1_VISIT')}
          >
            Đặt lịch tham quan
          </button>
        </div>
      )}

      {/* Compare Section */}
      {compareAction && (
        <ComparisonTable comparisonData={compareAction.comparison} sendMessage={sendMessage} />
      )}

    </div>
  );
};

