'use client';

import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  Popup,
  TileLayer,
  Polyline,
  CircleMarker,
} from 'react-leaflet';
import { Position } from '@/lib/types';

export default function LiveMap({ positions }: { positions: Position[] }) {
  const latest = positions[0];

  const center: [number, number] = latest
    ? [Number(latest.lat), Number(latest.lng)]
    : [-23.6207, -45.4138];

  const line = positions
    .slice()
    .reverse()
    .map((p) => [Number(p.lat), Number(p.lng)] as [number, number]);

  return (
    <div>
      {latest && (
        <div className="mb-3">
          <div className="row g-2 text-center">
            <div className="col-6">
              <div className="p-2 bg-dark rounded">
                <small className="text-muted text-uppercase">Latitude</small>
                <div className="h6 mb-0 text-warning">{latest.lat}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="p-2 bg-dark rounded">
                <small className="text-muted text-uppercase">Longitude</small>
                <div className="h6 mb-0 text-warning">{latest.lng}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {positions.length > 0 && (
        <div className="mb-3 text-center p-2 bg-dark rounded">
          <small className="text-muted text-uppercase">Posições Rastreadas</small>
          <div className="h6 mb-0 text-warning">{positions.length}</div>
        </div>
      )}

      <MapContainer
        key={`${center[0]}-${center[1]}`}
        center={center}
        zoom={15}
        scrollWheelZoom
        style={{ height: 480, borderRadius: 12 }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {latest && (
          <CircleMarker
            center={[Number(latest.lat), Number(latest.lng)]}
            radius={16}
            pathOptions={{
              color: '#ffc107',
              weight: 4,
              fillColor: '#ff9800',
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div>
                <strong>📍 Posição Atual</strong>
                <br />
                Lat: {latest.lat}
                <br />
                Lng: {latest.lng}
                <br />
                Fonte: {latest.source}
              </div>
            </Popup>
          </CircleMarker>
        )}

        {line.length > 1 && (
          <Polyline
            positions={line}
            pathOptions={{ color: '#ffc107', weight: 3, opacity: 0.7 }}
          />
        )}
      </MapContainer>
    </div>
  );
}