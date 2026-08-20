import { CalendarDays, CheckCircle2, Home, MapPin, Ruler, Sofa } from 'lucide-react';
import type {
  ActionCompare,
  ActionDetail,
  ActionForm,
  ActionMap,
  ActionOverview,
  UIAction,
} from '../../types/agent';
import { ComparisonTable } from './ComparisonTable';
import { MapView } from './MapView';
import { ProjectOverview } from './ProjectOverview';
import { ChatTextAgent } from '../chat/ChatTextAgent';

interface InlineActionsProps {
  actions: UIAction[];
  sendMessage: (content: string, explicitIntent?: string, displayText?: string) => Promise<void>;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80';

const displayValue = (value: unknown, fallback = 'Đang cập nhật') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

export const InlineActions = ({ actions, sendMessage }: InlineActionsProps) => {
  const detailAction = actions.find(action => action.type === 'detail') as ActionDetail | undefined;
  const formAction = actions.find(action => action.type === 'form') as ActionForm | undefined;
  const mapAction = actions.find(action => action.type === 'map') as ActionMap | undefined;
  const compareAction = actions.find(action => action.type === 'compare') as ActionCompare | undefined;
  const overviewAction = actions.find(action => action.type === 'overview') as ActionOverview | undefined;
  const listing = detailAction?.listing;

  return (
    <div className="chat-inline-actions animate-fade-in">
      {listing && (
        <article className="inline-listing-card">
          <div className="inline-listing-image-wrap">
            <img
              src={listing.thumbnail || listing.image_url || listing.images?.[0] || fallbackImage}
              alt={listing.title || 'Căn hộ'}
              className="inline-listing-image"
              onError={event => { event.currentTarget.src = fallbackImage; }}
            />
            <span className="inline-listing-badge">Căn hộ đề xuất</span>
          </div>

          <div className="inline-listing-content">
            <div>
              <p className="inline-listing-eyebrow"><Home size={15} /> Chi tiết căn hộ</p>
              <h3>{listing.title || 'Thông tin căn hộ'}</h3>
              <p className="inline-listing-price">
                {listing.price_vnd
                  ? `${(listing.price_vnd / 1e9).toFixed(1)} tỷ VND`
                  : 'Liên hệ để nhận báo giá'}
              </p>
            </div>

            <div className="inline-listing-specs">
              <div><Ruler size={17} /><span>Diện tích<strong>{listing.area_m2 ? `${listing.area_m2} m²` : 'Đang cập nhật'}</strong></span></div>
              <div><Home size={17} /><span>Tầng<strong>{displayValue(listing.floor_num || listing.floor_band)}</strong></span></div>
              <div><MapPin size={17} /><span>Hướng / tầm nhìn<strong>{displayValue(listing.direction_balcony || listing.view)}</strong></span></div>
              <div><Sofa size={17} /><span>Bàn giao<strong>{displayValue(listing.furnishing, 'Cơ bản')}</strong></span></div>
              <div><CheckCircle2 size={17} /><span>Pháp lý<strong>{displayValue(listing.legal_status, 'Hợp đồng mua bán')}</strong></span></div>
            </div>

            <button
              className="inline-booking-button"
              onClick={() => sendMessage(
                `Tôi muốn đặt lịch tham quan căn ${listing.id || listing.title || 'này'}`,
                'US2_1_VISIT',
              )}
            >
              <CalendarDays size={18} />
              Đặt lịch tham quan
            </button>
          </div>
        </article>
      )}

      {formAction?.form && (
        <section className="inline-booking-form">
          <div className="inline-form-heading">
            <span><CalendarDays size={20} /></span>
            <div>
              <h3>{formAction.form.title || 'Đặt lịch tham quan'}</h3>
              <p>{formAction.form.description || 'Vui lòng để lại thông tin, chuyên viên sẽ xác nhận lịch với bạn.'}</p>
            </div>
          </div>
          <div className="inline-form-fields">
            {formAction.form.fields?.map((field: any, index: number) => (
              <label key={field.name || index}>
                <span>{field.label}</span>
                <input
                  name={field.name}
                  type={field.type === 'datetime' ? 'datetime-local' : field.type || 'text'}
                  placeholder={field.placeholder || field.label}
                />
              </label>
            ))}
          </div>
          <button className="inline-form-submit">Gửi yêu cầu đặt lịch</button>
        </section>
      )}

      {mapAction && <div className="inline-map"><MapView mapData={mapAction.map} /></div>}
      {compareAction && (
        <div className="inline-compare">
          <ComparisonTable
            comparisonData={compareAction.comparison}
            category={compareAction.category}
            title={compareAction.title}
            sendMessage={sendMessage}
          />
          {compareAction.summary && (
            <div className="compare-chat-summary-text">
              <ChatTextAgent content={`💡 Tổng quan: ${compareAction.summary}`} />
            </div>
          )}
        </div>
      )}
      {overviewAction && <ProjectOverview overview={overviewAction.overview} />}
    </div>
  );
};
