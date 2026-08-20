import { BarChart3, Building2, House, Ruler } from 'lucide-react';

const propertyLabels: Record<string, string> = {
  can_ho: 'Căn hộ', lien_ke: 'Liền kề', thuong_mai_dich_vu: 'Thương mại',
  shophouse: 'Shophouse', biet_thu_song_lap: 'Biệt thự song lập', unknown: 'Khác',
};
const money = (value?: number) => value ? `${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ` : '—';
const millions = (value?: number) => value ? `${Math.round(value / 1e6).toLocaleString('vi-VN')} tr/m²` : '—';

export const ProjectOverview = ({ overview }: { overview: any }) => {
  const stats = overview?.stats || overview;
  const project = overview?.project;
  const types = Object.entries(stats?.by_property_type || {}).sort((a: any, b: any) => b[1] - a[1]);
  const maxType = Math.max(...types.map(([, count]) => Number(count)), 1);
  const asking = stats?.by_price_type?.asking?.count || 0;
  const estimate = stats?.by_price_type?.estimate?.count || 0;
  const totalPriceTypes = Math.max(asking + estimate, 1);

  return (
    <section className="project-overview">
      <div className="overview-heading">
        <span><BarChart3 size={20} /></span>
        <div><h3>{project?.name || 'Tổng quan dự án'}</h3><p>{[project?.district, project?.province].filter(Boolean).join(', ')}</p></div>
      </div>
      <div className="overview-kpis">
        <div><Building2 size={17} /><span>Tổng nguồn hàng<strong>{stats?.count?.toLocaleString('vi-VN') || '—'} căn</strong></span></div>
        <div><House size={17} /><span>Giá trung bình<strong>{money(stats?.price_vnd?.avg)}</strong></span></div>
        <div><BarChart3 size={17} /><span>Đơn giá TB<strong>{millions(stats?.price_per_m2_vnd?.avg)}</strong></span></div>
        <div><Ruler size={17} /><span>Diện tích TB<strong>{stats?.area_m2?.avg ? `${stats.area_m2.avg.toLocaleString('vi-VN')} m²` : '—'}</strong></span></div>
      </div>
      <div className="overview-range">
        <h4>Khoảng giá ghi nhận</h4>
        <div><span>{money(stats?.price_vnd?.min)}</span><i /><span>{money(stats?.price_vnd?.max)}</span></div>
      </div>
      {types.length > 0 && (
        <div className="overview-chart">
          <h4>Cơ cấu loại hình</h4>
          {types.slice(0, 5).map(([key, count]) => (
            <div className="chart-row" key={key}>
              <span>{propertyLabels[key] || key}</span>
              <div><i style={{ width: `${Math.max((Number(count) / maxType) * 100, 2)}%` }} /></div>
              <strong>{Number(count).toLocaleString('vi-VN')}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="price-type-chart">
        <h4>Nguồn giá</h4>
        <div className="stacked-bar"><i style={{ width: `${asking / totalPriceTypes * 100}%` }} /><b style={{ width: `${estimate / totalPriceTypes * 100}%` }} /></div>
        <p><span>Giá chào bán · {asking}</span><span>Giá ước tính · {estimate}</span></p>
      </div>
      <p className="overview-note">Số liệu mang tính mô tả thị trường tại thời điểm thu thập, không phải khuyến nghị đầu tư.</p>
    </section>
  );
};
