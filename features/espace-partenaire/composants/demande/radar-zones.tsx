'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { formaterFcfa, type Zone } from './types';

type Pastille = { zone: Zone; x: number; y: number; w: number; h: number };

type Disposition = {
  cx: number;
  cy: number;
  rayonMax: number;
  anneaux: { tarif: number; rayon: number }[];
  pastilles: Pastille[];
};

/**
 * RADAR des zones (EF-02) : le store au centre, un anneau par palier de tarif
 * (croissant vers l'extérieur), les zones posées sur leur anneau selon leur
 * direction géographique réelle depuis le store. Tout est mesuré au pixel
 * (ResizeObserver) pour garantir des anneaux circulaires et des cibles ≥ 48 px.
 */
export default function RadarZones({
  zones,
  storeNom,
  storeLatitude,
  storeLongitude,
  recherche,
  onChoisir,
}: {
  zones: Zone[];
  storeNom: string | null;
  storeLatitude: number | null;
  storeLongitude: number | null;
  recherche: string;
  onChoisir: (zone: Zone) => void;
}) {
  const conteneurRef = useRef<HTMLDivElement | null>(null);
  const [taille, setTaille] = useState({ largeur: 0, hauteur: 0 });

  useEffect(() => {
    const element = conteneurRef.current;
    if (!element) return;
    const mesurer = () =>
      setTaille({ largeur: element.offsetWidth, hauteur: element.offsetHeight });
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  const disposition = useMemo<Disposition | null>(() => {
    const { largeur: w, hauteur: h } = taille;
    if (w < 200 || h < 200 || zones.length === 0) return null;

    const cx = w / 2;
    const cy = h / 2 + 8;
    const rayonMax = Math.min(w, h) / 2 - 58;
    const paliers = Array.from(new Set(zones.map((z) => z.tarifFcfa))).sort((a, b) => a - b);
    const rayonDuPalier = (indice: number) =>
      paliers.length > 1
        ? rayonMax * (0.42 + 0.58 * (indice / (paliers.length - 1)))
        : rayonMax * 0.72;

    const anneaux = paliers.map((tarif, i) => ({ tarif, rayon: rayonDuPalier(i) }));

    const geoStore = storeLatitude != null && storeLongitude != null;
    const noeuds: Pastille[] = zones.map((zone, i) => {
      const rayon = rayonDuPalier(paliers.indexOf(zone.tarifFcfa));
      // Cap géographique réel (0 = nord) — repli en éventail si coordonnées absentes.
      const angle =
        geoStore && zone.latitude != null && zone.longitude != null
          ? Math.atan2(zone.longitude - (storeLongitude as number), zone.latitude - (storeLatitude as number))
          : (i * 2 * Math.PI) / zones.length;
      const largeurEstimee = Math.min(180, Math.max(96, zone.nom.length * 7 + 44));
      return {
        zone,
        x: cx + rayon * Math.sin(angle),
        y: cy - rayon * Math.cos(angle),
        w: largeurEstimee + 10,
        h: 58,
      };
    });

    // Résolution des chevauchements : on écarte les pastilles par petites poussées.
    for (let iteration = 0; iteration < 50; iteration++) {
      let bouge = false;
      for (let a = 0; a < noeuds.length; a++) {
        for (let b = a + 1; b < noeuds.length; b++) {
          const A = noeuds[a];
          const B = noeuds[b];
          const ox = (A.w + B.w) / 2 - Math.abs(A.x - B.x);
          const oy = (A.h + B.h) / 2 - Math.abs(A.y - B.y);
          if (ox > 0 && oy > 0) {
            bouge = true;
            if (ox < oy) {
              const pas = (ox / 2 + 1) * (A.x < B.x ? -1 : 1);
              A.x += pas;
              B.x -= pas;
            } else {
              const pas = (oy / 2 + 1) * (A.y < B.y ? -1 : 1);
              A.y += pas;
              B.y -= pas;
            }
          }
        }
      }
      noeuds.forEach((n) => {
        n.x = Math.max(n.w / 2 + 6, Math.min(w - n.w / 2 - 6, n.x));
        n.y = Math.max(36, Math.min(h - 32, n.y));
      });
      if (!bouge) break;
    }

    return { cx, cy, rayonMax, anneaux, pastilles: noeuds };
  }, [taille, zones, storeLatitude, storeLongitude]);

  const requete = recherche.trim().toLowerCase();
  const correspond = (zone: Zone) =>
    !requete || `${zone.nom} ${zone.zone}`.toLowerCase().includes(requete);

  const initiales =
    (storeNom ?? 'Store')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot[0])
      .join('')
      .toUpperCase() || 'ST';

  const rayonBalayage = disposition ? disposition.rayonMax + 22 : 0;

  return (
    <div
      ref={conteneurRef}
      className="relative h-[440px] w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <div className="absolute left-3 top-3 z-30 flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
        VOTRE STORE AU CENTRE — CHAQUE ANNEAU EST UN PALIER DE TARIF
      </div>

      {disposition && (
        <>
          {/* Balayage sonar décoratif */}
          <div
            className="pointer-events-none absolute animate-[spin_9s_linear_infinite] rounded-full"
            aria-hidden
            style={{
              left: disposition.cx - rayonBalayage,
              top: disposition.cy - rayonBalayage,
              width: rayonBalayage * 2,
              height: rayonBalayage * 2,
              background: 'conic-gradient(from 0deg, hsl(var(--primary) / 0.09), transparent 80deg)',
            }}
          />

          {/* Anneaux de tarif */}
          {disposition.anneaux.map((anneau) => (
            <div
              key={anneau.tarif}
              className="pointer-events-none absolute rounded-full border border-dashed border-gray-200"
              aria-hidden
              style={{
                left: disposition.cx - anneau.rayon,
                top: disposition.cy - anneau.rayon,
                width: anneau.rayon * 2,
                height: anneau.rayon * 2,
              }}
            />
          ))}
          {disposition.anneaux.map((anneau) => (
            <span
              key={`etiquette-${anneau.tarif}`}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-1.5 text-[10px] font-bold text-gray-400"
              style={{
                left: disposition.cx - anneau.rayon * 0.707,
                top: disposition.cy - anneau.rayon * 0.707,
              }}
            >
              {formaterFcfa(anneau.tarif)} F
            </span>
          ))}

          {/* Le store, au centre */}
          <div
            className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: disposition.cx, top: disposition.cy }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-xs font-extrabold text-white shadow-md ring-4 ring-gray-900/10">
              {initiales}
            </span>
            <span className="mt-1 max-w-[150px] truncate rounded bg-white/80 px-1 text-[11px] font-bold text-gray-800">
              {storeNom ?? 'Votre store'}
            </span>
            <span className="text-[10px] text-gray-400">Votre store</span>
          </div>

          {/* Pastilles de zones */}
          {disposition.pastilles.map(({ zone, x, y }) => {
            const visible = correspond(zone);
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onChoisir(zone)}
                className={`absolute z-20 flex min-h-[48px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border bg-white px-3 py-1 shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-95 ${
                  visible ? 'border-gray-200' : 'pointer-events-none opacity-20'
                }`}
                style={{ left: x, top: y }}
              >
                <span className="whitespace-nowrap text-xs font-semibold text-gray-800">{zone.nom}</span>
                <span className="text-[11px] font-bold text-primary">{formaterFcfa(zone.tarifFcfa)} F</span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
