'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Checkbox,
} from '@heroui/react';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import Link from 'next/link';
import { TrendingUp, FileText, Users, Percent } from 'lucide-react';
import BulkActionsBar from './bulk-actions-bar';
import type { IActionsGroupeesFiltres } from '@/features/responsable-financier/types/responsable-financier.types';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { createResponsableFinancierColumns, getStatutConfig, formatMontant, type IFactureRF } from './responsable-financier-columns';
import { FactureMobileCard, MobileCardList } from '@/components/finance/shared/facture-mobile-card';
import { formatPeriodeFacturee } from '@/lib/finance/periode-facturee';
import { cycleOptions } from '@/features/responsable-financier/filters/responsable-financier.filter';
import type { IFactureRFParams } from '@/features/responsable-financier/types/responsable-financier.types';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import ValiderFactureModal from './valider-facture-modal';
import DepotBanqueModal from './depot-banque-modal';
import DemarrerRecouvrementDrawer from './demarrer-recouvrement-modal';
import DateFilterInput from '@/components/finance/date-filter-input';
import { useResponsableFinancierTable } from '@/features/responsable-financier/hooks/use-responsable-financier-table';
import { useResponsableFinancierStats } from '@/features/responsable-financier/hooks/use-responsable-financier-stats';
import EtatErreur from '@/components/commons/EtatErreur';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import {
  useValiderFactureRFMutation,
  useLancerRecouvrementMutation,
  useDepotBanqueMutation,
  useConfirmerReceptionComptableMutation,
} from '@/features/responsable-financier';

// Onglets de statut. 2026-07-27 : l'onglet « Visé DGA » devient « Orientation des fonds »
// (le visa est implicite depuis « En attente visa DGA » — plus d'étape manuelle de visa).
// La valeur backend reste « Visé DGA » : l'onglet liste le stock visé non encore orienté,
// sur lequel l'action groupée « Orientation des fonds » s'applique aussi.
const statutFilters = [
  { label: 'Tous', value: 'Tous' },
  { label: 'DRAFT', value: 'DRAFT' },
  { label: 'À valider', value: 'À valider' },
  { label: 'Validé', value: 'Validé' },
  { label: 'Recouvrement', value: 'Recouvrement' },
  { label: 'En cours', value: 'En cours' },
  { label: 'Déposé partenaire', value: 'Déposé partenaire' },
  { label: 'Preuve ajoutée', value: 'Preuve ajoutée' },
  { label: 'Soldé', value: 'Soldé' },
  { label: 'Versé au caissier', value: 'Versé au caissier' },
  { label: 'En attente visa DGA', value: 'En attente visa DGA' },
  { label: 'Orientation des fonds', value: 'Visé DGA' },
  { label: 'Rejeté DGA', value: 'Rejeté DGA' },
  { label: 'Clôturé', value: 'Clôturé' },
] as const;

