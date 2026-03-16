'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, GeoJSONSource, Marker as MapLibreMarker } from 'maplibre-gl';
import { Position } from '@/lib/types';

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
}: {
  positions: Position[];
  darkMap?: boolean;
  profileImageUrl?: string;
}) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<MapLibreMap | null>(null);
  const markerRef     = useRef<MapLibreMarker | null>(null);
  const markerPosRef  = useRef<[number, number] | null>(null);
  const animationRef  = useRef<number | null>(null);
  const positionsRef  = useRef(positions);
  positionsRef.current = positions;

  // Initialise map once
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    let cancelled = false;

    import('maplibre-gl').then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current) return;

      const first = positionsRef.current[0];
      const center: [number, number] = first
        ? [Number(first.lng), Number(first.lat)]
        : [-45.4138, -23.6207];

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: darkMap ? DARK_STYLE : LIGHT_STYLE,
        center,
        zoom: positionsRef.current.length > 1 ? 4 : 12,
        attributionControl: { compact: true },
      });

      mapRef.current = map;

      if (first) {
        const markerEl = createAvatarElement(profileImageUrl);
        const marker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
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
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update data sources when positions change (without recreating the map)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const routeSrc = map.getSource('route') as GeoJSONSource | undefined;
    if (!routeSrc) return; // style not yet loaded — style.load handler will do the initial draw
    routeSrc.setData(routeGeoJSON(positions));
    (map.getSource('positions') as GeoJSONSource).setData(dotsGeoJSON(positions));

    const latest = positions[0];
    if (!latest) return;

    const target: [number, number] = [Number(latest.lng), Number(latest.lat)];

    if (!markerRef.current) {
      import('maplibre-gl').then(({ default: maplibregl }) => {
        if (!mapRef.current || markerRef.current) return;
        const markerEl = createAvatarElement(profileImageUrl);
        const marker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
          .setLngLat(target)
          .addTo(mapRef.current);
        markerRef.current = marker;
        markerPosRef.current = target;
      });
      return;
    }

    const marker = markerRef.current;
    const start = markerPosRef.current ?? target;

    if (start[0] === target[0] && start[1] === target[1]) {
      return;
    }

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

  // Switch between dark and light basemap
  useEffect(() => {
    mapRef.current?.setStyle(darkMap ? DARK_STYLE : LIGHT_STYLE);
  }, [darkMap]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  );
}