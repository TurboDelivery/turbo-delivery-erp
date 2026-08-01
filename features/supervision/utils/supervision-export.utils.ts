// Export CSV de l'onglet actif de Supervision & Audit.
//
// Convention maison (identique au reporting M6) : séparateur `;`, BOM UTF-8 en
// tête pour qu'Excel FR ouvre le fichier sans écran d'import, champs encadrés de
// guillemets pour survivre aux `;` et aux sauts de ligne, nom de fichier daté.
//
// ⚠ Un export est lui-même une action tracée côté backend (règle de gestion 5 :
// « qui a exporté quoi, avec quels filtres »). La PREMIÈRE relecture de chaque export
// porte donc `export=true`, qui déclenche la trace EXPORT côté serveur ; les pages
// suivantes ne la portent pas, pour ne pas écrire une trace par page.
//
// ⚠ Le plafond de pages ci-dessous évite qu'un export accidentel de tout l'historique
// ne noie le journal — mais il ne COUPE JAMAIS EN SILENCE : au-delà, l'utilisateur est
// averti (toast) et le fichier lui-même porte la mention en première ligne.

import { supervisionAPI } from '../apis/supervision.api';
import {
  IActionsFiltre,
  IAdoptionCompte,
  IAuditAction,
  IConnexion,
  IConnexionsFiltre,
  ISessionErp,
  OngletSupervision,
  STATUT_ACTIVITE_LABELS,
  TYPE_ACTION_LABELS,
  TYPE_EVENEMENT_LABELS,
} from '../types';
import {
  detailTexte,
  dureeSessionVivante,
  formatDuree,
  formatInstant,
  libelleObjet,
  libellePage,
  utilisateurConnexion,
} from './supervision-format.utils';

/** Taille de page des relectures d'export (plafond backend : 200). */
const TAILLE_PAGE_EXPORT = 200;
/** Plafond de sécurité : 25 pages = 5 000 lignes. */
const PAGES_MAX = 25;

/**
 * Résultat d'un export.
 *
 * `total` est le volume annoncé par le backend pour les filtres appliqués ; `lignes` ce
 * qui a réellement été écrit dans le fichier. L'écart n'est JAMAIS silencieux : un
 * auditeur qui croit tenir le journal complet alors qu'il est coupé tire de fausses
 * conclusions.
 */
export interface ResultatExport {
  /** Lignes réellement écrites dans le fichier. */
  lignes: number;
  /** Lignes disponibles côté backend pour ces filtres. */
  total: number;
  /** Vrai si le plafond de relecture a coupé l'export. */
  tronque: boolean;
}

/** Message unique d'un export coupé — repris à l'identique dans le toast et dans le CSV. */
export function messageTroncature(resultat: ResultatExport): string {
  return (
    `EXPORT PARTIEL : ${resultat.lignes} ligne(s) exportée(s) sur ${resultat.total} disponible(s) ` +
    `pour ces filtres (plafond de ${PAGES_MAX} × ${TAILLE_PAGE_EXPORT} lignes). ` +
    `Affinez la période ou les filtres pour obtenir le journal complet.`
  );
}

/**
 * Caractères qui font d'une cellule une FORMULE dans Excel et LibreOffice. Les colonnes
 * exportées contiennent des chaînes saisies par des tiers (libellés d'objets, noms,
 * appareils) : sans échappement, `=cmd|'…'!A1` s'exécute à l'ouverture du fichier
 * (injection de formule CSV). Le guillemet CSV ne protège PAS de cela — seul le préfixe
 * apostrophe, qui force le tableur à traiter la cellule comme du texte, protège.
 */
const PREFIXES_FORMULE = /^[=+\-@\t\r]/;
/** Nombre pur (`-1500`, `+3`, `12,50`) : le tableur y voit un nombre, pas une formule. */
const NOMBRE_SIMPLE = /^[+-]?\d+([.,]\d+)?$/;

