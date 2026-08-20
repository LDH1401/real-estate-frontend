import React from 'react';
import { DollarSign, LayoutGrid } from 'lucide-react';

interface ComparisonTableProps {
  comparisonData: any;
  category?: 'financial_legal' | 'space_interior' | 'all';
  title?: string;
  sendMessage?: (content: string, explicitIntent?: string) => Promise<void>;
}

// Dictionary mapping từ Supabase
const SUPABASE_DICT: Record<string, string> = {
  so_do: 'Sổ đỏ',
  dat_coc: 'Hợp đồng đặt cọc',
  hdmb: 'Hợp đồng mua bán',
  thoa_thuan: 'Thoả thuận',
  trong: 'Đang để trống',
  cho_thue: 'Đang cho thuê',
  dang_o: 'Đang ở',
  cao_cap: 'Cao cấp',
  co_ban: 'Cơ bản',
  co_khong_ro: 'Có',
  day_du: 'Đầy đủ',
  khong: 'Không',
  tho: 'Nhà thô',
};

const formatDictValue = (key?: string) => {
  if (!key || key === '0' || key === 'null' || key === 'undefined') return '-';
  return SUPABASE_DICT[key] || key;
};

const formatBedrooms = (item: any) => {
  const norm = item.bedrooms_norm ?? item.bedrooms;
  const hasFlex = Boolean(item.bedrooms_plus || item.has_flex_room);

  let base = '-';
  if (norm === 0 || String(norm).toLowerCase() === 'studio') {
    base = 'Studio';
  } else if (norm != null && Number(norm) > 0) {
    base = `${norm} PN`;
  }

  if (base === '-') return '-';
  return hasFlex ? `${base} + 1` : base;
};

const formatFloor = (item: any) => {
  if (item.floor_num && Number(item.floor_num) > 0) {
    return `Tầng ${item.floor_num}`;
  }
  if (item.floor_band && item.floor_band.trim()) {
    return item.floor_band.trim();
  }
  return '-';
};

const formatDirection = (item: any) => {
  if (item.direction_balcony && item.direction_balcony.trim()) {
    const dir = item.direction_balcony.trim().replace(/^Hướng\s+/i, '');
    return `Hướng ${dir}`;
  }
  return '-';
};