export default function ResponsableFinancierView() {
  const [factureAValider, setFactureAValider] = useState<IFactureRF | null>(null);
  const [factureRecouvrement, setFactureRecouvrement] = useState<IFactureRF | null>(null);
  const [factureDepotBanque, setFactureDepotBanque] = useState<IFactureRF | null>(null);

  // ── Sélection pour les actions groupées ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllMatching, setSelectAllMatching] = useState(false);

  const toggleRow = (id: string) => {
    setSelectAllMatching(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectAllMatching(false);
  };

  const confirmerReceptionMutation = useConfirmerReceptionComptableMutation();

  const selectColumn: ColumnDef<IFactureRF> = useMemo(
    () => ({
      id: '__select',
      header: () => <span className="sr-only">Sélection</span>,
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Sélectionner ${row.original.numero}`}
          isSelected={selectAllMatching || selectedIds.has(row.original.id)}
          isDisabled={selectAllMatching}
          onValueChange={() => toggleRow(row.original.id)}
        />
      ),
      enableSorting: false,
    }),
    [selectedIds, selectAllMatching],
  );

  const columns = useMemo(
    () => [
      selectColumn,
      ...createResponsableFinancierColumns(
        (facture) => setFactureAValider(facture),
        (facture) => setFactureRecouvrement(facture),
        (facture) => setFactureDepotBanque(facture),
        // 2026-05 (fix post-test mardi) — D3 : Comptable confirme physiquement
        // la réception des fonds versés par le caissier. Click direct (pas de
        // modal), c'est une simple confirmation idempotente. La sécurité reste
        // côté backend qui vérifie le statut autorisé et renvoie 400 sinon.
        (facture) => confirmerReceptionMutation.mutate(facture.id),
      ),
    ],
    [confirmerReceptionMutation, selectColumn],
  );

  const { table, filters, setFilters, isLoading, isFetching, isError, refetch, totalPages, totalElements } =
    useResponsableFinancierTable(columns);

  // Ids de la page courante + états de la case « page ».
  const pageIds = table.getRowModel().rows.map((r) => r.original.id);
  const pageSelectedCount = pageIds.filter((id) => selectedIds.has(id)).length;
  const allPageSelected = pageIds.length > 0 && pageSelectedCount === pageIds.length;
  const somePageSelected = pageSelectedCount > 0 && !allPageSelected;

  const togglePage = () => {
    setSelectAllMatching(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // La sélection ne doit jamais survivre à un changement de filtre / de page.
  useEffect(() => {
    clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.statut, filters.cycle, filters.restaurantId, filters.dateDebut, filters.dateFin, filters.page]);

  const bulkFiltres: IActionsGroupeesFiltres = useMemo(
    () => ({
      periode: 'plage',
      debut: filters.dateDebut ? filters.dateDebut.toISOString().split('T')[0] : undefined,
      fin: filters.dateFin ? filters.dateFin.toISOString().split('T')[0] : undefined,
      statut: filters.statut || 'Tous',
      cycle: filters.cycle && filters.cycle !== 'TOUT' ? filters.cycle : undefined,
      restaurantId: filters.restaurantId || undefined,
    }),
    [filters],
  );

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
      <GrilleStats colonnes={4}>
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
        <CarteStat
          icone={TrendingUp}
          ton="succes"
          libelle="Total factures émises"
          valeur={formatMontant(statsCards[1]?.value ?? 0)}
          note="Somme des montants facturés"
        />
        <CarteStat
          icone={FileText}
          ton="primaire"
          libelle="Nombre de factures"
          valeur={String(statsCards[0]?.value ?? 0)}
          note="Période sélectionnée"
        />
        <CarteStat
          icone={Users}
          ton="primaire"
          libelle="Nombre de partenaires"
          valeur={String(statsCards[2]?.value ?? 0)}
          note="Partenaires uniques"
        />
        <CarteStat
          icone={Percent}
          ton="attention"
          libelle="Taux de recouvrement"
          valeur={`${statsCards[3]?.value ?? 0} %`}
          note="Période sélectionnée"
        />
      </GrilleStats>

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
                  key={s.value}
                  onClick={() => setFilters({ statut: s.value === 'Tous' ? '' : s.value, page: 0 })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    (s.value === 'Tous' && !filters.statut) || filters.statut === s.value
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Barre de sélection (desktop) */}
      {!isLoading && pageIds.length > 0 && (
        <div className="hidden md:flex items-center gap-4 text-sm px-1 -mb-2">
          <Checkbox
            isSelected={allPageSelected || selectAllMatching}
            isIndeterminate={somePageSelected && !selectAllMatching}
            onValueChange={togglePage}
          >
            <span className="text-gray-600">Sélectionner la page</span>
          </Checkbox>
          {allPageSelected && !selectAllMatching && totalElements > pageIds.length && (
            <button
              onClick={() => setSelectAllMatching(true)}
              className="text-primary font-medium hover:underline"
            >
              Sélectionner les {totalElements} factures de toutes les pages
            </button>
          )}
          {selectAllMatching && (
            <span className="text-gray-600">
              Les <b>{totalElements}</b> factures du filtre sont sélectionnées ·{' '}
              <button onClick={clearSelection} className="text-primary font-medium hover:underline">
                Effacer
              </button>
            </span>
          )}
        </div>
      )}

      {/* L'echec de lecture s'affiche ICI, et les deux messages d'etat vide
          (tableau desktop + cartes mobiles) sont neutralises en dessous : sans
          cela, l'ecran afficherait l'erreur ET « aucune donnee », ce qui revient
          a se contredire. */}
      {isError && (
        <EtatErreur quoi="les factures" onReessayer={() => refetch()} enCours={isFetching} />
      )}

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
            emptyContent={isLoading || isError ? ' ' : 'Aucune facture trouvée'}
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
          isError ? null : <p className="text-sm text-gray-400 text-center py-10">Aucune facture trouvée</p>
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
                  { label: 'Période facturée', value: formatPeriodeFacturee(f.cycle, f.periodeDebut, f.periodeFin) },
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

      {/* Actions groupées (barre flottante) */}
      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        selectAllMatching={selectAllMatching}
        totalElements={totalElements}
        filtres={bulkFiltres}
        onClear={clearSelection}
      />
    </div>
  );
}
