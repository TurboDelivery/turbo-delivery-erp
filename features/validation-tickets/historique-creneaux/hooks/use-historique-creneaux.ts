'use client';

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useHistoriqueCreneauxListQuery } from '../queries/historique-creneaux.query';
import type { ICreneauActifVm } from '@/features/creneaux/types/creneau.types';
import type { IHistoriqueCreneauxStats, LotStatut } from '../types/historique-creneaux.type';

export type StatutFilter = LotStatut | 'tous';

export default function useHistoriqueCreneaux() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('tous');

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHistoriqueCreneauxListQuery({
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

  const exportXlsx = () => {
    const worksheetData = allItems.map((c) => ({
      'Créneau': c.label,
      'Début': c.dateDebut,
      'Fin': c.dateFin,
      'Livreurs': c.nbLivreurs,
      'Tickets': c.totalTickets,
      'En attente': c.nbTicketsPending,
      'Net (FCFA)': c.totalNet,
      'Soumis le': c.soumisAt ?? '',
      'Soumis par': c.soumisParNom ?? '',
      'Statut': c.lotStatut ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const keys = Object.keys(worksheetData[0] ?? {});
    worksheet['!cols'] = keys.map((key) => {
      const maxLen = Math.max(key.length, ...worksheetData.map((r) => String((r as Record<string, unknown>)[key] ?? '').length));
      return { wch: Math.min(maxLen + 2, 40) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historique créneaux');

    const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-creneaux_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    exportXlsx,
    isLoading,
    // Sans isError, un echec de chargement se lisait comme « Aucun creneau trouve ».
    isError,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
  };
}
