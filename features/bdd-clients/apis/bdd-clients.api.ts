import { apiClientHttp } from '@/lib/api-client-http';

import {
  IEnregistrerLot,
  IFiltresClients,
  IKpisBase,
  ILigneAVerifier,
  ILotDetail,
  ILotResume,
  IPageClients,
  ISyntheseLot,
  IVerdictLigne,
} from '../types/bdd-clients.types';

/**
 * Les filtres deviennent des paramètres d'URL.
 *
 * <p>Une valeur vide est OMISE plutôt qu'envoyée vide : côté serveur, un filtre absent ne
 * pose aucun critère, alors qu'une chaîne vide en poserait un qui ne trouverait rien.</p>
 */
function parametres(f: IFiltresClients): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (f.recherche.trim()) p.recherche = f.recherche.trim();
  if (f.partenaires.length) {
    p.partenaires = f.partenaires;
    p.logique = f.logique;
  }
  if (f.debut) p.debut = f.debut;
  if (f.fin) p.fin = f.fin;
  if (f.zones.length) p.zones = f.zones;
  if (f.statut) p.statut = f.statut;
  if (f.segment) p.segment = f.segment;
  if (f.consentement) p.consentement = f.consentement;
  if (f.capturesMin !== null) p.capturesMin = f.capturesMin;
  if (f.partenairesMin !== null) p.partenairesMin = f.partenairesMin;
  return p;
}

/**
 * Le module passe par `apiClientHttp`, et NON par `lib/api`.
 *
 * <p>Ce n'est pas une préférence de style. `lib/api` n'injecte aucun jeton : son bloc
 * d'authentification est commenté. Or `/api/bdd-clients/**` n'est pas dans la liste des
 * préfixes ouverts de `SecurityConfiguration`, donc il exige un Bearer et répond 401 sans.
 * Mesuré en production : `/api/bdd-clients/lots` rend 401, là où `/api/erp/factures` rend
 * 200 avec de vraies factures. C'est ce qui ferme la base de numéros de clients finaux, et
 * c'est pour cela que le module a son propre préfixe.</p>
 *
 * <p>Le service `backend` pointe `NEXT_PUBLIC_API_BACKEND_URL`, c'est-à-dire main-backend,
 * qui porte ces routes.</p>
 */
export const bddClientsAPI = {
  /**
   * Contrôle le lot ENTIER en un aller-retour.
   *
   * <p>Jamais ligne par ligne : le serveur rend tous les verdicts en quatre lectures
   * quel que soit le nombre de lignes, et chaque appel de l'ERP paie déjà jusqu'à trois
   * allers-retours de session. Cinquante appels ne tiendraient pas les trois secondes.</p>
   */
  verifier(partenaireId: string, lignes: ILigneAVerifier[]): Promise<IVerdictLigne[]> {
    return apiClientHttp.request<IVerdictLigne[]>({
      endpoint: '/api/bdd-clients/lots/verifier',
      method: 'POST',
      service: 'backend',
      data: { partenaireId, lignes },
    });
  },

  /** Enregistre le lot, en brouillon ou validé, et rend la synthèse. */
  enregistrer(dto: IEnregistrerLot): Promise<ISyntheseLot> {
    return apiClientHttp.request<ISyntheseLot>({
      endpoint: '/api/bdd-clients/lots',
      method: 'POST',
      service: 'backend',
      data: dto,
    });
  },

  /** Les lots de l'agent connecté. Le serveur ne rend que les siens. */
  mesLots(): Promise<ILotResume[]> {
    return apiClientHttp.request<ILotResume[]>({
      endpoint: '/api/bdd-clients/lots',
      method: 'GET',
      service: 'backend',
    });
  },

  /**
   * Rouvre un lot pour repeupler la grille.
   *
   * <p>Les numéros reviennent MASQUÉS par défaut, et c'est le serveur qui masque.
   * Demander `enClair` est une action tracée : ne l'utiliser que là où le profil y a
   * droit et où l'opérateur en a besoin.</p>
   */
  rouvrir(lotId: string, enClair = false): Promise<ILotDetail> {
    return apiClientHttp.request<ILotDetail>({
      endpoint: `/api/bdd-clients/lots/${lotId}`,
      method: 'GET',
      service: 'backend',
      params: { enClair },
    });
  },
  /** La base consolidée, filtrée et paginée. Le serveur masque les numéros. */
  lister(filtres: IFiltresClients, taille = 25): Promise<IPageClients> {
    return apiClientHttp.request<IPageClients>({
      endpoint: '/api/bdd-clients',
      method: 'GET',
      service: 'backend',
      params: { ...parametres(filtres), page: filtres.page, taille },
    });
  },

  /** Les quatre cartes de tête. Elles suivent les mêmes filtres que la liste. */
  kpis(filtres: IFiltresClients): Promise<IKpisBase> {
    return apiClientHttp.request<IKpisBase>({
      endpoint: '/api/bdd-clients/kpis',
      method: 'GET',
      service: 'backend',
      params: parametres(filtres),
    });
  },
};
