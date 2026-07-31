// Export CSV de l'onglet actif de Supervision & Audit.
//
// Convention maison (identique au reporting M6) : séparateur `;`, BOM UTF-8 en
// tête pour qu'Excel FR ouvre le fichier sans écran d'import, champs encadrés de
// guillemets pour survivre aux `;` et aux sauts de ligne, nom de fichier daté.
//
// ⚠ Un export est lui-même une action tracée côté backend (règle de gestion 5) :
// chaque page relue par les boucles ci-dessous laisse une trace CONSULTATION_AUDIT.
// C'est voulu et documenté — d'où le plafond de pages, qui évite de noyer le
// journal des consultations sous un export accidentel de tout l'historique.

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

function champCsv(valeur: string): string {
  return `"${(valeur ?? '').replace(/"/g, '""')}"`;
}

/** Assemble entête + lignes en CSV `;`. Pur, testable. */
export function construireCsv(entete: string[], lignes: string[][]): string {
  return [entete, ...lignes].map((ligne) => ligne.map(champCsv).join(';')).join('\r\n');
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

export function exporterSessions(sessions: ISessionErp[]): number {
  if (sessions.length === 0) return 0;
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
  return sessions.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Onglet 4 — Premières connexions (liste complète, non paginée côté backend)
// ─────────────────────────────────────────────────────────────────────────────

export function exporterAdoption(comptes: IAdoptionCompte[]): number {
  if (comptes.length === 0) return 0;
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
  return comptes.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Onglets 2 et 3 — journaux paginés : on relit TOUT le jeu filtré, pas seulement
// la page affichée (un export partiel dans un écran d'audit serait trompeur).
// ─────────────────────────────────────────────────────────────────────────────

async function relireTout<T>(
  charger: (page: number) => Promise<{ content: T[]; totalPages?: number }>,
): Promise<T[]> {
  const premier = await charger(0);
  const lignes = [...(premier.content ?? [])];
  const total = Math.min(premier.totalPages ?? 1, PAGES_MAX);
  for (let page = 1; page < total; page++) {
    const suivant = await charger(page);
    lignes.push(...(suivant.content ?? []));
  }
  return lignes;
}

export async function exporterActions(userId: string, filtre: IActionsFiltre): Promise<number> {
  const lignes = await relireTout<IAuditAction>((page) =>
    supervisionAPI.actions(userId, { ...filtre, page }, TAILLE_PAGE_EXPORT),
  );
  if (lignes.length === 0) return 0;
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
  );
  telechargerOnglet('activite', contenu);
  return lignes.length;
}

export async function exporterConnexions(userId: string, filtre: IConnexionsFiltre): Promise<number> {
  const lignes = await relireTout<IConnexion>((page) =>
    supervisionAPI.connexions(userId, { ...filtre, page }, TAILLE_PAGE_EXPORT),
  );
  if (lignes.length === 0) return 0;
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
  );
  telechargerOnglet('connexions', contenu);
  return lignes.length;
}
