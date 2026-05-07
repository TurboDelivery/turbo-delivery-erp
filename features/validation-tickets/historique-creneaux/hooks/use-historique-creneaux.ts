'use client';

import { useMemo, useState } from 'react';
import { useHistoriqueCreneauxListQuery } from '../queries/historique-creneaux.query';
import type { IHistoriqueCreneau, IHistoriqueCreneauxStats, StatutCreneau } from '../types/historique-creneaux.type';

export type StatutFilter = StatutCreneau | 'tous';

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

export default function useHistoriqueCreneaux() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('tous');

  const { data, isLoading } = useHistoriqueCreneauxListQuery({ page: 0, size: 50 });

  const allItems: IHistoriqueCreneau[] = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((raw) => ({
      id: raw.id,
      code: raw.code,
      periodeDebut: formatDate(raw.periodeDebut),
      periodeFin: formatDate(raw.periodeFin),
      livreurs: raw.livreurs,
      tickets: raw.tickets,
      netFcfa: raw.netFcfa,
      soumisLe: '',
      soumisParNom: '',
      statut: raw.statut,
    }));
  }, [data]);

  const stats: IHistoriqueCreneauxStats = useMemo(
    () => ({
      total: allItems.length,
      payes: allItems.filter((c) => c.statut === 'paye').length,
      enRegularisation: allItems.filter((c) => c.statut === 'regularisation').length,
      rejets: allItems.filter((c) => c.statut === 'rejete').length,
    }),
    [allItems],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allItems.filter((c) => {
      const matchSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.soumisParNom.toLowerCase().includes(q) ||
        c.periodeDebut.toLowerCase().includes(q) ||
        c.periodeFin.toLowerCase().includes(q);
      const matchStatut = statutFilter === 'tous' || c.statut === statutFilter;
      return matchSearch && matchStatut;
    });
  }, [allItems, search, statutFilter]);

  const exportCsv = () => {
    const header = ['Créneau', 'Période', 'Livreurs', 'Tickets', 'Net (FCFA)', 'Soumis le', 'Soumis par', 'Statut'];
    const rows = allItems.map((c) => [
      c.code,
      `${c.periodeDebut} → ${c.periodeFin}`,
      c.livreurs,
      c.tickets,
      c.netFcfa,
      c.soumisLe,
      c.soumisParNom,
      c.statut,
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

  return { filtered, stats, search, setSearch, statutFilter, setStatutFilter, exportCsv, isLoading };
}
