'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useTheme } from 'next-themes';
import { AlertTriangle } from 'lucide-react';

import { darkMapStyle } from '@/data';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { LivreurTrafic, QuartierZone, StatutTrafic } from '@/types/models';
import { createUrlFile } from '@/utils/createUrlFile';
import { tempsEcoule } from '@/features/trafic/utils/statut-trafic';

/**
 * Carte TRAFIC — Google Maps.
 *
 * Remplaçant strict de {@link MapLeaflet} (Leaflet + tuiles OpenStreetMap) :
 * même interface de props, mêmes pins (photo + couleur par statut), même
 * contenu au clic, mêmes cercles de quartiers (M4/RG-33), même recentrage.
 *
 * Les marqueurs sont gérés en impératif (pas de composant React par pin) :
 * la carte reçoit des positions rafraîchies en continu, on réutilise donc les
 * overlays existants et on ne met à jour que ce qui a réellement bougé.
 */

const AVATAR_FALLBACK = '/assets/images/avatar.png';

// V54 (2026-05-29) — La couleur du pin est dérivée du helper centralisé
// pour rester cohérente avec les badges UI : INDEPENDANT bleu, JOURNALIER
// rouge, SUPERVISEUR_LIVREUR violet. Avant cette fix, la map ignorait
// silencieusement les superviseurs-livreurs (PIN_DEFAULT_COLOR gris).
const PIN_DEFAULT_COLOR = '#6b7280'; // fallback si type non assigné côté backend

// Couleur/libellé du pin par statut de service (prioritaire sur le type).
// Refonte 2026-08-01 : le statut vient de la file d'attente du jour. « Hors
// rayon » a quitté cette table — c'est un drapeau, signalé dans la liste
// latérale, et non une couleur de pin qui masquerait le vrai statut.
const STATUS_COLOR: Record<StatutTrafic, string> = {
  DISPONIBLE: '#1AA05A',
  EN_COURSE: '#ea580c',
  EN_PAUSE: '#6b7280',
  HORS_SERVICE: '#9ca3af',
};
const STATUS_LABEL: Record<StatutTrafic, string> = {
  DISPONIBLE: 'Disponible',
  EN_COURSE: 'En course',
  EN_PAUSE: 'En pause',
  HORS_SERVICE: 'Hors service',
};

// Abidjan — centre et zoom par défaut avant le premier cadrage sur les livreurs.
// Cadrage repris de MapLeaflet (l'ecran remplace), et NON de MapContainer : sans livreur
// positionne, fitBounds ne s'execute pas et l'operateur doit retrouver exactement la vue
// qu'il connait. L'ecart entre les deux valeurs etait d'environ 7 km vers l'ouest.
// Rappel d'échec d'authentification appelé par Google lui-même (clé invalide, expirée,
// restreinte à un autre référent, quota dépassé). Il n'est pas déclaré dans @types/google.maps
// car il vit sur window, pas dans l'espace de noms google.maps.
declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 5.3984153, lng: -3.9565058 };
const DEFAULT_ZOOM = 13;
const FOCUS_ZOOM = 17; // identique au flyTo de MapLeaflet
const MAX_ZOOM = 19; // parité avec le maxZoom de la couche de tuiles OSM

const GOOGLE_MAPS_SCRIPT_ID = 'google-map-script';

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

/** Couleur du pin — logique reprise telle quelle de MapLeaflet. */
function resolvePinColor(item: LivreurTrafic): string {
  return item.statut
    ? STATUS_COLOR[item.statut]
    : item.typeLivreur
    ? getTurboyTypeDisplay(item.typeLivreur).hexColor
    : PIN_DEFAULT_COLOR;
}

function resolveAvatarSrc(item: LivreurTrafic): string {
  return item.avatarUrl ? createUrlFile(item.avatarUrl, 'backend') : AVATAR_FALLBACK;
}

