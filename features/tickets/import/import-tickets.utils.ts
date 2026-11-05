import type { IColonneImport, ITableImport } from '@/lib/tableur/atelier-colonnes';
import { analyserMontant, lireDateFichier } from '@/lib/tableur/lecture-valeurs';

/**
 * Transformer un tableur en tickets : ce que l'écran doit décider, et ce qu'il déduit.
 *
 * <h3>La décision se prend par VALEUR, jamais par ligne</h3>
 * <p>Un fichier de quatre cents lignes ne porte pas quatre cents livreurs : il en porte
 * une quinzaine, chacun écrit quatre cents fois. Poser la question « qui est KRAH
 * Éric ? » à chaque ligne rendrait l'écran inutilisable, et pousserait l'opérateur à
 * cliquer sans lire. Elle se pose une fois, et la réponse vaut pour toutes les lignes
 * qui portent ce nom.</p>
 *
 * <h3>Ce que le fichier ne contient jamais</h3>
 * <p>La ZONE. Elle est pourtant obligatoire côté serveur, et elle porte, pour un
 * partenaire au montant fixe, le montant de la commission et son seuil. Aucune feuille
 * de terrain ne l'écrit — mais toutes écrivent le coût de livraison, et c'est la zone
 * qui le fixe. On remonte donc du prix vers la zone.</p>
 *
 * <p>Mesuré en production sur les 43 620 tickets des 90 derniers jours : le prix désigne
 * UNE seule zone dans 67 % des cas. Le tiers restant est ambigu, mais sur les 98 couples
 * (partenaire, prix) ambigus de la grille, 95 portent la même commission ET le même
 * seuil — le choix n'y change pas un franc. Seuls 3 couples déplacent réellement de
 * l'argent. L'écran dit lequel est lequel plutôt que de faire croire que tous les choix
 * se valent, ou que tous engagent.</p>
 *
 * <h3>Ce que ce module ne calcule PAS</h3>
 * <p>La commission. Elle se résout sur le serveur, depuis la version active à la date de
 * la course. Deux formules ont déjà cohabité dans cet ERP, d'accord entre elles et
 * fausses toutes les deux : une ligne annonçait 2 000 F et s'enregistrait à 200 F. Le
 * contrôle à blanc demande au serveur ce qu'il appliquera, et l'écran affiche cela.</p>
 */

/** Les champs qu'un ticket attend du fichier. */
export const CHAMPS_TICKET = [
  'reference',
  'livreur',
  'partenaire',
  'montantLivraison',
  'montantCommande',
  'date',
  'heure',
] as const;

export type ChampTicket = (typeof CHAMPS_TICKET)[number];

export const LIBELLES_CHAMP_TICKET: Record<ChampTicket, string> = {
  date: 'Date',
  heure: 'Heure',
  livreur: 'Livreur',
  montantCommande: 'Montant de commande',
  montantLivraison: 'Montant de livraison',
  partenaire: 'Partenaire',
  reference: 'Code check',
};

/**
 * Sans l'un de ceux-là, aucune ligne ne peut être construite.
 *
 * <p>L'heure n'en est pas : beaucoup de feuilles ne l'ont pas, et le serveur se
 * contente de minuit. La refuser bloquerait des imports parfaitement valides sur une
 * donnée qui ne change ni la paie, ni la facture, ni le créneau de rattachement.</p>
 */
export const CHAMPS_TICKET_OBLIGATOIRES: ChampTicket[] = [
  'reference',
  'livreur',
  'partenaire',
  'montantLivraison',
  'montantCommande',
  'date',
];

/** Quel champ prend quelle colonne. */
export type IRattachementTicket = Partial<Record<ChampTicket, string>>;

