import type {
  IMouvementRecouvrement,
  IRecouvrementFacture,
} from '@/features/rapports-performance/types/performance.type';

/**
 * L'ancre du bloc, pour qu'un autre bloc puisse y renvoyer.
 *
 * <p>Elle vit ICI, dans le fichier le plus léger du bloc : qui veut poser un lien n'a besoin
 * que de cette chaîne, et l'importer depuis la section l'obligerait à charger le tableau et la
 * bibliothèque de composants.</p>
 */
export const ANCRE_RECOUVREMENT = 'recouvrement-periode';

export type CleColonneRecouvrement =
  | 'etablissement'
  | 'code'
  | 'composante'
  | 'periode'
  | 'montant'
  | 'recouvre'
  | 'restant'
  | 'statut';

export interface DefinitionColonneRecouvrement {
  id: CleColonneRecouvrement;
  /** L'intitulé. L'unité y figure UNE fois, jamais sur chaque cellule. */
  entete: string;
  /** Un nombre se lit à droite, en chasse tabulaire. Une référence, non. */
  numerique: boolean;
  /** La colonne porte-t-elle un total en pied de tableau ? */
  totalisable: boolean;
  classeLargeur: string;
}

/**
 * Les colonnes du bloc de recouvrement, pour l'écran, le tableur ET le PDF.
 *
 * <h3>Pourquoi une FONCTION et non une constante</h3>
 * <p>La colonne « Établissement » n'a de sens que si la sélection en porte plusieurs : sur la
 * fiche d'un partenaire unique, elle répéterait le titre du rapport à chaque ligne. Mais la
 * liste doit rester UNE seule liste, lue par l'en-tête, par les lignes, par le total et par les
 * deux exports. Une liste calculée à deux endroits différents finirait par ne plus s'accorder,
 * et un tableau v3 lève « Cell count must match column count » — ce qui emporte la PAGE ENTIÈRE
 * en 500 — dès qu'une ligne n'a pas autant de cellules que d'en-têtes.</p>
 *
 * <p>L'ordre suit la lecture : de quoi il s'agit, puis ce qu'on a facturé, puis ce qui est
 * rentré, puis ce qui manque, puis où en est le dossier.</p>
 */
export function colonnesRecouvrement(avecEtablissement: boolean): DefinitionColonneRecouvrement[] {
  const colonnes: DefinitionColonneRecouvrement[] = [
    { id: 'code', entete: 'Facture', numerique: false, totalisable: false, classeLargeur: 'min-w-[9.5rem]' },
    { id: 'composante', entete: 'Objet', numerique: false, totalisable: false, classeLargeur: 'min-w-[5rem]' },
    { id: 'periode', entete: 'Période', numerique: false, totalisable: false, classeLargeur: 'min-w-[7rem]' },
    { id: 'montant', entete: 'Montant', numerique: true, totalisable: true, classeLargeur: 'min-w-[5.5rem]' },
    { id: 'recouvre', entete: 'Recouvré', numerique: true, totalisable: true, classeLargeur: 'min-w-[5.5rem]' },
    { id: 'restant', entete: 'Reste', numerique: true, totalisable: true, classeLargeur: 'min-w-[5rem]' },
    { id: 'statut', entete: 'État', numerique: false, totalisable: false, classeLargeur: 'min-w-[5rem]' },
  ];

  if (avecEtablissement) {
    colonnes.unshift({
      id: 'etablissement',
      entete: 'Établissement',
      numerique: false,
      totalisable: false,
      classeLargeur: 'min-w-[8rem]',
    });
  }

  return colonnes;
}

/**
 * La colonne « Établissement » a-t-elle lieu d'être ?
 *
 * <h3>Elle se decide sur la DONNEE, pas sur le mode de selection</h3>
 * <p>Premiere version : la colonne s'ajoutait quand `selection.consolide` etait vrai, c'est-a-dire
 * des qu'un GROUPE portait au moins un membre. Or le serveur ne resout les noms d'etablissement
 * que si la selection en porte PLUSIEURS. Un groupe d'un seul etablissement tombait donc entre
 * les deux : la colonne s'affichait, et son contenu etait l'identifiant technique en repli, un
 * UUID brut de trente-six caracteres, dans les trois sorties a la fois.</p>
 *
 * <p>Deux regles pour une meme question finissent toujours par diverger. Celle-ci n'en pose
 * qu'une, et elle lit ce que le serveur a REELLEMENT envoye.</p>
 */
export function avecColonneEtablissement(lignes: IRecouvrementFacture[]): boolean {
  return lignes.some((l) => l.etablissement != null && l.etablissement !== '');
}