/** Contenu de l'InfoWindow — mêmes informations et même mise en forme que le popup Leaflet. */
function buildInfoContent(item: LivreurTrafic): string {
  const safeName = escapeHtml(item.nomComplet ?? '');
  const safePhone = escapeHtml(item.telephone ?? '');
  const statutLabel = item.statut ? STATUS_LABEL[item.statut] : item.course ? 'En livraison' : 'Disponible';

  return (
    `<div style="font:12px/1.4 'Helvetica Neue', Arial, Helvetica, sans-serif; color:#111827;">` +
    `<b>${safeName}</b>` +
    `<br><b>Statut</b>: ${statutLabel}` +
    (item.quartier ? `<br><b>Quartier</b>: ${escapeHtml(item.quartier)}` : '') +
    `<br><b>Téléphone</b>: ${safePhone}` +
    // Honnêteté de la carte : le marqueur est à la DERNIÈRE position connue, qui peut
    // dater. Un opérateur qui arbitre sur « il est chez lui, à 10 min » doit savoir si
    // ce point a 2 minutes ou 14 heures.
    `<br><b>Position</b>: ${escapeHtml(tempsEcoule(item.dernierPointAt) ?? 'inconnue')}` +
    (item.positionAncienne
      ? `<br><span style="color:#B45309">Dernière position connue — peut ne plus être à jour</span>`
      : '') +
    `</div>`
  );
}

/* ------------------------------------------------------------------ */
/* Overlay HTML générique (équivalent du L.divIcon / L.tooltip)        */
/* ------------------------------------------------------------------ */

interface HtmlOverlay extends google.maps.OverlayView {
  readonly container: HTMLDivElement;
  setLatLng(next: google.maps.LatLngLiteral): void;
}

type HtmlOverlayCtor = new (
  position: google.maps.LatLngLiteral,
  container: HTMLDivElement,
  paneName: keyof google.maps.MapPanes,
) => HtmlOverlay;

let htmlOverlayCtor: HtmlOverlayCtor | null = null;

/**
 * `google.maps.OverlayView` n'existe qu'une fois l'API chargée : la classe est
 * donc définie paresseusement (et mémorisée) au premier appel.
 *
 * Pourquoi un overlay HTML plutôt qu'un `google.maps.Marker` ? Le pin porte la
 * photo du livreur : avec un Marker classique il faudrait recomposer l'icône au
 * canvas (CORS obligatoire sur les photos, aucun repli possible si l'image ne
 * charge pas). L'overlay rejoue exactement le HTML du divIcon Leaflet, avec le
 * vrai `<img>` et donc le repli avatar natif.
 */
function getHtmlOverlayCtor(): HtmlOverlayCtor {
  if (htmlOverlayCtor) return htmlOverlayCtor;

  class HtmlOverlayImpl extends google.maps.OverlayView {
    private latLng: google.maps.LatLngLiteral;
    readonly container: HTMLDivElement;
    private readonly paneName: keyof google.maps.MapPanes;

    constructor(position: google.maps.LatLngLiteral, container: HTMLDivElement, paneName: keyof google.maps.MapPanes) {
      super();
      this.latLng = position;
      this.container = container;
      this.paneName = paneName;
    }

    onAdd(): void {
      const panes = this.getPanes();
      if (panes) panes[this.paneName].appendChild(this.container);
    }

    draw(): void {
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(new google.maps.LatLng(this.latLng.lat, this.latLng.lng));
      if (!point) return;
      this.container.style.left = `${point.x}px`;
      this.container.style.top = `${point.y}px`;
    }

    onRemove(): void {
      if (this.container.parentNode) this.container.parentNode.removeChild(this.container);
    }

    setLatLng(next: google.maps.LatLngLiteral): void {
      this.latLng = next;
      this.draw();
    }
  }

  htmlOverlayCtor = HtmlOverlayImpl as unknown as HtmlOverlayCtor;

  return htmlOverlayCtor;
}

/** Conteneur du pin : ancré en bas au centre, comme `iconAnchor: [22, 56]`. */
function createPinContainer(html: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'trafic-pin-marker';
  el.style.position = 'absolute';
  el.style.width = '44px';
  el.style.height = '56px';
  el.style.transform = 'translate(-50%, -100%)';
  el.style.cursor = 'pointer';
  el.style.userSelect = 'none';
  el.innerHTML = html;

  return el;
}

/** Étiquette de quartier au survol — rendu calqué sur le tooltip Leaflet (`direction: 'center'`). */
function createTooltipContainer(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.transform = 'translate(-50%, -50%)';
  el.style.padding = '2px 6px';
  el.style.background = '#ffffff';
  el.style.borderRadius = '3px';
  el.style.color = '#222222';
  el.style.font = "12px/1.4 'Helvetica Neue', Arial, Helvetica, sans-serif";
  el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
  el.style.whiteSpace = 'nowrap';
  el.style.pointerEvents = 'none';

  return el;
}