/**
 * Les en-têtes que l'on sait reconnaître, du plus précis au plus large.
 *
 * <p>Les deux premiers de chaque liste sont les en-têtes RÉELS rencontrés : ceux de
 * l'export de tickets de l'ERP lui-même (« Code Check », « Partner », « Montant de
 * Livraison »), et ceux des feuilles de suivi du réseau (« Référence », « Restaurant »,
 * « Coût livraison »). Un aller-retour export puis import ne demande donc aucun
 * rattachement à la main.</p>
 *
 * <p>⚠ L'ordre compte. « Montant de livraison » contient « livraison » et « Montant de
 * commande » contient « commande » ; un libellé court testé en premier capterait la
 * mauvaise colonne. On teste l'égalité exacte sur tout le dictionnaire avant d'essayer
 * la moindre inclusion.</p>
 */
const ENTETES_CONNUS: Record<ChampTicket, string[]> = {
  date: ['date', 'date commande', 'date de commande', 'jour'],
  heure: ['heure', 'heures', 'time', 'horaire'],
  livreur: ['livreur', 'coursier', 'turboy', 'nom livreur', 'nom du livreur'],
  montantCommande: [
    'montant de commande',
    'cout commande',
    'montant commande',
    'cout de commande',
    'prix commande',
    'montant panier',
    'panier',
  ],
  montantLivraison: [
    'montant de livraison',
    'cout livraison',
    'montant livraison',
    'cout de livraison',
    'frais de livraison',
    'prix livraison',
  ],
  partenaire: [
    'partner',
    'restaurant',
    'partenaire',
    'etablissement',
    'enseigne',
    'commercant',
  ],
  reference: ['code check', 'reference', 'ref', 'numero', 'code', 'num check', 'numero ticket'],
};

/**
 * La forme comparable d'un texte : majuscules, sans accent, sans ponctuation.
 *
 * <p>Sert aux en-têtes comme aux noms de personnes. « N'DRI JEAN JACQUES » et
 * « N'Dri  Jean-Jacques » doivent se rejoindre, sans quoi l'opérateur rattacherait deux
 * fois le même livreur en croyant voir deux personnes.</p>
 */
