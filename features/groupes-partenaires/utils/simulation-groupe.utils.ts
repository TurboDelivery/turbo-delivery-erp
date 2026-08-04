import {
  IBlocageRecapitulatif,
  IComptePartenaire,
  IEtablissementCandidat,
  IEtablissementPerimetre,
  IGroupeDetail,
  ILigneRecapitulatif,
  IRecapitulatif,
} from '../types/groupes-partenaires.types';

/**
 * Le récapitulatif « avant de cliquer » : ce que chaque opération va changer, compte
 * par compte.
 *
 * <b>Pourquoi ce calcul est LOCAL et non demandé au backend.</b> Le récapitulatif est
 * la contrepartie visible de la promesse de l'owner (« comme ça on ne perd rien »).
 * Une promesse ne se tient pas en silence : il faut la MONTRER. Or les données qui la
 * démontrent — les comptes de chaque établissement, avec leur rôle et leur portée —
 * sont déjà à l'écran, chargées par le sélecteur. Les renvoyer au serveur pour qu'il
 * les recompose ajouterait un aller-retour, une latence entre chaque case cochée, et
 * une seconde source de vérité à maintenir.
 *
 * <b>Les règles reproduites ici</b> viennent du service d'autorisation du backend
 * (`GroupePartenaireService`, V118) :
 *   1. Le périmètre d'un compte est l'UNION de trois sources : son
 *      `restaurant_users.restaurant_id` historique (jamais déprécié), ses accès de
 *      portée RESTAURANT, et — s'il a un accès de portée GROUPE ou s'il possède le
 *      groupe — tous les établissements rattachés à ce groupe.
 *   2. Le rôle EFFECTIF sur un établissement suit l'établissement, pas le compte :
 *      accès direct d'abord, puis accès de groupe, puis propriété du groupe (OWNER),
 *      puis le rôle historique en dernier recours.
 *   3. Un établissement appartient à AU PLUS un groupe (`groupe_restaurant.restaurant_id`
 *      est UNIQUE) : rattacher ailleurs échoue, ce n'est pas un déplacement silencieux.
 *   4. Détacher un établissement ne touche PAS aux accès de portée RESTAURANT : ils ont
 *      été donnés à l'établissement, pas au groupe. Seul l'accès hérité du groupe tombe.
 *
 * Ces règles sont donc dupliquées entre le backend et cet écran. C'est assumé, mais
 * c'est une dette : si l'une d'elles change côté Java, ce fichier doit changer avec.
 * Le récapitulatif est une PRÉVISION, pas une garantie transactionnelle — le backend
 * reste seul juge, et un refus de sa part est affiché tel quel.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Petits outils
// ─────────────────────────────────────────────────────────────────────────────

const perimetre = (etablissement: { restaurantId: string; nom: string | null }): IEtablissementPerimetre => ({
  restaurantId: etablissement.restaurantId,
  nom: etablissement.nom,
});

const trierParNom = (a: IEtablissementPerimetre, b: IEtablissementPerimetre) =>
  (a.nom ?? '').localeCompare(b.nom ?? '', 'fr');

const difference = (
  gauche: IEtablissementPerimetre[],
  droite: IEtablissementPerimetre[],
): IEtablissementPerimetre[] => {
  const exclus = new Set(droite.map((e) => e.restaurantId));
  return gauche.filter((e) => !exclus.has(e.restaurantId));
};

/** Nom lisible d'un compte, avec repli sur l'e-mail puis sur un libellé neutre. */
export const nomCompte = (compte: { nom: string | null; email: string | null }): string =>
  compte.nom?.trim() || compte.email?.trim() || 'Compte sans nom';

export const libelleEtablissements = (liste: IEtablissementPerimetre[], maximum = 3): string => {
  if (liste.length === 0) return 'aucun établissement';
  const noms = liste.map((e) => e.nom ?? 'Établissement sans nom');
  if (noms.length <= maximum) return noms.join(', ');
  return `${noms.slice(0, maximum).join(', ')} et ${noms.length - maximum} autre${
    noms.length - maximum > 1 ? 's' : ''
  }`;
};

