import type { ReactNode } from 'react';
import { CalendarDays, ChevronRight, Headphones, MapPin, Scale } from 'lucide-react';

export interface PropertyCardData {
  id?: string; title?: string; property_type?: string; image_url?: string; thumbnail?: string;
  images?: string[]; price_vnd?: number; price_per_m2_vnd?: number; area_m2?: number;
  bedrooms?: number; floor_num?: number; floor_band?: string; direction_balcony?: string;
  project_name?: string; address?: string; province?: string; subtitle?: string;
}

interface PropertyCardProps {
  property: PropertyCardData; showViewAll?: boolean; onViewAll?: () => void;
  onVisit: () => void; onConsult: () => void; onMap?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  disableSelect?: boolean;
  showCompareToggle?: boolean;
}

const fallbackImage = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80';
const formatPrice = (value?: number) => value ? `Từ ${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ đ` : 'Liên hệ';

const ActionRow = ({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void; }) => (
  <button type="button" className="property-action" onClick={onClick}>
    <span className="property-action-icon">{icon}</span>
    <span className="property-action-copy"><strong>{title}</strong><small>{subtitle}</small></span>
    <ChevronRight size={18} />
  </button>
);

export const PropertyCard = ({
  property,
  showViewAll,
  onViewAll,
  onVisit,
  onConsult,
  onMap,
  onSelect,
  isSelected,
  onToggleSelect,
  disableSelect,
  showCompareToggle,
}: PropertyCardProps) => {
  const image = property.image_url || property.thumbnail || property.images?.[0] || fallbackImage;

  // 1. Diện tích (bỏ nếu null hoặc <= 0)
  const areaText =
    property.area_m2 && Number(property.area_m2) > 0
      ? `${Number(property.area_m2).toLocaleString('vi-VN')} m²`
      : null;

  // 2. Hướng (bỏ nếu null hoặc rỗng)
  const directionText =
    property.direction_balcony && property.direction_balcony.trim()
      ? `Hướng ${property.direction_balcony.trim()}`
      : null;

  // 3. Tầng (Ưu tiên floor_num > 0, sau đó đến floor_band; bỏ nếu null/0)
  let floorText: string | null = null;
  if (property.floor_num && Number(property.floor_num) > 0) {
    floorText = `Tầng ${property.floor_num}`;
  } else if (property.floor_band && property.floor_band.trim()) {
    floorText = property.floor_band.trim();
  }

  // Sắp xếp đúng thứ tự: Diện tích -> Hướng -> Tầng
  const specs = [areaText, directionText, floorText].filter(Boolean) as string[];
  const shouldShowToggle = Boolean(onToggleSelect && (showCompareToggle || isSelected));

  const handleCardClick = () => {
    if (shouldShowToggle) {
      // Khi đang ở chế độ so sánh: Click ảnh/tiêu đề sẽ chọn/bỏ chọn căn, không mở chi tiết
      if (!disableSelect || isSelected) {
        onToggleSelect?.();
      }
    } else {
      // Chế độ bình thường: Xem chi tiết
      onSelect?.();
    }
  };

  return (
    <article className={`property-card ${isSelected ? 'is-selected' : ''}`}>
      <div className="property-hero-wrap">
        <img
          className="property-hero"
          src={image}
          alt={property.title || 'Bất động sản'}
          onClick={handleCardClick}
          style={{ cursor: 'pointer' }}
          onError={event => { event.currentTarget.src = fallbackImage; }}
        />
        {shouldShowToggle && (
          <button
            type="button"
            className={`property-compare-toggle ${isSelected ? 'selected' : ''} ${disableSelect && !isSelected ? 'disabled' : ''} animate-pop`}
            onClick={(e) => {
              e.stopPropagation();
              if (!disableSelect || isSelected) {
                onToggleSelect?.();
              }
            }}
            title={isSelected ? 'Bỏ chọn so sánh' : disableSelect ? 'Đã chọn tối đa 4 căn' : 'Thêm vào danh sách so sánh'}
          >
            <Scale size={13} />
            <span>{isSelected ? '✓ Đã chọn' : '+ So sánh'}</span>
          </button>
        )}
      </div>
      <div className="property-card-body">
        <h3 onClick={handleCardClick} style={{ cursor: 'pointer' }}>{property.title || property.property_type || 'Bất động sản nổi bật'}</h3>
        <div className="property-price"><strong>{formatPrice(property.price_vnd)}</strong>{property.price_per_m2_vnd && <span>{Math.round(property.price_per_m2_vnd / 1e6)} triệu/m²</span>}</div>
        <div className="property-specs-tag-row">
          {specs.map((item, idx) => (
            <span key={idx} className="property-spec-pill">
              {item}
            </span>
          ))}
        </div>
        <p className="property-address">
          {property.address ||
            (property.project_name && property.province
              ? `${property.project_name}, ${property.province}`
              : property.project_name || property.province || property.subtitle || 'Thông tin vị trí đang được cập nhật')}
        </p>
        {showViewAll && <button type="button" className="view-all-button" onClick={onViewAll}>Xem tất cả</button>}
      </div>
      <div className="property-actions">
        {onMap && <ActionRow icon={<MapPin size={18} />} title="Xem vị trí" subtitle="Bản đồ quanh dự án" onClick={onMap} />}
        <ActionRow icon={<CalendarDays size={18} />} title="Đặt lịch tham quan" subtitle="Dự án, nhà mẫu / thực tế" onClick={onVisit} />
        <ActionRow icon={<Headphones size={18} />} title="Tư vấn mua nhà 1:1" subtitle="Phân tích chính sách chuyên sâu" onClick={onConsult} />
      </div>
    </article>
  );
};

export const PropertyCarousel = ({
  items,
  onSelect,
  onAction,
  showViewAll,
  selectedItems = [],
  onToggleSelect,
  maxSelect = 4,
  showCompareToggle = false,
}: {
  items: PropertyCardData[];
  onSelect: (item: PropertyCardData) => void;
  onAction: (item: PropertyCardData, intent: string) => void;
  showViewAll?: boolean;
  selectedItems?: PropertyCardData[];
  onToggleSelect?: (item: PropertyCardData) => void;
  maxSelect?: number;
  showCompareToggle?: boolean;
}) => {
  const isMaxReached = selectedItems.length >= maxSelect;

  return (
    <div className="property-carousel" aria-label="Danh sách bất động sản">
      {items.map((item, index) => {
        const isSelected = Boolean(
          item.id && selectedItems.some((s) => s.id === item.id)
        );

        return (
          <div className="property-slide" key={item.id || index}>
            <PropertyCard
              property={item}
              showViewAll={showViewAll && index === 0}
              onViewAll={() => onSelect(item)}
              onSelect={() => onSelect(item)}
              onVisit={() => onAction(item, 'US2_1_VISIT')}
              onConsult={() => onAction(item, 'US2_2_CONSULT')}
              onMap={() => onAction(item, 'US5_MAP')}
              isSelected={isSelected}
              onToggleSelect={onToggleSelect ? () => onToggleSelect(item) : undefined}
              disableSelect={isMaxReached}
              showCompareToggle={showCompareToggle}
            />
          </div>
        );
      })}
    </div>
  );
};
