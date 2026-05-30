import { api } from '@/lib/api';
import type {
  IAttestationCaisseDTO,
  IAttestationCaisseVm,
  IOrientationDTO,
  IReorientationDTO,
  IStatutVm,
  IVerificationDepots,
} from '../types';

// Le frontend admin-erp n'envoie pas de token ; l'identité (DG/DGA/Caissier
// décideur) est tracée via le header X-User-Id côté backend.
function withUserHeader(userId?: string) {
  return userId ? { headers: { 'X-User-Id': userId } } : undefined;
}

const BASE = 'finance/responsable-financier';

export const orientationFondsAPI = {
  // SPEC-RECOUV-002 (A) — décision d'orientation (DG/DGA) après visa.
  orienter(id: string, data: IOrientationDTO, userId?: string): Promise<IStatutVm> {
    return api.request<IStatutVm>({
      endpoint: `${BASE}/factures/${id}/orientation`,
      method: 'PATCH',
      data,
      config: withUserHeader(userId),
    });
  },

  // Ré-orientation caisse → banque.
  reorienter(id: string, data: IReorientationDTO, userId?: string): Promise<IStatutVm> {
    return api.request<IStatutVm>({
      endpoint: `${BASE}/factures/${id}/reorienter`,
      method: 'PATCH',
      data,
      config: withUserHeader(userId),
    });
  },

  // SPEC-RECOUV-002 (4.3) — attestation de comptage physique de caisse.
  enregistrerAttestation(data: IAttestationCaisseDTO, userId?: string): Promise<IAttestationCaisseVm> {
    return api.request<IAttestationCaisseVm>({
      endpoint: `${BASE}/caisse/attestation`,
      method: 'POST',
      data,
      config: withUserHeader(userId),
    });
  },

  listAttestations(): Promise<IAttestationCaisseVm[]> {
    return api.request<IAttestationCaisseVm[]>({
      endpoint: `${BASE}/caisse/attestations`,
      method: 'GET',
    });
  },

  // SPEC-RECOUV-002 (4.4) — données de rapprochement visa↔bordereau + caisse.
  getVerificationDepots(): Promise<IVerificationDepots> {
    return api.request<IVerificationDepots>({
      endpoint: `${BASE}/verification-depots`,
      method: 'GET',
    });
  },
};
