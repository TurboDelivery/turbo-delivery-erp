/**
 * Le modèle de fichier que l'écran d'import propose au téléchargement.
 *
 * <h3>Pourquoi un modèle, alors que l'écran sait rattacher n'importe quelles colonnes</h3>
 * <p>L'atelier de colonnes existe parce qu'un fichier de caisse ne sort jamais aux
 * colonnes attendues. Mais il traite le cas SUBI : un fichier qu'on reçoit tel quel.
 * Quand c'est l'opérateur qui fabrique le fichier — une liste tapée à la main, une
 * remontée demandée à un restaurant — lui faire inventer les colonnes puis les
 * rattacher une à une est un détour pur. Le modèle rend ce cas immédiat.</p>
 *
 * <h3>Ses en-têtes sont choisies pour être RECONNUES</h3>
 * <p>Elles ne sont pas décoratives : {@link proposerRattachement} les reconnaît toutes
 * les huit, dans cet ordre, de sorte qu'un fichier rempli à partir du modèle arrive à
 * l'écran déjà rattaché, sans un geste. Un banc le vérifie — sans lui, renommer une
 * en-tête pour « faire plus clair » casserait la reconnaissance en silence, et la
 * colonne repartirait en « Aucune » sans que rien ne le dise.</p>
 *
 * <h3>Deux feuilles, et la première est VIDE</h3>
 * <p>⚠ Les lignes d'exemple ne sont pas dans la feuille qu'on remplit. Un modèle
 * livré avec des lignes d'exemple dans la feuille de travail finit par les voir
 * entrer en base le jour où quelqu'un les oublie sous ses vraies lignes — et un faux
 * client, dans une base de numéros, ne se voit pas. Ils vivent donc dans une seconde
 * feuille, qui se lit et ne se charge pas : le lecteur ne prend que la PREMIÈRE.</p>
 */

import { CHAMPS_IMPORT, LIBELLES_CHAMP_IMPORT, type ChampImport } from './import.utils';

/** Le nom de la feuille à remplir. C'est elle que le lecteur ouvrira. */
export const FEUILLE_A_REMPLIR = 'Contacts';
/** Celle qui montre, et que le lecteur ignore. */
export const FEUILLE_EXEMPLE = 'Exemple';

/**
 * Les en-têtes du modèle, dans l'ordre des colonnes.
 *
 * <p>« Téléphone » plutôt que « Numéro de téléphone » : le motif du contact reconnaît
 * aussi « numéro », et « Numéro de check » serait alors parti dans le contact si le
 * fichier avait placé cette colonne en premier. Une en-tête sans ambiguïté vaut mieux
 * qu'un ordre de colonnes qu'il faut préserver.</p>
 */
const ENTETES: Record<ChampImport, string> = {
  contact: 'Téléphone',
  dateCommande: 'Date',
  montant: 'Montant',
  nom: 'Nom',
  numCheck: 'N° Check',
  numCommande: 'N° Commande',
  prenom: 'Prénoms',
  zoneSaisie: 'Quartier',
};

/** La ligne d'en-tête, dans l'ordre des champs. */
export function entetesDuModele(): string[] {
  return CHAMPS_IMPORT.map((champ) => ENTETES[champ]);
}

/**
 * Les lignes montrées dans la feuille d'exemple.
 *
 * <p>Elles enseignent les FORMES acceptées plus qu'elles ne remplissent : un numéro
 * avec et sans indicatif, un montant avec une espace de milliers, une date en
 * jour/mois/année. C'est ce que l'opérateur vient vérifier avant de taper deux cents
 * lignes.</p>
 */
export function lignesExempleDuModele(): string[][] {
  return [
    ['0707070707', 'KOUASSI', 'Adjoua Marie', 'CHK-1042', 'CMD-2026-0912', '12 500', '12/09/2026', 'Cocody Angré'],
    ['+225 0505050505', 'TRAORE', 'Ibrahim', '', '', '7250', '13/09/2026', 'Marcory Zone 4'],
  ];
}

/** Ce que dit la feuille d'exemple, sous les lignes, en clair. */
const NOTES: string[][] = [
  [],
  ['Cette feuille ne se charge pas : le lecteur ouvre la première, « Contacts ».'],
  ['Seul le téléphone est obligatoire. Tout le reste enrichit la fiche.'],
  ['Le téléphone accepte l’indicatif ou non, avec ou sans espaces.'],
  ['Le montant accepte les espaces de milliers et la virgule décimale.'],
  ['La date s’écrit jour/mois/année.'],
  ['Une colonne en trop ne gêne pas : elle se retire à l’écran.'],
];

/**
 * Fabrique le classeur et le rend prêt à enregistrer.
 *
 * <p>⚠ `xlsx` est chargé À LA DEMANDE, pour la même raison que dans le lecteur : la
 * bibliothèque pèse plusieurs centaines de kilo-octets et n'a rien à faire dans le
 * paquet d'un écran qui ne télécharge pas de modèle.</p>
 */
export async function construireModeleImport(): Promise<Blob> {
  const { utils, write } = await import('xlsx');

  const classeur = utils.book_new();

  // La feuille de travail : l'en-tête, et rien dessous.
  const aRemplir = utils.aoa_to_sheet([entetesDuModele()]);
  aRemplir['!cols'] = entetesDuModele().map((nom) => ({ wch: Math.max(12, nom.length + 4) }));
  utils.book_append_sheet(classeur, aRemplir, FEUILLE_A_REMPLIR);

  const exemple = utils.aoa_to_sheet([
    entetesDuModele(),
    ...lignesExempleDuModele(),
    ...NOTES,
  ]);
  exemple['!cols'] = entetesDuModele().map((nom) => ({ wch: Math.max(14, nom.length + 4) }));
  utils.book_append_sheet(classeur, exemple, FEUILLE_EXEMPLE);

  const octets = write(classeur, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Blob([octets], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** Le nom du fichier téléchargé. */
export const NOM_MODELE_IMPORT = 'modele-import-contacts.xlsx';
