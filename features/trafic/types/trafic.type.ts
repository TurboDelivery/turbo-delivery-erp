export type {
  LivreurDisponible,
  LivreurTrafic,
  LivreurCategorie,
  StatutTrafic,
  TraficLivreursResponse,
} from '@/types/models';

import type { LivreurCategorie, TraficLivreursResponse } from '@/types/models';

const categorieVide = (): LivreurCategorie => ({ total: 0, liste: [] });

/** Réponse neutre : premier rendu, échec réseau, ou cache vide côté socket. */
export const traficVide = (): TraficLivreursResponse => ({
  disponibles: categorieVide(),
  enActivite: categorieVide(),
  enPause: categorieVide(),
  horsService: categorieVide(),
  horsRayon: categorieVide(),
  indisponibles: categorieVide(),
  totalLivreurs: 0,
  totalEnService: 0,
});

export const EMPTY_TRAFIC_RESPONSE: TraficLivreursResponse = traficVide();
