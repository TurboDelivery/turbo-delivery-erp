'use client';

import { useEffect, useRef } from 'react';
import { LivreurTrafic } from '@/types/models';
import { createUrlFile } from '@/utils/createUrlFile';

export default function MapLeaflet({ positions }: { positions: LivreurTrafic[]; }) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null); // pour stocker l'instance Leaflet

    useEffect(() => {
        let L: any;

        const initMap = async () => {
            L = (await import('leaflet')).default;
            if (!mapContainer.current) return;

            const map = L.map(mapContainer.current, {
                center: [5.3984153, -3.9565058],
                zoom: 13,
                dragging: true,
                scrollWheelZoom: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            mapInstance.current = map;

            addMarkers();
        };

        const addMarkers = () => {
            if (!mapInstance.current || !positions || positions.length === 0) return;

            const validPositions = positions.filter(
                p => p.position.latitude !== 0 && p.position.longitude !== 0
            );

            validPositions.forEach(item => {
                // Créer un icon personnalisé
                const customIcon = L.divIcon({
                    className: '', // vide pour ne pas appliquer les styles par défaut
                    html: `
                        <div style="
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            border: 3px solid red;
                            overflow: hidden;
                            box-shadow: 0 0 3px rgba(0,0,0,0.5);
                        ">
                            <img src="${item.avatarUrl ? createUrlFile(item.avatarUrl, 'backend') : '/assets/images/avatar.png'}"
                                style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40],
                });
                  

                L.marker([item.position.latitude, item.position.longitude], { icon: customIcon })
                    .addTo(mapInstance.current)
                    .bindPopup(
                        `<b>${item.nomComplet}</b><br><b>Statut</b>: ${item.course ? 'En livraison' : 'Disponible'}<br><b>Téléphone</b>: ${item.telephone}`
                    );
            });

            if (validPositions.length > 0) {
                const bounds = L.latLngBounds(
                    validPositions.map(item => [item.position.latitude, item.position.longitude])
                );
                mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
            }
        };

        initMap();

        return () => {
            if (mapInstance.current) mapInstance.current.remove();
        };
    }, [positions]);

    return (
        <div ref={mapContainer} id="leaflet-map" className="w-full h-full" style={{ borderRadius: '5px' }} />
    );
}
