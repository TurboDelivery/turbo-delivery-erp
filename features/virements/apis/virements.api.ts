import { api } from '@/lib/api';
import { SearchParams } from 'ak-api-http';
import {
  ICreerPayeur,
  ICreerVirement,
  IEnregistrerParametre,
  IParametreReglement,
  IPayeur,
  IPayeurRattachement,
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
