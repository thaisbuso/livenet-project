'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, GeoJSONSource, Marker as MapLibreMarker } from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';
import { Position, MemberWithLocation } from '@/lib/types';

const DARK_STYLE  = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function createAvatarElement(profileImageUrl: string) {
  const markerEl = document.createElement('div');
  markerEl.className = 'gps-avatar-marker';

  const pulseEl = document.createElement('div');
  pulseEl.className = 'gps-avatar-pulse';

  const imageEl = document.createElement('img');
  imageEl.className = 'gps-avatar-image';
  imageEl.src = profileImageUrl;
  imageEl.alt = 'Perfil';
  imageEl.loading = 'lazy';
  imageEl.onerror = () => {
    imageEl.onerror = null;
    imageEl.src = '/assets/numbat.png';
  };

  markerEl.append(pulseEl, imageEl);
  return markerEl;
}

// Cria o elemento visual de marcador de membro do grupo
function createMemberMarkerElement(name: string, color: string) {
  const el = document.createElement('div');
  el.style.cssText = `
    display:flex; flex-direction:column; align-items:center; gap:3px;
    cursor:pointer; user-select:none;
  `;

  const dot = document.createElement('div');
  dot.style.cssText = `
    width:26px; height:26px; border-radius:50%;
    background:${color}22; border:2px solid ${color};
    box-shadow:0 0 10px ${color}66;
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; color:${color};
    font-family:Rajdhani,sans-serif; transition:transform 0.2s;
  `;
  dot.textContent = name[0]?.toUpperCase() ?? '?';
  dot.onmouseenter = () => { dot.style.transform = 'scale(1.15)'; };
  dot.onmouseleave = () => { dot.style.transform = 'scale(1)'; };

  const label = document.createElement('div');
  label.style.cssText = `
    font-size:10px; font-weight:600; color:#e8edf5;
    font-family:Rajdhani,sans-serif;
    background:rgba(8,11,18,0.85); border:1px solid ${color}40;
    border-radius:4px; padding:1px 5px; white-space:nowrap;
    letter-spacing:0.3px; max-width:80px; overflow:hidden; text-overflow:ellipsis;
  `;
  label.textContent = name;

  el.append(dot, label);
  return el;
}

function buildPopupHTML(member: MemberWithLocation): string {
  const updatedAt = new Date(member.location.updated_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });
  const color = member.group?.color ?? '#00d4ff';
  return `
    <div style="font-family:Rajdhani,sans-serif;min-width:140px;background:#0f1623;border:1px solid ${color}30;border-radius:8px;padding:10px 12px;">
      <div style="font-size:14px;font-weight:700;color:#e8edf5;margin-bottom:4px;">${member.profile.name}</div>
      <div style="font-size:11px;color:${color};margin-bottom:2px;">${member.group?.icon ?? ''} ${member.group?.name ?? '—'}</div>
      <div style="font-size:10px;color:rgba(232,237,245,0.45);">Atualizado às ${updatedAt}</div>
      <div style="font-size:10px;color:#00ff88;margin-top:4px;">● Compartilhando localização</div>
    </div>
  `;
}

// Sincroniza marcadores DOM de membros do grupo no mapa
function syncMemberMarkers(
  map: MapLibreMap,
  maplibreglModule: typeof maplibregl,
  members: MemberWithLocation[],
  markerMap: Map<string, MapLibreMarker>,
) {
  const incoming = new Set(members.map(m => m.profile.id));

  // Remove marcadores de membros que saíram da lista
  markerMap.forEach((marker, profileId) => {
    if (!incoming.has(profileId)) {
      marker.remove();
      markerMap.delete(profileId);
    }
  });

  // Adiciona ou move marcadores dos membros ativos
  members.forEach(member => {
    const { profile, group, location } = member;
    const lngLat: [number, number] = [location.lng, location.lat];
    const color = group?.color ?? '#00d4ff';

    const existing = markerMap.get(profile.id);
    if (existing) {
      existing.setLngLat(lngLat);
    } else {
      const el = createMemberMarkerElement(profile.name, color);
      const marker = new maplibreglModule.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(lngLat)
        .setPopup(
          new maplibreglModule.Popup({ offset: 8, closeButton: false })
            .setHTML(buildPopupHTML(member)),
        )
        .addTo(map);
      markerMap.set(profile.id, marker);
    }
  });
}

function routeGeoJSON(positions: Position[]) {
  const coords = [...positions].reverse().map(p => [Number(p.lng), Number(p.lat)]);
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates: coords },
  };
}

function dotsGeoJSON(positions: Position[]) {
  return {
    type: 'FeatureCollection' as const,
    features: positions.map(p => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'Point' as const, coordinates: [Number(p.lng), Number(p.lat)] },
    })),
  };
}

function addDataLayers(map: MapLibreMap, positions: Position[]) {
  map.addSource('route', {
    type: 'geojson',
    lineMetrics: true,
    data: routeGeoJSON(positions),
  });
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-width': 4,
      'line-gradient': [
        'interpolate', ['linear'], ['line-progress'],
        0,    '#4264fb',
        0.40, '#a855f7',
        0.70, '#ef4444',
        1,    '#fbbf24',
      ],
    },
  });

  map.addSource('positions', { type: 'geojson', data: dotsGeoJSON(positions) });
  map.addLayer({
    id: 'positions',
    type: 'circle',
    source: 'positions',
    paint: { 'circle-radius': 5, 'circle-color': '#fbbf24', 'circle-opacity': 0.8 },
  });
}

