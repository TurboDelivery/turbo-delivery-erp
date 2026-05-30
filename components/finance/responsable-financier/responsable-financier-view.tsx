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
  Select,
  SelectItem,
} from '@heroui/react';
import { flexRender } from '@tanstack/react-table';
import Link from 'next/link';
import { TrendingUp, FileText, Users, Percent } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { createResponsableFinancierColumns, getStatutConfig, formatMontant, type IFactureRF } from './responsable-financier-columns';
import { FactureMobileCard, MobileCardList } from '@/components/finance/shared/facture-mobile-card';
import { cycleOptions } from '@/features/responsable-financier/filters/responsable-financier.filter';
import type { IFactureRFParams } from '@/features/responsable-financier/types/responsable-financier.types';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import ValiderFactureModal from './valider-facture-modal';
import DepotBanqueModal from './depot-banque-modal';
import DemarrerRecouvrementDrawer from './demarrer-recouvrement-modal';
import DateFilterInput from '@/components/finance/date-filter-input';
import { useResponsableFinancierTable } from '@/features/responsable-financier/hooks/use-responsable-financier-table';
import { useResponsableFinancierStats } from '@/features/responsable-financier/hooks/use-responsable-financier-stats';
import {
  useValiderFactureRFMutation,
  useLancerRecouvrementMutation,
  useDepotBanqueMutation,
  useConfirmerReceptionComptableMutation,
} from '@/features/responsable-financier';

