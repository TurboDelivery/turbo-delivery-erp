import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * « Période facturée » — formatage d'affichage de la période d'une facture selon
 * le cycle de paiement du partenaire. Logique UNIQUE partagée par la vue
 * Finance‑Recouvrement (responsable financier) et le module Encours, pour que le
 * rendu soit strictement identique des deux côtés.
 *
 * Formats (spec) :
 *  - Mensuel       → « Juin 2026 »
 *  - Quinzaine     → « Quinzaine 1 – Juin 2026 »   (Q1 = 1–15, Q2 = 16–fin)
 *  - Hebdomadaire  → « 02 → 08 juin 2026 »  (à cheval sur 2 mois : « 30 juin → 06 juil. 2026 »)
 *  - Journalier    → « 03 juin 2026 »
 *
 * Mois en toutes lettres (mensuel/quinzaine, capitalisés), abrégés (date-fns fr :
 * « janv. », « juil. », « sept. »…) quand deux mois doivent tenir (hebdo à cheval).
 */
export type CyclePaiement = 'MENSUEL' | 'QUINZAINE' | 'HEBDOMADAIRE' | 'JOURNALIER';

/** Normalise les libellés/codes hétérogènes (Mensuel / MENSUEL / Quotidien / QUOTIDIEN…). */
export function normalizeCycle(raw?: string | null): CyclePaiement {
  const c = (raw ?? '').toUpperCase().trim();
  if (c.startsWith('MENS')) return 'MENSUEL';
  if (c.startsWith('QUINZ') || c.startsWith('BIMENS') || c.startsWith('BI-') || c.startsWith('BI ')) return 'QUINZAINE';
  if (c.startsWith('HEBDO')) return 'HEBDOMADAIRE';
  if (c.startsWith('QUOTID') || c.startsWith('JOURN')) return 'JOURNALIER';
  return 'MENSUEL';
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const moisFull = (d: Date) => format(d, 'MMMM', { locale: fr }); // « juin »
const moisAbbr = (d: Date) => format(d, 'MMM', { locale: fr }); // « juin », « juil. », « sept. »
const jj = (d: Date) => format(d, 'dd'); // « 02 »

/** Accepte une Date (Encours) ou une chaîne ISO "2026-06-01" (VM backend Recouvrement). */
function toDate(v: Date | string | null | undefined): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'string' && v.trim()) return parseISO(v);
  return new Date(NaN);
}

/** Formate la période facturée à partir des bornes réelles (Finance‑Recouvrement / Encours). */
export function formatPeriodeFacturee(
  cycleRaw: string | null | undefined,
  debutRaw: Date | string | null | undefined,
  finRaw: Date | string | null | undefined,
): string {
  const debut = toDate(debutRaw);
  const fin = toDate(finRaw);
  if (Number.isNaN(debut.getTime())) return '—';
  const cycle = normalizeCycle(cycleRaw);
  const annee = debut.getFullYear();

  if (cycle === 'MENSUEL') {
    return `${cap(moisFull(debut))} ${annee}`;
  }

  if (cycle === 'QUINZAINE') {
    const q = debut.getDate() <= 15 ? 1 : 2;
    return `Quinzaine ${q} – ${cap(moisFull(debut))} ${annee}`;
  }

  if (cycle === 'JOURNALIER') {
    return `${jj(debut)} ${moisFull(debut)} ${annee}`;
  }

  // HEBDOMADAIRE (lundi → dimanche)
  const finValide = fin && !Number.isNaN(fin.getTime()) ? fin : debut;
  const memeMois = debut.getMonth() === finValide.getMonth() && debut.getFullYear() === finValide.getFullYear();
  if (memeMois) {
    return `${jj(debut)} → ${jj(finValide)} ${moisFull(debut)} ${annee}`;
  }
  // Semaine à cheval sur 2 mois → mois abrégés pour tenir.
  if (debut.getFullYear() === finValide.getFullYear()) {
    return `${jj(debut)} ${moisAbbr(debut)} → ${jj(finValide)} ${moisAbbr(finValide)} ${finValide.getFullYear()}`;
  }
  return `${jj(debut)} ${moisAbbr(debut)} ${debut.getFullYear()} → ${jj(finValide)} ${moisAbbr(finValide)} ${finValide.getFullYear()}`;
}

/**
 * Variante Encours : le relevé est agrégé par mois et ne porte pas les dates
 * brutes. On reconstruit (debut, fin) depuis (année, mois, cycle, libellé) puis on
 * réutilise EXACTEMENT le même formateur que Finance‑Recouvrement.
 *
 * `libelle` du backend Encours : « Mois » | « Quinzaine 1/2 » | « Semaine N (dd–dd) » | « — ».
 */
export function formatPeriodeFactureeEncours(
  annee: number,
  mois: number, // 1-12
  cycleRaw: string | null | undefined,
  libelle: string | null | undefined,
): string {
  const lib = (libelle ?? '').trim();
  if (!annee || !mois) return '—';
  if (lib === '—') return '—'; // ligne « À venir » : pas de période concrète
  const m = mois - 1; // 0-based
  const cycle = normalizeCycle(cycleRaw);

  if (cycle === 'QUINZAINE') {
    const q2 = /2/.test(lib);
    const debut = q2 ? new Date(annee, m, 16) : new Date(annee, m, 1);
    const fin = q2 ? new Date(annee, m + 1, 0) : new Date(annee, m, 15);
    return formatPeriodeFacturee('QUINZAINE', debut, fin);
  }

  if (cycle === 'HEBDOMADAIRE') {
    // Extrait la plage « (dd–dd) » du libellé ; à défaut, on retombe sur le mois.
    const match = lib.match(/(\d{1,2})\s*[–\-—]\s*(\d{1,2})/);
    if (match) {
      const d1 = parseInt(match[1], 10);
      const d2 = parseInt(match[2], 10);
      const debut = new Date(annee, m, d1);
      let fin = new Date(annee, m, d2);
      if (fin < debut) fin = new Date(annee, m + 1, d2); // semaine à cheval → mois suivant
      return formatPeriodeFacturee('HEBDOMADAIRE', debut, fin);
    }
    return formatPeriodeFacturee('MENSUEL', new Date(annee, m, 1), new Date(annee, m + 1, 0));
  }

  // MENSUEL (et défaut)
  return formatPeriodeFacturee('MENSUEL', new Date(annee, m, 1), new Date(annee, m + 1, 0));
}
