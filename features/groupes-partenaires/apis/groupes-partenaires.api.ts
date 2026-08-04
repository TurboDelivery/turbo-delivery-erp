import { apiClientHttp } from '@/lib/api-client-http';

import {
  IComptePartenaire,
  ICreerGroupePayload,
  IEtablissementCandidat,
  IGroupeDetail,
  IGroupeResume,
} from '../types/groupes-partenaires.types';

/**
 * Couche d'appel UNIQUE du module « Groupes de partenaires ».
 *
 * CONTRAT CONFIRMÉ le 04/08/2026 contre `GroupesAdminResource.java`, chemin par
 * chemin. Cette couche a d'abord été écrite en parallèle du backend, sur une
 * proposition de contrat : les quatre divergences suivantes ont été relevées et
 * corrigées ici. Elles auraient produit un 404 sur CHAQUE appel de l'écran.
 *
 *   proposé                              →  réel
 *   /api/erp/partenaires/groupes         →  /api/erp/partenaire/groupes  (singulier)
 *   POST   …/groupes                     →  POST   …/groupes/constituer
 *   GET    …/groupes/etablissements      →  GET    …/groupes/restaurants-eligibles
 *   PUT    …/{id}/proprietaire           →  PUT    …/{id}/principal
 *
 * Le vocabulaire diverge aussi : le backend dit `principalUserId` là où l'écran dit
 * `proprietaireUserId`. On traduit ICI, au passage du réseau, plutôt que de renommer
 * dans toute l'interface — c'est précisément le rôle d'une couche d'appel, et le
 * mot « propriétaire » est celui que l'administrateur lit à l'écran.
 *
 * Routes NON utilisables depuis l'ERP, pour mémoire : `/api/V1/turbo/resto/partenaire/
 * groupes/**` y résout l'identité depuis le jeton PARTENAIRE (`PartenaireContexte`) et
 * exige que l'appelant ait déjà accès au restaurant. Un administrateur interne n'a
 * accès à aucun restaurant — d'où l'existence d'un endpoint admin distinct.
 *
 * Transport : `apiClientHttp` sans `service` → baseURL = `NEXT_PUBLIC_API_BACKEND_URL`,
 * comme les modules supervision / créneaux / standard. Le client pose `X-User-Id`
 * centralement depuis la session next-auth ; on le passe malgré tout explicitement sur
 * les écritures, car ces actions doivent être imputées au LECTEUR et ne doivent pas
 * dépendre d'un défaut implicite.
 */

const BASE = '/api/erp/partenaire/groupes';

const entete = (userId: string) => ({ headers: { 'X-User-Id': userId } });

/* ─────────────────────────────────────────────────────────────────────────────
 * PROJECTION DES RÉPONSES — relevée sur la production le 04/08/2026.
 *
 * Les chemins avaient été alignés sur le Java ; les FORMES ne l'avaient pas été,
 * parce que l'écran a été écrit en parallèle du backend, sur un contrat supposé.
 * L'écart a produit exactement ce qu'on pouvait craindre : « Aucun » à la place
 * du compte principal, une cellule d'établissements vide, et un 500 sur la fiche
 * (`Cannot read properties of undefined (reading 'length')` — l'écran lisait
 * `etablissements`, le serveur rend `restaurants`).
 *
 *   l'écran dit          le serveur dit
 *   nbEtablissements     nbRestaurants
 *   proprietaire*        principal (un OBJET, pas trois champs plats)
 *   etablissements       restaurants
 *
 * On traduit ici, et nulle part ailleurs : le vocabulaire « propriétaire /
 * établissement » est celui que l'administrateur lit à l'écran, et c'est le rôle
 * d'une couche d'appel d'absorber cet écart plutôt que de le propager.
 * ────────────────────────────────────────────────────────────────────────── */

/** Le compte principal tel que le serveur le rend, dans la liste comme dans la fiche. */
interface PrincipalServeur {
  userId: string;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  roleCompte: string | null;
  restaurantIdParDefaut: string | null;
}

interface GroupeResumeServeur {
  id: string;
  nom: string;
  origine: string | null;
  creeParErp: string | null;
  principal: PrincipalServeur | null;
  nbRestaurants: number | null;
  nbMembres: number | null;
  createdAt: string | null;
}