const statutFilters = [
  'Tous',
  'DRAFT',
  'À valider',
  'Validé',
  'Recouvrement',
  'En cours',
  'Déposé partenaire',
  'Preuve ajoutée',
  'Soldé',
  'Versé au caissier',
  'En attente visa DGA',
  'Visé DGA',
  'Rejeté DGA',
  'Clôturé',
] as const;

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
  const [factureRecouvrement, setFactureRecouvrement] = useState<IFactureRF | null>(null);
  const [factureDepotBanque, setFactureDepotBanque] = useState<IFactureRF | null>(null);

  const confirmerReceptionMutation = useConfirmerReceptionComptableMutation();

  const columns = useMemo(
    () => createResponsableFinancierColumns(
      (facture) => setFactureAValider(facture),
      (facture) => setFactureRecouvrement(facture),
      (facture) => setFactureDepotBanque(facture),
      // 2026-05 (fix post-test mardi) — D3 : Comptable confirme physiquement
      // la réception des fonds versés par le caissier. Click direct (pas de
      // modal), c'est une simple confirmation idempotente. La sécurité reste
      // côté backend qui vérifie le statut autorisé et renvoie 400 sinon.
      (facture) => confirmerReceptionMutation.mutate(facture.id),
    ),
    [confirmerReceptionMutation],
  );

  const { table, filters, setFilters, isLoading, totalPages } =
    useResponsableFinancierTable(columns);

  const statsParams = useMemo((): IFactureRFParams => ({
    periode: 'plage',
    dateDebut: filters.dateDebut ? filters.dateDebut.toISOString().split('T')[0] : undefined,
    dateFin: filters.dateFin ? filters.dateFin.toISOString().split('T')[0] : undefined,
    statut: filters.statut || undefined,
    cycle: filters.cycle && filters.cycle !== 'TOUT' ? filters.cycle : undefined,
    restaurantId: filters.restaurantId || undefined,
  }), [filters]);

  const { statsCards } = useResponsableFinancierStats(statsParams);

  const validerMutation = useValiderFactureRFMutation();
  const lancerRecouvrementMutation = useLancerRecouvrementMutation();
  const depotBanqueMutation = useDepotBanqueMutation();

  const handleDateChange = (range: DateRange | undefined) => {
    setFilters({
      dateDebut: range?.from ?? null,
      dateFin: range?.to ?? null,
      page: 0,
    });
  };

  const handleCycleChange = (key: string) => {
    setFilters({ cycle: key, page: 0 });
  };

  const handleRestaurantChange = (value?: string) => {
    setFilters({ restaurantId: value ?? '', page: 0 });
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
        {/*
          NB métier (2026-05) : ce "Total factures émises" est la somme des
          montants des factures émises pour la période/cycle/partenaire
          sélectionnés. Il diffère structurellement du "CA de la Période" du
          tableau de bord financier qui additionne frais de livraison +
          commissions + entrées de caisse côté commandes (notion comptable
          distincte). Voir DashboardFinancierService vs.
          ResponsableFinancierFactureService.buildStats côté backend.
          TODO UX : ajouter un Tooltip HeroUI sur le label avec cette
          explication courte ("Somme des factures émises ce mois ; ≠ CA
          dashboard qui inclut entrées caisse").
        */}
        <StatCard
          icon={TrendingUp}
          color="bg-green-500"
          label="Total factures émises"
          value={new Intl.NumberFormat('fr-FR').format(statsCards[1]?.value ?? 0) + ' FCFA'}
          sub="Somme des montants facturés"
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
        <div className="flex flex-wrap items-end gap-4">
          {/* Plage de dates (mois en cours par défaut) */}
          <DateFilterInput
            filters={{
              debut: filters.dateDebut ?? undefined,
              fin: filters.dateFin ?? undefined,
            }}
            handleDateChange={handleDateChange}
            variant="outline"
          />

          {/* Restaurant / Partenaire */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Partenaire</label>
            <RestaurantSelect
              value={filters.restaurantId || undefined}
              onChange={handleRestaurantChange}
              placeholder="Tous les partenaires"
              className="text-xs w-full sm:w-[220px]"
            />
          </div>

          {/* Cycle */}
          <Select
            label="Cycle"
            selectedKeys={new Set([filters.cycle || 'TOUT'])}
            onSelectionChange={(keys) => {
              const key = Array.from(keys as Set<string>)[0];
              if (key) handleCycleChange(key);
            }}
            variant="bordered"
            className="max-w-xs w-full sm:w-[220px]"
            disallowEmptySelection
          >
            {cycleOptions.map((opt) => (
              <SelectItem key={opt.key}>{opt.label}</SelectItem>
            ))}
          </Select>

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
        </div>
      </div>

      {/* Table — desktop uniquement (≥ md) */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <MobileCardList>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucune facture trouvée</p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const f = row.original;
            const cfg = getStatutConfig(f.statut);
            const detailLink = (
              <Link
                href={`/finance/comptabilite/responsable-financier/${f.id}`}
                className="w-full text-center text-sm font-medium text-red-500 border border-gray-200 rounded-md py-2"
              >
                Voir le détail ›
              </Link>
            );
            return (
              <FactureMobileCard
                key={f.id}
                numero={f.numero}
                partenaire={f.partenaire}
                montant={formatMontant(f.montant)}
                statut={cfg.label}
                statutClassName={cfg.className}
                fields={[
                  { label: 'Recouvré', value: f.montantRecouvre ? `${formatMontant(f.montantRecouvre)} (${f.pourcentageRecouvre ?? 0}%)` : '—' },
                  { label: 'Cycle', value: f.cycle },
                  { label: 'Agent', value: f.agent },
                  { label: 'Émission', value: f.emission },
                ]}
                actions={
                  <>
                    {(f.statut === 'DRAFT' || f.statut === 'À valider') && (
                      <Button onClick={() => setFactureAValider(f)} className="w-full bg-gray-900 hover:bg-gray-700 text-white text-sm">
                        ✓ Valider la facture
                      </Button>
                    )}
                    {f.statut === 'Validé' && (
                      <Button onClick={() => setFactureRecouvrement(f)} className="w-full bg-gray-900 hover:bg-gray-700 text-white text-sm">
                        Lancer le recouvrement →
                      </Button>
                    )}
                    {f.statut === 'Versé au caissier' && (
                      <Button onClick={() => confirmerReceptionMutation.mutate(f.id)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
                        Confirmer la réception des fonds
                      </Button>
                    )}
                    {f.statut === 'Orienté banque' && (
                      <Button onClick={() => setFactureDepotBanque(f)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                        🏦 Dépôt en banque
                      </Button>
                    )}
                    {detailLink}
                  </>
                }
              />
            );
          })
        )}
        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <Pagination page={filters.page + 1} total={totalPages} onChange={(p) => setFilters({ page: p - 1 })} />
          </div>
        )}
      </MobileCardList>

      <ValiderFactureModal
        open={factureAValider !== null}
        onClose={() => setFactureAValider(null)}
        facture={factureAValider}
        onConfirm={(facture, cycle) => {
          validerMutation.mutate({ id: facture.id, data: { cycle } });
          setFactureAValider(null);
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

      <DepotBanqueModal
        open={factureDepotBanque !== null}
        onClose={() => setFactureDepotBanque(null)}
        facture={factureDepotBanque}
        onConfirm={(facture, data) => {
          depotBanqueMutation.mutate({ id: facture.id, data });
          setFactureDepotBanque(null);
        }}
      />
    </div>
  );
}
