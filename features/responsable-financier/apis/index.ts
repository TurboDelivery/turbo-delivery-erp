import { api } from '@/lib/api';
import type {
  IResponsableFinancierFactureListVm,
  IResponsableFinancierAgent,
  IResponsableFinancierFactureStatutVm,
  IResponsableFinancierFactureRecouvrementVm,
  IResponsableFinancierFactureParams,
  IFactureValidationRequestDto,
  IFactureRecouvrementAssignRequestDto,
  IFacturePreuveRequestDto,
  IFactureDepotPartenaireRequestDto,
  IFactureDepotBanqueRequestDto,
} from '../types';

/**
 * GET /api/finance/responsable-financier/factures
 * Liste paginée des factures pour le responsable financier
 */
export function getFactures(params?: IResponsableFinancierFactureParams): Promise<IResponsableFinancierFactureListVm> {
  return api.request<IResponsableFinancierFactureListVm>({
    endpoint: 'finance/responsable-financier/factures',
    method: 'GET',
    searchParams: params as Record<string, unknown>,
  });
}

/**
 * GET /api/finance/responsable-financier/factures/{id}
 * Détail d'une facture
 */
export function getFacture(id: string): Promise<object> {
  return api.request<object>({
    endpoint: `finance/responsable-financier/factures/${id}`,
    method: 'GET',
  });
}

/**
 * GET /api/finance/responsable-financier/agents
 * Lister les agents disponibles pour le recouvrement
 */
export function getAgents(): Promise<IResponsableFinancierAgent[]> {
  return api.request<IResponsableFinancierAgent[]>({
    endpoint: 'finance/responsable-financier/agents',
    method: 'GET',
  });
}

/**
 * PATCH /api/finance/responsable-financier/factures/{id}/valider
 * Valider une facture
 */
export function validerFacture(
  id: string,
  body: IFactureValidationRequestDto,
  userId?: string,
): Promise<IResponsableFinancierFactureStatutVm> {
  return api.request<IResponsableFinancierFactureStatutVm>({
    endpoint: `finance/responsable-financier/factures/${id}/valider`,
    method: 'PATCH',
    data: body,
    headers: userId ? { 'X-User-Id': userId } : undefined,
  });
}

/**
 * PATCH /api/finance/responsable-financier/factures/{id}/viser-dg
 * Viser une facture par le DG
 */
export function viserDgFacture(
  id: string,
  userId?: string,
): Promise<IResponsableFinancierFactureStatutVm> {
  return api.request<IResponsableFinancierFactureStatutVm>({
    endpoint: `finance/responsable-financier/factures/${id}/viser-dg`,
    method: 'PATCH',
    headers: userId ? { 'X-User-Id': userId } : undefined,
  });
}

/**
 * PATCH /api/finance/responsable-financier/factures/{id}/recouvrement
 * Assigner un agent de recouvrement à une facture
 */
export function assignerRecouvrementFacture(
  id: string,
  body: IFactureRecouvrementAssignRequestDto,
): Promise<IResponsableFinancierFactureRecouvrementVm> {
  return api.request<IResponsableFinancierFactureRecouvrementVm>({
    endpoint: `finance/responsable-financier/factures/${id}/recouvrement`,
    method: 'PATCH',
    data: body,
  });
}

/**
 * PATCH /api/finance/responsable-financier/factures/{id}/preuve
 * Ajouter une preuve sur une facture
 */
export function ajouterPreuveFacture(
  id: string,
  body: IFacturePreuveRequestDto,
  userId?: string,
): Promise<IResponsableFinancierFactureStatutVm> {
  return api.request<IResponsableFinancierFactureStatutVm>({
    endpoint: `finance/responsable-financier/factures/${id}/preuve`,
    method: 'PATCH',
    data: body,
    headers: userId ? { 'X-User-Id': userId } : undefined,
  });
}

/**
 * PATCH /api/finance/responsable-financier/factures/{id}/depot-partenaire
 * Marquer le dépôt partenaire d'une facture
 */
export function marquerDepotPartenaireFacture(
  id: string,
  body: IFactureDepotPartenaireRequestDto,
): Promise<IResponsableFinancierFactureStatutVm> {
  return api.request<IResponsableFinancierFactureStatutVm>({
    endpoint: `finance/responsable-financier/factures/${id}/depot-partenaire`,
    method: 'PATCH',
    data: body,
  });
}

/**
 * PATCH /api/finance/responsable-financier/factures/{id}/depot-banque
 * Marquer le dépôt banque d'une facture
 */
export function marquerDepotBanqueFacture(
  id: string,
  body: IFactureDepotBanqueRequestDto,
  userId?: string,
): Promise<IResponsableFinancierFactureStatutVm> {
  return api.request<IResponsableFinancierFactureStatutVm>({
    endpoint: `finance/responsable-financier/factures/${id}/depot-banque`,
    method: 'PATCH',
    data: body,
    headers: userId ? { 'X-User-Id': userId } : undefined,
  });
}