interface MembreServeur {
  accesId: string | null;
  userId: string;
  nom: string | null;
  email: string | null;
  role: string | null;
  portee: string;
  restaurantId: string | null;
  restaurantNom: string | null;
  origine: string | null;
  principal: boolean | null;
}

interface GroupeDetailServeur {
  id: string;
  nom: string;
  origine: string | null;
  creeParErp: string | null;
  createdAt: string | null;
  principal: PrincipalServeur | null;
  restaurants: { restaurantId: string; nom: string | null; nbComptes: number | null }[] | null;
  membres: MembreServeur[] | null;
  invitationsEnAttente: number | null;
}

function versCompte(p: PrincipalServeur | null): IComptePartenaire | null {
  if (!p) return null;
  return {
    accesId: null,
    userId: p.userId,
    nom: p.nom,
    email: p.email,
    role: p.roleCompte,
    portee: 'GROUPE',
    restaurantId: p.restaurantIdParDefaut,
    restaurantNom: null,
  };
}

function versResume(g: GroupeResumeServeur): IGroupeResume {
  return {
    id: g.id,
    nom: g.nom,
    nbEtablissements: g.nbRestaurants ?? 0,
    proprietaireUserId: g.principal?.userId ?? null,
    proprietaireNom: g.principal?.nom ?? null,
    proprietaireEmail: g.principal?.email ?? null,
    createdAt: g.createdAt,
  };
}

function versDetail(g: GroupeDetailServeur): IGroupeDetail {
  return {
    id: g.id,
    nom: g.nom,
    createdAt: g.createdAt,
    proprietaire: versCompte(g.principal),
    // Les listes sont défendues contre l'absence : c'est précisément un `undefined`
    // ici qui a produit le 500. Une liste vide s'affiche, `undefined` fait tomber
    // l'écran entier.
    etablissements: (g.restaurants ?? []).map((r) => ({
      restaurantId: r.restaurantId,
      nom: r.nom,
      // TODO-BACKEND : la commune n'est pas rendue par /groupes/{id}. Le champ est
      // conservé pour ne pas retoucher l'affichage le jour où elle arrivera.
      commune: null,
      nbComptes: r.nbComptes ?? 0,
    })),
    membres: (g.membres ?? []).map((m) => ({
      accesId: m.accesId,
      userId: m.userId,
      nom: m.nom,
      email: m.email,
      role: m.role,
      portee: m.portee,
      restaurantId: m.restaurantId,
      restaurantNom: m.restaurantNom,
    })),
  };
}

