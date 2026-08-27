'use client';

import React, { useMemo, useState } from 'react';
import { formatMontant } from '@/utils/format.utils';
import Link from 'next/link';
import {
  Chip,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/heroui';
import { MapPin, Search } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { useGrilleTarifaireQuery } from '@/features/restaurants/queries/restaurant-list.query';

const fmtPrix = (v: number) => formatMontant(v);
const fmtKm = (v: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v);

/**
 * Grille tarifaire du restaurant : ses zones de livraison, le prix facturé au
 * partenaire par zone et le rayon d'application. C'est cette grille qui sert à
 * résoudre les frais d'une course externe (et donc la rémunération du livreur).
 */
export default function GrilleTarifaireSection({ restaurantId }: { restaurantId: string }) {
  const { data, isLoading, isError, isFetching, refetch } = useGrilleTarifaireQuery(restaurantId);
  const [search, setSearch] = useState('');

  const zones = useMemo(() => {
    const list = [...(data ?? [])];
    list.sort((a, b) => (a.zone ?? '').localeCompare(b.zone ?? '', 'fr'));
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((z) => (z.zone ?? '').toLowerCase().includes(q));
  }, [data, search]);

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-base font-semibold text-primary">Grille tarifaire</h2>
        <Chip size="sm" variant="flat">
          {data ? `${data.length} zone${data.length > 1 ? 's' : ''}` : '…'}
        </Chip>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Zones de livraison de ce partenaire et prix facturé par zone. Ces tarifs déterminent les frais
        appliqués aux courses (et la rémunération du livreur). Gestion complète dans{' '}
        <Link href="/price-list" className="text-primary underline underline-offset-2">
          Grille tarifaire
        </Link>
        .
      </p>

      <Input
        className="mb-4 max-w-sm"
        size="sm"
        variant="bordered"
        placeholder="Rechercher une zone..."
        startContent={<Search className="w-4 h-4 text-gray-400" />}
        value={search}
        onValueChange={setSearch}
        isClearable
        onClear={() => setSearch('')}
      />

      {/* En echec on retire le tableau : son message de vide annoncerait
          "aucune zone tarifaire configuree", ce qui est une information
          metier fausse quand la grille n'a simplement pas pu etre lue. */}
      {isError ? (
        <EtatErreur
          quoi="les zones tarifaires de ce partenaire"
          onReessayer={() => refetch()}
          enCours={isFetching}
        />
      ) : (
      <Table
        aria-label="Grille tarifaire du restaurant"
        removeWrapper
        isStriped
        classNames={{
          th: 'bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide',
          td: 'py-2.5',
        }}
      >
        <TableHeader>
          <TableColumn>ZONE</TableColumn>
          <TableColumn>PRIX</TableColumn>
          <TableColumn>RAYON D&apos;APPLICATION</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          loadingContent={<Spinner />}
          emptyContent={
            search
              ? 'Aucune zone ne correspond à la recherche.'
              : 'Aucune zone tarifaire configurée pour ce partenaire.'
          }
        >
          {zones.map((z) => (
            <TableRow key={z.id}>
              <TableCell>
                <div className="flex items-center gap-2 min-w-[180px]">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-gray-700">{z.zone}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{fmtPrix(z.prix)}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {fmtKm(z.distanceDebut)} – {fmtKm(z.distanceFin)} km
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}
    </section>
  );
}
