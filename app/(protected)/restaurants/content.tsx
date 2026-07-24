'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { flexRender } from '@tanstack/react-table';
import {
  Button,
  Input,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { ChevronDown, ChevronUp, Download, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useRestaurantTable } from '@/features/restaurants/hooks/use-restaurant-table';
import { useRestaurantStatusCountsQuery } from '@/features/restaurants/queries/restaurant-list.query';
import { StatCard } from '@/features/men/components/stat-card';
import { RestaurantMobileCard, RestaurantMobileCardList } from '@/components/restaurants/restaurant-mobile-card';
import { StatusChip, ActionsMenu } from '@/components/restaurants/table/restaurant-table-columns';

const RECOUVREMENT_LABELS: Record<string, string> = {
  MENSUEL: 'Mensuel',
  QUOTIDIEN: 'Quotidien',
  HEBDOMADAIRE: 'Hebdomadaire',
  QUINZAINE: 'Quinzaine',
};

const TYPE_OPTIONS = [
  { label: 'Tous les types', value: '' },
  { label: 'Mensuel', value: 'MENSUEL' },
  { label: 'Quotidien', value: 'QUOTIDIEN' },
  { label: 'Hebdomadaire', value: 'HEBDOMADAIRE' },
  { label: 'Quinzaine', value: 'QUINZAINE' },
];

/** Vues par état du compte (cartes cliquables — même code que le backend). */
type VueStatut = '' | 'valides' | 'partiels' | 'nouveaux' | 'inactifs';

export default function Content() {
  const { table, isLoading, isFetching, pagination, filters, setSearch, setFilters, handleExport, isExporting } = useRestaurantTable();
  const { data: counts } = useRestaurantStatusCountsQuery();
  const colsCount = table.getAllColumns().length;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const vue = (filters.statut ?? '') as VueStatut;
  const setVue = (statut: VueStatut) => setFilters((prev) => ({ ...prev, statut, page: 0 }));

  return (
    <div className="w-full pb-10 flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Partenaires ({counts?.total ?? '…'})</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez tous vos partenaires en un seul endroit</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="bordered" startContent={<Download className="w-4 h-4" />} size="sm" onPress={handleExport} isLoading={isExporting}>
            Exporter
          </Button>
          <Button color="primary" startContent={<Plus className="w-4 h-4" />} size="sm" as={Link} href="/restaurants/create">
            Créer un profil
          </Button>
        </div>
      </div>

      {/* ── Cartes par état du compte (cliquables — filtrent le tableau) ── */}
      <div className="grid grid-cols-2 gap-4 w-full sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Tous les partenaires"
          value={counts?.total ?? 0}
          highlight
          isActive={vue === ''}
          onClick={() => setVue('')}
        />
        <StatCard
          label="Validés"
          value={counts?.valides ?? 0}
          isActive={vue === 'valides'}
          onClick={() => setVue('valides')}
        />
        <StatCard
          label="Partiellement validés"
          value={counts?.partiels ?? 0}
          isActive={vue === 'partiels'}
          onClick={() => setVue('partiels')}
        />
        <StatCard
          label="Nouveaux (30 j)"
          value={counts?.nouveaux ?? 0}
          isActive={vue === 'nouveaux'}
          onClick={() => setVue('nouveaux')}
        />
        <StatCard
          label="Inactifs"
          value={counts?.inactifs ?? 0}
          isActive={vue === 'inactifs'}
          onClick={() => setVue('inactifs')}
        />
      </div>

      {/* ── Search + filter ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Input
            className="flex-1"
            startContent={<Search className="text-gray-400 w-4 h-4 shrink-0" />}
            placeholder="Rechercher par nom..."
            value={filters.search ?? ''}
            onChange={(e) => setSearch(e.target.value)}
            variant="bordered"
            size="sm"
          />
          <Button
            variant="bordered"
            size="sm"
            className="shrink-0 gap-1.5"
            onPress={() => setShowAdvanced((v) => !v)}
            startContent={<SlidersHorizontal className="w-4 h-4 text-gray-400" />}
            endContent={showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          >
            Filtres
          </Button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <Input
              label="Localisation"
              size="sm"
              variant="bordered"
              value={filters.localisation ?? ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, localisation: e.target.value, page: 0 }))}
            />
            <Input
              label="Email"
              size="sm"
              variant="bordered"
              value={filters.email ?? ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value, page: 0 }))}
            />
            <Input
              label="Téléphone"
              size="sm"
              variant="bordered"
              value={filters.telephone ?? ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, telephone: e.target.value, page: 0 }))}
            />
            <Input
              label="Commune"
              size="sm"
              variant="bordered"
              value={filters.commune ?? ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, commune: e.target.value, page: 0 }))}
            />
            <Select
              label="Méthode de recouvrement"
              size="sm"
              variant="bordered"
              selectedKeys={filters.methodRecouvrement ? [filters.methodRecouvrement] : ['']}
              onSelectionChange={(keys) =>
                setFilters((prev) => ({
                  ...prev,
                  methodRecouvrement: Array.from(keys as Set<string>)[0] === '' ? '' : Array.from(keys as Set<string>)[0],
                  page: 0,
                }))
              }
            >
              {TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value}>{opt.label}</SelectItem>)}
            </Select>
          </div>
        )}
      </div>

      {/* ── Table (desktop ≥ md) ── */}
      <div className="hidden md:block relative rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <Spinner color="primary" />
          </div>
        )}
        <Table
          aria-label="Liste des partenaires"
          removeWrapper
          classNames={{
            th: 'bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide',
            td: 'py-3',
          }}
          bottomContent={
            pagination && pagination.pageCount > 1 ? (
              <div className="flex justify-center py-3 border-t border-gray-100">
                <Pagination
                  total={pagination.pageCount}
                  page={pagination.page + 1}
                  onChange={pagination.handlePageChange}
                  isDisabled={isLoading}
                  showControls
                  color="primary"
                  variant="bordered"
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            {table.getFlatHeaders().map((header) => (
              <TableColumn
                key={header.id}
                allowsSorting={header.column.getCanSort()}
                onClick={header.column.getToggleSortingHandler()}
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent={isLoading ? ' ' : 'Aucun partenaire trouvé.'}>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: colsCount }).map((_, j) => (
                      <TableCell key={`sk-c-${j}`}>
                        <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50 transition-colors">
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

      {/* ── Cartes (mobile < md) ── */}
      <RestaurantMobileCardList>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`sk-card-${i}`} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucun partenaire trouvé.</p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const r = row.original;
            const isGratuite = r.typeCommission === 'GRATUIT';
            return (
              <RestaurantMobileCard
                key={r.id}
                nom={r.nomEtablissement}
                verified={r.status != null && r.status >= 1 && !isGratuite}
                gratuite={isGratuite}
                statut={<StatusChip status={r.status} typeCommission={r.typeCommission} />}
                fields={[
                  { label: 'Email', value: r.email || '-' },
                  { label: 'Téléphone', value: r.telephone || '-' },
                  { label: 'Localisation', value: r.localisation || r.commune || '-' },
                  { label: 'Cycle de paiement', value: RECOUVREMENT_LABELS[r.methodRecouvrement] ?? r.methodRecouvrement ?? '-' },
                ]}
                actions={<ActionsMenu id={r.id} name={r.nomEtablissement} status={r.status} />}
              />
            );
          })
        )}
        {pagination && pagination.pageCount > 1 && (
          <div className="flex justify-center pt-2">
            <Pagination
              total={pagination.pageCount}
              page={pagination.page + 1}
              onChange={pagination.handlePageChange}
              isDisabled={isLoading}
              showControls
              color="primary"
              variant="bordered"
            />
          </div>
        )}
      </RestaurantMobileCardList>
    </div>
  );
}