/*
 * Les montants sont écrits SANS leur suffixe, l'unité étant portée par l'en-tête : trois
 * colonnes de montants sur trente lignes feraient quatre-vingt-dix « FCFA » à l'écran pour une
 * information déjà donnée par le titre, et une largeur qui pousserait le tableau au défilement
 * horizontal sur la fenêtre réelle du poste.
 *
 * Le groupement passe par `Intl` en `fr-FR`, comme partout ailleurs sur cet écran : un
 * groupement différent d'un bloc à l'autre suffit à faire douter que deux nombres soient le même.
 */
const NOMBRE_FR = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/**
 * Un montant groupé. `null` rend le tiret d'absence, jamais « 0 ».
 *
 * <p>⚠ L'ARRONDI n'est pas de la mise en forme. Les montants arrivent en flottants, et sommer
 * des lignes de facture donne `109465874.99999999` là où le total vaut `109465875` : sans
 * arrondi, la ligne de total afficherait un centime de moins que la somme des lignes
 * au-dessus, et le lecteur, dont c'est précisément le geste ici, conclurait à une erreur.</p>
 */
export function formatMontantRecouvrement(valeur: number | null | undefined): string {
  if (valeur == null || !Number.isFinite(valeur)) return '—';
  return NOMBRE_FR.format(Math.round(valeur));
}

/** Un jour au format français. */
export function jourFr(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, j] = iso.slice(0, 10).split('-');
  return a && m && j ? `${j}/${m}/${a}` : '—';
}

/** « du 01/08/2026 au 07/08/2026 », les bornes réelles de la facture et non celles du rapport. */
export function libellePeriodeFacture(ligne: IRecouvrementFacture): string {
  return `du ${jourFr(ligne.periodeDebut)} au ${jourFr(ligne.periodeFin)}`;
}

/** Les trois objets de facturation, en français. Une valeur inconnue sort telle quelle. */
const OBJETS: Record<string, string> = {
  GLOBALE: 'Globale',
  FRAIS: 'Frais de livraison',
  COMMISSION: 'Commission',
};

export function libelleObjet(composante: string | null | undefined): string {
  if (!composante) return '—';
  return OBJETS[composante] ?? composante;
}

/**
 * L'état d'une facture, en français.
 *
 * <p>Une valeur inconnue sort TELLE QUELLE plutôt que de devenir un tiret : un état que ce
 * tableau ne connaît pas encore reste une information, et le masquer ferait croire que la
 * facture n'en a pas.</p>
 */
const ETATS: Record<string, string> = {
  DRAFT: 'Brouillon',
  VALIDATED: 'Validée',
  PARTIAL: 'Partiellement réglée',
  PAID: 'Réglée',
  CANCELLED: 'Annulée',
};

export function libelleEtat(statut: string | null | undefined): string {
  if (!statut) return '—';
  return ETATS[statut] ?? statut;
}

/** Le texte d'une cellule, partagé par l'écran, le tableur et le PDF. */
export function texteCellule(ligne: IRecouvrementFacture, id: CleColonneRecouvrement): string {
  switch (id) {
    case 'etablissement':
      return ligne.etablissement ?? ligne.restaurantId;
    case 'code':
      // Pas de référence inventée en repli : la référence maison a une forme précise
      // (F20260811-AGHA-04217), et en fabriquer une autre introduirait dans le document un
      // identifiant qui n'existe nulle part ailleurs dans l'ERP.
      return ligne.code ?? '—';
    case 'composante':
      return libelleObjet(ligne.composante);
    case 'periode':
      return libellePeriodeFacture(ligne);
    case 'montant':
      return formatMontantRecouvrement(ligne.montant);
    case 'recouvre':
      return formatMontantRecouvrement(ligne.recouvre);
    case 'restant':
      return formatMontantRecouvrement(ligne.restant);
    case 'statut':
      return libelleEtat(ligne.statut);
  }
}

/**
 * La phrase qui voyage avec le tableau, dans les trois sorties.
 *
 * <p>Sans elle, un montant posé sous « Facture totale à régler » se lirait « voilà ce qui a
 * déjà été payé sur cette facture ». Ce n'est pas ce qu'il dit.</p>
 */

/**
 * Le libellé de la ligne de total, IDENTIQUE dans les trois sorties.
 *
 * <p>Il était écrit trois fois à la main, avec trois séparateurs différents : « Total · N » à
 * l'écran, « Total - N » dans le PDF, « Total — N » dans le tableur. Trois documents qui
 * décrivent le même tableau ne peuvent pas nommer leur propre pied de page de trois façons.</p>
 *
 * <p>Le séparateur est un trait d'union simple : il s'imprime en WinAnsi, il s'affiche partout,
 * et la règle de style du projet écarte le tiret cadratin.</p>
 */