interface RowDefinition {
  key: string;
  label: string;
  getValue: (item: any) => React.ReactNode;
  shouldShow?: boolean;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  comparisonData,
  category = 'all',
  title,
}) => {
  if (!comparisonData || !comparisonData.listings || comparisonData.listings.length === 0) {
    return null;
  }

  const listings = comparisonData.listings;

  // Kiểm tra dự án và tỉnh thành có khác nhau không để quyết định hiển thị
  const distinctProjects = new Set(
    listings.map((l: any) => l.project_name || l.project_id || l.project).filter(Boolean)
  );
  const isDifferentProject = distinctProjects.size > 1;

  const distinctProvinces = new Set(
    listings.map((l: any) => l.province).filter(Boolean)
  );
  const isDifferentProvince = distinctProvinces.size > 1;

  // Định nghĩa các hàng cho Op1: Tài chính & Pháp lý
  const financialRows: RowDefinition[] = [
    {
      key: 'project',
      label: 'Dự án',
      getValue: (item) => item.project_name || item.project || item.subtitle || '-',
      shouldShow: isDifferentProject,
    },
    {
      key: 'province',
      label: 'Tỉnh/Thành',
      getValue: (item) => item.province || '-',
      shouldShow: isDifferentProvince,
    },
    {
      key: 'price',
      label: 'Giá',
      getValue: (item) => {
        if (!item.price_vnd) return '-';
        const priceStr = `${(item.price_vnd / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
        const typeLabel =
          item.price_type === 'asking'
            ? 'Chào bán'
            : item.price_type === 'estimate'
            ? 'Ước tính'
            : null;
        return (
          <div className="price-cell-content">
            <span className="price-main">{priceStr}</span>
            {typeLabel && <span className="price-type-tag">({typeLabel})</span>}
          </div>
        );
      },
    },
    {
      key: 'price_per_m2',
      label: 'Đơn giá / m²',
      getValue: (item) =>
        item.price_per_m2_vnd
          ? `${Math.round(item.price_per_m2_vnd / 1e6).toLocaleString('vi-VN')} triệu/m²`
          : '-',
    },
    {
      key: 'area',
      label: 'Diện tích',
      getValue: (item) =>
        item.area_m2 && Number(item.area_m2) > 0
          ? `${Number(item.area_m2).toLocaleString('vi-VN')} m²`
          : '-',
    },
    {
      key: 'legal_status',
      label: 'Pháp lý',
      getValue: (item) => formatDictValue(item.legal_status),
    },
    {
      key: 'usage_status',
      label: 'Hiện trạng',
      getValue: (item) => formatDictValue(item.usage_status),
    },
  ];

  // Định nghĩa các hàng cho Op2: Không gian & Nội thất
  const spaceRows: RowDefinition[] = [
    {
      key: 'bedrooms',
      label: 'Số phòng ngủ',
      getValue: (item) => formatBedrooms(item),
    },
    {
      key: 'bathrooms',
      label: 'Số toilet',
      getValue: (item) =>
        item.bathrooms && Number(item.bathrooms) > 0 ? `${item.bathrooms} WC` : '-',
    },
    {
      key: 'floor',
      label: 'Tầng / Vị trí',
      getValue: (item) => formatFloor(item),
    },
    {
      key: 'direction_balcony',
      label: 'Hướng ban công',
      getValue: (item) => formatDirection(item),
    },
    {
      key: 'view',
      label: 'View',
      getValue: (item) => {
        const v = (item.view || '').trim();
        if (!v || v.toLowerCase() === 'k' || v.toLowerCase() === 'khong' || v.toLowerCase() === 'k_co' || v === '0' || v === 'null') {
          return '-';
        }
        return v;
      },
    },
    {
      key: 'furnishing',
      label: 'Nội thất',
      getValue: (item) => formatDictValue(item.furnishing),
    },
  ];

  // Chọn bộ hàng dựa trên category
  let activeRows: RowDefinition[] = [];
  if (category === 'financial_legal') {
    activeRows = financialRows.filter((r) => r.shouldShow !== false);
  } else if (category === 'space_interior') {
    activeRows = spaceRows.filter((r) => r.shouldShow !== false);
  } else {
    // all
    activeRows = [
      ...financialRows.filter((r) => r.shouldShow !== false),
      ...spaceRows.filter((r) => r.shouldShow !== false),
    ];
  }

  const tableTitle =
    title ||
    (category === 'financial_legal'
      ? 'Thông số Tài chính & Pháp lý'
      : category === 'space_interior'
      ? 'Thông số Không gian & Nội thất'
      : 'Thông số so sánh các căn hộ');

  const titleIcon =
    category === 'financial_legal' ? (
      <DollarSign size={18} />
    ) : (
      <LayoutGrid size={18} />
    );

  return (
    <div className="inline-comparison-matrix">
      <div className="matrix-heading">
        <div className="matrix-title-icon">
          {titleIcon}
        </div>
        <div>
          <h3>{tableTitle}</h3>
        </div>
      </div>

      <div className="matrix-table-scroll-container">
        <table className="compare-matrix-table">
          <thead>
            <tr>
              <th className="criteria-col-header">
                <span>Thông số</span>
              </th>
              {listings.map((item: any, idx: number) => {
                const colWidth = `${(100 / listings.length).toFixed(2)}%`;
                return (
                  <th
                    key={item.id || idx}
                    className="property-col-header"
                    style={{ width: colWidth }}
                  >
                    <div className="matrix-card-head">
                      <h4 title={item.title}>
                        {item.title || `Căn hộ ${idx + 1}`}
                      </h4>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {activeRows.map((row) => (
              <tr key={row.key}>
                <td className="criteria-label">{row.label}</td>
                {listings.map((item: any, idx: number) => {
                  const val = row.getValue(item);
                  const isPrice = row.key === 'price' || row.key === 'unit_price';
                  return (
                    <td
                      key={`${row.key}-${item.id || idx}`}
                      className={`spec-cell ${isPrice ? 'price-cell' : ''}`}
                    >
                      <span className={val === '-' ? 'spec-empty' : 'spec-value'}>
                        {val}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
