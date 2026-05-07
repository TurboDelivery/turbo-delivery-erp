'use server';

import { getHistoriqueCreneauxApi } from '../apis/historique-creneaux.api';

export async function getHistoriqueCreneauxAction(params?: { page?: number; size?: number }) {
  return getHistoriqueCreneauxApi(params);
}
