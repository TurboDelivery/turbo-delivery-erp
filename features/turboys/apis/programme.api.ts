import { apiClientHttp } from '@/lib/api-client-http';
import type { IAuditAction } from '@/features/supervision/types';
import {
  IAccorderSurplusPayload,
  IPreuveCarburant,
  IRelancePreuves,
  IValiderPreuvePayload,
  IAffecterSitePayload,
  ISoumissionSurplus,
  ISurplus,
  IBandeauCarburant,
  IProgramme,
  ICreerProgrammePayload,
  IModifierProgrammePayload,
  IAutosuffisanceJour,
  IEtatCarburantSemaine,
  IDupliquerSemainePayload,
  IDuplicationSemaine,
} from '@/features/turboys/types/programme.types';

/**
 * Programmes hebdomadaires (M2). Endpoints backend déployés. On mirrore le pattern
 * pointage : pas de `service` → baseURL par défaut (proxy /api/erp).
 */
export const programmeAPI = {
  async listerSemaine(annee: number, semaine: number): Promise<IProgramme[]> {
    return apiClientHttp.request<IProgramme[]>({
      endpoint: '/api/erp/programmes',
      method: 'GET',
      params: { annee, semaine },
    });
  },

  async autosuffisance(annee: number, semaine: number): Promise<IAutosuffisanceJour[]> {
    return apiClientHttp.request<IAutosuffisanceJour[]>({
      endpoint: '/api/erp/programmes/autosuffisance',
      method: 'GET',
      params: { annee, semaine },
    });
  },

  async detail(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}`,
      method: 'GET',
    });
  },

  async creer(payload: ICreerProgrammePayload): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: '/api/erp/programmes',
      method: 'POST',
      data: payload,
    });
  },

  async modifier(id: string, payload: Omit<IModifierProgrammePayload, 'id'>): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}`,
      method: 'PUT',
      data: {
        // ⚠ Les trois champs de sites ne sont PAS ramenés à une valeur par défaut, au
        // contraire des deux au-dessus. Absent et vide ne disent pas la même chose :
        // absent, le serveur n'y touche pas ; vide, il efface. Écrire `?? []` ici ferait
        // effacer les sites desservis par « Ajuster le carburant », qui n'envoie que des
        // montants. Un `undefined` disparaît à la sérialisation, c'est exactement voulu.
        basesGerees: payload.basesGerees,
        jours: payload.jours,
        siteModifie: payload.siteModifie ?? false,
        sitePartnerId: payload.sitePartnerId ?? null,
        sitesDesservis: payload.sitesDesservis,
        sitesParJour: payload.sitesParJour,
      },
    });
  },

  /** Copie une semaine entière vers une semaine vide ; 409 avec la raison sinon. */
  async dupliquerSemaine(payload: IDupliquerSemainePayload): Promise<IDuplicationSemaine> {
    return apiClientHttp.request<IDuplicationSemaine>({
      endpoint: '/api/erp/programmes/dupliquer',
      method: 'POST',
      data: payload,
    });
  },

  /** Renvoie le programme par WhatsApp, sans le republier. */
  async renvoyerWhatsApp(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}/whatsapp`,
      method: 'POST',
    });
  },

  /** L'histoire d'un programme : qui a changé quoi, et quand. */
  async historique(id: string): Promise<IAuditAction[]> {
    return apiClientHttp.request<IAuditAction[]>({
      endpoint: `/api/erp/programmes/${id}/historique`,
      method: 'GET',
    });
  },

  async planifier(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}/planifier`,
      method: 'POST',
    });
  },

  async publier(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}/publier`,
      method: 'POST',
    });
  },

  async envoyer(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}/envoyer`,
      method: 'POST',
    });
  },

  async independants(annee: number, semaine: number): Promise<IProgramme[]> {
    return apiClientHttp.request<IProgramme[]>({
      endpoint: '/api/erp/programmes/independants',
      method: 'GET',
      params: { annee, semaine },
    });
  },

  async supprimer(id: string): Promise<void> {
    await apiClientHttp.request<void>({
      endpoint: `/api/erp/programmes/${id}`,
      method: 'DELETE',
    });
  },

  // ── Preuves de versement Wave (§9) ─────────────────────────────────────────

  /** Toutes les preuves d'un programme, REJETÉES COMPRISES (RG-W03). */
  async listerPreuves(programmeId: string): Promise<IPreuveCarburant[]> {
    return apiClientHttp.request<IPreuveCarburant[]>({
      endpoint: `/api/erp/programmes/${programmeId}/preuves`,
      method: 'GET',
    });
  },

  async validerPreuve(programmeId: string, preuveId: string, payload: IValiderPreuvePayload): Promise<IPreuveCarburant> {
    return apiClientHttp.request<IPreuveCarburant>({
      data: payload,
      endpoint: `/api/erp/programmes/${programmeId}/preuves/${preuveId}/valider`,
      method: 'POST',
    });
  },

  /** Demander une nouvelle capture (CA-54). La capture refusée reste lisible. */
  async rejeterPreuve(programmeId: string, preuveId: string, motif: string): Promise<IPreuveCarburant> {
    return apiClientHttp.request<IPreuveCarburant>({
      data: { motif },
      endpoint: `/api/erp/programmes/${programmeId}/preuves/${preuveId}/rejeter`,
      method: 'POST',
    });
  },

  /** Qui est en retard, et sur quoi : l'écran le montre AVANT d'envoyer. */
  async etatRelancePreuves(annee: number, semaine: number): Promise<IRelancePreuves> {
    return apiClientHttp.request<IRelancePreuves>({
      endpoint: '/api/erp/programmes/preuves/relance',
      method: 'GET',
      params: { annee, semaine },
    });
  },

  /** Relancer (RG-W07). Liste vide = tous ceux qui ont une preuve manquante. */
  async relancerPreuves(annee: number, semaine: number, programmeIds?: string[]): Promise<IRelancePreuves> {
    return apiClientHttp.request<IRelancePreuves>({
      data: { annee, programmeIds: programmeIds ?? [], semaine },
      endpoint: '/api/erp/programmes/preuves/relance',
      method: 'POST',
    });
  },

  // ── Surplus de carburant (§7) ──────────────────────────────────────────────

  /** Les surplus d'un programme, ANNULÉS COMPRIS : l'écran les montre barrés (RG-C07). */
  async listerSurplus(programmeId: string): Promise<ISurplus[]> {
    return apiClientHttp.request<ISurplus[]>({
      endpoint: `/api/erp/programmes/${programmeId}/surplus`,
      method: 'GET',
    });
  },

  async accorderSurplus(programmeId: string, payload: IAccorderSurplusPayload): Promise<ISurplus> {
    return apiClientHttp.request<ISurplus>({
      data: payload,
      endpoint: `/api/erp/programmes/${programmeId}/surplus`,
      method: 'POST',
    });
  },

  async modifierSurplus(programmeId: string, surplusId: string, payload: IAccorderSurplusPayload): Promise<ISurplus> {
    return apiClientHttp.request<ISurplus>({
      data: payload,
      endpoint: `/api/erp/programmes/${programmeId}/surplus/${surplusId}`,
      method: 'PUT',
    });
  },

  /**
   * Annuler un surplus (RG-C07).
   *
   * ⚠ POST et non DELETE, bien que la spec écrive DELETE : la ligne n'est pas supprimée,
   * et le motif est obligatoire — un corps sur un DELETE est mal supporté par plusieurs
   * intermédiaires HTTP, et un motif perdu en route rendrait l'annulation muette.
   */
  async annulerSurplus(programmeId: string, surplusId: string, motif: string): Promise<ISurplus> {
    return apiClientHttp.request<ISurplus>({
      data: { motif },
      endpoint: `/api/erp/programmes/${programmeId}/surplus/${surplusId}/annuler`,
      method: 'POST',
    });
  },

  /** Où en est la soumission des surplus d'une semaine. */
  async etatSoumissionSurplus(annee: number, semaine: number): Promise<ISoumissionSurplus> {
    return apiClientHttp.request<ISoumissionSurplus>({
      endpoint: '/api/erp/programmes/surplus/soumission',
      method: 'GET',
      params: { annee, semaine },
    });
  },

  /**
   * Affecter à un autre site aujourd'hui (§3.3, RG-S08).
   *
   * Ne fait PAS repasser le programme en « à publier » : le reste de la semaine ne bouge
   * pas, il n'y a rien à re-valider. Le livreur est notifié par le serveur.
   */
  async affecterSite(id: string, payload: IAffecterSitePayload): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      data: payload,
      endpoint: `/api/erp/programmes/${id}/affectations`,
      method: 'POST',
    });
  },

  /** Dupliquer CE programme sur la semaine suivante (§6.2). 409 si le livreur y en a déjà un. */
  async dupliquerSurSemaineSuivante(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}/dupliquer-semaine-suivante`,
      method: 'POST',
    });
  },

  /**
   * Le bandeau du haut de page (§8.2) : total à décaisser surplus compris, dotation
   * validée, surplus, répartition journaliers / superviseurs, et les quatre compteurs de
   * preuves Wave.
   *
   * Distinct de `etatCarburant`, qui ne regarde que l'engagement comptable : celui-ci
   * additionne aussi les surplus, que l'engagement ignore par construction.
   */
  async bandeauCarburant(annee: number, semaine: number): Promise<IBandeauCarburant> {
    return apiClientHttp.request<IBandeauCarburant>({
      endpoint: '/api/erp/programmes/bandeau-carburant',
      method: 'GET',
      params: { annee, semaine },
    });
  },

  /** Carburant de la semaine : total publié, engagement existant, écart. */
  async etatCarburant(annee: number, semaine: number): Promise<IEtatCarburantSemaine> {
    return apiClientHttp.request<IEtatCarburantSemaine>({
      endpoint: '/api/erp/programmes/carburant',
      method: 'GET',
      params: { annee, semaine },
    });
  },
};
