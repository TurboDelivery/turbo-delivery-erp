'use client';

import { useEffect, useRef, useState } from 'react';
import { LivreurTrafic } from '@/types/models';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { createUrlFile } from '@/utils/createUrlFile';

const AVATAR_FALLBACK = '/assets/images/avatar.png';

// V54 (2026-05-29) — La couleur du pin est dérivée du helper centralisé
// pour rester cohérente avec les badges UI : INDEPENDANT bleu, JOURNALIER
// rouge, SUPERVISEUR_LIVREUR violet. Avant cette fix, la map ignorait
// silencieusement les superviseurs-livreurs (PIN_DEFAULT_COLOR gris).
const PIN_DEFAULT_COLOR = '#6b7280'; // fallback si type non assigné côté backend

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

function buildPinHtml(color: string, avatarSrc: string, label: string): string {
  return `
    <div style="position: relative; width: 44px; height: 56px;">
      <svg width="44" height="56" viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute; top:0; left:0;">
        <path d="M22 0C9.85 0 0 9.85 0 22c0 13 22 34 22 34s22-21 22-34C44 9.85 34.15 0 22 0z"
              fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="22" cy="22" r="16" fill="#ffffff"/>
      </svg>
      <img
        src="${avatarSrc}"
        alt="${label}"
        style="position:absolute; top:8px; left:8px; width:28px; height:28px; border-radius:50%; object-fit:cover; background:#f5f5f5; display:block;"
      />
    </div>
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
      // V54 (2026-05-29) — Couleur dérivée du helper central pour rester
      // cohérent avec le reste de l'UI (3 types + fallback).
      const pinColor = item.typeLivreur
        ? getTurboyTypeDisplay(item.typeLivreur).hexColor
        : PIN_DEFAULT_COLOR;
      const primarySrc = item.avatarUrl ? createUrlFile(item.avatarUrl, 'backend') : AVATAR_FALLBACK;
      const safeSrc = escapeHtml(primarySrc);

      const customIcon = L.divIcon({
        className: 'trafic-pin-marker',
        html: buildPinHtml(pinColor, safeSrc, safeName),
        iconSize: [44, 56],
        iconAnchor: [22, 56],
        popupAnchor: [0, -56],
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

  return <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '400px' }} />;
}