export const groupesPartenairesAPI = {
  // ── Lectures ───────────────────────────────────────────────────────────────

  /**
   * `GET /api/erp/partenaires/groupes`
   * La liste d'accueil : nom, nombre d'établissements, compte principal.
   */
  async lister(userId: string): Promise<IGroupeResume[]> {
    const brut = await apiClientHttp.request<GroupeResumeServeur[]>({
      endpoint: BASE,
      method: 'GET',
      config: entete(userId),
    });
    return (brut ?? []).map(versResume);
  },

  /**
   * `GET /api/erp/partenaires/groupes/{groupeId}`
   * La fiche : établissements rattachés + tous les membres avec rôle et portée.
   */
  async detail(groupeId: string, userId: string): Promise<IGroupeDetail> {
    return versDetail(
      await apiClientHttp.request<GroupeDetailServeur>({
        endpoint: `${BASE}/${groupeId}`,
        method: 'GET',
        config: entete(userId),
      }),
    );
  },

  /**
   * `GET /api/erp/partenaire/groupes/restaurants-eligibles`
   * Le sélecteur de constitution : chaque établissement, son groupe actuel s'il en a
   * un, et LES COMPTES qui y sont rattachés.
   *
   * Les comptes voyagent avec l'établissement à dessein : le récapitulatif « compte
   * par compte » se calcule alors sans un appel par établissement coché, donc sans
   * clignotement ni condition de course pendant que l'administrateur compose sa
   * sélection.
   *
   * ⚠ Le backend n'accepte AUCUN paramètre de recherche : il rend le catalogue
   * complet en un appel. La recherche reste donc côté client — ce qui est cohérent
   * avec la remarque ci-dessus (filtrer côté serveur rouvrirait le clignotement
   * qu'on cherchait à éviter). Le paramètre est conservé dans la signature pour la
   * clé de cache TanStack, mais n'est pas envoyé.
   */
  etablissements(userId: string, _recherche = ''): Promise<IEtablissementCandidat[]> {
    return apiClientHttp.request<IEtablissementCandidat[]>({
      endpoint: `${BASE}/restaurants-eligibles`,
      method: 'GET',
      config: entete(userId),
    });
  },

  // ── Écritures ──────────────────────────────────────────────────────────────

  /**
   * `POST /api/erp/partenaire/groupes/constituer`
   * Crée le groupe, rattache les établissements, pose l'accès de portée GROUPE du
   * compte principal ET matérialise l'accès de chaque autre compte sur SON
   * établissement — le tout dans une seule transaction côté backend, sans quoi un
   * échec partiel laisserait un groupe sans propriétaire ou des comptes orphelins.
   *
   * Rejouable : relancer la même constitution ne crée pas de doublon et répond
   * proprement. Relancer avec un établissement de plus l'ajoute — c'est la façon la
   * plus simple d'agrandir un groupe depuis l'écran.
   *
   * La réponse est un COMPTE RENDU, pas un accusé : lire `comptesEcartes`, qui dit
   * qui n'a rien reçu et pourquoi. Un compte écarté en silence serait exactement la
   * perte que ce module s'interdit.
   */
  async creer(payload: ICreerGroupePayload, userId: string): Promise<IGroupeDetail> {
    return versDetail(await apiClientHttp.request<GroupeDetailServeur>({
      endpoint: `${BASE}/constituer`,
      method: 'POST',
      // Traduction de vocabulaire : l'écran dit « propriétaire », le backend dit
      // « principal ». Voir l'en-tête du fichier.
      data: {
        nom: payload.nom,
        restaurantIds: payload.restaurantIds,
        principalUserId: payload.proprietaireUserId,
      },
      config: entete(userId),
    }));
  },

  /** `POST /api/erp/partenaires/groupes/{groupeId}/restaurants` — rattache un établissement. */
  async rattacher(groupeId: string, restaurantId: string, userId: string): Promise<IGroupeDetail> {
    return versDetail(await apiClientHttp.request<GroupeDetailServeur>({
      endpoint: `${BASE}/${groupeId}/restaurants`,
      method: 'POST',
      data: { restaurantId },
      config: entete(userId),
    }));
  },

  /**
   * `DELETE /api/erp/partenaires/groupes/{groupeId}/restaurants/{restaurantId}`
   *
   * Détache sans toucher aux accès de portée RESTAURANT : ils ont été donnés à
   * l'établissement, pas au groupe, et survivent au détachement. Seul l'accès HÉRITÉ
   * du groupe disparaît — c'est ce que l'écran montre avant de demander confirmation.
   */
  async detacher(groupeId: string, restaurantId: string, userId: string): Promise<IGroupeDetail> {
    return versDetail(await apiClientHttp.request<GroupeDetailServeur>({
      endpoint: `${BASE}/${groupeId}/restaurants/${restaurantId}`,
      method: 'DELETE',
      config: entete(userId),
    }));
  },

  /**
   * `PUT /api/erp/partenaire/groupes/{groupeId}/principal`
   * Désigne un autre compte principal. Route propre à l'ERP (voir l'en-tête).
   *
   * Confirmé côté backend : le compte sortant RESTE membre du groupe avec son rôle.
   * Il perd le titre, pas son périmètre — c'est ce que l'écran annonce.
   */
  async changerProprietaire(groupeId: string, userId: string, nouveauProprietaireUserId: string): Promise<IGroupeDetail> {
    return versDetail(await apiClientHttp.request<GroupeDetailServeur>({
      endpoint: `${BASE}/${groupeId}/principal`,
      method: 'PUT',
      data: { principalUserId: nouveauProprietaireUserId },
      config: entete(userId),
    }));
  },

  /**
   * `DELETE /api/erp/partenaire/groupes/{groupeId}`
   * Dissout le groupe. Ne retire QUE les accès de portée GROUPE : les accès de portée
   * restaurant et `restaurant_users.restaurant_id` sont intacts. La réponse énumère à
   * la fois ce qui a été retiré et ce qui a été conservé — c'est cette seconde liste
   * qui constitue la garantie, et c'est elle qu'il faut montrer.
   */
  dissoudre(groupeId: string, userId: string): Promise<Record<string, unknown>> {
    return apiClientHttp.request<Record<string, unknown>>({
      endpoint: `${BASE}/${groupeId}`,
      method: 'DELETE',
      config: entete(userId),
    });
  },
};