export function normaliserTexte(valeur: string | null | undefined): string {
  return (valeur ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

/** Propose un rattachement à partir des seuls noms de colonnes. */
export function proposerRattachementTicket(colonnes: IColonneImport[]): IRattachementTicket {
  const propose: IRattachementTicket = {};
  const pris = new Set<string>();

  const essayer = (champ: ChampTicket, correspond: (nom: string) => boolean) => {
    if (propose[champ]) return;
    const trouvee = colonnes.find((c) => !pris.has(c.id) && correspond(normaliserTexte(c.nom)));
    if (trouvee) {
      propose[champ] = trouvee.id;
      pris.add(trouvee.id);
    }
  };

  // Deux passes, et c'est ce qui évite qu'« Heure » capte « Heure de commande » avant
  // que « Date de commande » n'ait eu sa chance sur une égalité franche.
  for (const champ of CHAMPS_TICKET) {
    for (const attendu of ENTETES_CONNUS[champ]) {
      essayer(champ, (nom) => nom === normaliserTexte(attendu));
    }
  }
  for (const champ of CHAMPS_TICKET) {
    for (const attendu of ENTETES_CONNUS[champ]) {
      essayer(champ, (nom) => nom.includes(normaliserTexte(attendu)));
    }
  }

  return propose;
}

/** Une ligne du fichier, lue mais pas encore résolue. */
export interface ILigneLue {
  /**
   * Rang de la ligne dans le tableau LU, en-tête comptée comme ligne 1.
   *
   * <p>⚠ Ce n'est pas forcément le numéro de ligne du tableur : les lignes vides sont
   * écartées à la lecture, et l'en-tête n'est pas toujours en haut. Sur la feuille de
   * suivi du réseau, dont l'en-tête est en ligne 5 derrière deux bandeaux, l'écart se
   * compte en unités. Le repère qu'un opérateur peut réellement chercher dans son
   * tableur est le CODE CHECK, et c'est lui que l'écran affiche à côté du rang.</p>
   */
  index: number;
  reference: string;
  /** Le nom du livreur tel qu'écrit dans le fichier. */
  livreur: string;
  /** Le nom du partenaire tel qu'écrit dans le fichier. */
  partenaire: string;
  montantLivraison: number | null;
  montantCommande: number | null;
  /** `AAAA-MM-JJ`, ou null si la cellule n'est pas une date. */
  date: string | null;
  /** `HH:MM:SS`. Minuit quand la colonne n'est pas renseignée. */
  heure: string | null;
}

/**
 * Lit la table transformée en lignes de ticket.
 *
 * <p>La date et l'heure se lisent ENSEMBLE, par le lecteur de dates partagé : il connaît
 * déjà les pièges d'ici (le jour avant le mois, l'année sur deux chiffres, le 31 février
 * qui n'existe pas). Les recomposer à la main ici aurait rejoué chacun de ces pièges.</p>
 *
 * <p>Le décalage de fuseau est nul : le lecteur travaille en UTC, et Abidjan est à UTC+0
 * toute l'année. L'instant rendu porte donc exactement le jour et l'heure écrits dans le
 * fichier, et on les redécoupe sans conversion.</p>
 */
export function versLignesTicket(
  table: ITableImport,
  rattachement: IRattachementTicket,
): ILigneLue[] {
  const lire = (ligne: Record<string, string>, champ: ChampTicket): string => {
    const colonne = rattachement[champ];
    return colonne ? (ligne[colonne] ?? '').trim() : '';
  };

  return table.lignes.map((ligne, position) => {
    const dateBrute = lire(ligne, 'date');
    const heureBrute = lire(ligne, 'heure');
    const instant = dateBrute === ''
      ? null
      : lireDateFichier(heureBrute === '' ? dateBrute : `${dateBrute} ${heureBrute}`);

    return {
      date: instant ? instant.slice(0, 10) : null,
      // +2 : l'en-tête occupe le rang 1, et on compte à partir de 1. Un index de
      // tableau ferait dire « ligne 0 » pour la première donnée.
      index: position + 2,
      heure: instant ? instant.slice(11, 19) : null,
      livreur: lire(ligne, 'livreur'),
      montantCommande: analyserMontant(lire(ligne, 'montantCommande')),
      montantLivraison: analyserMontant(lire(ligne, 'montantLivraison')),
      partenaire: lire(ligne, 'partenaire'),
      reference: lire(ligne, 'reference'),
    };
  });
}

/** Une valeur distincte du fichier, et combien de lignes la portent. */
export interface IValeurDistincte {
  valeur: string;
  normalisee: string;
  occurrences: number;
}

/**
 * Les valeurs distinctes d'un champ texte, les plus fréquentes d'abord.
 *
 * <p>C'est la liste des questions à poser. Les trier par fréquence met en tête celles
 * qui engagent le plus de lignes : un nom vu quatre cents fois mérite d'être arbitré
 * avant un nom vu une fois.</p>
 */
export function valeursDistinctes(
  lignes: ILigneLue[],
  champ: 'livreur' | 'partenaire',
): IValeurDistincte[] {
  const parClef = new Map<string, IValeurDistincte>();
  for (const ligne of lignes) {
    const valeur = ligne[champ];
    const normalisee = normaliserTexte(valeur);
    if (normalisee === '') continue;
    const vue = parClef.get(normalisee);
    if (vue) {
      vue.occurrences += 1;
    } else {
      parClef.set(normalisee, { normalisee, occurrences: 1, valeur });
    }
  }
  return [...parClef.values()].sort((a, b) => b.occurrences - a.occurrences);
}

/** Un candidat de l'annuaire, avec toutes les écritures sous lesquelles il peut tomber. */
export interface ICandidat {
  id: string;
  /** Les formes acceptables : « NOM Prénoms » et « Prénoms NOM », par exemple. */
  libelles: string[];
}

/**
 * Rattache automatiquement ce qui ne fait aucun doute.
 *
 * <p>Un nom n'est proposé que s'il désigne UN SEUL candidat. Deux candidats pour une
 * écriture, c'est une question à poser, pas un tirage au sort : rattacher quatre cents
 * tickets au mauvais livreur se voit sur sa paie, pas à l'écran.</p>
 *
 * <p>⚠ La correspondance est exacte après normalisation, jamais approchante. Un
 * rapprochement par ressemblance confondrait « KOUAME Yao » et « KOUAME Yaya », et
 * personne ne le verrait.</p>
 */
export function proposerCorrespondances(
  valeurs: IValeurDistincte[],
  candidats: ICandidat[],
): Record<string, string> {
  const parLibelle = new Map<string, string[]>();
  for (const candidat of candidats) {
    for (const libelle of candidat.libelles) {
      const clef = normaliserTexte(libelle);
      if (clef === '') continue;
      const deja = parLibelle.get(clef);
      if (deja) {
        if (!deja.includes(candidat.id)) deja.push(candidat.id);
      } else {
        parLibelle.set(clef, [candidat.id]);
      }
    }
  }

  const correspondances: Record<string, string> = {};
  for (const { normalisee } of valeurs) {
    const trouves = parLibelle.get(normalisee);
    if (trouves && trouves.length === 1) {
      correspondances[normalisee] = trouves[0];
    }
  }
  return correspondances;
}

/** Une zone de la grille tarifaire, réduite à ce dont l'import a besoin. */
export interface IZoneGrille {
  id: string;
  nom: string;
  prix: number;
  commission: number;
  seuilCommission?: number | null;
}

/** Un couple (partenaire, prix) rencontré dans le fichier, et ses zones possibles. */
export interface IChoixZone {
  partenaireId: string;
  prix: number;
  occurrences: number;
  candidates: IZoneGrille[];
  /**
   * Vrai quand toutes les candidates portent la même commission et le même seuil :
   * le choix est alors sans effet sur le montant, et l'écran peut le dire.
   */
  sansEffetSurLeMontant: boolean;
}

/** La clef d'un couple (partenaire, prix), stable et lisible dans un état React. */
export function clefChoixZone(partenaireId: string, prix: number): string {
  return `${partenaireId}|${prix}`;
}

/**
 * Les choix de zone qu'un fichier impose, un par couple (partenaire, prix) rencontré.
 *
 * <p>Les couples sans aucune candidate sont rendus eux aussi, avec une liste vide :
 * les taire ferait disparaître des lignes que l'opérateur devra de toute façon traiter,
 * et un import qui perd des lignes en silence est pire qu'un import qui refuse.</p>
 */
export function choixDeZone(
  lignes: ILigneLue[],
  correspondancePartenaire: Record<string, string>,
  grilles: Record<string, IZoneGrille[]>,
): IChoixZone[] {
  const parClef = new Map<string, IChoixZone>();

  for (const ligne of lignes) {
    const partenaireId = correspondancePartenaire[normaliserTexte(ligne.partenaire)];
    if (!partenaireId || ligne.montantLivraison === null) continue;

    const clef = clefChoixZone(partenaireId, ligne.montantLivraison);
    const vu = parClef.get(clef);
    if (vu) {
      vu.occurrences += 1;
      continue;
    }

    const candidates = (grilles[partenaireId] ?? []).filter(
      (zone) => zone.prix === ligne.montantLivraison,
    );
    parClef.set(clef, {
      candidates,
      occurrences: 1,
      partenaireId,
      prix: ligne.montantLivraison,
      sansEffetSurLeMontant: memeMontantPartout(candidates),
    });
  }

  return [...parClef.values()].sort((a, b) => b.occurrences - a.occurrences);
}

function memeMontantPartout(zones: IZoneGrille[]): boolean {
  if (zones.length < 2) return true;
  const [premiere] = zones;
  return zones.every(
    (zone) =>
      zone.commission === premiere.commission
      && (zone.seuilCommission ?? null) === (premiere.seuilCommission ?? null),
  );
}

/** Une ligne prête pour le serveur, telle que le contrôle à blanc l'attend. */
export interface ILigneAEnvoyer {
  index: number;
  reference: string;
  livreurId: string;
  restaurantId: string;
  zoneId: string;
  montantCommande: number;
  montantLivraison: number;
  date: string;
  heure: string;
}

/** Ce qui empêche une ligne de partir, décidé ici et non par le serveur. */
export interface ILigneIncomplete {
  index: number;
  reference: string;
  motif: string;
}

export interface IPreparation {
  pretes: ILigneAEnvoyer[];
  incompletes: ILigneIncomplete[];
}

/**
 * Assemble les lignes à envoyer, et met de côté celles qui ne peuvent pas l'être.
 *
 * <p>Une ligne incomplète n'est pas envoyée pour que le serveur la refuse : elle est
 * écartée ici, avec son motif. Faire l'aller-retour reviendrait à occuper un paquet,
 * donc à ralentir l'import, pour une réponse connue d'avance.</p>
 *
 * <p>L'heure manquante vaut minuit, et seulement l'heure. Un champ obligatoire absent
 * écarte la ligne.</p>
 */
export function preparerLignes(
  lignes: ILigneLue[],
  correspondanceLivreur: Record<string, string>,
  correspondancePartenaire: Record<string, string>,
  choixZone: Record<string, string>,
): IPreparation {
  const pretes: ILigneAEnvoyer[] = [];
  const incompletes: ILigneIncomplete[] = [];

  for (const ligne of lignes) {
    const ecarter = (motif: string) =>
      incompletes.push({ index: ligne.index, motif, reference: ligne.reference });

    if (ligne.reference.trim() === '') {
      ecarter('Code check vide.');
      continue;
    }
    const livreurId = correspondanceLivreur[normaliserTexte(ligne.livreur)];
    if (!livreurId) {
      ecarter(
        ligne.livreur.trim() === ''
          ? 'Livreur vide.'
          : `Livreur « ${ligne.livreur.trim()} » non rattaché.`,
      );
      continue;
    }
    const restaurantId = correspondancePartenaire[normaliserTexte(ligne.partenaire)];
    if (!restaurantId) {
      ecarter(
        ligne.partenaire.trim() === ''
          ? 'Partenaire vide.'
          : `Partenaire « ${ligne.partenaire.trim()} » non rattaché.`,
      );
      continue;
    }
    if (ligne.montantLivraison === null) {
      ecarter('Montant de livraison illisible.');
      continue;
    }
    if (ligne.montantCommande === null) {
      ecarter('Montant de commande illisible.');
      continue;
    }
    if (ligne.date === null) {
      ecarter('Date illisible.');
      continue;
    }
    const zoneId = choixZone[clefChoixZone(restaurantId, ligne.montantLivraison)];
    if (!zoneId) {
      ecarter(`Aucune zone choisie pour ${ligne.montantLivraison} F chez ce partenaire.`);
      continue;
    }

    pretes.push({
      date: ligne.date,
      heure: ligne.heure ?? '00:00:00',
      index: ligne.index,
      livreurId,
      montantCommande: ligne.montantCommande,
      montantLivraison: ligne.montantLivraison,
      reference: ligne.reference.trim(),
      restaurantId,
      zoneId,
    });
  }

  return { incompletes, pretes };
}

/**
 * Les références qui reviennent plusieurs fois DANS le fichier.
 *
 * <p>Le serveur contrôle l'unicité contre la base ; il ne voit pas le fichier. Deux
 * lignes du même import portant la même référence passeraient donc toutes les deux, et
 * le ticket serait payé et facturé en double. Il n'y a par ailleurs aucune contrainte
 * d'unicité en base pour rattraper le coup : 707 lignes vivantes portent aujourd'hui une
 * référence partagée.</p>
 */
export function referencesEnDoublon(lignes: ILigneLue[]): Map<string, number[]> {
  const parReference = new Map<string, number[]>();
  for (const ligne of lignes) {
    const clef = ligne.reference.trim().toLowerCase();
    if (clef === '') continue;
    const vues = parReference.get(clef);
    if (vues) {
      vues.push(ligne.index);
    } else {
      parReference.set(clef, [ligne.index]);
    }
  }
  for (const [clef, indices] of parReference) {
    if (indices.length < 2) parReference.delete(clef);
  }
  return parReference;
}