/** Totaux dérivés des lignes — jamais écrits en dur, c'est tout l'intérêt. */
function totaliser(lignes: ILigneRecapitulatif[], blocages: IBlocageRecapitulatif[]): IRecapitulatif {
  return {
    lignes,
    blocages,
    nbComptes: lignes.length,
    nbAccesGagnes: lignes.reduce((total, ligne) => total + ligne.gains.length, 0),
    nbAccesPerdus: lignes.reduce((total, ligne) => total + ligne.pertes.length, 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Constitution d'un groupe
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simule la constitution d'un groupe sur `etablissements`, avec `proprietaireUserId`
 * comme compte principal.
 *
 * Le résultat contient une ligne PAR COMPTE concerné — y compris ceux qui ne bougent
 * pas. Les lignes « inchangé » sont le cœur du sujet : ce sont elles qui montrent que
 * personne ne perd son accès, et les masquer viderait le récapitulatif de son sens.
 */
export function simulerConstitution(
  etablissements: IEtablissementCandidat[],
  proprietaireUserId: string | null,
): IRecapitulatif {
  const perimetreDuGroupe = etablissements.map(perimetre).sort(trierParNom);

  // Un établissement déjà rattaché ailleurs fait échouer l'appel entier côté backend
  // (contrainte UNIQUE). Autant le dire avant, et nommer le groupe qui le détient.
  const blocages: IBlocageRecapitulatif[] = etablissements
    .filter((etablissement) => !!etablissement.groupeId)
    .map((etablissement) => ({
      restaurantId: etablissement.restaurantId,
      nom: etablissement.nom,
      message: `Déjà rattaché au groupe « ${etablissement.groupeNom ?? 'sans nom'} ». Un établissement ne peut appartenir qu'à un seul groupe : détachez-le d'abord.`,
    }));

  // Regroupement des comptes : un même compte peut être rattaché à plusieurs des
  // établissements sélectionnés (propriétaire multi-enseignes déjà en place).
  const comptes = new Map<string, { compte: IComptePartenaire; avant: IEtablissementPerimetre[] }>();
  etablissements.forEach((etablissement) => {
    etablissement.comptes.forEach((compte) => {
      const existant = comptes.get(compte.userId);
      if (existant) {
        existant.avant.push(perimetre(etablissement));
        return;
      }
      comptes.set(compte.userId, { compte, avant: [perimetre(etablissement)] });
    });
  });

  const lignes: ILigneRecapitulatif[] = Array.from(comptes.values()).map(({ compte, avant }) => {
    const perimetreAvant = [...avant].sort(trierParNom);
    const estPrincipal = !!proprietaireUserId && compte.userId === proprietaireUserId;

    // Le compte principal reçoit un accès de portée GROUPE, rôle OWNER : son périmètre
    // devient l'ensemble du groupe. Les autres gardent l'accès qu'ils ont, sur
    // l'établissement où ils l'ont — c'est la définition même de « on ne perd rien ».
    const perimetreApres = estPrincipal ? perimetreDuGroupe : perimetreAvant;
    const gains = difference(perimetreApres, perimetreAvant);
    const pertes = difference(perimetreAvant, perimetreApres);

    let effet: ILigneRecapitulatif['effet'] = 'INCHANGE';
    if (estPrincipal) effet = 'DEVIENT_PRINCIPAL';
    else if (pertes.length > 0) effet = 'PERD';
    else if (gains.length > 0) effet = 'GAGNE';

    const explication = estPrincipal
      ? gains.length > 0
        ? `Devient le compte principal du groupe (rôle Propriétaire) et accède en plus à ${libelleEtablissements(
            gains,
          )}.`
        : 'Devient le compte principal du groupe (rôle Propriétaire). Son périmètre ne change pas : il administrait déjà ces établissements.'
      : `Conserve son accès à ${libelleEtablissements(
          perimetreAvant,
        )}. Le groupe ne lui retire rien et ne lui ajoute rien.`;

    return {
      userId: compte.userId,
      nom: compte.nom,
      email: compte.email,
      effet,
      roleAvant: compte.role ?? null,
      roleApres: estPrincipal ? 'OWNER' : (compte.role ?? null),
      porteeAvant: compte.portee,
      porteeApres: estPrincipal ? 'GROUPE' : 'RESTAURANT',
      perimetreAvant,
      perimetreApres,
      gains,
      pertes,
      explication,
    };
  });

  // Le compte principal en tête, puis les gains, puis l'ordre alphabétique : la
  // première ligne lue est celle qui change le plus.
  const rang = (ligne: ILigneRecapitulatif) =>
    ligne.effet === 'DEVIENT_PRINCIPAL' ? 0 : ligne.effet === 'PERD' ? 1 : ligne.effet === 'GAGNE' ? 2 : 3;
  lignes.sort((a, b) => rang(a) - rang(b) || nomCompte(a).localeCompare(nomCompte(b), 'fr'));

  return totaliser(lignes, blocages);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Changement du compte principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simule la désignation d'un nouveau compte principal sur un groupe existant.
 *
 * Le compte sortant CONSERVE son accès de portée groupe : il cesse d'être le titulaire
 * sans cesser d'être membre. C'est la lecture cohérente avec le backend, où le
 * propriétaire n'est jamais retirable de son groupe et où la propriété est « un titre,
 * pas une ligne » — mais c'est aussi le point du contrat ERP qui reste à confirmer,
 * et l'écran le dit à l'administrateur plutôt que de le taire.
 */
export function simulerChangementProprietaire(
  groupe: IGroupeDetail,
  nouveauProprietaireUserId: string | null,
): IRecapitulatif {
  const perimetreDuGroupe = groupe.etablissements.map(perimetre).sort(trierParNom);

  /** Ce que ce compte voit AUJOURD'HUI parmi les établissements du groupe. */
  const perimetreActuel = (membre: IComptePartenaire): IEtablissementPerimetre[] => {
    const estProprietaire = groupe.proprietaire?.userId === membre.userId;
    if (membre.portee === 'GROUPE' || estProprietaire) return perimetreDuGroupe;
    return perimetreDuGroupe.filter((e) => e.restaurantId === membre.restaurantId);
  };

  // Un compte peut porter plusieurs accès (groupe + restaurant) : on ne garde qu'une
  // ligne par personne, sinon le récapitulatif compte deux fois le même individu.
  const parCompte = new Map<string, IComptePartenaire>();
  groupe.membres.forEach((membre) => {
    const existant = parCompte.get(membre.userId);
    if (!existant || (existant.portee !== 'GROUPE' && membre.portee === 'GROUPE')) {
      parCompte.set(membre.userId, membre);
    }
  });
  if (groupe.proprietaire && !parCompte.has(groupe.proprietaire.userId)) {
    parCompte.set(groupe.proprietaire.userId, groupe.proprietaire);
  }

  const lignes: ILigneRecapitulatif[] = Array.from(parCompte.values()).map((membre) => {
    const estNouveau = !!nouveauProprietaireUserId && membre.userId === nouveauProprietaireUserId;
    const estSortant = groupe.proprietaire?.userId === membre.userId && !estNouveau;

    const perimetreAvant = perimetreActuel(membre);
    const perimetreApres = estNouveau ? perimetreDuGroupe : perimetreAvant;
    const gains = difference(perimetreApres, perimetreAvant);
    const pertes = difference(perimetreAvant, perimetreApres);

    let effet: ILigneRecapitulatif['effet'] = 'INCHANGE';
    if (estNouveau) effet = 'DEVIENT_PRINCIPAL';
    else if (pertes.length > 0) effet = 'PERD';
    else if (gains.length > 0) effet = 'GAGNE';

    let explication: string;
    if (estNouveau) {
      explication =
        gains.length > 0
          ? `Devient le compte principal et accède désormais à l'ensemble du groupe, dont ${libelleEtablissements(
              gains,
            )}.`
          : 'Devient le compte principal. Il administrait déjà l’ensemble du groupe.';
    } else if (estSortant) {
      explication =
        'N’est plus le compte principal, mais conserve son accès à l’ensemble du groupe (rôle Propriétaire). Le retirer serait une seconde décision, explicite.';
    } else {
      explication = `Non concerné : conserve son accès à ${libelleEtablissements(perimetreAvant)}.`;
    }

    return {
      userId: membre.userId,
      nom: membre.nom,
      email: membre.email,
      effet,
      roleAvant: membre.role ?? null,
      roleApres: estNouveau ? 'OWNER' : (membre.role ?? null),
      porteeAvant: membre.portee,
      porteeApres: estNouveau ? 'GROUPE' : membre.portee,
      perimetreAvant,
      perimetreApres,
      gains,
      pertes,
      explication,
    };
  });

  const rang = (ligne: ILigneRecapitulatif) =>
    ligne.effet === 'DEVIENT_PRINCIPAL' ? 0 : ligne.effet === 'PERD' ? 1 : ligne.effet === 'GAGNE' ? 2 : 3;
  lignes.sort((a, b) => rang(a) - rang(b) || nomCompte(a).localeCompare(nomCompte(b), 'fr'));

  return totaliser(lignes, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Détachement d'un établissement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simule le détachement d'un établissement du groupe.
 *
 * C'est la seule opération du module qui RETIRE quelque chose : elle mérite donc le
 * récapitulatif le plus précis. Le partage est net :
 *   · accès de portée RESTAURANT sur cet établissement → intact, il survit au groupe ;
 *   · accès de portée GROUPE (dont le compte principal) → perd CET établissement, et
 *     lui seul ; le reste du groupe ne bouge pas.
 */
export function simulerDetachement(groupe: IGroupeDetail, restaurantId: string): IRecapitulatif {
  const perimetreDuGroupe = groupe.etablissements.map(perimetre).sort(trierParNom);
  const detache = perimetreDuGroupe.find((e) => e.restaurantId === restaurantId);
  const restant = perimetreDuGroupe.filter((e) => e.restaurantId !== restaurantId);

  const blocages: IBlocageRecapitulatif[] = detache
    ? []
    : [
        {
          restaurantId,
          nom: null,
          message: "Cet établissement n'est plus rattaché à ce groupe — la page a peut-être changé entre-temps.",
        },
      ];

  // Un même compte peut cumuler un accès de groupe ET un accès direct sur
  // l'établissement détaché : dans ce cas il ne perd rien, l'accès direct le couvre.
  const accesDirect = new Set(
    groupe.membres.filter((m) => m.portee === 'RESTAURANT' && m.restaurantId === restaurantId).map((m) => m.userId),
  );

  const parCompte = new Map<string, IComptePartenaire>();
  groupe.membres.forEach((membre) => {
    const existant = parCompte.get(membre.userId);
    if (!existant || (existant.portee !== 'GROUPE' && membre.portee === 'GROUPE')) {
      parCompte.set(membre.userId, membre);
    }
  });
  if (groupe.proprietaire && !parCompte.has(groupe.proprietaire.userId)) {
    parCompte.set(groupe.proprietaire.userId, groupe.proprietaire);
  }

  const lignes: ILigneRecapitulatif[] = Array.from(parCompte.values()).map((membre) => {
    const estProprietaire = groupe.proprietaire?.userId === membre.userId;
    const porteeGroupe = membre.portee === 'GROUPE' || estProprietaire;

    const perimetreAvant = porteeGroupe
      ? perimetreDuGroupe
      : perimetreDuGroupe.filter((e) => e.restaurantId === membre.restaurantId);

    let perimetreApres: IEtablissementPerimetre[];
    if (!porteeGroupe) {
      // Accès donné à l'établissement : il survit au détachement, tel quel.
      perimetreApres = perimetreAvant;
    } else if (accesDirect.has(membre.userId) && detache) {
      // Accès de groupe + accès direct : l'établissement reste accessible par l'autre voie.
      perimetreApres = [...restant, detache].sort(trierParNom);
    } else {
      perimetreApres = restant;
    }

    const gains = difference(perimetreApres, perimetreAvant);
    const pertes = difference(perimetreAvant, perimetreApres);
    const effet: ILigneRecapitulatif['effet'] =
      pertes.length > 0 ? 'PERD' : gains.length > 0 ? 'GAGNE' : 'INCHANGE';

    let explication: string;
    if (pertes.length > 0) {
      explication = `Perd l'accès à ${libelleEtablissements(pertes)} — un accès qu'il tenait du groupe. Il conserve ${
        perimetreApres.length > 0 ? libelleEtablissements(perimetreApres) : 'aucun autre établissement de ce groupe'
      }.`;
    } else if (!porteeGroupe) {
      explication = `Conserve son accès à ${libelleEtablissements(
        perimetreAvant,
      )} : cet accès a été donné à l'établissement, pas au groupe.`;
    } else {
      explication = `Conserve son accès à ${libelleEtablissements(perimetreApres)}.`;
    }

    return {
      userId: membre.userId,
      nom: membre.nom,
      email: membre.email,
      effet,
      roleAvant: membre.role ?? null,
      roleApres: membre.role ?? null,
      porteeAvant: membre.portee,
      porteeApres: membre.portee,
      perimetreAvant,
      perimetreApres,
      gains,
      pertes,
      explication,
    };
  });

  const rang = (ligne: ILigneRecapitulatif) => (ligne.effet === 'PERD' ? 0 : ligne.effet === 'GAGNE' ? 1 : 2);
  lignes.sort((a, b) => rang(a) - rang(b) || nomCompte(a).localeCompare(nomCompte(b), 'fr'));

  return totaliser(lignes, blocages);
}