/** Repli avatar si la photo du livreur ne charge pas (404, backend fichiers indisponible…). */
function wireAvatarFallback(img: HTMLImageElement): void {
  img.addEventListener('error', () => {
    if (img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    img.src = AVATAR_FALLBACK;
  });
}

/* ------------------------------------------------------------------ */
/* Composant                                                           */
/* ------------------------------------------------------------------ */

interface MapTraficProps {
  positions: LivreurTrafic[];
  focusPosition?: [number, number, number] | null;
  quartiers?: QuartierZone[];
}

interface MarkerEntry {
  overlay: HtmlOverlay;
  img: HTMLImageElement | null;
  pinPath: SVGPathElement | null;
  lat: number;
  lng: number;
  color: string;
  /** Mémorisé pour que l'opacité soit RAFRAÎCHIE quand la position redevient récente. */
  positionAncienne: boolean;
  avatarSrc: string;
  data: LivreurTrafic;
}

interface CircleEntry {
  circle: google.maps.Circle;
  libelle: string;
  center: google.maps.LatLngLiteral;
  listeners: google.maps.MapsEventListener[];
}

function MapUnavailable({ title, details }: { title: string; details: string }) {
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-default-100 p-6">
      <div className="max-w-md flex flex-col items-center text-center gap-2">
        <AlertTriangle className="w-8 h-8 text-warning" />
        <p className="text-sm font-semibold text-default-800">{title}</p>
        <p className="text-xs text-default-600 leading-relaxed">{details}</p>
      </div>
    </div>
  );
}

