'use client';

import { useMemo } from 'react';
import DataTable from '@/components/ui/data-table';
import { BonLivraisonTerminee } from '@/types/bon-livraison.model';
import { buildVerrouillageV2Columns } from './verrouillage-v2-columns';

interface VerrouillageV2TableProps {
  tickets: BonLivraisonTerminee[];
  validatingId: string | null;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

export function VerrouillageV2Table({ tickets, validatingId, onValidate, onReject }: VerrouillageV2TableProps) {
  const columns = useMemo(
    () => buildVerrouillageV2Columns(onValidate, onReject, validatingId),
    [onValidate, onReject, validatingId],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900">Récapitulatif final</p>
          <p className="text-xs text-gray-400">À vérifier avant verrouillage définitif</p>
        </div>
        <p className="text-xs text-gray-500">{tickets.length} ligne{tickets.length > 1 ? 's' : ''}</p>
      </div>
      <DataTable.Root columns={columns} data={tickets}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable.Root>
    </div>
  );
}
