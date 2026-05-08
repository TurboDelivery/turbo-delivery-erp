'use client';

import { useMemo, useState } from 'react';
import { useHistoriqueCreneauxListQuery } from '../queries/historique-creneaux.query';
import type { ICreneauActifVm } from '@/features/creneaux/types/creneau.types';
import type { IHistoriqueCreneauxStats, LotStatut } from '../types/historique-creneaux.type';

export type StatutFilter = LotStatut | 'tous';

export default function useHistoriqueCreneaux() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('tous');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useHistoriqueCreneauxListQuery({
      size: 20,
      lotStatut: statutFilter !== 'tous' ? statutFilter : undefined,
    });

  const allItems: ICreneauActifVm[] = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allItems;
    return allItems.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.soumisParNom ?? '').toLowerCase().includes(q),
    );
  }, [allItems, search]);

  // TODO: remplacer par l'endpoint de stats dédié quand disponible
  const stats: IHistoriqueCreneauxStats = {
    total: 0,
    payes: 0,
    enRegularisation: 0,
    rejets: 0,
  };

  const exportCsv = () => {
    const header = ['Créneau', 'Début', 'Fin', 'Livreurs', 'Tickets', 'En attente', 'Net (FCFA)', 'Soumis le', 'Soumis par', 'Statut'];
    const rows = allItems.map((c) => [
      c.label,
      c.dateDebut,
      c.dateFin,
      c.nbLivreurs,
      c.totalTickets,
      c.nbTicketsPending,
      c.totalNet,
      c.soumisAt ?? '',
      c.soumisParNom ?? '',
      c.lotStatut ?? '',
    ]);
    const csv = [header, ...rows].map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historique-creneaux.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    filtered,
    stats,
    search,
    setSearch,
    statutFilter,
    setStatutFilter,
    exportCsv,
    isLoading,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
  };
}
