'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient , keepPreviousData} from '@tanstack/react-query';

import {
  fetchFilleAttente,
  fetchReferentielFileAttente,
  fetchStatistiqueFilleAttente,
} from '@/src/actions/file-attente.actions';
import type { FilleAttenteVM } from '@/types/file-attente.model';
import { instantEntree } from '../utils/file-attente.utils';

/** Cadence de rafraîchissement de la file : 30 s, comme le reste du Trafic. */
const RAFRAICHISSEMENT_MS = 30_000;
/** Le référentiel (postes, contrats) bouge à la journée, pas à la minute. */
const RAFRAICHISSEMENT_REFERENTIEL_MS = 5 * 60_000;

export const fileAttenteKeys = {
  all: ['file-attente'] as const,
  historique: () => [...fileAttenteKeys.all, 'historique'] as const,
  referentiel: () => [...fileAttenteKeys.all, 'referentiel'] as const,
  statistique: () => [...fileAttenteKeys.all, 'statistique'] as const,
};

/** Un livreur dans la file d'un poste, prêt à afficher. */
export interface LigneFileVue {
  cle: string;
  livreurId?: string;
  /** Rang RECALCULÉ (1, 2, 3…) — jamais la colonne `position` brute. */
  rang: number;
  nomComplet: string;
  avatar?: string;
  /** Type de contrat (INDEPENDANT / JOURNALIER / SUPERVISEUR_LIVREUR), si connu. */
  typeContrat?: string;
  entreeLe: Date | null;
}

/** Un poste et sa file, dans l'ordre où les courses seront distribuées. */
export interface PosteFileVue {
  restaurantId: string;
  restaurant: string;
  livreursAssignes: number;
  file: LigneFileVue[];
  /** Aucun livreur en file : le poste ne peut servir aucune commande. */
  desert: boolean;
}

export interface FileAttenteKpis {
  postesPourvus: number;
  livreursEnFile: number;
  postesDeserts: number;
  commandesEnAttente: number | null;
}

/**
 * Assemble la vue de l'écran File d'attente.
 *
 * <p>Trois sources, trois cadences :</p>
 * <ul>
 *   <li>la FILE du jour (30 s) — qui attend, dans quel ordre, depuis quand ;</li>
 *   <li>le RÉFÉRENTIEL des postes (5 min) — sans lui, un poste déserté serait
 *       invisible : il n'a plus aucune ligne de file, donc n'apparaît pas dans
 *       l'historique ;</li>
 *   <li>les STATISTIQUES du jour (30 s) — commandes en attente, pour mettre le
 *       manque de livreurs en regard de la demande.</li>
 * </ul>
 */
