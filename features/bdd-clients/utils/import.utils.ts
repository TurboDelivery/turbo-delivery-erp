/**
 * Le rattachement des colonnes vers les champs de la BASE CLIENTS.
 *
 * <p>L'atelier de colonnes lui-même vit dans {@code lib/tableur/atelier-colonnes.ts} :
 * il est partagé avec l'import de tickets et ne sait rien d'un contact. Ce fichier le
 * réexporte, si bien que tout ce qui importait déjà `@/features/bdd-clients` ou ce
 * chemin continue de fonctionner sans changement.</p>
 */
export {
  LIBELLES_COMPARAISON,
  LIBELLES_NETTOYAGE,
  appliquer,
  comparer,
  construireTable,
  nettoyer,
  nouvelIdColonne,
} from '@/lib/tableur/atelier-colonnes';

export type {
  ComparaisonImport,
  IColonneImport,
  ITableImport,
  ITransformation,
  NettoyageImport,
} from '@/lib/tableur/atelier-colonnes';

import type { IColonneImport, ITableImport } from '@/lib/tableur/atelier-colonnes';

/** Les champs de destination : ce que la base clients sait recevoir. */
export const CHAMPS_IMPORT = [
  'contact',
  'nom',
  'prenom',
  'numCheck',
  'numCommande',
  'montant',
  'dateCommande',
  'zoneSaisie',
] as const;

export type ChampImport = (typeof CHAMPS_IMPORT)[number];

export const LIBELLES_CHAMP_IMPORT: Record<ChampImport, string> = {
  contact: 'Numéro de téléphone',
  dateCommande: 'Date de la commande',
  montant: 'Montant',
  nom: 'Nom',
  numCheck: 'Numéro de check',
  numCommande: 'Numéro de commande',
  prenom: 'Prénoms',
  zoneSaisie: 'Quartier',
};

/** Le rattachement : quel champ prend quelle colonne. */
export type IRattachement = Partial<Record<ChampImport, string>>;

/**
 * Propose un rattachement à partir des noms de colonnes.
 *
 * <p>Il PROPOSE : l'opérateur voit et corrige. Un rattachement imposé sur une
 * ressemblance de nom mettrait un « Total TTC » dans « montant » sans que personne ne
 * l'ait décidé, et une colonne mal rattachée entre en base sans laisser de trace.</p>
 */
export function proposerRattachement(colonnes: IColonneImport[]): IRattachement {
  const motifs: [ChampImport, RegExp][] = [
    ['contact', /t[eé]l|phone|contact|num[eé]ro|mobile|cell/i],
    ['numCheck', /check|ticket|re[cç]u/i],
    ['numCommande', /commande|order|facture/i],
    ['montant', /montant|total|prix|ttc|somme|amount/i],
    ['dateCommande', /date|jour/i],
    ['prenom', /pr[eé]nom|first/i],
    ['nom', /^nom|nom\b|client|last|name/i],
    ['zoneSaisie', /quartier|zone|commune|adresse|secteur/i],
  ];

  const propose: IRattachement = {};
  const pris = new Set<string>();
  for (const [champ, motif] of motifs) {
    const trouvee = colonnes.find((c) => !pris.has(c.id) && motif.test(c.nom));
    if (trouvee) {
      propose[champ] = trouvee.id;
      pris.add(trouvee.id);
    }
  }
  return propose;
}

/** Une ligne prête pour la grille de saisie, telle que le serveur l'attend. */
export interface ILigneImportee {
  contact: string;
  nom: string;
  prenom: string;
  numCheck: string;
  numCommande: string;
  montant: string;
  dateCommande: string;
  zoneSaisie: string;
}

/**
 * Transforme la table rattachée en lignes de saisie.
 *
 * <p>⚠ Une ligne dont le CONTACT est vide est écartée ici, et le compte des écartées est
 * rendu. Un fichier de caisse se termine presque toujours par une ligne de total, et une
 * ligne sans numéro n'est pas un client : la laisser passer ferait un refus incompréhensible
 * au contrôle, sur une ligne que l'opérateur n'a pas saisie.</p>
 */
export function versLignes(
  table: ITableImport,
  rattachement: IRattachement,
): { lignes: ILigneImportee[]; ecartees: number } {
  const lire = (ligne: Record<string, string>, champ: ChampImport): string => {
    const colonne = rattachement[champ];
    return colonne ? (ligne[colonne] ?? '').trim() : '';
  };

  const lignes: ILigneImportee[] = [];
  let ecartees = 0;

  for (const brute of table.lignes) {
    const contact = lire(brute, 'contact');
    if (contact === '') {
      // Une ligne entièrement vide ne compte pas comme écartée : c'est du remplissage
      // de fin de fichier, pas une ligne qu'on refuse.
      const quelqueChose = Object.values(brute).some((v) => v.trim() !== '');
      if (quelqueChose) ecartees++;
      continue;
    }
    lignes.push({
      contact,
      dateCommande: lire(brute, 'dateCommande'),
      montant: lire(brute, 'montant'),
      nom: lire(brute, 'nom'),
      numCheck: lire(brute, 'numCheck'),
      numCommande: lire(brute, 'numCommande'),
      prenom: lire(brute, 'prenom'),
      zoneSaisie: lire(brute, 'zoneSaisie'),
    });
  }

  return { ecartees, lignes };
}
