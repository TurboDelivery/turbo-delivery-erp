'use client';

import React from 'react';
import { Input, Label, Spinner, Table, TextField } from '@heroui-v3/react';
import { flexRender } from '@tanstack/react-table';
import { Store } from 'lucide-react';
import { parseAsString, useQueryStates } from 'nuqs';

import EtatErreur from '@/components/commons/EtatErreur';
import useStatsPartenairesTable from '@/features/bdd-clients/hooks/use-stats-partenaires-table';
import { formatNombre, useVoisinsPartenaireQuery } from '@/features/bdd-clients';

import { statsPartenairesColumns } from './stats-partenaires-table-columns';

/**
 * Ce que chaque partenaire représente dans la base clients.
 *
 * <h3>La question à laquelle cet écran répond</h3>
 * <p>« Combien de clients cette enseigne nous apporte, et lesquels sont à elle seule. »
 * Un partenaire qui apporte cent clients dont quatre-vingt-dix commandent aussi ailleurs
 * ne pèse pas comme un partenaire qui en apporte cinquante exclusifs, et c'est cette
 * différence que le total seul efface.</p>
 *
 * <h3>⚠ Exclusif se lit SUR LA PÉRIODE</h3>
 * <p>Pas sur toute la vie du contact. Un client vu chez deux enseignes en août et chez
 * une seule en septembre est exclusif de celle-là pour septembre, et c'est bien ce que le
 * commercial vient chercher. La phrase sous le titre le dit, parce que personne ne
 * devinerait qu'un même client change de colonne selon la période.</p>
 *
 * <h3>Le détail se demande, il ne se charge pas</h3>
 * <p>« Avec qui cette enseigne partage ses clients » est une seconde lecture, et elle
 * n'intéresse qu'une ligne à la fois. La charger pour les soixante-quinze enseignes à
 * l'ouverture coûterait soixante-quinze requêtes pour une réponse qu'on ne lira pas.</p>
 */

function Voisins({
  debut,
  fin,
  nom,
  partenaireId,
}: {
  debut: string;
  fin: string;
  nom: string;
  partenaireId: string;
}) {
  const { data, isLoading } = useVoisinsPartenaireQuery(partenaireId, debut, fin);

  return (
    <div className="flex flex-col gap-2 rounded-large border border-separator bg-surface p-4">
      <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Les clients de {nom} vont aussi
      </h2>
      {isLoading ? (
        <Spinner size="sm" />
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted">
          Aucun de ses clients n&apos;a commandé ailleurs sur la période : son audience lui
          appartient entièrement.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {data.map((v) => (
            <li className="flex items-center justify-between gap-4 text-sm" key={v.partenaireId}>
              <span className="truncate text-foreground">{v.partenaire}</span>
              <span className="shrink-0 tabular-nums text-muted">
                {formatNombre(v.nbClients)} client{v.nbClients > 1 ? 's' : ''} en commun
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StatsPartenairesView() {
  const [periode, setPeriode] = useQueryStates(
    {
      debut: parseAsString.withDefault(''),
      fin: parseAsString.withDefault(''),
    },
    { clearOnDefault: true, urlKeys: { debut: 'spDebut', fin: 'spFin' } },
  );

  const [ouvert, setOuvert] = React.useState<{ id: string; nom: string } | null>(null);

  const ouvrir = React.useCallback(
    (id: string, nom: string) => setOuvert({ id, nom }),
    [],
  );

  const { error, isLoading, refetch, table, total } = useStatsPartenairesTable(
    periode.debut,
    periode.fin,
    ouvrir,
  );

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Par restaurant</h1>
        <p className="text-sm text-muted">
          Ce que chaque enseigne apporte à la base. « Exclusif » se compte sur la période
          choisie : un client vu ailleurs en août et seulement ici en septembre est exclusif
          d&apos;ici pour septembre.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-separator bg-surface px-3 py-2.5">
        <TextField
          className="w-40"
          onChange={(v) => void setPeriode({ debut: v })}
          value={periode.debut}
        >
          <Label>Du</Label>
          <Input type="date" />
        </TextField>
        <TextField
          className="w-40"
          onChange={(v) => void setPeriode({ fin: v })}
          value={periode.fin}
        >
          <Label>Au</Label>
          <Input type="date" />
        </TextField>
        <p className="mb-2 text-xs text-muted">
          {periode.debut || periode.fin
            ? `${formatNombre(total)} restaurant${total > 1 ? 's' : ''} sur la période`
            : 'Toute la base'}
        </p>
      </div>

      {error ? (
        <EtatErreur
          detail={(error as Error).message}
          onReessayer={() => void refetch()}
          quoi="les statistiques par restaurant"
        />
      ) : (
        <Table aria-label="Statistiques par restaurant">
          <Table.ScrollContainer>
            <Table.Content aria-label="Statistiques par restaurant" className="min-w-[52rem]">
              <Table.Header>
                {table.getFlatHeaders().map((h, i) => (
                  <Table.Column id={h.id} isRowHeader={i === 0} key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  isLoading ? null : (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Store aria-hidden="true" className="size-6 text-muted" />
                      <p className="text-sm text-foreground">
                        Aucune commande sur cette période.
                      </p>
                    </div>
                  )
                }
              >
                {isLoading
                  ? /*
                      Le squelette dérive son nombre de cellules de la liste des colonnes.
                      Un compte écrit à la main fait lever « Cell count must match column
                      count » à React Aria, et la page entière tombe en 500.
                    */
                    [0, 1, 2, 3, 4].map((i) => (
                      <Table.Row id={`squelette-${i}`} key={`squelette-${i}`}>
                        {statsPartenairesColumns.map((_, j) => (
                          <Table.Cell key={j}>
                            <div className="h-4 animate-pulse rounded bg-surface-2" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <Table.Row id={row.id} key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <Table.Cell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      {ouvert ? (
        <Voisins
          debut={periode.debut}
          fin={periode.fin}
          nom={ouvert.nom}
          partenaireId={ouvert.id}
        />
      ) : (
        <p className="text-xs text-muted">
          Ouvre une ligne pour voir où vont aussi les clients de cette enseigne.
        </p>
      )}
    </section>
  );
}
