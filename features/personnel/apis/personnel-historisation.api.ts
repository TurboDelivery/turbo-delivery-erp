import { apiClientHttp } from '@/lib/api-client-http';
import { PaginatedResponse } from '@/types/general';

import {
  CODE_ANOMALIE,
  EtatDeclaration,
  IAnomaliesPersonnel,
  IAuditActionFiche,
  IContratDeclaration,
  IEffectif,
  IEffectifLigne,
  IEmployeContrat,
  IEmployeDossier,
  IEmployeEvenement,
  IMasseSalariale,
  IMasseSalarialeComparaison,
  IMasseSalarialeMois,
  IRegularisationRemuneration,
  IRemunerationHistorique,
  IRemunerationMois,
} from '../types/personnel-historisation.types';

/**
 * Accès API du volet « historisation du personnel » (SPEC-ERP-TURBO-PERSONNEL-v1.1).
 *
 * Cible : main-backend, routes `/api/erp/**` (permitAll). On passe donc par `apiClientHttp`
 * — l'identité ERP voyage dans l'en-tête `X-User-Id`, qui n'est PAS injecté automatiquement :
 * chaque appel qui en a besoin le reçoit en paramètre depuis la session next-auth.
 *
 * Les endpoints existants (`/api/erp/employees/**`) ne sont pas touchés : ils sont seulement
 * lus ici pour composer l'effectif.
 */

/** Libellé d'entité utilisé par la cartographie d'audit du backend pour `EmployeeTable`. */
export const ENTITE_AUDIT_FICHE_EMPLOYE = 'Fiche employé';

type EnteteUtilisateur = { config?: { headers: Record<string, string> } };

const entete = (userId?: string | null): EnteteUtilisateur =>
  userId ? { config: { headers: { 'X-User-Id': userId } } } : {};

// ─────────────────────────────────────────────────────────────────────────────
// F3 — rémunération d'un agent
// ─────────────────────────────────────────────────────────────────────────────

export function obtenirHistoriqueRemuneration(
  employeId: string,
  options?: { export?: boolean; userId?: string | null },
): Promise<IRemunerationHistorique> {
  return apiClientHttp.request<IRemunerationHistorique>({
    endpoint: '/api/erp/personnel/remunerations',
    method: 'GET',
    service: 'backend',
    params: { employeId, ...(options?.export ? { export: 'true' } : {}) },
    ...entete(options?.userId),
  });
}

/**
 * Régularisation d'un mois CLÔTURÉ, écrite sur un mois OUVERT (règle 2 de la spec,
 * scénario de recette n°3). Le serveur refuse en 409 si le mois d'origine n'est pas
 * clôturé, si le mois d'écriture l'est, ou si l'origine n'est pas antérieure ; en 400 si
 * tous les montants sont nuls. L'identité voyage pour que l'écriture soit imputable.
 */
