'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type GeoPosition = {
  lat:      number;
  lng:      number;
  accuracy: number;
};

export type GeoState = {
  position:      GeoPosition | null;
  error:         string | null;
  isWatching:    boolean;
  isSupported:   boolean;
};

export type GeoActions = {
  captureOnce:    () => void;
  startWatching:  () => void;
  stopWatching:   () => void;
};

export function useGeolocation(): GeoState & GeoActions {
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const [position,   setPosition]   = useState<GeoPosition | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef  = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setError(null);
    setPosition({
      lat:      pos.coords.latitude,
      lng:      pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'Permissão de localização negada.',
      2: 'Localização não disponível.',
      3: 'Tempo esgotado ao obter localização.',
    };
    setError(messages[err.code] ?? 'Erro desconhecido.');
  }, []);

  // Captura única (one-shot)
  const captureOnce = useCallback(() => {
    if (!isSupported) { setError('Geolocalização não suportada.'); return; }
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  }, [isSupported, handleSuccess, handleError]);

  // Inicia watchPosition (live)
  const startWatching = useCallback(() => {
    if (!isSupported) { setError('Geolocalização não suportada.'); return; }
    if (watchIdRef.current !== null) return; // já está assistindo

    setIsWatching(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
    );
  }, [isSupported, handleSuccess, handleError]);

  // Para watchPosition
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  // Limpa ao desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    position,
    error,
    isWatching,
    isSupported,
    captureOnce,
    startWatching,
    stopWatching,
  };
}
