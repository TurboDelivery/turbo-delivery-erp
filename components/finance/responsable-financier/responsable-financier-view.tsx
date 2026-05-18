'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  Skeleton,
} from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import { TrendingUp, FileText, Users, Percent } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { createResponsableFinancierColumns, type IFactureRF, type StatutFacture } from './responsable-financier-columns';
import ValiderFactureModal from './valider-facture-modal';
import ViserDgModal from './viser-dg-modal';
import AjouterPreuveModal from './ajouter-preuve-modal';
import DepotPartenaireModal from './depot-partenaire-modal';
import DepotBanqueModal from './depot-banque-modal';
import DemarrerRecouvrementDrawer from './demarrer-recouvrement-modal';
import DateFilterInput from '@/components/finance/date-filter-input';
import { useResponsableFinancierTable } from '@/features/responsable-financier/hooks/use-responsable-financier-table';
import { useResponsableFinancierStats } from '@/features/responsable-financier/hooks/use-responsable-financier-stats';
import {
  useValiderFactureRFMutation,
  useViserDgMutation,
  useLancerRecouvrementMutation,
  useAjouterPreuveMutation,
  useDepotPartenaireMutation,
  useDepotBanqueMutation,
} from '@/features/responsable-financier';

type Periode = 'mois' | 'annee' | 'cycle' | 'plage';
type StatutFilter = 'Tous' | StatutFacture;

