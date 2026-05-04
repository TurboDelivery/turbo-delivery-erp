import { EntreeCaisseTable } from '@/components/finance/entrees-caisse/entree-caisse-table';

export default function EntreesCaissePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Entrées Caisse</h1>
        <p className="text-muted-foreground">
          Gestion et historique des entrées caisse
        </p>
      </div>
      <EntreeCaisseTable />
    </div>
  );
}
