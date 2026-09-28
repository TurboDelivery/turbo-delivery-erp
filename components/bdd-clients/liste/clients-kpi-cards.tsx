'use client';

import { Spinner } from '@heroui-v3/react';

import {
  formatNombre,
  formatPourcent,
  useBddClientsFilters,
  useKpisClientsQuery,
} from '@/features/bdd-clients';

/**
 * Les quatre cartes de tête de la base clients.
 *
 * <h3>Elles SUIVENT les filtres, contrairement à celles des encours</h3>
 * <p>Sur les encours, les cartes sont volontairement insensibles au filtre : elles disent
 * l'exposition globale de l'entreprise, et la faire varier avec un filtre d'affichage
 * ferait croire à une dette qui bouge. Ici c'est l'inverse : la question posée est « que
 * vaut MON audience », et un partenaire à qui l'on présente sa photographie clients veut
 * ses chiffres à lui. Le cahier des charges le dit explicitement.</p>
 *
 * <h3>Un chiffre seul ne veut rien dire</h3>
 * <p>Chaque carte porte son ordre de grandeur : un taux annonce son dénominateur, et
 * « clients multi-restaurants » annonce sa part du total. Sans cela, « 12 » ne dit pas si
 * c'est beaucoup.</p>
 */
export function ClientsKpiCards() {
  const { filtres } = useBddClientsFilters();
  const { data, isFetching } = useKpisClientsQuery(filtres);

  const uniques = data?.clientsUniques ?? 0;
  const partMulti = uniques > 0 ? (data?.clientsMultiRestaurants ?? 0) / uniques : 0;

  const cartes = [
    {
      detail: filtres.partenaires.length > 0 ? 'sur le périmètre filtré' : 'sur toute la base',
      libelle: 'Clients uniques',
      valeur: formatNombre(uniques),
    },
    {
      detail:
        filtres.debut || filtres.fin
          ? 'première commande sur la période'
          : 'toute la base, aucune période posée',
      libelle: 'Nouveaux clients',
      valeur: formatNombre(data?.nouveauxClients ?? 0),
    },
    {
      detail: uniques > 0 ? `${formatPourcent(partMulti)} des clients uniques` : '—',
      libelle: 'Clients multi-restaurants',
      valeur: formatNombre(data?.clientsMultiRestaurants ?? 0),
    },
    {
      detail: 'qualifiés parmi les fiches soumises',
      libelle: 'Taux de qualification',
      valeur: formatPourcent(data?.tauxQualification),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cartes.map((carte) => (
        <div
          className="rounded-large border border-separator bg-surface px-3 py-2.5"
          key={carte.libelle}
        >
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            {carte.libelle}
            {isFetching ? <Spinner size="sm" /> : null}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">{carte.valeur}</p>
          <p className="text-xs text-muted">{carte.detail}</p>
        </div>
      ))}
    </div>
  );
}
