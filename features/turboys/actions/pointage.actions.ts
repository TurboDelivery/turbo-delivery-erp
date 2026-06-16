'use server';

import { pointageAPI } from '@/features/turboys/apis/pointage.api';
import { IEmploiPointage } from '@/features/turboys/types/pointage.types';

export async function listerPointagesLivreurAction(livreurId: string): Promise<IEmploiPointage[]> {
  return pointageAPI.listerParLivreur(livreurId);
}
