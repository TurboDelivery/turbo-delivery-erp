import React from 'react';
import { FactureTable } from '@/components/finance/recouvrements/factures/facture-table';

async function FacturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Factures</h1>
          <p className="text-muted-foreground">Liste des factures du restaurant</p>
        </div>
      </div>

      <FactureTable restaurantId={id} />
    </div>
  );
}

export default FacturesPage;