const statutFilters: StatutFilter[] = [
  'Tous',
  'Soldé',
  'Acompte',
  'Déposé partenaire',
  'Recouvrement',
  'En cours',
  'Validé',
  'Preuve ajoutée',
  'Visé DG',
  'À valider',
];

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
  const [factureAValider, setFactureAValider] = useState<IFactureRF | null>(null);
  const [factureViserDg, setFactureViserDg] = useState<IFactureRF | null>(null);
  const [factureRecouvrement, setFactureRecouvrement] = useState<IFactureRF | null>(null);
  const [facturePreuve, setFacturePreuve] = useState<IFactureRF | null>(null);
  const [factureDepotPartenaire, setFactureDepotPartenaire] = useState<IFactureRF | null>(null);
  const [factureDepotBanque, setFactureDepotBanque] = useState<IFactureRF | null>(null);

  const columns = useMemo(
    () => createResponsableFinancierColumns(
      (facture) => setFactureAValider(facture),
      (facture) => setFactureViserDg(facture),
      (facture) => setFactureRecouvrement(facture),
      (facture) => setFacturePreuve(facture),
      (facture) => setFactureDepotPartenaire(facture),
      (facture) => setFactureDepotBanque(facture),
    ),
    [],
  );

  const { table, filters, setFilters, isLoading, stats, totalPages } =
    useResponsableFinancierTable(columns);
  const { statsCards } = useResponsableFinancierStats({ periode: filters.periode as 'mois' | 'annee' | 'cycle' | 'plage' | undefined });

  const validerMutation = useValiderFactureRFMutation();
  const viserDgMutation = useViserDgMutation();
  const lancerRecouvrementMutation = useLancerRecouvrementMutation();
  const ajouterPreuveMutation = useAjouterPreuveMutation();
  const depotPartenaireMutation = useDepotPartenaireMutation();
  const depotBanqueMutation = useDepotBanqueMutation();

  const handleDateChange = (range: DateRange | undefined) => {
    setFilters({
      dateDebut: range?.from ?? null,
      dateFin: range?.to ?? null,
      page: 0,
    });
  };

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
          value={new Intl.NumberFormat('fr-FR').format(statsCards[1]?.value ?? 0) + ' FCFA'}
          sub="Période sélectionnée"
        />
        <StatCard
          icon={FileText}
          color="bg-blue-500"
          label="Nombre de Factures"
          value={String(statsCards[0]?.value ?? 0)}
          sub="Période sélectionnée"
        />
        <StatCard
          icon={Users}
          color="bg-purple-500"
          label="Nombre de Partenaires"
          value={String(statsCards[2]?.value ?? 0)}
          sub="Partenaires uniques"
        />
        <StatCard
          icon={Percent}
          color="bg-orange-500"
          label="Taux de Recouvrement"
          value={(statsCards[3]?.value ?? 0) + '%'}
          sub="Période sélectionnée"
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
              {([['mois', 'Mois en cours'], ['annee', 'Année'], ['cycle', 'Par cycle'], ['plage', 'Plage de dates']] as [Periode, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilters({ periode: val, page: 0 })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filters.periode === val
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
            <div className="flex flex-wrap gap-1.5">
              {statutFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilters({ statut: s === 'Tous' ? '' : s, page: 0 })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    (s === 'Tous' && !filters.statut) || filters.statut === s
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Plage de dates */}
          {filters.periode === 'plage' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 font-medium">Plage de dates</label>
              <DateFilterInput
                filters={{
                  debut: filters.dateDebut ?? undefined,
                  fin: filters.dateFin ?? undefined,
                }}
                handleDateChange={handleDateChange}
                variant="outline"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table
          isStriped
          aria-label="Factures responsable financier"
          bottomContent={
            totalPages > 1 ? (
              <div className="flex justify-center py-3">
                <Pagination
                  page={filters.page + 1}
                  total={totalPages}
                  onChange={(p) => setFilters({ page: p - 1 })}
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            {table.getFlatHeaders().map((h) => (
              <TableColumn key={h.id} className="text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody
            emptyContent={isLoading ? ' ' : 'Aucune facture trouvée'}
            items={isLoading ? [] : table.getRowModel().rows}
          >
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {table.getAllColumns().map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              )) as unknown as React.ReactElement
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )) as unknown as React.ReactElement
            )}
          </TableBody>
        </Table>
      </div>

      <ValiderFactureModal
        open={factureAValider !== null}
        onClose={() => setFactureAValider(null)}
        facture={factureAValider}
        onConfirm={(facture, cycle) => {
          validerMutation.mutate({ id: facture.id, data: { cycle } });
          setFactureAValider(null);
        }}
      />

      <ViserDgModal
        open={factureViserDg !== null}
        onClose={() => setFactureViserDg(null)}
        facture={factureViserDg}
        onConfirm={(facture) => {
          viserDgMutation.mutate(facture.id);
          setFactureViserDg(null);
        }}
      />

      <DemarrerRecouvrementDrawer
        open={factureRecouvrement !== null}
        onClose={() => setFactureRecouvrement(null)}
        facture={factureRecouvrement}
        onConfirm={(facture, agent) => {
          lancerRecouvrementMutation.mutate({ id: facture.id, data: { agentId: agent.id } });
          setFactureRecouvrement(null);
        }}
      />

      <AjouterPreuveModal
        open={facturePreuve !== null}
        onClose={() => setFacturePreuve(null)}
        facture={facturePreuve}
        onConfirm={(facture, preuveUrl) => {
          ajouterPreuveMutation.mutate({ id: facture.id, data: { reference: preuveUrl } });
          setFacturePreuve(null);
        }}
      />

      <DepotPartenaireModal
        open={factureDepotPartenaire !== null}
        onClose={() => setFactureDepotPartenaire(null)}
        facture={factureDepotPartenaire}
        onConfirm={(facture, date, agentId) => {
          depotPartenaireMutation.mutate({ id: facture.id, data: { date, agentId } });
          setFactureDepotPartenaire(null);
        }}
      />

      <DepotBanqueModal
        open={factureDepotBanque !== null}
        onClose={() => setFactureDepotBanque(null)}
        facture={factureDepotBanque}
        onConfirm={(facture, date) => {
          depotBanqueMutation.mutate({ id: facture.id, data: { date } });
          setFactureDepotBanque(null);
        }}
      />
    </div>
  );
}
