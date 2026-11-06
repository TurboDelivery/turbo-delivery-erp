import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import {
  ICreerPayeur,
  ICreerVirement,
  IEnregistrerParametre,
  IParametreReglement,
  IPayeur,
  IPayeurRattachement,
  IReleveParams,
  IReleveReglement,
  IVirementRecu,
} from '../types/virements.types';

// Backend : main-backend (service erp), /api/erp/releve/*.
export const virementsAPI = {
  listerPayeurs(): Promise<IPayeur[]> {
    return api.request<IPayeur[]>({ endpoint: 'erp/releve/payeurs', method: 'GET' });
  },

  creerPayeur(dto: ICreerPayeur): Promise<IPayeur> {
    return api.request<IPayeur>({ endpoint: 'erp/releve/payeurs', method: 'POST', data: dto });
  },

  rattachements(payeurId: string): Promise<IPayeurRattachement[]> {
    return api.request<IPayeurRattachement[]>({
      endpoint: `erp/releve/payeurs/${payeurId}/rattachements`,
      method: 'GET',
    });
  },

  rattacher(payeurId: string, dto: Pick<ICreerPayeur, 'groupeIds' | 'restaurantIds'>): Promise<void> {
    return api.request<void>({
      endpoint: `erp/releve/payeurs/${payeurId}/rattachements`,
      method: 'POST',
      data: dto,
    });
  },

  detacher(rattachementId: string): Promise<void> {
    return api.request<void>({
      endpoint: `erp/releve/rattachements/${rattachementId}`,
      method: 'DELETE',
    });
  },

  /**
   * ⚠ Sans payeur, on ne demande RIEN plutôt que d'appeler sans filtre : la route
   * exige `payeurIds`, et un appel vide remonterait une erreur serveur là où il n'y a
   * simplement rien à afficher.
   */
  listerVirements(payeurIds: string[]): Promise<IVirementRecu[]> {
    if (!payeurIds.length) return Promise.resolve([]);
    return api.request<IVirementRecu[]>({
      endpoint: 'erp/releve/virements',
      method: 'GET',
      searchParams: { payeurIds: payeurIds.join(',') } as SearchParams,
    });
  },

  creerVirement(dto: ICreerVirement): Promise<IVirementRecu> {
    return api.request<IVirementRecu>({
      endpoint: 'erp/releve/virements',
      method: 'POST',
      data: dto,
    });
  },

  /** Un virement ne s'efface pas : il s'annule, et le motif est obligatoire. */
  annulerVirement(virementId: string, motif: string): Promise<IVirementRecu> {
    return api.request<IVirementRecu>({
      endpoint: `erp/releve/virements/${virementId}/annuler`,
      method: 'POST',
      data: { motif },
    });
  },


  /**
   * Le volet règlement d'une sélection : facturé, réglé, prélèvement, Gap.
   *
   * <p>MÊME endpoint que les deux PDF du relevé. L'écran de performance et l'export
   * lisent donc la même source, ce qui est tout l'objet de la corrélation demandée :
   * deux calculs séparés divergent à la première grandeur ajoutée.</p>
   *
   * <p>⚠ Le détail des tickets (Annexe 3) n'est PAS demandé ici : `detail` reste à faux.
   * Sur un groupe de dix établissements sur l'année, c'est plusieurs dizaines de milliers
   * de lignes transportées pour afficher quatre nombres.</p>
   */
  lireReglement(params: IReleveParams): Promise<IReleveReglement> {
    const recherche: Record<string, string> = {
      debut: params.debut.toISOString().split('T')[0],
      fin: params.fin.toISOString().split('T')[0],
    };
    // Un seul paramètre de sélection part, jamais deux : la précédence du serveur est
    // reproduite ici, comme dans `performanceAPI`, pour que ce qui est envoyé soit ce
    // qui est demandé.
    if (params.groupeId) {
      recherche.groupeId = params.groupeId;
    } else if (params.restaurantIds?.length) {
      recherche.restaurantIds = params.restaurantIds.join(',');
    }
    return api.request<IReleveReglement>({
      endpoint: 'erp/releve/donnees',
      method: 'GET',
      searchParams: recherche as SearchParams,
    });
  },

  /** `null` quand rien n'est paramétré : le relevé applique alors une retenue de 0. */
  lireParametre(cible: { groupeId?: string; restaurantId?: string }): Promise<IParametreReglement | null> {
    return api.request<IParametreReglement | null>({
      endpoint: 'erp/releve/parametres',
      method: 'GET',
      searchParams: {
        groupeId: cible.groupeId || undefined,
        restaurantId: cible.restaurantId || undefined,
      } as SearchParams,
    });
  },

  enregistrerParametre(dto: IEnregistrerParametre): Promise<IParametreReglement> {
    return api.request<IParametreReglement>({
      endpoint: 'erp/releve/parametres',
      method: 'PUT',
      data: dto,
    });
  },
};
