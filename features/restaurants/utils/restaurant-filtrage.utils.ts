// Le vocabulaire partagé de la liste des partenaires : ce qui filtre, ce qui trie, et
// comment un code se dit en français. Pur, sans React et sans 'use server' — le tableau à
// l'écran, les compteurs et le fichier exporté s'en servent tous les trois.

import type { IRestaurant, IRestaurantParams } from '@/features/restaurants/types/restaurant.type';

const TRENTE_JOURS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Le cycle de paiement, en français.
 *
 * <p>Cette table vivait en DOUBLE, recopiée dans `content.tsx` et dans
 * `restaurant-table-columns.tsx`. Le fichier exporté en aurait fait une troisième copie, et
 * trois tables séparées finissent par ne plus dire la même chose. Le repli sur la valeur
 * brute est délibéré : l'énumération du backend porte plus de valeurs que l'ERP n'en
 * libelle, et une valeur inconnue doit se lire telle quelle plutôt que disparaître.</p>
 */
export const RECOUVREMENT_LABELS: Record<string, string> = {
  MENSUEL: 'Mensuel',
  QUOTIDIEN: 'Quotidien',
  HEBDOMADAIRE: 'Hebdomadaire',
  QUINZAINE: 'Quinzaine',
};

export function libelleRecouvrement(methode?: string | null): string {
  if (!methode) return '';
  return RECOUVREMENT_LABELS[methode] ?? methode;
}

/**
 * L'état du compte, en français.
 *
 * <p>Codes backend (`RestaurantTable.status`) : 0 désactivé, 2 partiellement validé,
 * 1 et 3 compte actif. La même règle que `StatusChip` à l'écran, écrite une seule fois pour
 * que la pastille et le fichier ne puissent pas diverger.</p>
 */
export function libelleStatutPartenaire(status?: number | null): string {
  if (status === 0) return 'Inactif';
  if (status === 2) return 'Partiellement validé';
  if (status != null && status >= 1) return 'Validé';
  return '';
}

/** Créé dans les 30 derniers jours. C'est ce que dit la carte « Nouveaux (30 j) ». */
export function estNouveau(createdAt?: string | null): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  return Number.isFinite(t) && Date.now() - t <= TRENTE_JOURS_MS;
}

/**
 * Une vue par état du compte.
 *
 * <p>Les vues ne sont PAS exclusives : « Validés » contient « Partiellement validés », et
 * « Nouveaux » est une fenêtre de 30 jours qui recoupe les autres. Leurs compteurs ne
 * s'additionnent donc pas, et le fichier exporté le dit.</p>
 */
export function statutMatch(vue: string, r: IRestaurant): boolean {
  switch (vue) {
    case 'valides':
      return (r.status ?? 0) >= 1;
    case 'partiels':
      return r.status === 2;
    case 'nouveaux':
      return estNouveau(r.createdAt);
    case 'inactifs':
      return r.status === 0;
    default:
      return true;
  }
}

/**
 * Le filtrage et le tri de la liste, en mémoire.
 *
 * <h3>Pourquoi cette fonction est partagée</h3>
 * <p>L'écran et le fichier exporté doivent montrer exactement la même population. Tant que
 * chacun portait sa propre copie du filtrage, ils divergeaient : le bouton d'export
 * n'envoyait pas la vue `statut`, si bien qu'exporter depuis la carte « Inactifs » aurait
 * rendu les 71 partenaires au lieu des 2 affichés. Un fichier qui ne correspond pas à
 * l'écran qui l'a produit est pire qu'un fichier absent : on ne s'en aperçoit pas.</p>
 *
 * <p>`page` et `limit` ne sont PAS traités ici. Le découpage appartient à l'appelant :
 * l'écran en veut dix, le fichier les veut toutes.</p>
 */
export function filtrerEtTrierRestaurants(all: IRestaurant[], params: IRestaurantParams): IRestaurant[] {
  const norm = (s?: string | null) => (s ?? '').toLowerCase().trim();
  // `nomEtablissement` et `search` portent la MÊME valeur : la recherche libre de l'écran
  // ne cherche que dans le nom. Les cumuler filtrerait deux fois sur le même critère.
  const search = norm(params.nomEtablissement || params.search);
  const localisation = norm(params.localisation);
  const email = norm(params.email);
  const telephone = norm(params.telephone);
  const commune = norm(params.commune);
  const method = norm(params.methodRecouvrement);

  const filtered = (all ?? []).filter((r) => {
    if (search && !norm(r.nomEtablissement).includes(search)) return false;
    if (localisation && !norm(r.localisation).includes(localisation)) return false;
    if (email && !norm(r.email).includes(email)) return false;
    if (telephone && !norm(r.telephone).includes(telephone)) return false;
    if (commune && !norm(r.commune).includes(commune)) return false;
    if (method && norm(r.methodRecouvrement) !== method) return false;
    if (params.statut && !statutMatch(params.statut, r)) return false;
    return true;
  });

  if (!params.orderBy) return filtered;

  const key = params.orderBy as keyof IRestaurant;
  const dir = params.orderDirection === 'desc' ? -1 : 1;
  return [...filtered].sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1 * dir;
    if (bv == null) return -1 * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

/** Les compteurs des cartes, recalculés sur une population donnée. */
export function compterParStatut(lignes: IRestaurant[]) {
  return {
    total: lignes.length,
    valides: lignes.filter((r) => (r.status ?? 0) >= 1).length,
    partiels: lignes.filter((r) => r.status === 2).length,
    nouveaux: lignes.filter((r) => estNouveau(r.createdAt)).length,
    inactifs: lignes.filter((r) => r.status === 0).length,
  };
}
