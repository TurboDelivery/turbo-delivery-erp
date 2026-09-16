import * as XLSX from 'xlsx';

import type { IRestaurant } from '@/features/restaurants/types/restaurant.type';

import {
  compterParStatut,
  libelleRecouvrement,
  libelleStatutPartenaire,
} from './restaurant-filtrage.utils';

/**
 * La liste des partenaires en tableur.
 *
 * <h3>Pourquoi un tableur et pas un PDF</h3>
 * <p>Le bouton visait un endpoint d export PDF qui n a jamais existé côté serveur. Plutôt
 * que de le faire naître, on regarde à quoi ce fichier sert : soixante-et-onze lignes de
 * coordonnées qu on trie, qu on filtre, dont on copie un numéro dans un téléphone et qu on
 * rapproche de factures. Cela se travaille dans un tableur. Personne ne retape une adresse
 * électronique depuis un PDF.</p>
 *
 * <h3>Des NOMBRES et des DATES, pas des chaînes</h3>
 * <p>La commission écrit sa valeur brute et la mise en forme est portée par le format de
 * cellule : le tableur affiche « 10 % » et calcule quand même sur 10. Une date est un vrai
 * objet Date, donc elle se trie chronologiquement au lieu de se trier comme du texte.</p>
 *
 * <p>⚠ Le téléphone reste une CHAÎNE. « 0709... » converti en nombre perd son zéro de tête,
 * et un numéro de téléphone amputé est pire qu absent : on le compose.</p>
 *
 * <h3>Une cellule vide est vide</h3>
 * <p>`null` produit une cellule réellement vide, jamais un zéro ni un tiret. Un zéro se
 * sommerait avec les autres et ferait mentir toute colonne calculée par le lecteur du
 * fichier. La commission fait exception : là, zéro est une clause de contrat mesurée, pas
 * une absence de mesure.</p>
 */

/** Ce qui a produit le fichier : la vue et les filtres actifs au moment du clic. */
export interface ContexteExportPartenaires {
  commune?: string;
  email?: string;
  localisation?: string;
  methodRecouvrement?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  recherche?: string;
  telephone?: string;
  /** '' | 'valides' | 'partiels' | 'nouveaux' | 'inactifs' */
  vue?: string;
}

const LIBELLE_VUE: Record<string, string> = {
  '': 'Tous les partenaires',
  valides: 'Validés',
  partiels: 'Partiellement validés',
  nouveaux: 'Nouveaux (30 j)',
  inactifs: 'Inactifs',
};

/** Les entêtes du tableau, et le champ qui les remplit. L ordre est celui du fichier. */
const COLONNES: {
  /** Format de cellule Excel, quand la valeur est un nombre ou une date. */
  format?: string | ((r: IRestaurant) => string | undefined);
  largeur: number;
  libelle: string;
  valeur: (r: IRestaurant) => Date | number | string | null;
}[] = [
  { libelle: 'Partenaire', largeur: 32, valeur: (r) => r.nomEtablissement || null },
  { libelle: 'Email', largeur: 30, valeur: (r) => r.email || null },
  // Chaîne, jamais un nombre : voir la note en tête de fichier.
  { libelle: 'Téléphone', largeur: 16, valeur: (r) => r.telephone || null },
  { libelle: 'Commune', largeur: 18, valeur: (r) => r.commune || null },
  { libelle: 'Localisation', largeur: 28, valeur: (r) => r.localisation || null },
  { libelle: 'Cycle de paiement', largeur: 18, valeur: (r) => libelleRecouvrement(r.methodRecouvrement) || null },
  { libelle: 'Type de commission', largeur: 18, valeur: (r) => r.typeCommission || null },
  {
    libelle: 'Commission',
    largeur: 14,
    valeur: (r) => (typeof r.commission === 'number' ? r.commission : null),
    /*
     * Le format suit le TYPE de commission : un pourcentage et un montant fixe ne se lisent
     * pas de la même façon, et la colonne porte les deux. Un partenaire sans type déclaré
     * (il y en a un) garde son nombre NU : lui coller « % » affirmerait un pourcentage que
     * la donnée ne dit pas.
     */
    format: (r) => {
      if (r.typeCommission === 'FIXE') return '#,##0" FCFA"';
      if (r.typeCommission === 'POURCENTAGE') return '0.##" %"';
      return undefined;
    },
  },
  { libelle: 'Statut', largeur: 20, valeur: (r) => libelleStatutPartenaire(r.status) || null },
  // Le libellé confond les codes 1 et 3, tous deux « Validé ». Le code brut les distingue,
  // et c est ce qu on redemande quand on cherche à comprendre un compte.
  { libelle: 'Code statut', largeur: 11, valeur: (r) => (typeof r.status === 'number' ? r.status : null), format: '0' },
  { libelle: 'Inscription en attente', largeur: 20, valeur: (r) => ouiNon(r.inscriptionEnAttente) },
  { libelle: 'Ouvert', largeur: 10, valeur: (r) => ouiNon(r.isOpen) },
  { libelle: 'Date de création', largeur: 16, valeur: (r) => enDate(r.createdAt), format: 'dd/mm/yyyy' },
  { libelle: 'Date de mise en service', largeur: 20, valeur: (r) => enDate(r.dateService), format: 'dd/mm/yyyy' },
  { libelle: 'Site web', largeur: 26, valeur: (r) => r.siteWeb || null },
  { libelle: 'Latitude', largeur: 12, valeur: (r) => (typeof r.latitude === 'number' ? r.latitude : null), format: '0.000000' },
  { libelle: 'Longitude', largeur: 12, valeur: (r) => (typeof r.longitude === 'number' ? r.longitude : null), format: '0.000000' },
  { libelle: 'Adresse', largeur: 28, valeur: (r) => r.idLocation || null },
  { libelle: 'Code postal', largeur: 12, valeur: (r) => r.codePostal || null },
  { libelle: 'Description', largeur: 40, valeur: (r) => r.description || null },
  { libelle: 'Identifiant', largeur: 38, valeur: (r) => r.id || null },
];

