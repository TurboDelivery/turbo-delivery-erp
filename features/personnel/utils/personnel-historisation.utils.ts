import { EtatDeclaration } from '../types/personnel-historisation.types';

/** Formatage, libellés et export CSV du volet historisation. Aucun appel réseau ici. */

export function formaterMontant(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined) return '—';
  return `${Math.round(valeur).toLocaleString('fr-FR')} F`;
}

export function formaterMontantSigne(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined) return '—';
  const signe = valeur > 0 ? '+' : valeur < 0 ? '−' : '';
  return `${signe}${Math.abs(Math.round(valeur)).toLocaleString('fr-FR')} F`;
}

export function formaterDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formaterDateHeure(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initiales(nom: string | null | undefined): string {
  if (!nom) return '—';
  return nom
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map((mot) => mot[0])
    .join('')
    .replace(/[^A-Za-zÀ-ÿ]/g, '')
    .slice(0, 2)
    .toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Typologie contractuelle
// ─────────────────────────────────────────────────────────────────────────────

export type CouleurChip = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

const LIBELLE_TYPE: Record<string, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  PRESTATAIRE: 'Prestataire',
  PRESTATION: 'Prestataire',
  JOURNALIER: 'Journalier',
  INDEPENDANT: 'Indépendant',
  'INDÉPENDANT': 'Indépendant',
  SUPERVISEUR_LIVREUR: 'Superviseur livreur',
  STAGIAIRE: 'Stagiaire',
  INTERIMAIRE: 'Intérimaire',
};

export function libelleTypeCollaborateur(type: string | null | undefined): string {
  if (!type || !type.trim()) return 'Non renseigné';
  const cle = type.trim().toUpperCase();
  return LIBELLE_TYPE[cle] ?? type.trim();
}

/** CDI bleu, CDD ambre, Prestataire violet, le reste neutre (maquette v1.1). */
export function couleurTypeCollaborateur(type: string | null | undefined): CouleurChip {
  const cle = (type ?? '').trim().toUpperCase();
  if (cle === 'CDI') return 'primary';
  if (cle === 'CDD') return 'warning';
  if (cle === 'PRESTATAIRE' || cle === 'PRESTATION') return 'secondary';
  return 'default';
}

// ─────────────────────────────────────────────────────────────────────────────
// Déclaration & gravité
// ─────────────────────────────────────────────────────────────────────────────

export const LIBELLE_DECLARATION: Record<EtatDeclaration, string> = {
  DECLARE: 'Déclaré',
  NON_DECLARE: 'Non déclaré',
  INCONNU: 'À confirmer',
  NON_APPLICABLE: 'n/a',
};

export const COULEUR_DECLARATION: Record<EtatDeclaration, CouleurChip> = {
  DECLARE: 'success',
  NON_DECLARE: 'danger',
  INCONNU: 'warning',
  NON_APPLICABLE: 'default',
};

export function etatDeclarationDepuisContrat(declare: boolean | null | undefined, type?: string | null): EtatDeclaration {
  const cle = (type ?? '').trim().toUpperCase();
  if (cle && cle !== 'CDI' && cle !== 'CDD') return 'NON_APPLICABLE';
  if (declare === true) return 'DECLARE';
  if (declare === false) return 'NON_DECLARE';
  return 'INCONNU';
}

export const LIBELLE_GRAVITE: Record<string, string> = {
  CRITIQUE: 'Critique',
  A_TRAITER: 'À traiter',
  A_VERIFIER: 'À vérifier',
};

export const COULEUR_GRAVITE: Record<string, CouleurChip> = {
  CRITIQUE: 'danger',
  A_TRAITER: 'warning',
  A_VERIFIER: 'primary',
};

export const RANG_GRAVITE: Record<string, number> = {
  CRITIQUE: 0,
  A_TRAITER: 1,
  A_VERIFIER: 2,
};

// ─────────────────────────────────────────────────────────────────────────────
// Parcours
// ─────────────────────────────────────────────────────────────────────────────

export type NatureEvenement = 'ENTREE' | 'SORTIE' | 'BASCULE' | 'AUTRE';

/** Vert pour une entrée, rouge pour une sortie, bleu pour un basculement. */
export function natureEvenement(type: string | null | undefined): NatureEvenement {
  const cle = (type ?? '').trim().toUpperCase();
  if (cle === 'ENROLEMENT' || cle === 'REINTEGRATION' || cle === 'ACTIVATION' || cle === 'REPRISE_EXISTANT') {
    return 'ENTREE';
  }
  if (cle === 'SORTIE' || cle === 'SUSPENSION') return 'SORTIE';
  if (cle === 'BASCULEMENT' || cle === 'CHANGEMENT_TYPE') return 'BASCULE';
  return 'AUTRE';
}

export const COULEUR_PASTILLE_EVENEMENT: Record<NatureEvenement, string> = {
  ENTREE: 'bg-success',
  SORTIE: 'bg-danger',
  BASCULE: 'bg-primary',
  AUTRE: 'bg-default-300',
};

// ─────────────────────────────────────────────────────────────────────────────
// Export CSV
// ─────────────────────────────────────────────────────────────────────────────

function echapper(valeur: unknown): string {
  const texte = valeur === null || valeur === undefined ? '' : String(valeur);
  return /[";\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

/**
 * Télécharge un CSV point-virgule avec BOM UTF-8 (Excel FR lit les accents correctement).
 * L'onglet appelant fournit ses propres lignes déjà filtrées : on exporte ce qui est à l'écran.
 */
export function telechargerCsv(nom: string, entetes: string[], lignes: (string | number | null)[][]): void {
  const contenu = [entetes.map(echapper).join(';'), ...lignes.map((l) => l.map(echapper).join(';'))].join('\n');
  const blob = new Blob([`﻿${contenu}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = `${nom}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}
