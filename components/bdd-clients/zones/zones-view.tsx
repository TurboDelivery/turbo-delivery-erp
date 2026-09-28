'use client';

import React from 'react';
import { ListBox, Select, Label, Spinner } from '@heroui-v3/react';
import { MapPin } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import {
  formatNombre,
  useLibellesDeZoneQuery,
  useRapprocherZoneMutation,
  useZonesQuery,
} from '@/features/bdd-clients';

/**
 * Rapprocher le quartier du ticket et celui du référentiel.
 *
 * <h3>Pourquoi un humain doit trancher</h3>
 * <p>Le ticket porte « MARCORY RÉSIDENTIEL », le référentiel connaît « Marcory-Zone 4 ».
 * Un appariement automatique sur le premier mot ferait tomber « COCODY 2 PLATEAUX » sur
 * « Cocody-Angré » : deux quartiers distincts. Une zone fausse est pire qu'une zone
 * absente, parce qu'elle ne se voit pas — elle produit un filtre qui rend des gens,
 * simplement pas les bons.</p>
 *
 * <h3>Ce qui reste à faire, en premier</h3>
 * <p>Le serveur classe les libellés jamais tranchés avant les autres, puis par fréquence.
 * C'est la seule liste de ce module qui soit une file de travail : on la descend jusqu'à
 * ce qu'il n'y ait plus rien en haut.</p>
 *
 * <h3>« Aucune zone » est un choix, pas une absence de choix</h3>
 * <p>« À emporter » n'a pas de quartier. Sans cette option, le libellé reviendrait à
 * chaque ouverture de l'écran et la file ne se viderait jamais.</p>
 */

const AUCUNE = '__aucune';

export function ZonesView() {
  const zones = useZonesQuery();
  const { data, error, isLoading, refetch } = useLibellesDeZoneQuery();
  const rapprocher = useRapprocherZoneMutation();

  const [enCours, setEnCours] = React.useState<string | null>(null);

  const choisir = (libelle: string, valeur: string) => {
    setEnCours(libelle);
    rapprocher.mutate(
      { libelle, zoneId: valeur === AUCUNE ? null : valeur },
      { onSettled: () => setEnCours(null) },
    );
  };

  const restants = (data ?? []).filter((l) => !l.arbitre).length;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Quartiers</h1>
        <p className="text-sm text-muted">
          Ce que les agents tapent sur les tickets, rapproché des zones du référentiel. Le
          rapprochement vaut aussi pour ce qui est déjà saisi, et il se corrige.
        </p>
      </div>

      {error ? (
        <EtatErreur
          detail={(error as Error).message}
          onReessayer={() => void refetch()}
          quoi="les quartiers saisis"
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div className="h-14 animate-pulse rounded-md bg-surface-2" key={i} />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-large border border-separator bg-surface p-10 text-center">
          <MapPin aria-hidden="true" className="size-6 text-muted" />
          <p className="text-sm text-foreground">Aucun quartier n&apos;a encore été saisi.</p>
          <p className="max-w-md text-xs text-muted">
            Cette liste se remplira des libellés que les agents tapent réellement. Tant
            qu&apos;elle est vide, le filtre par zone ne rend personne, et c&apos;est normal.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted">
            {restants === 0
              ? 'Tous les libellés sont tranchés.'
              : `${formatNombre(restants)} libellé${restants > 1 ? 's' : ''} à trancher, en haut de la liste.`}
          </p>

          <ul className="flex flex-col divide-y divide-separator rounded-large border border-separator bg-surface">
            {data.map((ligne) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 p-3"
                key={ligne.libelleNormalise}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-foreground">{ligne.libelleVu}</span>
                  <span className="text-xs text-muted">
                    <span className="tabular-nums">{formatNombre(ligne.nbCaptures)}</span>{' '}
                    commande{ligne.nbCaptures > 1 ? 's' : ''}
                    {ligne.arbitre ? '' : ' · jamais tranché'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {enCours === ligne.libelleNormalise ? <Spinner size="sm" /> : null}
                  <Select
                    className="w-56"
                    isDisabled={rapprocher.isPending}
                    // ⚠ `placeholder` se pose sur Select, pas sur Select.Value : posé
                    // là, le menu d'un libellé non tranché restait VIDE. « À rapprocher »
                    // dit ce qu'il reste à faire, pas « sélectionner ».
                    placeholder="À rapprocher"
                    onSelectionChange={(k) =>
                      choisir(ligne.libelleNormalise, String(k ?? ''))
                    }
                    selectedKey={ligne.arbitre ? (ligne.zoneId ?? AUCUNE) : null}
                  >
                    <Label className="sr-only">Zone pour {ligne.libelleVu}</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {/*
                          « Aucune zone » est un CHOIX. Sans lui, « à emporter »
                          reviendrait à chaque ouverture et la file ne se viderait jamais.
                        */}
                        <ListBox.Item id={AUCUNE} textValue="Aucune zone">
                          Aucune zone
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        {(zones.data ?? []).map((z) => (
                          <ListBox.Item id={z.id} key={z.id} textValue={z.libelle}>
                            {z.libelle}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
