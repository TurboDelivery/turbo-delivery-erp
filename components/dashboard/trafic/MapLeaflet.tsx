'use client';

import { useEffect, useRef, useState } from 'react';
import { LivreurTrafic, TypeLivreur } from '@/types/models';

const PIN_COLORS: Record<TypeLivreur, string> = {
  INDEPENDANT: '#2563eb', // bleu
  JOURNALIER: '#dc2626', // rouge
};
const PIN_DEFAULT_COLOR = '#6b7280'; // gris neutre si type inconnu

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return c;
    }
  });
}

function buildPinSvg(color: string): string {
  return `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z"
            fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="#ffffff"/>
    </svg>
  `;
}

interface MapLeafletProps {
  positions: LivreurTrafic[];
  focusPosition?: [number, number, number] | null;
}

export default function MapLeaflet({ positions, focusPosition }: MapLeafletProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const hasFittedRef = useRef<boolean>(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapContainer.current || mapInstance.current) return;

      leafletRef.current = L;

      const map = L.map(mapContainer.current, {
        center: [5.3984153, -3.9565058],
        zoom: 13,
        dragging: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      markersLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;

      // Leaflet ne peint pas correctement les tuiles si le conteneur
      // n'avait pas sa taille finale au moment du `L.map()` — on force un recalcul.
      requestAnimationFrame(() => {
        if (!cancelled && mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      });

      setMapReady(true);
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersLayer.current = null;
        leafletRef.current = null;
        hasFittedRef.current = false;
      }
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const L = leafletRef.current;
    const map = mapInstance.current;
    const layer = markersLayer.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();

    const validPositions = (positions || []).filter((p) => p.position.latitude !== 0 && p.position.longitude !== 0);

    validPositions.forEach((item) => {
      const safeName = escapeHtml(item.nomComplet ?? '');
      const safePhone = escapeHtml(item.telephone ?? '');
      const pinColor = item.typeLivreur ? PIN_COLORS[item.typeLivreur] ?? PIN_DEFAULT_COLOR : PIN_DEFAULT_COLOR;

      const customIcon = L.divIcon({
        className: 'trafic-pin-marker',
        html: buildPinSvg(pinColor),
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42],
      });

      L.marker([item.position.latitude, item.position.longitude], { icon: customIcon })
        .addTo(layer)
        .bindPopup(`<b>${safeName}</b><br><b>Statut</b>: ${item.course ? 'En livraison' : 'Disponible'}<br><b>Téléphone</b>: ${safePhone}`);
    });

    if (!hasFittedRef.current && validPositions.length > 0) {
      const bounds = L.latLngBounds(validPositions.map((item) => [item.position.latitude, item.position.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
      hasFittedRef.current = true;
    }
  }, [positions, mapReady]);

  useEffect(() => {
    if (!mapReady || !focusPosition) return;
    const map = mapInstance.current;
    if (!map) return;
    const [lat, lon] = focusPosition;
    map.flyTo([lat, lon], 17, { duration: 0.8 });
  }, [focusPosition, mapReady]);

  return <div ref={mapContainer} className="w-full h-full" style={{ borderRadius: '5px', minHeight: '400px' }} />;
}
