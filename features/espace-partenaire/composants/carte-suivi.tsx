'use client';

/**
 * Carte de suivi temps réel d'une course (EF-05).
 *
 * Google Maps est chargé par le MÊME loader que MapTrafic (id 'google-map-script') :
 * le script n'est injecté qu'une seule fois pour toute l'application, quel que soit
 * l'écran ouvert en premier. Marqueurs : S = store (position du profil), C = client
 * (uniquement si sa position exacte a été reçue), T = Turboys (poll 10 s).
 * La perte du signal N'INTERROMPT PAS le suivi : bandeau « signal interrompu » (EF-05.6).
 */

import { useEffect, useRef, useState } from 'react';
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api';
import { AlertTriangle, WifiOff } from 'lucide-react';

import { lirePartenaire } from '@/features/espace-partenaire/api';

const GOOGLE_MAPS_SCRIPT_ID = 'google-map-script';
const CENTRE_ABIDJAN: google.maps.LatLngLiteral = { lat: 5.3489, lng: -4.0268 };

export interface PositionTurboys {
  disponible: boolean;
  latitude?: number;
  longitude?: number;
  horodatage?: string;
  livreurNom?: string;
}

interface CarteSuiviProps {
  courseId: string;
  storeLatitude: number | null;
  storeLongitude: number | null;
  clientLatitude?: number | null;
  clientLongitude?: number | null;
  /** Course encore en mouvement : la position est relevée toutes les 10 s. */
  active: boolean;
}

function heureLocale(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function CarteSuivi(props: CarteSuiviProps) {
  const cle = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!cle) {
    return (
      <div className="flex h-full min-h-[260px] w-full items-center justify-center rounded-xl bg-gray-100 p-6">
        <div className="flex max-w-xs flex-col items-center gap-2 text-center">
          <AlertTriangle className="h-6 w-6 text-warning" aria-hidden />
          <p className="text-sm font-semibold text-gray-700">Carte indisponible</p>
          <p className="text-xs leading-relaxed text-gray-500">
            Clé Google Maps absente (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) — la chronologie et les
            actions de la course restent utilisables.
          </p>
        </div>
      </div>
    );
  }
  return <CarteSuiviInterne {...props} cle={cle} />;
}

function CarteSuiviInterne({
  courseId,
  storeLatitude,
  storeLongitude,
  clientLatitude,
  clientLongitude,
  active,
  cle,
}: CarteSuiviProps & { cle: string }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: cle,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [pret, setPret] = useState(false);
  const [position, setPosition] = useState<PositionTurboys | null>(null);
  // Dernière position CONNUE du Turboys : conservée même quand le signal tombe,
  // pour que le marqueur T ne disparaisse pas de la carte.
  const [dernierPoint, setDernierPoint] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    let arrete = false;
    const relever = () =>
      lirePartenaire<PositionTurboys>(`courses/${courseId}/position`)
        .then((p) => {
          if (arrete) return;
          setPosition(p);
          if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
            setDernierPoint({ lat: p.latitude, lng: p.longitude });
          }
        })
        .catch(() => undefined);
    relever();
    if (!active) {
      return () => {
        arrete = true;
      };
    }
    const intervalle = setInterval(relever, 10_000);
    return () => {
      arrete = true;
      clearInterval(intervalle);
    };
  }, [courseId, active]);

  const store: google.maps.LatLngLiteral | null =
    storeLatitude != null && storeLongitude != null
      ? { lat: storeLatitude, lng: storeLongitude }
      : null;
  const client: google.maps.LatLngLiteral | null =
    clientLatitude != null && clientLongitude != null
      ? { lat: clientLatitude, lng: clientLongitude }
      : null;

  // Recadrage uniquement quand la COMPOSITION des marqueurs change (S/C/T qui
  // apparaît ou disparaît) — jamais à chaque battement de position, sinon la
  // carte « saute » sous le doigt de l'opérateur.
  const composition = `${store ? 's' : ''}${client ? 'c' : ''}${dernierPoint ? 't' : ''}`;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !pret) return;
    const points = [store, client, dernierPoint].filter(
      (p): p is google.maps.LatLngLiteral => p != null,
    );
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(14);
      return;
    }
    const bornes = new google.maps.LatLngBounds();
    points.forEach((p) => bornes.extend(p));
    map.fitBounds(bornes, 56);
    google.maps.event.addListenerOnce(map, 'idle', () => {
      const zoom = map.getZoom();
      if (zoom != null && zoom > 16) map.setZoom(16);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, pret, composition]);

  if (loadError) {
    return (
      <div className="flex h-full min-h-[260px] w-full items-center justify-center rounded-xl bg-gray-100 p-6 text-center">
        <p className="text-xs text-gray-500">
          Impossible de charger Google Maps — vérifiez la connexion réseau puis rouvrez le suivi.
        </p>
      </div>
    );
  }
  if (!isLoaded) {
    return <div className="h-full min-h-[260px] w-full animate-pulse rounded-xl bg-gray-100" />;
  }

  const icone = (couleur: string): google.maps.Symbol => ({
    path: google.maps.SymbolPath.CIRCLE,
    scale: 13,
    fillColor: couleur,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2.5,
  });
  const etiquette = (texte: string): google.maps.MarkerLabel => ({
    text: texte,
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '800',
  });

  const derniereHeure = heureLocale(position?.horodatage);

  return (
    <div className="relative h-full min-h-[260px] w-full overflow-hidden rounded-xl">
      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={store ?? CENTRE_ABIDJAN}
        zoom={13}
        onLoad={(map) => {
          mapRef.current = map;
          setPret(true);
        }}
        onUnmount={() => {
          mapRef.current = null;
          setPret(false);
        }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        }}
      >
        {store && (
          <MarkerF position={store} icon={icone('#101C2C')} label={etiquette('S')} title="Votre store" />
        )}
        {client && (
          <MarkerF
            position={client}
            icon={icone('#12915B')}
            label={etiquette('C')}
            title="Client — position exacte reçue"
          />
        )}
        {dernierPoint && (
          <MarkerF
            position={dernierPoint}
            icon={icone('#F4650C')}
            label={etiquette('T')}
            title={position?.livreurNom ? `Turboys — ${position.livreurNom}` : 'Turboys'}
            zIndex={10}
          />
        )}
        {store && client && (
          <PolylineF
            path={[store, client]}
            options={{ strokeColor: '#F4650C', strokeOpacity: 0.85, strokeWeight: 4, clickable: false }}
          />
        )}
      </GoogleMap>

      {/* État du signal — la perte de GPS n'interrompt jamais le suivi (EF-05.6). */}
      {active && position?.disponible && (
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold tracking-wide text-gray-800 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          POSITION EN DIRECT
          {position.livreurNom && (
            <span className="font-medium normal-case text-gray-500">· {position.livreurNom}</span>
          )}
        </div>
      )}
      {active && position && !position.disponible && (
        <div className="absolute inset-x-3 top-3 flex items-center gap-2 rounded-xl bg-amber-50/95 px-3 py-2 text-xs font-semibold text-amber-800 shadow-md ring-1 ring-amber-200">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            {derniereHeure
              ? `Signal interrompu — dernière position à ${derniereHeure}`
              : 'Signal interrompu — en attente de la position du Turboys'}
          </span>
        </div>
      )}
    </div>
  );
}
