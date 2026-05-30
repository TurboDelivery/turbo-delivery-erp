'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
} from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import { Landmark, Clock, CheckCircle2, FileCheck } from 'lucide-react';
import { createCaissierColumns } from './caissier-columns';
import ConfirmerReceptionModal from './confirmer-reception-modal';
import DepotBanqueCaissierModal from './depot-banque-caissier-modal';
import {
  useCaissierTable,
  useCaissierFacturesQuery,
  useCaissierConfirmationMutation,
  useCaissierDepotBanqueMutation,
} from '@/features/caissier';
import type { IFactureCaissier, IDepotBanqueCaissierBody } from '@/features/caissier';

function formatMontant(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F CFA';
}

const statutChips = [
  'Tous',
  'Versé au caissier',
  'Rejeté DGA',
  'En attente visa DGA',
  'Visé DGA',
  'Orienté banque',
  'Conservé en caisse',
  'Clôturé',
] as const;
type StatutChip = (typeof statutChips)[number];

function StatCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}

export default function CaissierView() {
  const [statut, setStatut] = useState<string>('Versé au caissier');
  const [page, setPage] = useState(0);

  // periode 'cycle' = aucun filtre date côté backend (cf. ICaissierParams).
  // Sans ça, la caisse ne voyait que les factures créées le mois courant et
  // perdait celles versées un mois précédent encore à confirmer/clôturer.
  const params = { periode: 'cycle' as const, statut: statut || undefined, page };
  const { data: statsData } = useCaissierFacturesQuery({ periode: 'cycle', size: 200 });

  const [factureAConfirmer, setFactureAConfirmer] = useState<IFactureCaissier | null>(null);
  const [factureDepotBanque, setFactureDepotBanque] = useState<IFactureCaissier | null>(null);

  const columns = useMemo(
    () => createCaissierColumns(
      (facture) => setFactureAConfirmer(facture),
      (facture) => setFactureDepotBanque(facture),
    ),
    [],
  );

  const { table, isLoading, isError, error, totalPages } = useCaissierTable(columns, params);
  const confirmationMutation = useCaissierConfirmationMutation();
  const depotBanqueMutation = useCaissierDepotBanqueMutation();

  const handleStatutChip = (chip: StatutChip) => {
    setStatut(chip === 'Tous' ? '' : chip);
    setPage(0);
  };

  const handleConfirm = (
    facture: IFactureCaissier,
    data: { reference: string },
  ) => {
    confirmationMutation.mutate(
      { id: facture.id, body: { reference: data.reference } },
      {
        onSuccess: () => toast.success('Fiche de paiement enregistrée — facture envoyée en visa DGA'),
        onError: (e) => toast.error('Erreur dépôt banque', { description: e instanceof Error ? e.message : 'Veuillez réessayer.' }),
      },
    );
  };

  const handleDepotBanque = (
    facture: IFactureCaissier,
    data: IDepotBanqueCaissierBody,
  ) => {
    depotBanqueMutation.mutate(
      { id: facture.id, body: data },
      {
        onSuccess: () => toast.success('Dépôt en banque enregistré (bordereau + preuve)'),
        onError: (e) => toast.error('Erreur dépôt en banque', { description: e instanceof Error ? e.message : 'Veuillez réessayer.' }),
      },
    );
  };

  // Stats from unfiltered query
  const allFactures = statsData?.factures?.content ?? [];
  const enAttente = allFactures.filter((f) => f.statut === 'Versé au caissier' || f.statut === 'Rejeté DGA').length;
  const confirmees = allFactures.filter((f) =>
    ['En attente visa DGA', 'Visé DGA', 'Clôturé'].includes(f.statut),
  ).length;
  const montantEnAttente = allFactures
    .filter((f) => f.statut === 'Versé au caissier' || f.statut === 'Rejeté DGA')
    .reduce((acc, f) => acc + (f.montantRecouvre ?? f.montant), 0);

  const statsCards = [
    { icon: Clock, color: 'bg-amber-500', label: 'En attente', value: String(enAttente) },
    {
      icon: Landmark,
      color: 'bg-indigo-600',
      label: 'Montant en attente',
      value: formatMontant(montantEnAttente),
    },
    { icon: FileCheck, color: 'bg-sky-500', label: 'Confirmées', value: String(confirmees) },
    {
      icon: CheckCircle2,
      color: 'bg-emerald-500',
      label: 'Total factures',
      value: String(allFactures.length),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">Comptabilité</p>
        <h1 className="text-2xl font-bold text-indigo-600">Espace Caissier</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <StatCard key={card.label} icon={card.icon} color={card.color} label={card.label} value={card.value} />
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {statutChips.map((s) => {
            const active = s === 'Tous' ? !statut : statut === s;
            return (
              <button
                key={s}
                onClick={() => handleStatutChip(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table
          isStriped
          aria-label="Factures caissier"
          bottomContent={
            totalPages > 1 ? (
              <div className="flex justify-center py-3">
                <Pagination
                  showControls
                  page={page + 1}
                  total={totalPages}
                  onChange={(p) => setPage(p - 1)}
                />
              </div>
            ) : null
          }
          classNames={{
            wrapper: 'rounded-none shadow-none p-0',
            th: 'bg-gray-50 text-gray-600 text-xs uppercase tracking-wide',
          }}
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody
            emptyContent={isError ? String(error) : 'Aucune facture trouvée'}
            loadingContent={<div className="py-12 text-sm text-gray-400">Chargement…</div>}
            isLoading={isLoading}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {table.getFlatHeaders().map((h) => (
                      <TableCell key={h.id}>
                        <div className="h-4 rounded bg-gray-200 animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <ConfirmerReceptionModal
        open={!!factureAConfirmer}
        onClose={() => setFactureAConfirmer(null)}
        facture={factureAConfirmer}
        onConfirm={handleConfirm}
      />
      <DepotBanqueCaissierModal
        open={!!factureDepotBanque}
        onClose={() => setFactureDepotBanque(null)}
        facture={factureDepotBanque}
        onConfirm={handleDepotBanque}
      />
    </div>
  );
}
