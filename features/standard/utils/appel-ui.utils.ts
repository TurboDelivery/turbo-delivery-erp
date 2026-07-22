/** Helpers d'affichage partagés par les écrans d'appel (entrant, en cours, manqués). */

/** Initiales d'un nom pour l'avatar (2 lettres max). */
export function initialesDe(nom?: string | null): string {
  const propre = (nom ?? '').trim();
  if (!propre) return '?';
  const parts = propre.split(/\s+/).filter(Boolean);
  const lettres = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return lettres.join('') || '?';
}

/** Durée en secondes → `mm:ss` (ou `h:mm:ss` au-delà de l'heure). */
export function formaterDuree(secondes: number): string {
  const s = Math.max(0, Math.floor(secondes));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Horodatage ISO → « il y a 5 min », « hier 14:03 », « 12/07 09:41 ». */
export function depuisQuand(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const heure = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const aujourdhui = new Date();
  const memeJour = d.toDateString() === aujourdhui.toDateString();
  if (memeJour) return heure;

  const hier = new Date(aujourdhui);
  hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === hier.toDateString()) return `hier ${heure}`;

  const jour = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${jour} ${heure}`;
}