export function creerRegularisationRemuneration(
  data: IRegularisationRemuneration,
  userId?: string | null,
): Promise<IRemunerationMois> {
  return apiClientHttp.request<IRemunerationMois>({
    endpoint: '/api/erp/personnel/remunerations/regularisation',
    method: 'POST',
    service: 'backend',
    data,
    ...entete(userId),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// F4 — masse salariale
// ─────────────────────────────────────────────────────────────────────────────

export function listerMoisMasseSalariale(limite?: number): Promise<IMasseSalarialeMois[]> {
  return apiClientHttp.request<IMasseSalarialeMois[]>({
    endpoint: '/api/erp/personnel/masse-salariale/mois',
    method: 'GET',
    service: 'backend',
    params: limite ? { limite: String(limite) } : undefined,
  });
}

export function obtenirMasseSalariale(
  mois: string,
  options?: { export?: boolean; userId?: string | null },
): Promise<IMasseSalariale> {
  return apiClientHttp.request<IMasseSalariale>({
    endpoint: '/api/erp/personnel/masse-salariale',
    method: 'GET',
    service: 'backend',
    params: { mois, ...(options?.export ? { export: 'true' } : {}) },
    ...entete(options?.userId),
  });
}

export function obtenirComparaisonMasseSalariale(mois: string): Promise<IMasseSalarialeComparaison> {
  return apiClientHttp.request<IMasseSalarialeComparaison>({
    endpoint: '/api/erp/personnel/masse-salariale/comparaison',
    method: 'GET',
    service: 'backend',
    params: { mois },
  });
}

/**
 * Clôture d'un mois : irréversible, réservée aux profils habilités (contrôle fail-closed
 * côté serveur — sans `X-User-Id` la requête est refusée).
 */
export function cloturerMasseSalariale(mois: string, userId: string): Promise<IMasseSalariale> {
  return apiClientHttp.request<IMasseSalariale>({
    endpoint: '/api/erp/personnel/masse-salariale/cloturer',
    method: 'POST',
    service: 'backend',
    params: { mois },
    ...entete(userId),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// F6 — anomalies
// ─────────────────────────────────────────────────────────────────────────────

export function obtenirAnomalies(
  type?: string | null,
  options?: { export?: boolean; userId?: string | null },
): Promise<IAnomaliesPersonnel> {
  return apiClientHttp.request<IAnomaliesPersonnel>({
    endpoint: '/api/erp/personnel/anomalies',
    method: 'GET',
    service: 'backend',
    params: {
      ...(type ? { type } : {}),
      ...(options?.export ? { export: 'true' } : {}),
    },
    ...entete(options?.userId),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// F1 / F2 / F5 — dossier, parcours, contrats
// ─────────────────────────────────────────────────────────────────────────────

export function obtenirDossierAgent(employeId: string): Promise<IEmployeDossier> {
  return apiClientHttp.request<IEmployeDossier>({
    endpoint: `/api/erp/personnel/employes/${employeId}/dossier`,
    method: 'GET',
    service: 'backend',
  });
}

export function listerParcours(employeId: string): Promise<IEmployeEvenement[]> {
  return apiClientHttp.request<IEmployeEvenement[]>({
    endpoint: `/api/erp/personnel/employes/${employeId}/parcours`,
    method: 'GET',
    service: 'backend',
  });
}

/**
 * Contrats à échéance. Le backend renvoie les CDD actifs dont la fin tombe avant
 * `aujourd'hui + jours` — échéances dépassées comprises. Avec un horizon large, c'est la
 * seule liste transverse de contrats disponible : elle alimente les dates exactes de
 * l'onglet « Contrats & déclarations ».
 */
export function listerContratsEcheance(jours?: number): Promise<IEmployeContrat[]> {
  return apiClientHttp.request<IEmployeContrat[]>({
    endpoint: '/api/erp/personnel/contrats/alertes-echeance',
    method: 'GET',
    service: 'backend',
    params: jours ? { jours: String(jours) } : undefined,
  });
}

/**
 * Suivi de déclaration d'un contrat (F5).
 *
 * Endpoint gardé et fail-closed : sans `X-User-Id` reconnu — et hors profils habilités
 * (DG, DGA, Ops Manager, Comptable) — le backend répond 403. `userId` est donc requis ici,
 * pas facultatif : envoyer la requête sans identité serait un appel perdu d'avance.
 */
export function marquerDeclarationContrat(
  contratId: string,
  data: IContratDeclaration,
  userId: string,
): Promise<IEmployeContrat> {
  return apiClientHttp.request<IEmployeContrat>({
    endpoint: `/api/erp/personnel/contrats/${contratId}/declaration`,
    method: 'PATCH',
    service: 'backend',
    data,
    ...entete(userId),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit — historique des modifications d'une fiche
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Qui a fait quoi sur CETTE fiche. Endpoint gardé : sans `X-User-Id` reconnu (Direction,
 * Admin, Ops Manager) le backend répond 403 — l'écran doit donc traiter l'échec comme une
 * absence de droit, pas comme une erreur technique.
 */
export function obtenirHistoriqueFiche(employeId: string, lecteurId: string): Promise<IAuditActionFiche[]> {
  return apiClientHttp.request<IAuditActionFiche[]>({
    endpoint: '/api/erp/audit/actions/entite',
    method: 'GET',
    service: 'backend',
    params: { type: ENTITE_AUDIT_FICHE_EMPLOYE, id: employeId },
    ...entete(lecteurId),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Bascule journalier ⇄ indépendant
// ─────────────────────────────────────────────────────────────────────────────

export type TypeLivreurBascule = 'JOURNALIER' | 'INDEPENDANT';

/**
 * Bascule du type de contrat d'un livreur. Le geste reste celui d'aujourd'hui — un appel,
 * un champ — et c'est le serveur qui écrit l'événement BASCULEMENT au parcours RH. On envoie
 * l'identité pour que l'événement soit signé, mais elle reste facultative côté backend.
 *
 * ⚠ L'identifiant attendu est celui du LIVREUR (`fiche.livreurId`), pas celui de l'employé.
 */
export function basculerTypeLivreur(
  livreurId: string,
  typeLivreur: TypeLivreurBascule,
  userId?: string | null,
): Promise<unknown> {
  return apiClientHttp.request<unknown>({
    endpoint: `/api/erp/livreur/${livreurId}/type`,
    method: 'PATCH',
    service: 'backend',
    data: { typeLivreur },
    ...entete(userId),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Effectif — composition côté client
// ─────────────────────────────────────────────────────────────────────────────

interface IRosterEmploye {
  id: string;
  name: string | null;
  position: string | null;
  department: string | null;
  statut: string | null;
  entryDate: string | null;
}

/** Roster complet : l'endpoint historique, appelé en une page large plutôt qu'en boucle. */
function listerRoster(taille = 500): Promise<PaginatedResponse<IRosterEmploye>> {
  return apiClientHttp.request<PaginatedResponse<IRosterEmploye>>({
    endpoint: '/api/erp/employees',
    method: 'GET',
    service: 'backend',
    params: { page: '0', size: String(taille) },
  });
}

interface IEnrichissement {
  matricule: string | null;
  poste: string | null;
  agence: string | null;
  typeCollaborateur: string | null;
}

const TYPES_A_DECLARER = ['CDI', 'CDD'];

function normaliser(valeur: string | null | undefined): string {
  return (valeur ?? '').trim().toUpperCase();
}

/**
 * Effectif enrichi de l'onglet « Effectif ».
 *
 * Il n'existe pas d'endpoint dédié : la ligne est composée de sources qui, elles, existent —
 * le roster (`/api/erp/employees`), la masse salariale du mois courant (matricule, agence,
 * type de collaborateur de tout l'effectif payable), celle du dernier mois clôturé (net figé
 * + agents sortis depuis), le tableau d'anomalies (déclarations manquantes ou jamais
 * renseignées) et les contrats datés (seule source d'une déclaration POSITIVE en liste).
 *
 * Aucune de ces sources n'est appelée par employé : cinq requêtes au total, quel que soit
 * l'effectif. Le jour où le backend expose `GET /api/erp/personnel/effectif`, cette fonction
 * devient un GET et les écrans ne changent pas d'une ligne.
 */
export async function obtenirEffectif(): Promise<IEffectif> {
  const [roster, mois, anomalies, contrats] = await Promise.all([
    listerRoster(),
    listerMoisMasseSalariale(24).catch(() => [] as IMasseSalarialeMois[]),
    obtenirAnomalies().catch(() => null),
    // Horizon large : on ne cherche pas les échéances mais l'état de déclaration réellement
    // enregistré. C'est la seule liste transverse qui le porte.
    listerContratsEcheance(3650).catch(() => [] as IEmployeContrat[]),
  ]);

  const moisOuvert = mois.find((m) => m.statut === 'OUVERT') ?? null;
  const moisCloture = mois.find((m) => m.statut === 'CLOTURE') ?? null;

  const [masseCourante, masseCloturee] = await Promise.all([
    moisOuvert ? obtenirMasseSalariale(moisOuvert.mois).catch(() => null) : Promise.resolve(null),
    moisCloture ? obtenirMasseSalariale(moisCloture.mois).catch(() => null) : Promise.resolve(null),
  ]);

  // Le mois ouvert décrit l'effectif d'aujourd'hui ; le mois clôturé rattrape les agents
  // sortis depuis (ils ne sont plus dans la masse courante mais gardent leur fiche).
  const enrichissements = new Map<string, IEnrichissement>();
  const enregistrer = (masse: IMasseSalariale | null) => {
    masse?.lignes
      ?.filter((l) => !l.regularisationDe)
      .forEach((l) => {
        if (!enrichissements.has(l.employeId)) {
          enrichissements.set(l.employeId, {
            matricule: l.matricule,
            poste: l.poste,
            agence: l.agence,
            typeCollaborateur: l.typeCollaborateur,
          });
        }
      });
  };
  enregistrer(masseCourante);
  enregistrer(masseCloturee);

  const netCloture = new Map<string, number>();
  masseCloturee?.lignes?.forEach((l) => {
    const cumul = netCloture.get(l.employeId) ?? 0;
    netCloture.set(l.employeId, cumul + (l.net ?? 0));
  });

  const nbAnomalies = new Map<string, number>();
  const declarationParEmploye = new Map<string, EtatDeclaration>();
  const matriculeAnomalie = new Map<string, string>();
  anomalies?.anomalies?.forEach((a) => {
    if (!a.employeId) return;
    nbAnomalies.set(a.employeId, (nbAnomalies.get(a.employeId) ?? 0) + 1);
    if (a.matricule && !matriculeAnomalie.has(a.employeId)) {
      matriculeAnomalie.set(a.employeId, a.matricule);
    }
    // Un contrat non déclaré prime sur une déclaration simplement non renseignée.
    if (a.type === CODE_ANOMALIE.CONTRAT_NON_DECLARE) {
      declarationParEmploye.set(a.employeId, 'NON_DECLARE');
    } else if (
      a.type === CODE_ANOMALIE.DECLARATION_INCONNUE &&
      declarationParEmploye.get(a.employeId) !== 'NON_DECLARE'
    ) {
      declarationParEmploye.set(a.employeId, 'INCONNU');
    }
  });

  // Déclaration POSITIVE : un contrat réellement marqué déclaré. C'est la seule donnée qui
  // autorise à écrire « Déclaré » — l'absence d'anomalie ne prouve rien (un agent dont le
  // contrat n'a jamais été saisi ne produit aucune anomalie de déclaration).
  const declarePositif = new Map<string, boolean>();
  (contrats ?? []).forEach((c) => {
    if (!c.employeId || c.declare === null || c.declare === undefined) return;
    if (!declarePositif.has(c.employeId)) declarePositif.set(c.employeId, c.declare);
  });

  const lignes: IEffectifLigne[] = (roster?.content ?? []).map((e) => {
    const enrichi = enrichissements.get(e.id);
    const type = enrichi?.typeCollaborateur ?? null;
    const actif = normaliser(e.statut) !== 'INACTIF';
    const signale = declarationParEmploye.get(e.id);
    const positif = declarePositif.get(e.id);
    // Ordre : l'anomalie prime (elle est calculée sur le contrat actif), puis la donnée
    // positive, puis le défaut INCONNU. Jamais « Déclaré » par défaut : afficher une
    // conformité qu'on n'a pas constatée est précisément le risque que ce module éclaire.
    const declaration: EtatDeclaration = !TYPES_A_DECLARER.includes(normaliser(type))
      ? 'NON_APPLICABLE'
      : signale
        ? signale
        : positif === true
          ? 'DECLARE'
          : positif === false
            ? 'NON_DECLARE'
            : 'INCONNU';

    return {
      employeId: e.id,
      nom: e.name ?? '—',
      matricule: enrichi?.matricule ?? matriculeAnomalie.get(e.id) ?? null,
      poste: enrichi?.poste ?? e.position ?? null,
      agence: enrichi?.agence ?? e.department ?? null,
      typeCollaborateur: type,
      enroleLe: e.entryDate ?? null,
      actif,
      // La date de sortie n'est pas servie par le roster : elle est lue sur la fiche.
      sortieLe: null,
      declaration,
      netDernierMoisCloture: netCloture.get(e.id) ?? null,
      nbAnomalies: nbAnomalies.get(e.id) ?? 0,
    };
  });

  const agences = Array.from(
    new Set(lignes.map((l) => l.agence).filter((a): a is string => !!a && a.trim().length > 0)),
  ).sort((a, b) => a.localeCompare(b, 'fr'));
  const types = Array.from(
    new Set(lignes.map((l) => l.typeCollaborateur).filter((t): t is string => !!t && t.trim().length > 0)),
  ).sort((a, b) => a.localeCompare(b, 'fr'));

  return {
    lignes,
    dernierMoisCloture: moisCloture?.mois ?? null,
    dernierMoisClotureLibelle: moisCloture?.moisLibelle ?? null,
    totalActifs: lignes.filter((l) => l.actif).length,
    totalSortis: lignes.filter((l) => !l.actif).length,
    nonDeclares: lignes.filter((l) => l.actif && l.declaration === 'NON_DECLARE').length,
    aConfirmer: lignes.filter((l) => l.actif && l.declaration === 'INCONNU').length,
    totalAnomalies: anomalies?.total ?? 0,
    masseDernierMoisCloture: moisCloture?.totalNet ?? null,
    agences,
    types,
  };
}

export const personnelHistorisationAPI = {
  obtenirHistoriqueRemuneration,
  creerRegularisationRemuneration,
  marquerDeclarationContrat,
  listerMoisMasseSalariale,
  obtenirMasseSalariale,
  obtenirComparaisonMasseSalariale,
  cloturerMasseSalariale,
  obtenirAnomalies,
  obtenirDossierAgent,
  listerParcours,
  listerContratsEcheance,
  obtenirHistoriqueFiche,
  basculerTypeLivreur,
  obtenirEffectif,
};
