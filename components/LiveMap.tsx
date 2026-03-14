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
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Mapa ao vivo</h2>

      <div style={{ marginBottom: 12, fontSize: 14 }}>
        Últimas posições carregadas: {positions.length}
      </div>

      {latest && (
        <div style={{ marginBottom: 12, fontSize: 14 }}>
          Lat: {latest.lat} | Lng: {latest.lng} | Fonte: {latest.source}
        </div>
      )}

      <MapContainer
        key={`${center[0]}-${center[1]}`}
        center={center}
        zoom={15}
        scrollWheelZoom
        style={{ height: 480 }}
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
              color: '#ff0000',
              weight: 4,
              fillColor: '#ff3b30',
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              Última posição
              <br />
              Lat: {latest.lat}
              <br />
              Lng: {latest.lng}
              <br />
              Fonte: {latest.source}
            </Popup>
          </CircleMarker>
        )}

        {line.length > 1 && (
          <Polyline
            positions={line}
            pathOptions={{ color: '#00e0ff', weight: 4 }}
          />
        )}
      </MapContainer>
    </div>
  );
}