export function useFileAttenteVue() {
  const queryClient = useQueryClient();

  const fileQuery = useQuery({
    queryKey: fileAttenteKeys.historique(),
    queryFn: () => fetchFilleAttente(),
    refetchInterval: RAFRAICHISSEMENT_MS,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  const referentielQuery = useQuery({
    queryKey: fileAttenteKeys.referentiel(),
    queryFn: () => fetchReferentielFileAttente(),
    refetchInterval: RAFRAICHISSEMENT_REFERENTIEL_MS,
    staleTime: RAFRAICHISSEMENT_REFERENTIEL_MS,
    placeholderData: keepPreviousData,
  });

  const statistiqueQuery = useQuery({
    queryKey: fileAttenteKeys.statistique(),
    queryFn: () => fetchStatistiqueFilleAttente(),
    refetchInterval: RAFRAICHISSEMENT_MS,
    placeholderData: keepPreviousData,
  });

  // Les durées d'attente doivent vieillir à l'écran même entre deux relectures.
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    const battement = setInterval(() => setMaintenant(Date.now()), 30_000);
    return () => clearInterval(battement);
  }, []);

  const typeParLivreur = referentielQuery.data?.typeParLivreur ?? {};

  const postes = useMemo<PosteFileVue[]>(() => {
    const parRestaurant = new Map<string, PosteFileVue>();

    // 1. L'univers : tous les postes pourvus en livreurs, file ou pas.
    for (const poste of referentielQuery.data?.postes ?? []) {
      parRestaurant.set(poste.restaurantId, {
        restaurantId: poste.restaurantId,
        restaurant: poste.restaurant,
        livreursAssignes: poste.livreursAssignes,
        file: [],
        desert: true,
      });
    }

    // 2. La file du jour vient remplir cet univers.
    for (const groupe of fileQuery.data ?? []) {
      const restaurantId = groupe?.restaurantId;
      if (!restaurantId) continue;

      const file = ordonnerFile(groupe.fileAttentes ?? [], typeParLivreur);
      const existant = parRestaurant.get(restaurantId);

      if (existant) {
        existant.file = file;
        existant.desert = file.length === 0;
        // Un poste peut compter plus de monde en file que d'assignés connus
        // (assignation récente pas encore relue) : on ne montre jamais un
        // effectif inférieur à ce qu'on voit de nos yeux.
        existant.livreursAssignes = Math.max(existant.livreursAssignes, file.length);
        continue;
      }

      // Restaurant absent du référentiel (assignation via un autre chemin,
      // référentiel momentanément indisponible) : on l'affiche quand même,
      // on ne cache jamais une file réelle.
      parRestaurant.set(restaurantId, {
        restaurantId,
        restaurant: groupe.restaurant?.trim() || 'Partenaire sans nom',
        livreursAssignes: file.length,
        file,
        desert: file.length === 0,
      });
    }

    // 3. Les postes en difficulté d'abord — un poste déserté est le seul
    //    élément de cet écran sur lequel on peut encore agir.
    return Array.from(parRestaurant.values()).sort((a, b) => {
      if (a.desert !== b.desert) return a.desert ? -1 : 1;
      return a.restaurant.localeCompare(b.restaurant, 'fr');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileQuery.data, referentielQuery.data]);

  const kpis = useMemo<FileAttenteKpis>(
    () => ({
      postesPourvus: postes.filter((p) => !p.desert).length,
      livreursEnFile: postes.reduce((total, p) => total + p.file.length, 0),
      postesDeserts: postes.filter((p) => p.desert).length,
      commandesEnAttente: statistiqueQuery.data?.commandeEnAttente ?? null,
    }),
    [postes, statistiqueQuery.data],
  );

  /**
   * Le compte des postes déserts n'a de sens que si l'univers des postes a pu
   * être lu. Sans lui, l'écran afficherait un rassurant « 0 poste sans
   * livreur » qui ne voudrait rien dire.
   */
  const universeIncomplet =
    referentielQuery.isError || (referentielQuery.isFetched && (referentielQuery.data?.postes.length ?? 0) === 0);

  return {
    postes,
    kpis,
    maintenant,
    isLoading: fileQuery.isLoading,
    isFetching: fileQuery.isFetching || referentielQuery.isFetching,
    isError: fileQuery.isError,
    derniereLecture: fileQuery.dataUpdatedAt,
    universeIncomplet,
    rafraichir: () => queryClient.invalidateQueries({ queryKey: fileAttenteKeys.all }),
  };
}

/**
 * Trie la file d'un poste et lui redonne des rangs contigus.
 *
 * <p>La colonne `position` peut comporter des trous et, plus rarement, des
 * doublons (deux écritures concurrentes sur le même livreur). Afficher
 * « N°1, N°3, N°3 » à un opérateur serait pire qu'inutile : on trie sur les
 * signaux disponibles puis on numérote nous-mêmes.</p>
 */
function ordonnerFile(
  entrees: FilleAttenteVM[],
  typeParLivreur: Record<string, string>,
): LigneFileVue[] {
  const vues = entrees.map((entree, index) => ({
    entree,
    index,
    entreeLe: instantEntree(entree),
  }));

  vues.sort((a, b) => {
    const positionA = a.entree.position ?? Number.MAX_SAFE_INTEGER;
    const positionB = b.entree.position ?? Number.MAX_SAFE_INTEGER;
    if (positionA !== positionB) return positionA - positionB;

    const heureA = a.entreeLe?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const heureB = b.entreeLe?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (heureA !== heureB) return heureA - heureB;

    return (a.entree.nomComplet ?? '').localeCompare(b.entree.nomComplet ?? '', 'fr');
  });

  const dejaVu = new Set<string>();
  const lignes: LigneFileVue[] = [];

  for (const vue of vues) {
    const identite =
      vue.entree.livreurId ?? vue.entree.id ?? `${vue.entree.nomComplet ?? ''}#${vue.index}`;
    if (dejaVu.has(identite)) continue;
    dejaVu.add(identite);

    lignes.push({
      cle: vue.entree.id ?? identite,
      livreurId: vue.entree.livreurId,
      rang: lignes.length + 1,
      nomComplet: vue.entree.nomComplet?.trim() || 'Livreur sans nom',
      avatar: vue.entree.avatar ?? undefined,
      typeContrat: vue.entree.livreurId ? typeParLivreur[vue.entree.livreurId] : undefined,
      entreeLe: vue.entreeLe,
    });
  }

  return lignes;
}
