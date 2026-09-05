'use client';

import { Card, Chip, InputGroup, Table, TextField } from '@heroui-v3/react';
import { MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { useGrilleTarifaireQuery } from '@/features/restaurants/queries/restaurant-list.query';
import { formatMontant } from '@/utils/format.utils';

const fmtPrix = (v: number) => formatMontant(v);
const fmtKm = (v: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v);

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { id: 'zone', libelle: 'Zone' },
  { id: 'prix', libelle: 'Prix' },
  { id: 'rayon', libelle: "Rayon d'application" },
] as const;

/**
 * Grille tarifaire du restaurant : ses zones de livraison, le prix facturé au
 * partenaire par zone et le rayon d'application. C'est cette grille qui sert à
 * résoudre les frais d'une course externe (et donc la rémunération du livreur).
 */
export default function GrilleTarifaireSection({ restaurantId }: { restaurantId: string }) {
  const { data, isError, isFetching, isLoading, refetch } = useGrilleTarifaireQuery(restaurantId);
  const [search, setSearch] = useState('');

  const zones = useMemo(() => {
    const list = [...(data ?? [])];
    list.sort((a, b) => (a.zone ?? '').localeCompare(b.zone ?? '', 'fr'));
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((z) => (z.zone ?? '').toLowerCase().includes(q));
  }, [data, search]);

  return (
    <Card>
      <Card.Content className="gap-4 p-6">
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">Grille tarifaire</h2>
            <Chip size="sm" variant="soft">
              <Chip.Label>
                {data ? `${data.length} zone${data.length > 1 ? 's' : ''}` : '…'}
              </Chip.Label>
            </Chip>
          </div>
          <p className="text-sm text-muted">
            Zones de livraison de ce partenaire et prix facturé par zone. Ces tarifs déterminent
            les frais appliqués aux courses (et la rémunération du livreur). Gestion complète dans{' '}
            <Link className="text-accent underline underline-offset-2" href="/price-list">
              Grille tarifaire
            </Link>
            .
          </p>
        </div>

        <TextField
          aria-label="Rechercher une zone"
          className="max-w-sm"
          onChange={setSearch}
          value={search}
        >
          <InputGroup>
            <InputGroup.Prefix>
              <Search aria-hidden="true" className="size-4" />
            </InputGroup.Prefix>
            <InputGroup.Input placeholder="Rechercher une zone…" />
          </InputGroup>
        </TextField>

        {/* En echec on retire le tableau : son message de vide annoncerait
            "aucune zone tarifaire configuree", ce qui est une information
            metier fausse quand la grille n'a simplement pas pu etre lue. */}
        {isError ? (
          <EtatErreur
            enCours={isFetching}
            onReessayer={() => refetch()}
            quoi="les zones tarifaires de ce partenaire"
          />
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Grille tarifaire du restaurant">
                <Table.Header>
                  {COLONNES.map((c) => (
                    <Table.Column id={c.id} isRowHeader={c.id === 'zone'} key={c.id}>
                      {c.libelle}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : (
                      <p className="py-8 text-center text-sm text-muted">
                        {search
                          ? 'Aucune zone ne correspond à la recherche.'
                          : 'Aucune zone tarifaire configurée pour ce partenaire.'}
                      </p>
                    )
                  }
                >
                  {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {COLONNES.map((c) => (
                            <Table.Cell key={`sq-${i}-${c.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading ? [] : zones).map((z) => (
                    <Table.Row id={z.id} key={z.id}>
                      <Table.Cell>
                        <div className="flex min-w-[180px] items-center gap-2">
                          <MapPin aria-hidden="true" className="size-4 shrink-0 text-muted" />
                          <span className="text-sm text-foreground">{z.zone}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm font-semibold tabular-nums whitespace-nowrap text-foreground">
                          {fmtPrix(z.prix)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm tabular-nums whitespace-nowrap text-muted">
                          {fmtKm(z.distanceDebut)} – {fmtKm(z.distanceFin)} km
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card.Content>
    </Card>
  );
}