export function libelleTotalFactures(nombre: number): string {
  return `Total - ${nombre} facture${nombre > 1 ? 's' : ''}`;
}

export const NOTE_RECOUVREMENT =
  "Les factures dont la période chevauche celle du rapport sont reprises en entier, avec leurs " +
  "bornes réelles. Le montant recouvré est ce qui a été porté au crédit de la facture à ce jour, " +
  "pas ce qui est rentré pendant la période : aucune date d'encaissement n'est enregistrée. Une " +
  "facture d'un mois précédent soldée pendant cette période ne figure donc pas ici.";

/** Le renvoi à faire quand le total du bloc diffère de « Facture totale à régler ». */
export const NOTE_ECART_FACTURE =
  "Ce total vient des FACTURES émises ; « Facture totale à régler » vient des COURSES de la " +
  "période. Les deux peuvent légitimement différer : les cycles de facturation sont " +
  "hebdomadaires et ne s'alignent pas sur les mois, et le calcul de la facture écarte les " +
  "tickets rejetés pour fraude ainsi que les périodes de désactivation. Les soustraire l'un de " +
  "l'autre n'aurait pas de sens.";


// ─────────────────────────────────────────────────────────────────────────────
// La chronologie des encaissements
// ─────────────────────────────────────────────────────────────────────────────

export type CleColonneMouvement =
  | 'date'
  | 'heure'
  | 'factureCode'
  | 'libelle'
  | 'montant'
  | 'par';

/**
 * Les colonnes de la chronologie, pour l'écran, le tableur ET le PDF.
 *
 * <p>L'ordre suit la lecture d'un relevé : QUAND, sur quelle facture, QUOI, COMBIEN, PAR QUI.
 * La date en tête parce que c'est une chronologie : on la parcourt dans le temps, et la
 * référence sert à rattacher chaque mouvement à sa ligne du tableau du dessus.</p>
 *
 * <p>Largeurs calibrées sur la fenêtre réelle du poste, comme le tableau des factures : 904 px
 * disponibles, 5 colonnes, donc 160 px de gouttières et 744 px de contenu au plus.</p>
 */
export const COLONNES_MOUVEMENT: {
  id: CleColonneMouvement;
  entete: string;
  numerique: boolean;
  classeLargeur: string;
}[] = [
  { id: 'date', entete: 'Date', numerique: false, classeLargeur: 'min-w-[5rem]' },
  /*
   * L'HEURE dans sa propre colonne, et non collée au jour.
   *
   * On trie par jour sans perdre l'heure, et on filtre sur un jour sans manipuler des
   * horodatages. C'est la règle déjà appliquée à l'export de la fiche livreur, où une colonne
   * unique faisait relire le 8 septembre « 9/8/26 » sur le document qui justifie une paie.
   */
  { id: 'heure', entete: 'Heure', numerique: false, classeLargeur: 'min-w-[3.5rem]' },
  { id: 'factureCode', entete: 'Facture', numerique: false, classeLargeur: 'min-w-[9.5rem]' },
  { id: 'libelle', entete: 'Événement', numerique: false, classeLargeur: 'min-w-[13rem]' },
  { id: 'montant', entete: 'Montant', numerique: true, classeLargeur: 'min-w-[5.5rem]' },
  { id: 'par', entete: 'Par', numerique: false, classeLargeur: 'min-w-[8rem]' },
];

/** Le texte d'une cellule de chronologie, partagé par l'écran, le tableur et le PDF. */
export function texteMouvement(m: IMouvementRecouvrement, id: CleColonneMouvement): string {
  switch (id) {
    case 'date':
      return jourFr(m.date);
    case 'heure':
      // Un tiret, et non une case blanche : l'heure peut manquer sur une vieille ligne.
      return m.heure ?? '—';
    case 'factureCode':
      return m.factureCode ?? '—';
    case 'libelle':
      return m.libelle;
    case 'montant':
      return formatMontantRecouvrement(m.montant);
    case 'par':
      // Un tiret, et non une case blanche : on ne sait pas qui, ce n'est pas la même chose
      // que « personne ».
      return m.par ?? '—';
  }
}

/**
 * La phrase qui accompagne la chronologie, dans les trois sorties.
 *
 * <p>Sans elle, une chronologie vide sous une facture recouvrée se lirait « rien n'a été
 * encaissé », ce qui serait faux.</p>
 */
export const NOTE_MOUVEMENTS =
  "Seuls les mouvements d'argent figurent ici. Les jalons du circuit de contrôle interne, " +
  "validation, visa DGA, orientation des fonds, n'en portent pas et ne sont pas repris. " +
  "Cette chronologie est effacée quand une facture est réinitialisée : une facture peut donc " +
  "afficher un montant recouvré sans mouvement ci-dessous.";
