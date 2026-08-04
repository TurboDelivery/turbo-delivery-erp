import { apiClientHttp } from '@/lib/api-client-http';

import {
  ICreerGroupePayload,
  IEtablissementCandidat,
  IGroupeDetail,
  IGroupeResume,
} from '../types/groupes-partenaires.types';

/**
 * ⚠️ CONTRAT À CONFIRMER — couche d'appel UNIQUE du module « Groupes de partenaires ».
 *
 * Les routes ci-dessous sont écrites en parallèle par un autre intervenant, côté
 * main-backend, sous `/api/erp/**`. Elles n'ont donc PAS été relevées dans le Java :
 * ce fichier est une proposition de contrat, pas un relevé. Tant qu'il n'est pas
 * confirmé, TOUT l'écran se répare ici et nulle part ailleurs — aucun composant,
 * aucun hook, aucune query n'appelle le réseau directement.
 *
 * Ce qui a été relevé en revanche (et qui fixe le vocabulaire des types) :
 *   · `GroupesPartenaireResource` — `/api/V1/turbo/resto/partenaire/groupes/**`,
 *     l'équivalent CÔTÉ PORTAIL PARTENAIRE. L'identité y vient du jeton partenaire
 *     (`PartenaireContexte`) : ces routes-là ne sont PAS utilisables depuis l'ERP,
 *     qui agit au nom d'un administrateur interne.
 *   · `AdminDemandeCoursierResource` — `/api/erp/demande-coursier/**`, le précédent
 *     ERP du même paquet ; c'est de lui qu'est repris le préfixe `/api/erp/partenaires`.
 *
 * Points à trancher avec le backend (repris dans le compte rendu) :
 *   1. Préfixe exact : `/api/erp/partenaires/groupes` est une proposition.
 *   2. Côté portail, `rattacherRestaurant` exige que l'appelant ait DÉJÀ accès au
 *      restaurant (sinon 409). Côté ERP l'appelant est un administrateur interne :
 *      la vérification doit porter sur le PROPRIÉTAIRE DÉSIGNÉ, ou être levée — sans
 *      quoi constituer un groupe autour d'un compte mono-établissement échouerait.
 *   3. Le changement de compte principal n'existe pas côté portail ; c'est une route
 *      propre à l'ERP. Le compte sortant doit CONSERVER son accès de portée groupe
 *      (« on ne perd rien ») : à confirmer explicitement, l'écran l'annonce.
 *
 * Transport : `apiClientHttp` sans `service` → baseURL = `NEXT_PUBLIC_API_BACKEND_URL`,
 * comme les modules supervision / créneaux / standard. Le client pose `X-User-Id`
 * centralement depuis la session next-auth ; on le passe malgré tout explicitement sur
 * les écritures, car ces actions doivent être imputées au LECTEUR et ne doivent pas
 * dépendre d'un défaut implicite.
 */

const BASE = '/api/erp/partenaires/groupes';

const entete = (userId: string) => ({ headers: { 'X-User-Id': userId } });

export const groupesPartenairesAPI = {
  // ── Lectures ───────────────────────────────────────────────────────────────

  /**
   * `GET /api/erp/partenaires/groupes`
   * La liste d'accueil : nom, nombre d'établissements, compte principal.
   */
  lister(userId: string): Promise<IGroupeResume[]> {
    return apiClientHttp.request<IGroupeResume[]>({
      endpoint: BASE,
      method: 'GET',
      config: entete(userId),
    });
  },

  /**
   * `GET /api/erp/partenaires/groupes/{groupeId}`
   * La fiche : établissements rattachés + tous les membres avec rôle et portée.
   */
  detail(groupeId: string, userId: string): Promise<IGroupeDetail> {
    return apiClientHttp.request<IGroupeDetail>({
      endpoint: `${BASE}/${groupeId}`,
      method: 'GET',
      config: entete(userId),
    });
  },

  /**
   * `GET /api/erp/partenaires/groupes/etablissements`
   * Le sélecteur de constitution : chaque établissement, son groupe actuel s'il en a
   * un, et LES COMPTES qui y sont rattachés.
   *
   * Les comptes voyagent avec l'établissement à dessein : le récapitulatif « compte
   * par compte » se calcule alors sans un appel par établissement coché, donc sans
   * clignotement ni condition de course pendant que l'administrateur compose sa
   * sélection.
   */
  etablissements(userId: string, recherche = ''): Promise<IEtablissementCandidat[]> {
    return apiClientHttp.request<IEtablissementCandidat[]>({
      endpoint: `${BASE}/etablissements`,
      method: 'GET',
      params: recherche.trim() ? { recherche: recherche.trim() } : undefined,
      config: entete(userId),
    });
  },

  // ── Écritures ──────────────────────────────────────────────────────────────

  /**
   * `POST /api/erp/partenaires/groupes`
   * Crée le groupe, rattache les établissements et pose l'accès de portée GROUPE du
   * compte principal — le tout dans la même transaction côté backend, sans quoi un
   * échec partiel laisserait un groupe sans propriétaire.
   */
  creer(payload: ICreerGroupePayload, userId: string): Promise<IGroupeDetail> {
    return apiClientHttp.request<IGroupeDetail>({
      endpoint: BASE,
      method: 'POST',
      data: payload,
      config: entete(userId),
    });
  },

  /** `POST /api/erp/partenaires/groupes/{groupeId}/restaurants` — rattache un établissement. */
  rattacher(groupeId: string, restaurantId: string, userId: string): Promise<IGroupeDetail> {
    return apiClientHttp.request<IGroupeDetail>({
      endpoint: `${BASE}/${groupeId}/restaurants`,
      method: 'POST',
      data: { restaurantId },
      config: entete(userId),
    });
  },

  /**
   * `DELETE /api/erp/partenaires/groupes/{groupeId}/restaurants/{restaurantId}`
   *
   * Détache sans toucher aux accès de portée RESTAURANT : ils ont été donnés à
   * l'établissement, pas au groupe, et survivent au détachement. Seul l'accès HÉRITÉ
   * du groupe disparaît — c'est ce que l'écran montre avant de demander confirmation.
   */
  detacher(groupeId: string, restaurantId: string, userId: string): Promise<IGroupeDetail> {
    return apiClientHttp.request<IGroupeDetail>({
      endpoint: `${BASE}/${groupeId}/restaurants/${restaurantId}`,
      method: 'DELETE',
      config: entete(userId),
    });
  },

  /**
   * `PUT /api/erp/partenaires/groupes/{groupeId}/proprietaire`
   * Désigne un autre compte principal. Route propre à l'ERP (voir l'entête).
   */
  changerProprietaire(groupeId: string, userId: string, nouveauProprietaireUserId: string): Promise<IGroupeDetail> {
    return apiClientHttp.request<IGroupeDetail>({
      endpoint: `${BASE}/${groupeId}/proprietaire`,
      method: 'PUT',
      data: { userId: nouveauProprietaireUserId },
      config: entete(userId),
    });
  },
};
