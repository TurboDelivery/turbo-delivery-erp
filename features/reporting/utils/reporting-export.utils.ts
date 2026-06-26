// Module M6 — Reporting & historisation (CDC RG-11 « historique … exportable »).
// Export CSV du journal transverse : récupère TOUT le jeu filtré (en bouclant
// la pagination, pas seulement la page affichée) puis génère un CSV ';' + BOM
// directement ouvrable dans Excel — même convention que l'export Planification.

import { reportingAPI } from '../apis/reporting.api';
import { IJournalActivite, IJournalFiltre, MODULE_LABELS } from '../types/reporting.types';

function formatInstant(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const AUTEUR_LABELS: Record<string, string> = {
  AGENT: 'Agent',
  LIVREUR: 'Livreur',
  SYSTEME: 'Système',
};

function champCsv(valeur: string): string {
  // Échappe les guillemets et encadre — sûr pour les ';' / sauts de ligne dans le libellé.
  return `"${(valeur ?? '').replace(/"/g, '""')}"`;
}

/** Construit le contenu CSV (entête + lignes) du journal. Pur, testable. */
export function construireJournalCsv(lignes: IJournalActivite[]): string {
  const entete = ['Date', 'Module', 'Action', 'Détail', 'Type auteur', 'Auteur'];
  const corps = lignes.map((l) => [
    formatInstant(l.occurredAt),
    MODULE_LABELS[l.module] ?? l.module,
    l.action ?? '',
    l.libelle ?? '',
    AUTEUR_LABELS[l.auteurType] ?? l.auteurType ?? '',
    l.auteurNom ?? '',
  ]);
  return [entete, ...corps].map((r) => r.map(champCsv).join(';')).join('\r\n');
}

/**
 * Récupère l'intégralité du journal correspondant au filtre courant en
 * parcourant toutes les pages (taille 500), pour ne pas exporter qu'une page.
 */
export async function recupererJournalComplet(filtre: IJournalFiltre): Promise<IJournalActivite[]> {
  const size = 500;
  const premier = await reportingAPI.rechercherJournal({ ...filtre, page: 0 }, size);
  const lignes = [...premier.content];
  const totalPages = premier.totalPages ?? 1;
  for (let page = 1; page < totalPages; page++) {
    const res = await reportingAPI.rechercherJournal({ ...filtre, page }, size);
    lignes.push(...res.content);
  }
  return lignes;
}

/** Déclenche le téléchargement d'un CSV dans le navigateur. */
function telecharger(contenu: string, nomFichier: string): void {
  const blob = new Blob(['﻿' + contenu], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Récupère tout le journal filtré et télécharge le CSV.
 * Retourne le nombre de lignes exportées (0 = rien à exporter).
 */
export async function exporterJournalCsv(filtre: IJournalFiltre): Promise<number> {
  const lignes = await recupererJournalComplet(filtre);
  if (lignes.length === 0) return 0;
  const horodatage = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  telecharger(construireJournalCsv(lignes), `journal_activite_${horodatage}.csv`);
  return lignes.length;
}
