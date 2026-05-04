'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntreeCaisseTable } from '@/components/finance/entrees-caisse/entree-caisse-table';
import { CreerEntreeCaisseModal } from '@/components/finance/entrees-caisse/creer-entree-caisse-modal';
import DateFilterInput from '@/components/finance/date-filter-input';
import { useEntreeCaisseTable } from '@/features/entrees-caisse/hooks/use-entree-caisse-table';

export default function EntreesCaissePage() {
  const router = useRouter();
  const { table, isLoading, isFetching, pagination, filters, handleDateChange } =
    useEntreeCaisseTable();

  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Entrées Caisse</h1>
          <p className="text-muted-foreground text-sm">
            Gestion et historique des entrées caisse
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
          <CreerEntreeCaisseModal />
        </div>
      </div>

      <EntreeCaisseTable
        table={table}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={pagination}
      />
    </div>
  );
}