function MapTraficInner({ positions, focusPosition, quartiers, apiKey }: MapTraficProps & { apiKey: string }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const circlesRef = useRef<Map<string, CircleEntry>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const openInfoIdRef = useRef<string | null>(null);
  const tooltipRef = useRef<HtmlOverlay | null>(null);
  const hasFittedRef = useRef<boolean>(false);
  const fitListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { resolvedTheme, theme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === 'dark';

  // Un seul chargement du script Google pour toute l'application (id stable).
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: apiKey,
  });

  // Échec d'AUTHENTIFICATION Google — le cas le plus probable en exploitation, et celui que
  // `loadError` ne voit PAS : Google sert toujours le script en 200, même avec une clé
  // invalide, expirée, restreinte à un autre référent ou hors quota. `loadError` n'est
  // alimenté que par une erreur réseau sur la balise script. Sans ce rappel, l'opérateur
  // n'obtient qu'une carte grisée « For development purposes only » et une alerte Google en
  // anglais, sans savoir quoi faire.
  const [echecAuth, setEchecAuth] = useState(false);
  useEffect(() => {
    const precedent = window.gm_authFailure;
    window.gm_authFailure = () => {
      setEchecAuth(true);
      if (typeof precedent === 'function') precedent();
    };
    return () => {
      window.gm_authFailure = precedent;
    };
  }, []);

  /* --- création / destruction de la carte ------------------------- */
  useEffect(() => {
    if (!isLoaded || !mapContainer.current || mapRef.current) return;

    const map = new google.maps.Map(mapContainer.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      maxZoom: MAX_ZOOM,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false, // pas de fiche POI Google : la carte est un outil de supervision
      gestureHandling: 'greedy', // molette = zoom direct, comme scrollWheelZoom de Leaflet
      styles: isDark ? (darkMapStyle as google.maps.MapTypeStyle[]) : [],
    });

    const infoWindow = new google.maps.InfoWindow({ pixelOffset: new google.maps.Size(0, -56) });
    const closeListener = infoWindow.addListener('closeclick', () => {
      openInfoIdRef.current = null;
    });

    const TooltipOverlay = getHtmlOverlayCtor();

    mapRef.current = map;
    infoWindowRef.current = infoWindow;
    tooltipRef.current = new TooltipOverlay(DEFAULT_CENTER, createTooltipContainer(), 'floatPane');
    setMapReady(true);

    const markers = markersRef.current;
    const circles = circlesRef.current;
    const tooltip = tooltipRef.current;

    return () => {
      // Démontage : on relâche tout ce qu'on a créé (overlays, cercles, écouteurs).
      // Cet écran de supervision reste ouvert toute la journée — pas de fuite tolérée.
      markers.forEach((entry) => entry.overlay.setMap(null));
      markers.clear();

      circles.forEach((entry) => {
        entry.listeners.forEach((listener) => listener.remove());
        entry.circle.setMap(null);
      });
      circles.clear();

      fitListenerRef.current?.remove();
      fitListenerRef.current = null;

      tooltip.setMap(null);
      infoWindow.close();
      closeListener.remove();

      mapRef.current = null;
      infoWindowRef.current = null;
      tooltipRef.current = null;
      openInfoIdRef.current = null;
      hasFittedRef.current = false;
      setMapReady(false);
    };
    // `isDark` est appliqué par un effet dédié : ne pas recréer la carte au changement de thème.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  /* --- mode sombre ------------------------------------------------ */
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.setOptions({ styles: isDark ? (darkMapStyle as google.maps.MapTypeStyle[]) : [] });
  }, [isDark, mapReady]);

  /* --- marqueurs livreurs ----------------------------------------- */
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !infoWindow) return;

    const PinOverlay = getHtmlOverlayCtor();
    const markers = markersRef.current;

    const validPositions = (positions || []).filter((p) => p.position.latitude !== 0 && p.position.longitude !== 0);
    const seen = new Set<string>();

    validPositions.forEach((item) => {
      const id = item.livreurId;
      seen.add(id);

      const lat = item.position.latitude;
      const lng = item.position.longitude;
      const color = resolvePinColor(item);
      const avatarSrc = resolveAvatarSrc(item);
      const existing = markers.get(id);

      if (!existing) {
        const container = createPinContainer(buildPinHtml(color, escapeHtml(avatarSrc), escapeHtml(item.nomComplet ?? '')));
        const img = container.querySelector('img');
        if (img) wireAvatarFallback(img);

        // Un point périmé se voit : le pin est estompé. Sans ce signal, la carte présente
        // avec la même assurance une position d'il y a 2 minutes et une d'il y a 14 heures.
        container.style.opacity = item.positionAncienne ? '0.5' : '1';

        const overlay = new PinOverlay({ lat, lng }, container, 'overlayMouseTarget');
        overlay.setMap(map);

        const entry: MarkerEntry = {
          overlay,
          img,
          pinPath: container.querySelector('path'),
          lat,
          lng,
          color,
          positionAncienne: Boolean(item.positionAncienne),
          avatarSrc,
          data: item,
        };

        // Le handler lit `entry.data` : il reste valable après chaque rafraîchissement,
        // inutile de le ré-attacher (donc rien à nettoyer hors démontage de l'overlay).
        container.addEventListener('click', (event) => {
          event.stopPropagation();
          openInfoIdRef.current = entry.data.livreurId;
          infoWindow.setContent(buildInfoContent(entry.data));
          infoWindow.setPosition({ lat: entry.lat, lng: entry.lng });
          infoWindow.open({ map });
        });

        markers.set(id, entry);

        return;
      }

      existing.data = item;

      if (existing.lat !== lat || existing.lng !== lng) {
        existing.lat = lat;
        existing.lng = lng;
        existing.overlay.setLatLng({ lat, lng });
        if (openInfoIdRef.current === id) infoWindow.setPosition({ lat, lng });
      }

      if (existing.color !== color) {
        existing.color = color;
        existing.pinPath?.setAttribute('fill', color);
      }

      const perimee = Boolean(item.positionAncienne);
      if (existing.positionAncienne !== perimee) {
        existing.positionAncienne = perimee;
        existing.overlay.container.style.opacity = perimee ? '0.5' : '1';
      }

      if (existing.avatarSrc !== avatarSrc) {
        existing.avatarSrc = avatarSrc;
        if (existing.img) {
          existing.img.dataset.fallbackApplied = '0';
          existing.img.src = avatarSrc;
        }
      }

      if (openInfoIdRef.current === id) infoWindow.setContent(buildInfoContent(item));
    });

    markers.forEach((entry, id) => {
      if (seen.has(id)) return;
      entry.overlay.setMap(null);
      markers.delete(id);
      if (openInfoIdRef.current === id) {
        infoWindow.close();
        openInfoIdRef.current = null;
      }
    });

    if (!hasFittedRef.current && validPositions.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      validPositions.forEach((item) => bounds.extend({ lat: item.position.latitude, lng: item.position.longitude }));
      map.fitBounds(bounds, 50);
      hasFittedRef.current = true;

      // Sur un seul livreur, `fitBounds` d'une emprise ponctuelle colle au zoom max :
      // on redescend au zoom de focus, plus lisible.
      if (validPositions.length === 1) {
        fitListenerRef.current = google.maps.event.addListenerOnce(map, 'idle', () => {
          fitListenerRef.current = null;
          const zoom = map.getZoom();
          if (zoom && zoom > FOCUS_ZOOM) map.setZoom(FOCUS_ZOOM);
        });
      }
    }
  }, [positions, mapReady]);

  /* --- cercles de quartiers (M4/RG-33) ---------------------------- */
  const quartiersActifs = useMemo(() => (quartiers || []).filter((q) => q.actif), [quartiers]);
  const quartiersKey = useMemo(
    () => JSON.stringify(quartiersActifs.map((q) => [q.id, q.libelle, q.centreLat, q.centreLon, q.rayonM, q.couleur ?? ''])),
    [quartiersActifs],
  );
  // Identité stable : les cercles ne sont redessinés que si la liste change réellement.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quartiersStables = useMemo(() => quartiersActifs, [quartiersKey]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const tooltip = tooltipRef.current;
    if (!map || !tooltip) return;

    const circles = circlesRef.current;
    const seen = new Set<string>();

    quartiersStables.forEach((q) => {
      seen.add(q.id);
      const couleur = q.couleur || '#2563eb';
      const center: google.maps.LatLngLiteral = { lat: q.centreLat, lng: q.centreLon };
      const options: google.maps.CircleOptions = {
        center,
        radius: q.rayonM,
        strokeColor: couleur,
        strokeWeight: 1,
        strokeOpacity: 1,
        fillColor: couleur,
        fillOpacity: 0.06,
        clickable: true,
        zIndex: 1,
      };

      const existing = circles.get(q.id);

      if (existing) {
        existing.libelle = q.libelle;
        existing.center = center;
        existing.circle.setOptions(options);

        return;
      }

      const circle = new google.maps.Circle({ ...options, map });
      const entry: CircleEntry = { circle, libelle: q.libelle, center, listeners: [] };

      // Étiquette au survol : équivalent du `bindTooltip(libelle, { direction: 'center' })` Leaflet.
      // Le handler lit `entry` (mutable) : un quartier déplacé/renommé reste correct.
      entry.listeners.push(
        circle.addListener('mouseover', () => {
          tooltip.container.textContent = entry.libelle;
          tooltip.setLatLng(entry.center);
          tooltip.setMap(map);
        }),
        circle.addListener('mouseout', () => {
          tooltip.setMap(null);
        }),
      );

      circles.set(q.id, entry);
    });

    circles.forEach((entry, id) => {
      if (seen.has(id)) return;
      entry.listeners.forEach((listener) => listener.remove());
      entry.circle.setMap(null);
      circles.delete(id);
    });
  }, [quartiersStables, mapReady]);

  /* --- recentrage sur un livreur ---------------------------------- */
  useEffect(() => {
    if (!mapReady || !focusPosition) return;
    const map = mapRef.current;
    if (!map) return;

    const [lat, lon] = focusPosition;
    map.panTo({ lat, lng: lon });
    map.setZoom(FOCUS_ZOOM);
  }, [focusPosition, mapReady]);

  return (
    // Pas de hauteur minimale ici : c'est le conteneur appelant qui sait ce qui reste de la
    // fenêtre. Un plancher de 400 px imposé par la carte débordait sur les écrans courts et
    // faisait défiler la page — le défaut même que l'on corrige.
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="w-full h-full" />

      {(loadError || echecAuth) && (
        <div className="absolute inset-0">
          <MapUnavailable
            title="Carte indisponible — Google Maps n'a pas pu être chargé"
            details="Vérifiez la connexion internet du poste puis rechargez la page (F5). Si le message persiste, prévenez l'équipe technique : la clé Google Maps est peut-être expirée, restreinte ou son quota dépassé. En attendant, la liste des livreurs reste consultable via « Voir les livreurs »."
          />
        </div>
      )}

      {!isLoaded && !loadError && !echecAuth && (
        <div className="absolute inset-0 flex items-center justify-center bg-default-100">
          <p className="text-sm text-default-600 animate-pulse">Chargement de la carte…</p>
        </div>
      )}
    </div>
  );
}

export default function MapTrafic(props: MapTraficProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <MapUnavailable
        title="Carte indisponible — clé Google Maps non configurée"
        details="La variable NEXT_PUBLIC_GOOGLE_MAPS_API_KEY est absente de ce déploiement : signalez-le à l'équipe technique. La liste des livreurs et leurs statuts restent consultables via le bouton « Voir les livreurs »."
      />
    );
  }

  return <MapTraficInner {...props} apiKey={apiKey} />;
}