function ouiNon(valeur?: boolean | null): string | null {
  if (valeur === true) return 'Oui';
  if (valeur === false) return 'Non';
  return null;
}

function enDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function jourEtHeure(d: Date): string {
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Le bloc d entête : le fichier voyage loin de l écran qui l a produit.
 *
 * <p>Les compteurs sont recalculés sur la population EXPORTÉE, jamais recopiés des cartes
 * de l écran : celles-ci comptent sans filtre, et un « 71 » posé au-dessus de deux lignes
 * filtrées ferait mentir le fichier.</p>
 */
function construireEnTete(
  lignes: IRestaurant[],
  contexte: ContexteExportPartenaires,
): (Date | number | string | null)[][] {
  const compte = compterParStatut(lignes);
  const filtres: [string, string][] = [];
  if (contexte.recherche) filtres.push(['Recherche (nom)', contexte.recherche]);
  if (contexte.localisation) filtres.push(['Localisation', contexte.localisation]);
  if (contexte.email) filtres.push(['Email', contexte.email]);
  if (contexte.telephone) filtres.push(['Téléphone', contexte.telephone]);
  if (contexte.commune) filtres.push(['Commune', contexte.commune]);
  if (contexte.methodRecouvrement) {
    filtres.push(['Cycle de paiement', libelleRecouvrement(contexte.methodRecouvrement)]);
  }

  const tri = contexte.orderBy
    ? `${contexte.orderBy} (${contexte.orderDirection === 'desc' ? 'décroissant' : 'croissant'})`
    : 'Ordre du serveur';

  return [
    ['PARTENAIRES'],
    [],
    ['Exporté le', jourEtHeure(new Date())],
    ['Lignes exportées', lignes.length],
    ['Vue', LIBELLE_VUE[contexte.vue ?? ''] ?? contexte.vue ?? ''],
    ...(filtres.length > 0 ? filtres : ([['Filtres', 'Aucun']] as [string, string][])),
    ['Tri', tri],
    [],
    ['Répartition sur les lignes exportées'],
    ['Validés', compte.valides],
    ['Partiellement validés', compte.partiels],
    ['Nouveaux (30 j)', compte.nouveaux],
    ['Inactifs', compte.inactifs],
    [
      'Note',
      'Ces vues ne s’additionnent pas : « Validés » contient « Partiellement validés », et « Nouveaux » est une fenêtre de 30 jours qui recoupe les autres.',
    ],
    [],
  ];
}

export function construireRestaurantsExcel(
  lignes: IRestaurant[],
  contexte: ContexteExportPartenaires,
): ArrayBuffer {
  const classeur = XLSX.utils.book_new();

  const enTete = construireEnTete(lignes, contexte);
  const titres = COLONNES.map((c) => c.libelle);
  const corps = lignes.map((r) => COLONNES.map((c) => c.valeur(r)));

  const tout = [...enTete, titres, ...corps];
  const feuille = XLSX.utils.aoa_to_sheet(tout, { cellDates: true });

  /*
   * Les formats se posent sur les CELLULES, pas dans le texte. Des codes EXCEL, pas du
   * francais : la virgule y DESIGNE le separateur de milliers, que le tableur remplace par
   * celui de la machine du lecteur. Une espace ecrite en dur donnerait un format ignore,
   * et la colonne retomberait en nombres nus.
   */
  const premiereLigne = enTete.length + 1;
  COLONNES.forEach((colonne, indexColonne) => {
    if (!colonne.format) return;
    lignes.forEach((restaurant, indexLigne) => {
      const format =
        typeof colonne.format === 'function' ? colonne.format(restaurant) : colonne.format;
      if (!format) return;
      const adresse = XLSX.utils.encode_cell({ c: indexColonne, r: premiereLigne + indexLigne });
      const cellule = feuille[adresse];
      if (cellule && (typeof cellule.v === 'number' || cellule.v instanceof Date)) {
        cellule.z = format;
      }
    });
  });

  feuille['!cols'] = COLONNES.map((c) => ({ wch: c.largeur }));

  XLSX.utils.book_append_sheet(classeur, feuille, 'Partenaires');

  return XLSX.write(classeur, { bookType: 'xlsx', type: 'array', cellDates: true });
}

/** Écrit le fichier et rend son nom, pour que le message de fin puisse le nommer. */
export function exporterRestaurantsExcel(
  lignes: IRestaurant[],
  contexte: ContexteExportPartenaires,
): string {
  const donnees = construireRestaurantsExcel(lignes, contexte);
  // La vue est dans le nom : deux exports du meme jour ne se confondent pas dans le
  // dossier de telechargement.
  const nomFichier = `partenaires-${contexte.vue || 'tous'}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  const blob = new Blob([donnees], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(url);

  return nomFichier;
}