function champCsv(valeur: string): string {
  const texte = valeur ?? '';
  const protege = PREFIXES_FORMULE.test(texte) && !NOMBRE_SIMPLE.test(texte) ? `'${texte}` : texte;
  return `"${protege.replace(/"/g, '""')}"`;
}

/**
 * Assemble entête + lignes en CSV `;`. Pur, testable.
 *
 * `avertissement`, s'il est fourni, est écrit en toute première ligne du fichier : le
 * fichier lui-même dit qu'il est partiel, même détaché de l'écran qui l'a produit.
 */
export function construireCsv(entete: string[], lignes: string[][], avertissement?: string): string {
  const corps = [entete, ...lignes];
  const toutes = avertissement ? [[avertissement], ...corps] : corps;
  return toutes.map((ligne) => ligne.map(champCsv).join(';')).join('\r\n');
}

function telecharger(contenu: string, nomFichier: string): void {
  const blob = new Blob(['﻿' + contenu], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(url);
}

function horodatageFichier(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

const NOMS_FICHIER: Record<OngletSupervision, string> = {
  'en-ligne': 'sessions_en_ligne',
  activite: 'audit_actions_modules',
  connexions: 'journal_connexions',
  adoption: 'premieres_connexions',
};

/** Déclenche le téléchargement d'un CSV daté pour un onglet donné. */
function telechargerOnglet(onglet: OngletSupervision, contenu: string): void {
  telecharger(contenu, `${NOMS_FICHIER[onglet]}_${horodatageFichier()}.csv`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Onglet 1 — Utilisateurs en ligne (déjà entièrement chargé à l'écran)
// ─────────────────────────────────────────────────────────────────────────────

export function exporterSessions(sessions: ISessionErp[]): ResultatExport {
  if (sessions.length === 0) return { lignes: 0, total: 0, tronque: false };
  const maintenant = Date.now();
  const contenu = construireCsv(
    ['Utilisateur', 'Rôle', 'Agence', 'Page en cours', 'Connecté à', 'Durée de session', 'Statut', 'IP', 'Appareil'],
    sessions.map((s) => [
      s.utilisateur ?? '—',
      s.role ?? '',
      s.agence ?? '',
      libellePage(s),
      formatInstant(s.loginAt),
      formatDuree(dureeSessionVivante(s, maintenant)),
      STATUT_ACTIVITE_LABELS[s.statutActivite] ?? s.statutActivite,
      s.ip ?? '',
      s.appareil ?? '',
    ]),
  );
  telechargerOnglet('en-ligne', contenu);
  // Liste non paginée, entièrement chargée à l'écran : rien ne peut être coupé.
  return { lignes: sessions.length, total: sessions.length, tronque: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Onglet 4 — Premières connexions (liste complète, non paginée côté backend)
// ─────────────────────────────────────────────────────────────────────────────

export function exporterAdoption(comptes: IAdoptionCompte[]): ResultatExport {
  if (comptes.length === 0) return { lignes: 0, total: 0, tronque: false };
  const contenu = construireCsv(
    ['Utilisateur', 'Identifiant', 'Rôle', 'Première connexion', 'Dernière connexion', 'Nombre de connexions', "Statut d'adoption"],
    comptes.map((c) => [
      c.utilisateur ?? '—',
      c.identifiant ?? '',
      c.role ?? '',
      c.premiereConnexionAt ? formatInstant(c.premiereConnexionAt) : 'jamais',
      c.derniereConnexionAt ? formatInstant(c.derniereConnexionAt) : 'jamais',
      String(c.nbConnexions ?? 0),
      c.jamaisConnecte ? 'Jamais connecté' : 'Adopté',
    ]),
  );
  telechargerOnglet('adoption', contenu);
  // Liste complète servie en un bloc par le backend : aucun plafond ne s'applique.
  return { lignes: comptes.length, total: comptes.length, tronque: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Onglets 2 et 3 — journaux paginés : on relit TOUT le jeu filtré, pas seulement
// la page affichée (un export partiel dans un écran d'audit serait trompeur).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Relit toutes les pages du jeu filtré, dans la limite de {@link PAGES_MAX}, et rend
 * AUSSI le volume annoncé par le backend : c'est l'écart entre les deux qui permet
 * d'avertir d'un export coupé au lieu de le taire.
 */
async function relireTout<T>(
  charger: (page: number, premierAppel: boolean) => Promise<{ content: T[]; totalPages?: number; totalElements?: number }>,
): Promise<{ lignes: T[]; total: number }> {
  const premier = await charger(0, true);
  const lignes = [...(premier.content ?? [])];
  const pages = Math.min(premier.totalPages ?? 1, PAGES_MAX);
  for (let page = 1; page < pages; page++) {
    const suivant = await charger(page, false);
    lignes.push(...(suivant.content ?? []));
  }
  // À défaut de `totalElements` (backend plus ancien), on ne peut rien affirmer de plus
  // que ce qu'on a lu : pas de fausse alerte de troncature.
  return { lignes, total: premier.totalElements ?? lignes.length };
}

/** Assemble le résultat d'un export paginé et l'éventuelle mention de troncature. */
function resultat(lignes: number, total: number): ResultatExport {
  return { lignes, total, tronque: total > lignes };
}

export async function exporterActions(userId: string, filtre: IActionsFiltre): Promise<ResultatExport> {
  const { lignes, total } = await relireTout<IAuditAction>((page, premierAppel) =>
    supervisionAPI.actions(userId, { ...filtre, page }, TAILLE_PAGE_EXPORT, { export: premierAppel }),
  );
  if (lignes.length === 0) return { lignes: 0, total: 0, tronque: false };
  const bilan = resultat(lignes.length, total);
  const contenu = construireCsv(
    ['Horodatage', 'Utilisateur', 'Rôle', 'Module', 'Écran', 'Action', 'Objet concerné', 'Référence', 'Détail (avant → après)', 'Résultat'],
    lignes.map((a) => [
      formatInstant(a.occurredAt),
      a.utilisateur ?? '—',
      a.role ?? '',
      a.module ?? '',
      a.ecran ?? '',
      TYPE_ACTION_LABELS[a.typeAction] ?? a.typeAction,
      libelleObjet(a),
      a.entiteId ?? '',
      detailTexte(a),
      a.succes ? 'Succès' : 'Échec',
    ]),
    bilan.tronque ? messageTroncature(bilan) : undefined,
  );
  telechargerOnglet('activite', contenu);
  return bilan;
}

export async function exporterConnexions(userId: string, filtre: IConnexionsFiltre): Promise<ResultatExport> {
  const { lignes, total } = await relireTout<IConnexion>((page, premierAppel) =>
    supervisionAPI.connexions(userId, { ...filtre, page }, TAILLE_PAGE_EXPORT, { export: premierAppel }),
  );
  if (lignes.length === 0) return { lignes: 0, total: 0, tronque: false };
  const bilan = resultat(lignes.length, total);
  const contenu = construireCsv(
    ['Horodatage', 'Utilisateur', 'Événement', 'Motif', 'Adresse IP', 'Appareil', 'Session', 'Durée de session'],
    lignes.map((c) => [
      formatInstant(c.occurredAt),
      utilisateurConnexion(c.utilisateur, c.identifiant),
      TYPE_EVENEMENT_LABELS[c.typeEvenement] ?? c.typeEvenement,
      c.motif ?? '',
      c.ip ?? '',
      c.appareil ?? '',
      c.sessionId ?? '',
      c.dureeSessionS != null ? formatDuree(c.dureeSessionS) : '',
    ]),
    bilan.tronque ? messageTroncature(bilan) : undefined,
  );
  telechargerOnglet('connexions', contenu);
  return bilan;
}
