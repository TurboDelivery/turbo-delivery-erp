'use client';

import { useEffect, useRef, useState } from 'react';
import { LivreurTrafic } from '@/types/models';
import { createUrlFile } from '@/utils/createUrlFile';

const AVATAR_FALLBACK = '/assets/images/avatar.png';

function escapeHtml(input: string): string {
    return input.replace(/[&<>"']/g, (c) => {
        switch (c) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return c;
        }
    });
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

        const validPositions = (positions || []).filter(
            (p) => p.position.latitude !== 0 && p.position.longitude !== 0,
        );

        validPositions.forEach((item) => {
            const primarySrc = item.avatarUrl ? createUrlFile(item.avatarUrl, 'backend') : AVATAR_FALLBACK;
            const safeSrc = escapeHtml(primarySrc).replace(/'/g, "\\'");
            const safeFallback = escapeHtml(AVATAR_FALLBACK).replace(/'/g, "\\'");
            const safeName = escapeHtml(item.nomComplet ?? '');
            const safePhone = escapeHtml(item.telephone ?? '');

            const customIcon = L.divIcon({
                className: '',
                html: `
                    <div
                        role="img"
                        aria-label="${safeName}"
                        style="
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            border: 3px solid red;
                            overflow: hidden;
                            box-shadow: 0 0 3px rgba(0,0,0,0.5);
                            background-color: #f5f5f5;
                            background-image: url('${safeSrc}'), url('${safeFallback}');
                            background-size: cover, cover;
                            background-position: center, center;
                            background-repeat: no-repeat, no-repeat;
                        "
                    ></div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40],
            });

            L.marker([item.position.latitude, item.position.longitude], { icon: customIcon })
                .addTo(layer)
                .bindPopup(
                    `<b>${safeName}</b><br><b>Statut</b>: ${item.course ? 'En livraison' : 'Disponible'}<br><b>Téléphone</b>: ${safePhone}`,
                );
        });

        if (!hasFittedRef.current && validPositions.length > 0) {
            const bounds = L.latLngBounds(
                validPositions.map((item) => [item.position.latitude, item.position.longitude]),
            );
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

    return (
        <div ref={mapContainer} className="w-full h-full" style={{ borderRadius: '5px', minHeight: '400px' }} />
    );
}
