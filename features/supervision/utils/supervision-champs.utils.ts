// Le vocabulaire de la colonne « Détail » du journal d'audit : ce qui décide du RANG
// d'un champ et de son RENDU. Pur, sans dépendance React — l'export CSV s'en sert aussi.

import { formatMontant } from '@/utils/format.utils';

/**
 * Pourquoi ce fichier existe.
 *
 * <p>Le journal stocke les valeurs avant/après sous forme d'objet JSON plat, dont les clés
 * sont les noms de champs Java de l'entité. Hibernate les fournit dans l'ORDRE ALPHABÉTIQUE
 * de ses propriétés, et l'écran en affichait les TROIS PREMIÈRES. Sur une création de course
 * partenaire qui porte quarante champs, les trois montrées étaient donc `clientId`,
 * `commission`, `commissionFixe` — les trois premières de l'alphabet — pendant que
 * « + 37 autres champs » cachait le montant, le statut et le numéro.</p>
 *
 * <p>Deux corrections, et une seule règle pour les deux : le nom et la valeur du champ
 * disent ce qu'il est. On s'en sert pour le CLASSER, et pour le METTRE EN FORME.</p>
 */

/** Les familles, de la plus parlante à la moins parlante pour qui surveille. */
export type FamilleChamp =
  | 'argent'
  | 'etat'
  | 'reference'
  | 'date'
  | 'personne'
  | 'quantite'
  | 'texte'
  | 'identifiant'
  | 'technique';

/** Rang d'affichage de chaque famille. Plus petit = montré en premier. */
const RANG: Record<FamilleChamp, number> = {
  etat: 0,
  argent: 1,
  reference: 2,
  date: 3,
  personne: 4,
  quantite: 5,
  texte: 6,
  identifiant: 7,
  technique: 8,
};

/**
 * Les identifiants techniques dont on connaît le sujet.
 *
 * <p>`creneauId` n'est pas « Creneau Id », c'est « Créneau ». Le suffixe `Id` est du
 * vocabulaire de développeur : il dit comment la donnée est rangée, pas ce qu'elle
 * désigne.</p>
 */
const SUJET_IDENTIFIANT: Record<string, string> = {
  agentid: 'Agent',
  clientid: 'Client',
  commandeid: 'Commande',
  creneauid: 'Créneau',
  depenseid: 'Dépense',
  emploitempsid: 'Emploi du temps',
  employeid: 'Employé',
  employeeid: 'Employé',
  factureid: 'Facture',
  factureliieeid: 'Facture liée',
  livreurid: 'Livreur',
  lotid: 'Lot de paiement',
  restaurantid: 'Établissement',
  sessionid: 'Session',
  sitepartnerid: 'Site partenaire',
  turboyid: 'Livreur',
  utilisateurid: 'Utilisateur',
};

/** Racines qui désignent de l'argent. Un montant se lit avec sa devise et ses milliers. */
const RACINES_ARGENT = [
  'montant', 'prix', 'tarif', 'solde', 'total', 'somme', 'frais', 'commission',
  'prime', 'salaire', 'remuneration', 'penalite', 'amende', 'avance', 'restant',
  'paye', 'verse', 'encaisse', 'rembourse', 'brut', 'net', 'cout', 'gain',
];

/** Racines qui désignent un état, un statut, une étape. */
const RACINES_ETAT = ['statut', 'status', 'etat', 'etape', 'phase', 'workflow', 'validation'];

/** Racines qui désignent une référence lisible par un humain. */
const RACINES_REFERENCE = ['code', 'reference', 'numero', 'matricule', 'libelle', 'nom', 'intitule'];

/** Racines qui désignent une date ou un instant. */
const RACINES_DATE = ['date', 'at', 'jour', 'debut', 'fin', 'echeance', 'deadline', 'expire'];

/** Racines qui désignent une personne. */
const RACINES_PERSONNE = ['par', 'auteur', 'utilisateur', 'agent', 'responsable', 'valideur'];

