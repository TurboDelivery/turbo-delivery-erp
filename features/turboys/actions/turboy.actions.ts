import { turboyAPI } from '@/features/turboys/apis/turboy.api';
import { ITurboyParams, ITurboy } from '@/features/turboys/types/turboys.types';
import { PaginatedResponse } from '@/types/general';

export async function getTurboysByType(params: ITurboyParams): Promise<PaginatedResponse<ITurboy>> {
  return turboyAPI.obtenirTurboyParType(params);
}

export async function getTurboyById(id: string): Promise<ITurboy> {
  return turboyAPI.obtenirTurboy(id);
}

