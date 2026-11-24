import { COMPLEMENT_VIDE, type IProgramme } from '../types/programme.types';
import { carburantAffiche } from './carburant.utils';
import { JOURS_SEMAINE } from './couverture.utils';
import { finitApresMinuit } from './jours-programme.utils';

const LIBELLE_JOUR: Record<string, string> = {
  DIMANCHE: 'Dimanche',
  JEUDI: 'Jeudi',
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  SAMEDI: 'Samedi',
  VENDREDI: 'Vendredi',
};

const LIBELLE_STATUT: Record<string, string> = {
  ACCEPTE: 'Accepté',
  BROUILLON: 'Brouillon',
  NOTIFIE: 'Publié',
  PLANIFIE: 'Planifié',
  REFUSE: 'Refusé',
};

const LIBELLE_TYPE: Record<string, string> = {
  INDEPENDANT: 'Indépendant',
  JOURNALIER: 'Journalier',
  SUPERVISEUR_LIVREUR: 'Superviseur-livreur',
};

export const ENTETES_CSV = [
  'Livreur',
  'Type',
  'Site de base',
  'Sites desservis / bases',
  ...JOURS_SEMAINE.map((j) => LIBELLE_JOUR[j]),
  'Dotation (FCFA)',
  'Surplus (FCFA)',
  'Total carburant (FCFA)',
  'Statut',
];

const hhmm = (t?: string | null) => (t ?? '').slice(0, 5);

/** Les surplus non annulés d'un programme : un surplus annulé ne coûte rien (RG-C04). */
function surplusVivants(p: IProgramme): number {
  const parJour = (p.complement ?? COMPLEMENT_VIDE).surplusParJour ?? {};
  return Object.values(parJour)
    .flat()
    .filter((s) => !s.annule)
    .reduce((t, s) => t + (s.montant ?? 0), 0);
}

/**
 * Une cellule CSV. Le séparateur est le point-virgule : c'est celui qu'un tableur réglé en
 * français attend, et la virgule y découperait « TOURE, Bakary » en deux colonnes.
 *
 * <p>⚠ Une cellule qui commence par `=`, `+`, `-` ou `@` est lue comme une FORMULE par le
 * tableur qui ouvre le fichier. Un nom de site saisi « =… » s'exécuterait chez celui qui
 * colle l'export : on la désamorce d'une apostrophe.</p>
 */
function cellule(valeur: string | number): string {
  if (typeof valeur === 'number') return String(valeur);
  const texte = /^[=+\-@]/.test(valeur) ? `'${valeur}` : valeur;
  return /[";\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

/**
 * Les programmes en CSV : des données brutes, une ligne par programme (maquette, fenêtre
 * d'export). Les montants sont des nombres nus, pour rester sommables une fois collés.
 */
export function programmesEnCsv(programmes: IProgramme[], nomSite: Map<string, string>): string {
  const nom = (id: string) => nomSite.get(id) ?? 'Site inconnu';
  const lignes = programmes.map((p) => {
    const c = p.complement ?? COMPLEMENT_VIDE;
    const estSuperviseur = p.typeLivreur === 'SUPERVISEUR_LIVREUR';
    const autres = estSuperviseur ? (c.basesGerees ?? []) : (c.sitesDesservis ?? []).filter((id) => id !== p.siteId);
    const dotation = carburantAffiche(p).montant;
    const surplus = surplusVivants(p);
    const jours = JOURS_SEMAINE.map((cle) => {
      const j = (p.jours ?? []).find((x) => (x.jour ?? '').toUpperCase() === cle);
      if (!j?.actif) return 'Repos';
      return `${hhmm(j.debut)}–${hhmm(j.fin)}${finitApresMinuit(j) ? ' +1' : ''}`;
    });
    return [
      p.livreurNom ?? '',
      LIBELLE_TYPE[String(p.typeLivreur ?? '')] ?? String(p.typeLivreur ?? ''),
      !estSuperviseur && p.siteId ? nom(p.siteId) : '',
      autres.map(nom).join(' · '),
      ...jours,
      // Rien de saisi n'est pas zéro franc : la cellule reste vide.
      dotation === null ? '' : Math.round(dotation),
      surplus > 0 ? Math.round(surplus) : '',
      dotation === null && surplus === 0 ? '' : Math.round((dotation ?? 0) + surplus),
      LIBELLE_STATUT[String(p.statut ?? '')] ?? String(p.statut ?? ''),
    ]
      .map(cellule)
      .join(';');
  });
  return [ENTETES_CSV.map(cellule).join(';'), ...lignes].join('\r\n');
}
