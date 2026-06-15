'use server';

import { compteLivreurAPI } from '@/features/turboys/apis/compte-livreur.api';
import { ITurboy } from '@/features/turboys/types/turboys.types';
import {
  ChangerStatutPieceDTO,
  CleActivationVm,
  EmissionCle,
  LivreurEvenementVm,
  ValiderCompteDTO,
  ValidationCompteVm,
} from '@/features/turboys/types/compte-livreur.types';
import { ActionResponse } from '@/types';
import { handleServerActionError } from '@/utils/handleServerActionError';
import { AxiosError } from 'axios';

/** Extrait un message lisible d'une erreur serveur (409/400…). */
function messageErreur(error: unknown, fallback: string): ActionResponse<never> {
  if (error instanceof AxiosError) {
    const serverMsg = error.response?.data?.message || error.response?.data || error.message;
    return { success: false, error: typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg) };
  }
  return handleServerActionError(error, fallback);
}

export async function validerCompteAction(id: string, dto: ValiderCompteDTO): Promise<ActionResponse<ValidationCompteVm>> {
  try {
    const data = await compteLivreurAPI.valider(id, dto);
    return { success: true, data, message: 'Compte validé et clé d’activation émise.' };
  } catch (error) {
    console.error('❌ Erreur validation compte:', error);
    return messageErreur(error, 'Erreur lors de la validation du compte');
  }
}

export async function changerStatutPieceAction(id: string, dto: ChangerStatutPieceDTO): Promise<ActionResponse<ITurboy>> {
  try {
    const data = await compteLivreurAPI.changerStatutPiece(id, dto);
    return { success: true, data, message: 'Statut de la pièce mis à jour.' };
  } catch (error) {
    console.error('❌ Erreur statut pièce:', error);
    return messageErreur(error, 'Erreur lors de la mise à jour de la pièce');
  }
}

export async function emettreCleAction(id: string, motif?: string): Promise<ActionResponse<EmissionCle>> {
  try {
    const data = await compteLivreurAPI.emettreCle(id, motif);
    return { success: true, data, message: 'Nouvelle clé d’activation émise.' };
  } catch (error) {
    console.error('❌ Erreur émission clé:', error);
    return messageErreur(error, 'Erreur lors de l’émission de la clé');
  }
}

export async function listerClesAction(id: string): Promise<CleActivationVm[]> {
  return compteLivreurAPI.listerCles(id);
}

export async function listerEvenementsAction(id: string): Promise<LivreurEvenementVm[]> {
  return compteLivreurAPI.listerEvenements(id);
}
