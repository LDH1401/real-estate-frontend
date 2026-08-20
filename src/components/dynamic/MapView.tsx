import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  mapData: any;
}

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const getAmenityEmoji = (type: string) => {
  switch(type) {
    case 'school':
    case 'kindergarten':
      return '🏫';
    case 'hospital':
    case 'clinic':
      return '🏥';
    case 'marketplace':
      return '🛒';
    case 'park':
      return '🌳';
    default:
      return '📍';
  }
};

const getPropertyIcon = () => {
  return L.divIcon({
    html: `<div style="font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); line-height: 1; display: flex; justify-content: center; align-items: center; width: 36px; height: 36px; background: white; border-radius: 50%; border: 2px solid #3b82f6; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">🏠</div>`,
    className: 'custom-property-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

const getAmenityIcon = (type: string) => {
  const emoji = getAmenityEmoji(type);
  return L.divIcon({
    html: `<div style="font-size: 16px; line-height: 1; display: flex; justify-content: center; align-items: center; width: 28px; height: 28px; background-color: white; border-radius: 50%; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.15);">${emoji}</div>`,
    className: 'custom-amenity-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

export const MapView: React.FC<MapViewProps> = ({ mapData }) => {
  const points = mapData?.points || mapData?.listings || [];
  
  let centerLat = mapData?.center_lat;
  let centerLng = mapData?.center_lng;

  // If no center provided, compute from points
  if ((!centerLat || !centerLng) && points.length > 0) {
    centerLat = points.reduce((sum: number, p: any) => sum + (p.lat || p.latitude || 0), 0) / points.length;
    centerLng = points.reduce((sum: number, p: any) => sum + (p.lng || p.longitude || 0), 0) / points.length;
  }

  // Fallback to a default center (e.g., HCMC center)
  if (!centerLat || !centerLng) {
    centerLat = 10.762622;
    centerLng = 106.660172;
  }

  return (
    <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
      <h3 className="font-bold text-xs mb-4 uppercase tracking-wider text-slate-400">
        Vị trí: {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
      </h3>
      <div 
        className="relative"
        style={{ 
          height: '220px', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          boxShadow: 'var(--shadow-md)',
          zIndex: 1
        }}
      >
        <MapContainer center={[centerLat, centerLng]} zoom={13} attributionControl={false} style={{ height: '100%', width: '100%' }}>
          <ChangeView center={[centerLat, centerLng]} zoom={13} />
          <TileLayer
            attribution=""
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p: any, idx: number) => {
            const lat = p.lat || p.latitude;
            const lng = p.lng || p.longitude;
            if (!lat || !lng) return null;
            return (
              <Marker key={`point-${idx}`} position={[lat, lng]} icon={getPropertyIcon()}>
                {(p.title || p.name) && (
                  <Popup>
                    <strong>{p.title || p.name}</strong>
                    {p.price_vnd ? <div className="text-sm mt-1 text-slate-600">{(p.price_vnd / 1e9).toFixed(2)} Tỷ đ</div> : null}
                  </Popup>
                )}
              </Marker>
            );
          })}
          {mapData?.amenities?.map((a: any, idx: number) => {
            const lat = a.lat;
            const lng = a.lng;
            if (!lat || !lng) return null;
            
            return (
              <Marker key={`amenity-${idx}`} position={[lat, lng]} icon={getAmenityIcon(a.type)}>
                <Popup>
                  <div className="font-medium text-sm text-slate-800">{a.name || 'Tiện ích'}</div>
                  <div className="text-xs text-slate-500 capitalize">{a.type || 'Khác'}</div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
