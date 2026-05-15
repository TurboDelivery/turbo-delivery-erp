'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@heroui/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { TrendingUp, FileText, Users, Percent } from 'lucide-react';
import { createResponsableFinancierColumns, type IFactureRF, type StatutFacture } from './responsable-financier-columns';
import { MOCK_FACTURES } from './mock-data';
import ValiderFactureModal from './valider-facture-modal';

// ─── Stats ────────────────────────────────────────────────────────────────────
const MOCK_STATS = {
  montantTotal: 750000,
  nombreFactures: 3,
  nombrePartenaires: 3,
  tauxRecouvrement: 0,
};

type Periode = 'mois' | 'annee' | 'cycle' | 'plage';
type StatutFilter = 'Tous' | 'En attente' | StatutFacture;

const statutFilters: StatutFilter[] = ['Tous', 'En attente', 'Acompte', 'Soldé'];

function StatCard({ icon: Icon, color, label, value, sub }: { icon: React.ElementType; color: string; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function ResponsableFinancierView() {
  const [periode, setPeriode] = useState<Periode>('mois');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('Tous');
  const [factures, setFactures] = useState<IFactureRF[]>(MOCK_FACTURES);
  const [factureAValider, setFactureAValider] = useState<IFactureRF | null>(null);

  const filteredData = useMemo(() => factures.filter((f) => {
    if (statutFilter === 'Tous') return true;
    if (statutFilter === 'En attente') {
      const enAttente: StatutFacture[] = ['Recouvrement', 'À valider', 'Déposé partenaire'];
      return enAttente.includes(f.statut);
    }
    return f.statut === (statutFilter as StatutFacture);
  }), [factures, statutFilter]);

  const columns = useMemo(
    () => createResponsableFinancierColumns((facture) => setFactureAValider(facture)),
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">Gestion des Paiements</p>
        <h1 className="text-2xl font-bold text-red-500">Espace Responsable Financier</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          color="bg-green-500"
          label="Montant Total"
          value={new Intl.NumberFormat('fr-FR').format(MOCK_STATS.montantTotal) + ' FCFA'}
          sub="Mois en cours"
        />
        <StatCard
          icon={FileText}
          color="bg-blue-500"
          label="Nombre de Factures"
          value={String(MOCK_STATS.nombreFactures)}
          sub="Mois en cours"
        />
        <StatCard
          icon={Users}
          color="bg-purple-500"
          label="Nombre de Partenaires"
          value={String(MOCK_STATS.nombrePartenaires)}
          sub="Partenaires uniques"
        />
        <StatCard
          icon={Percent}
          color="bg-orange-500"
          label="Taux de Recouvrement"
          value={MOCK_STATS.tauxRecouvrement + '%'}
          sub="Mois en cours"
        />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <span>🔽</span> Filtres
        </div>
        <div className="flex flex-wrap gap-6">
          {/* Période */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Période</label>
            <div className="flex gap-1.5">
              {([['mois', 'Mois en cours'], ['annee', 'Année 2026'], ['cycle', 'Par cycle'], ['plage', 'Plage de dates']] as [Periode, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setPeriode(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    periode === val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">Statut</label>
            <div className="flex gap-1.5">
              {statutFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatutFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    statutFilter === s
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table isStriped aria-label="Factures responsable financier">
          <TableHeader>
            {table.getFlatHeaders().map((h) => (
              <TableColumn key={h.id} className="text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="Aucune facture trouvée">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ValiderFactureModal
        open={factureAValider !== null}
        onClose={() => setFactureAValider(null)}
        facture={factureAValider}
        onConfirm={(facture, cycle) => {
          setFactures((prev) =>
            prev.map((f) =>
              f.id === facture.id ? { ...f, statut: 'À valider' as const } : f,
            ),
          );
        }}
      />
    </div>
  );
}
