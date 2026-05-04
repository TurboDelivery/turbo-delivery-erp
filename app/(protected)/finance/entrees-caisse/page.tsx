'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntreeCaisseTable } from '@/components/finance/entrees-caisse/entree-caisse-table';

export default function EntreesCaissePage() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Entrées Caisse</h1>
          <p className="text-muted-foreground">
            Gestion et historique des entrées caisse
          </p>
        </div>
      </div>
      <EntreeCaisseTable />
    </div>
  );
}