/** Champs de plomberie, qui n'apprennent rien sur l'acte métier. */
const RACINES_TECHNIQUE = ['version', 'deleted', 'supprime', 'createdat', 'updatedat', 'datecreation', 'dateedition'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** `NomDeClasse#<uuid>` — ce que l'intercepteur écrit pour une entité liée. */
const ENTITE_LIEE = /^([A-Za-z]+?)(?:Table|Model)?#([0-9a-f-]{36})$/i;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?/;

function sansAccent(mot: string): string {
  return mot.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function contient(champNormalise: string, racines: string[]): boolean {
  return racines.some((racine) => champNormalise.includes(racine));
}

/**
 * La famille d'un champ.
 *
 * <p>⚠ La VALEUR l'emporte sur le NOM quand elle est formelle. Un champ nommé `commission`
 * dont la valeur est un UUID est un identifiant, pas de l'argent : un nom peut mentir, la
 * forme d'un UUID ne ment pas. C'est la garde qui empêche d'écrire « 36 362 945 FCFA » sous
 * prétexte que le champ s'appelle `creneauId`.</p>
 */
export function familleChamp(champ: string, valeur: unknown): FamilleChamp {
  const texte = typeof valeur === 'string' ? valeur : '';
  if (UUID.test(texte) || ENTITE_LIEE.test(texte)) return 'identifiant';

  const n = sansAccent(champ);
  if (n.endsWith('id') || n.endsWith('ids')) return 'identifiant';
  if (contient(n, RACINES_TECHNIQUE)) return 'technique';
  if (contient(n, RACINES_ARGENT) && typeof valeur !== 'boolean') return 'argent';
  if (contient(n, RACINES_ETAT)) return 'etat';
  if (contient(n, RACINES_REFERENCE)) return 'reference';
  if (ISO_INSTANT.test(texte) || contient(n, RACINES_DATE)) return 'date';
  if (contient(n, RACINES_PERSONNE)) return 'personne';
  if (typeof valeur === 'number') return 'quantite';
  return 'texte';
}

/**
 * Le libellé d'un champ, en français lisible.
 *
 * <p>`creneauId` devient « Créneau » et non « Creneau Id ». Le repli reste la coupure du
 * camelCase, qui marche pour tout le reste.</p>
 */
export function libelleChampLisible(champ: string): string {
  const sujet = SUJET_IDENTIFIANT[sansAccent(champ).replace(/[^a-z]/g, '')];
  if (sujet) return sujet;

  const espace = champ
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\bId\b/g, '')
    .trim();
  const capitalise = espace.charAt(0).toUpperCase() + espace.slice(1);

  // Mot a mot : « codeRecuperation » devient « Code Recuperation » puis « Code Récupération ».
  return capitalise
    .split(' ')
    .map((mot) => ACCENTS[mot.charAt(0).toUpperCase() + mot.slice(1)] ?? mot)
    .join(' ');
}

/**
 * Les mots que le Java écrit sans accent et que le français porte.
 *
 * <p>Liste COURTE et volontairement limitée aux mots fréquents des entités de cet ERP. On
 * n'accentue pas au jugé : mettre un accent là où il n'en faut pas, dans un journal d'audit,
 * c'est écrire un mot que personne ne retrouvera en cherchant.</p>
 */
const ACCENTS: Record<string, string> = {
  Numero: 'Numéro',
  Recuperation: 'Récupération',
  Reference: 'Référence',
  Etat: 'État',
  Etablissement: 'Établissement',
  Depense: 'Dépense',
  Creation: 'Création',
  Cree: 'Créé',
  Echeance: 'Échéance',
  Penalite: 'Pénalité',
  Remuneration: 'Rémunération',
  Validee: 'Validée',
  Verifie: 'Vérifié',
  Regle: 'Réglé',
  Generee: 'Générée',
  Livree: 'Livrée',
  Prevue: 'Prévue',
  Duree: 'Durée',
  Valide: 'Validé',
  Supprime: 'Supprimé',
  Modifie: 'Modifié',
};

/** Vide, au sens du journal : absent, nul, ou chaîne vide. */
export function estVide(valeur: unknown): boolean {
  return valeur === null || valeur === undefined || valeur === '';
}

/**
 * Une valeur rendue lisible, selon ce qu'elle EST.
 *
 * <p>Un montant prend sa devise et ses séparateurs de milliers : « 864700 » se lit
 * « 864 700 FCFA », ce que la règle du dépôt exige de tout chiffre qui se compare. Un
 * identifiant est raccourci à son premier segment, précédé d'un croisillon pour qu'on
 * voie que c'est une référence et non un nombre ; l'entier reste en info-bulle.</p>
 *
 * <p>⚠ Un montant non entier ne passe PAS par `formatMontant`, qui force zéro décimale et
 * arrondirait en silence : un taux de 0,6 deviendrait « 1 FCFA ». Dans le doute on rend le
 * nombre tel quel — un rendu brut est toujours préférable à un rendu faux dans un journal
 * d'audit.</p>
 */
export function formatValeurChamp(champ: string, valeur: unknown): string {
  if (estVide(valeur)) return 'vide';
  if (typeof valeur === 'boolean') return valeur ? 'oui' : 'non';

  const famille = familleChamp(champ, valeur);

  if (famille === 'argent' && typeof valeur === 'number' && Number.isInteger(valeur)) {
    return formatMontant(valeur);
  }

  if (typeof valeur === 'string') {
    const liee = ENTITE_LIEE.exec(valeur);
    if (liee) return `#${liee[2].slice(0, 8)}`;
    if (UUID.test(valeur)) return `#${valeur.slice(0, 8)}`;
    if (valeur === '***') return 'masqué';
    if (ISO_INSTANT.test(valeur)) {
      const d = new Date(valeur);
      if (!Number.isNaN(d.getTime())) {
        return valeur.length <= 10
          ? d.toLocaleDateString('fr-FR')
          : d.toLocaleString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });
      }
    }
    return valeur;
  }

  if (typeof valeur === 'number') return valeur.toLocaleString('fr-FR');
  if (typeof valeur === 'object') {
    try {
      return JSON.stringify(valeur);
    } catch {
      return String(valeur);
    }
  }
  return String(valeur);
}

/**
 * Le rang d'affichage d'un champ. Plus petit = montré en premier.
 *
 * <p>Deux niveaux. La FAMILLE d'abord : l'argent et les états avant les identifiants
 * techniques. Puis, à famille égale, ce qui a RÉELLEMENT changé passe devant ce qui est
 * resté vide — sur une création, quarante champs sont « nouveaux », mais ceux qui portent
 * une valeur sont les seuls à dire quelque chose.</p>
 */
export function rangChamp(champ: string, avantBrut: unknown, apresBrut: unknown): number {
  const retenue = estVide(apresBrut) ? avantBrut : apresBrut;
  const famille = familleChamp(champ, retenue);
  const deuxCotesVides = estVide(avantBrut) && estVide(apresBrut);

  /*
   * Un zero n'est pas vide, mais il dit moins qu'un montant. Sur une creation de course
   * partenaire, « Commission : 0 FCFA » occupait une des trois places pendant que le
   * montant total attendait derriere le compteur. A famille egale, ce qui porte une
   * valeur passe devant ce qui n'en porte pas.
   */
  const nul = retenue === 0 || retenue === false;

  return RANG[famille] * 10 + (deuxCotesVides ? 5 : 0) + (nul ? 2 : 0);
}
