import {
  IBilanEdition,
  IBilanFusion,
  IBilanListeNoire,
  IDoublon,
  IEnregistrerLot,
  IAppelSaisi,
  ILigneJournalFusion,
  ILigneListeNoire,
  IModificationFiche,
  IFicheClient,
  IFiltresClients,
  IKpisBase,
  ILigneAVerifier,
  ILotDetail,
  ILotResume,
  IPageClients,
  IResultatAppel,
  ISyntheseLot,
  IVerdictLigne,
} from '../types/bdd-clients.types';

/**
 * Les filtres deviennent des paramètres d'URL.
 *
 * <p>Une valeur vide est OMISE plutôt qu'envoyée vide : côté serveur, un filtre absent ne
 * pose aucun critère, alors qu'une chaîne vide en poserait un qui ne trouverait rien.</p>
 */
/** Le relais, en même origine. Le chemin qui suit est celui du backend. */
const RELAIS = '/api/bdd';

async function appeler<T>(chemin: string, init?: RequestInit & { params?: Record<string, unknown> }): Promise<T> {
  const url = new URL(`${RELAIS}${chemin}`, window.location.origin);
  Object.entries(init?.params ?? {}).forEach(([cle, valeur]) => {
    if (valeur === undefined || valeur === null) return;
    if (Array.isArray(valeur)) valeur.forEach((v) => url.searchParams.append(cle, String(v)));
    else url.searchParams.set(cle, String(valeur));
  });

  const reponse = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const texte = await reponse.text();
  if (!reponse.ok) {
    // Le message du serveur d'abord : il dit souvent exactement ce qui manque.
    let message = `La lecture a échoué (${reponse.status}).`;
    try {
      const corps = JSON.parse(texte);
      if (corps?.message) message = corps.message;
    } catch {
      /* le corps n'est pas du JSON : on garde le message générique */
    }
    throw new Error(message);
  }
  return texte ? (JSON.parse(texte) as T) : (undefined as T);
}

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
  if (f.capturesMax !== null) p.capturesMax = f.capturesMax;
  if (f.partenairesMin !== null) p.partenairesMin = f.partenairesMin;
  return p;
}

/**
 * Le module passe par le RELAIS `/api/bdd`, et non directement par main-backend.
 *
 * <p>Mesuré le 28/09 : l'écran recevait 401 sur toutes ses lectures. La cause n'est pas
 * un jeton manquant mais une impossibilité — `api-client-http.tsx` contient
 * `if (service !== 'backend')` et n'envoie DÉLIBÉRÉMENT aucun en-tête `Authorization`
 * vers main-backend, parce que son filtre JWT valide des jetons de livreur signés avec un
 * autre secret que celui d'erp-backend. Tous les appels ERP qui fonctionnent aujourd'hui
 * passent par un préfixe ouvert en `permitAll` ; celui-ci est le premier à ne pas l'être,
 * et il ne doit pas l'être : il sert les numéros de tous les clients finaux.</p>
 *
 * <p>Les appels partent donc vers `/api/bdd/...`, en MÊME ORIGINE. Un gestionnaire de
 * route Next.js les reçoit côté serveur, vérifie la session, et rejoue vers main-backend
 * avec une clé de service que le navigateur ne voit jamais.</p>
 *
 * <p>⚠ Ne pas « simplifier » en rappelant `apiClientHttp` avec `service: 'backend'` : cela
 * remet le 401. Et ne pas ouvrir le préfixe côté backend pour s'en passer.</p>
 */

