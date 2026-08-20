import React from 'react';
import { ArrowRight, Scale, Trash2, X, Plus } from 'lucide-react';
import type { PropertyCardData } from './PropertyCard';

interface CompareDockProps {
  selectedItems: PropertyCardData[];
  onRemove: (item: PropertyCardData) => void;
  onClear: () => void;
  onCompare: () => void;
  maxItems?: number;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&q=80';

const formatPriceShort = (value?: number) => {
  if (!value) return 'Liên hệ';
  return `${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
};

export const CompareDock: React.FC<CompareDockProps> = ({
  selectedItems,
  onRemove,
  onClear,
  onCompare,
  maxItems = 4,
}) => {
  if (selectedItems.length === 0) return null;

  const canCompare = selectedItems.length >= 2;
  const emptySlotsCount = Math.max(0, maxItems - selectedItems.length);

  return (
    <div className="compare-dock-container" role="region" aria-label="Thanh so sánh bất động sản">
      <div className="compare-dock">
        {/* Left header / status */}
        <div className="compare-dock-header">
          <div className="compare-dock-icon">
            <Scale size={18} />
          </div>
          <div className="compare-dock-meta">
            <span className="compare-dock-title">So sánh căn</span>
            <span className="compare-dock-badge">
              <strong>{selectedItems.length}</strong>/{maxItems} căn
            </span>
          </div>
        </div>

        {/* Middle Slots (Items + Placeholders) */}
        <div className="compare-slots-wrapper">
          <div className="compare-slots">
            {selectedItems.map((item, idx) => {
              const image =
                item.image_url || item.thumbnail || item.images?.[0] || fallbackImage;
              return (
                <div className="compare-slot filled" key={item.id || idx}>
                  <img
                    src={image}
                    alt={item.title || 'Căn hộ'}
                    onError={(e) => {
                      e.currentTarget.src = fallbackImage;
                    }}
                  />
                  <div className="slot-info">
                    <span className="slot-title">{item.title || `Căn ${idx + 1}`}</span>
                    <span className="slot-price">{formatPriceShort(item.price_vnd)}</span>
                  </div>
                  <button
                    type="button"
                    className="slot-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item);
                    }}
                    title="Gỡ khỏi so sánh"
                    aria-label={`Gỡ căn ${item.title || idx + 1}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}

            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div className="compare-slot empty" key={`empty-${idx}`}>
                <Plus size={16} />
                <span>+ Thêm</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="compare-dock-actions">
          <button
            type="button"
            className="compare-clear-btn"
            onClick={onClear}
            title="Xóa tất cả căn đã chọn"
          >
            <Trash2 size={15} />
            <span>Xóa hết</span>
          </button>

          <button
            type="button"
            className={`compare-submit-btn ${canCompare ? 'active' : 'disabled'}`}
            disabled={!canCompare}
            onClick={canCompare ? onCompare : undefined}
            title={canCompare ? 'Bấm để so sánh ngay' : 'Chọn thêm ít nhất 1 căn nữa'}
          >
            <span>
              {canCompare ? `So sánh (${selectedItems.length})` : 'Chọn thêm căn'}
            </span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
