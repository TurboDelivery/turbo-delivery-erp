export type {
  LivreurDisponible,
  LivreurTrafic,
  LivreurCategorie,
  TraficLivreursResponse,
} from '@/types/models';

import type { TraficLivreursResponse } from '@/types/models';

export const EMPTY_TRAFIC_RESPONSE: TraficLivreursResponse = {
  disponibles: { total: 0, liste: [] },
  enActivite: { total: 0, liste: [] },
  indisponibles: { total: 0, liste: [] },
  horsRayon: { total: 0, liste: [] },
  totalLivreurs: 0,
};