/**
 * Note historique — pourquoi pas `lib/api`.
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
    return appeler<IVerdictLigne[]>(`/lots/verifier`, {
      body: JSON.stringify({ partenaireId, lignes }),
      method: 'POST',
    });
  },

  /** Enregistre le lot, en brouillon ou validé, et rend la synthèse. */
  enregistrer(dto: IEnregistrerLot): Promise<ISyntheseLot> {
    return appeler<ISyntheseLot>(`/lots`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /** Les lots de l'agent connecté. Le serveur ne rend que les siens. */
  mesLots(): Promise<ILotResume[]> {
    return appeler<ILotResume[]>(`/lots`, {
      method: 'GET',
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
    return appeler<ILotDetail>(`/lots/${lotId}`, {
      method: 'GET',
      params: { enClair },
    });
  },
  /** La base consolidée, filtrée et paginée. Le serveur masque les numéros. */
  lister(filtres: IFiltresClients, taille = 25): Promise<IPageClients> {
    return appeler<IPageClients>(``, {
      method: 'GET',
      params: { ...parametres(filtres), page: filtres.page, taille },
    });
  },

  /** Les quatre cartes de tête. Elles suivent les mêmes filtres que la liste. */
  kpis(filtres: IFiltresClients): Promise<IKpisBase> {
    return appeler<IKpisBase>(`/kpis`, {
      method: 'GET',
      params: parametres(filtres),
    });
  },
  /**
   * La fiche complète d'un client.
   *
   * <p>Le serveur la rend en trois lectures et masque le numéro. `enClair` est un geste
   * explicite, réservé aux profils qui y ont droit.</p>
   */
  fiche(id: string, enClair = false): Promise<IFicheClient> {
    return appeler<IFicheClient>(`/${id}`, {
      method: 'GET',
      params: { enClair },
    });
  },
  /** Enregistre un appel de qualification. Le statut de la fiche en découle. */
  qualifier(clientId: string, appel: IAppelSaisi): Promise<IResultatAppel> {
    return appeler<IResultatAppel>(`/${clientId}/qualifier`, {
      body: JSON.stringify(appel),
      method: 'POST',
    });
  },

  /** Les groupes de fiches vivantes portant le même nom. Le serveur propose, on arbitre. */
  doublons(limite = 50): Promise<IDoublon[]> {
    return appeler<IDoublon[]>(`/doublons`, { method: 'GET', params: { limite } });
  },

  /**
   * Absorbe une fiche dans une autre.
   *
   * <p>Réservé à la Direction et aux superviseurs côté serveur. Réversible, et le
   * numéro absorbé continue de désigner la fiche conservée.</p>
   */
  fusionner(sourceId: string, cibleId: string): Promise<IBilanFusion> {
    return appeler<IBilanFusion>(`/fusionner`, {
      body: JSON.stringify({ cibleId, sourceId }),
      method: 'POST',
    });
  },

  /** Le journal des fusions : c'est par lui qu'une fusion se retrouve pour être annulée. */
  journalFusions(limite = 50): Promise<ILigneJournalFusion[]> {
    return appeler<ILigneJournalFusion[]>(`/fusions`, { method: 'GET', params: { limite } });
  },

  /**
   * Corrige une fiche.
   *
   * <p>⚠ N'envoyer QUE les champs touchés : `null` veut dire « ne touche pas », une
   * chaîne vide veut dire « efface ». Envoyer l'objet entier effacerait ce que l'écran
   * n'affiche pas.</p>
   */
  modifier(clientId: string, modification: IModificationFiche): Promise<IBilanEdition> {
    return appeler<IBilanEdition>(`/${clientId}`, {
      body: JSON.stringify(modification),
      method: 'PATCH',
    });
  },

  /** Les numéros qui ne sont pas des clients. */
  listeNoire(): Promise<ILigneListeNoire[]> {
    return appeler<ILigneListeNoire[]>(`/liste-noire`, { method: 'GET' });
  },

  /** Inscrit un numéro, et retire la fiche qui le portait. */
  inscrireEnListeNoire(
    telephone: string,
    libelle: string,
    motif: string | null,
  ): Promise<IBilanListeNoire> {
    return appeler<IBilanListeNoire>(`/liste-noire`, {
      body: JSON.stringify({ libelle, motif, telephone }),
      method: 'POST',
    });
  },

  /** Retire un numéro, et rend la fiche que cette liste avait retirée. */
  retirerDeLaListeNoire(telephone: string): Promise<IBilanListeNoire> {
    return appeler<IBilanListeNoire>(`/liste-noire/${encodeURIComponent(telephone)}`, {
      method: 'DELETE',
    });
  },

  /** Défait une fusion, à l'identique. Le motif est obligatoire côté serveur. */
  annulerFusion(fusionId: string, motif: string): Promise<IBilanFusion> {
    return appeler<IBilanFusion>(`/fusions/${fusionId}/annuler`, {
      body: JSON.stringify({ motif }),
      method: 'POST',
    });
  },
};