export default function LiveMap({
  positions,
  darkMap = true,
  profileImageUrl = '/assets/numbat.png',
  groupMembers = [],
}: {
  positions:        Position[];
  darkMap?:         boolean;
  profileImageUrl?: string;
  // Membros de grupos com localização compartilhada — exibidos como marcadores coloridos.
  // Telefone NÃO é usado aqui: localização vem exclusivamente do consentimento via Geolocation API.
  groupMembers?:   MemberWithLocation[];
}) {
  const containerRef     = useRef<HTMLDivElement>(null);
  const mapRef           = useRef<MapLibreMap | null>(null);
  const markerRef        = useRef<MapLibreMarker | null>(null);
  const markerPosRef     = useRef<[number, number] | null>(null);
  const animationRef     = useRef<number | null>(null);
  const positionsRef     = useRef(positions);
  const membersRef       = useRef(groupMembers);
  const memberMarkersRef = useRef<Map<string, MapLibreMarker>>(new Map());

  positionsRef.current = positions;
  membersRef.current   = groupMembers;

  // ── Inicialização do mapa (uma vez) ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    let cancelled = false;

    import('maplibre-gl').then((maplibreglModule) => {
      if (cancelled || !containerRef.current) return;

      const first = positionsRef.current[0];
      const center: [number, number] = first
        ? [Number(first.lng), Number(first.lat)]
        : [-45.4138, -23.6207];

      const map = new maplibreglModule.Map({
        container: containerRef.current,
        style: darkMap ? DARK_STYLE : LIGHT_STYLE,
        center,
        zoom: positionsRef.current.length > 1 ? 4 : 12,
        attributionControl: { compact: true },
      });

      mapRef.current = map;

      if (first) {
        const markerEl = createAvatarElement(profileImageUrl);
        const marker = new maplibreglModule.Marker({ element: markerEl, anchor: 'center' })
          .setLngLat([Number(first.lng), Number(first.lat)])
          .addTo(map);
        markerRef.current = marker;
        markerPosRef.current = [Number(first.lng), Number(first.lat)];
      }

      // Re-add data layers whenever a style finishes loading (covers initial + setStyle)
      map.on('style.load', () => {
        if (cancelled) return;
        const ps = positionsRef.current;
        addDataLayers(map, ps);

        if (ps.length > 1) {
          const lngs = ps.map(p => Number(p.lng));
          const lats = ps.map(p => Number(p.lat));
          map.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 60, maxZoom: 15, duration: 0 },
          );
        }

        // Re-popula marcadores de membros após troca de estilo do mapa
        syncMemberMarkers(map, maplibreglModule, membersRef.current, memberMarkersRef.current);
      });
    });

    return () => {
      cancelled = true;
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      markerRef.current?.remove();
      markerRef.current = null;
      markerPosRef.current = null;
      memberMarkersRef.current.forEach(m => m.remove());
      memberMarkersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Atualiza trail GPS quando positions muda ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const routeSrc = map.getSource('route') as GeoJSONSource | undefined;
    if (!routeSrc) return; // style.load ainda não disparou, ele fará a carga inicial
    routeSrc.setData(routeGeoJSON(positions));
    (map.getSource('positions') as GeoJSONSource).setData(dotsGeoJSON(positions));

    const latest = positions[0];
    if (!latest) return;

    const target: [number, number] = [Number(latest.lng), Number(latest.lat)];

    if (!markerRef.current) {
      import('maplibre-gl').then((maplibreglModule) => {
        if (!mapRef.current || markerRef.current) return;
        const markerEl = createAvatarElement(profileImageUrl);
        const marker = new maplibreglModule.Marker({ element: markerEl, anchor: 'center' })
          .setLngLat(target)
          .addTo(mapRef.current);
        markerRef.current = marker;
        markerPosRef.current = target;
      });
      return;
    }

    const marker = markerRef.current;
    const start = markerPosRef.current ?? target;

    if (start[0] === target[0] && start[1] === target[1]) return;

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const durationMs = 900;
    const startedAt = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - startedAt) / durationMs, 1);
      const eased = easeOutCubic(t);
      const lng = start[0] + (target[0] - start[0]) * eased;
      const lat = start[1] + (target[1] - start[1]) * eased;
      marker.setLngLat([lng, lat]);
      markerPosRef.current = [lng, lat];

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [positions, profileImageUrl]);

  useEffect(() => {
    const markerImg = containerRef.current?.querySelector('.gps-avatar-image') as HTMLImageElement | null;
    if (!markerImg || markerImg.src.endsWith(profileImageUrl)) return;
    markerImg.src = profileImageUrl;
  }, [profileImageUrl]);

  // ── Troca entre mapa escuro e claro ────────────────────────────────────────
  useEffect(() => {
    mapRef.current?.setStyle(darkMap ? DARK_STYLE : LIGHT_STYLE);
  }, [darkMap]);

  // ── Sincroniza marcadores de membros de grupo ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    import('maplibre-gl').then((maplibreglModule) => {
      if (!mapRef.current) return;
      syncMemberMarkers(mapRef.current, maplibreglModule, groupMembers, memberMarkersRef.current);
    });
  }, [groupMembers]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  );
}
