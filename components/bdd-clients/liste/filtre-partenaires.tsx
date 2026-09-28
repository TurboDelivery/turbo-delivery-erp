'use client';

import React from 'react';
import { Button, Checkbox, Popover, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { ChevronDown, Store } from 'lucide-react';

import { formatNombre, usePartenairesQuery } from '@/features/bdd-clients';

/**
 * Choisir des restaurants, et dire comment on les croise.
 *
 * <h3>Ce que « TOUS » change, et pourquoi il fallait l'exposer</h3>
 * <p>Le serveur sait répondre à deux questions différentes : « qui a commandé chez l'un
 * OU l'autre » et « qui a commandé chez l'un ET l'autre ». La seconde est la question
 * commerciale — celle qui trouve les clients partagés entre deux enseignes — et l'écran
 * ne l'atteignait pas : il envoyait toujours la première.</p>
 *
 * <p>Le bascule n'apparaît qu'à partir de DEUX restaurants : sur un seul, « tous » et
 * « au moins un » disent la même chose, et proposer un choix sans effet fait douter de
 * celui qu'on vient de faire.</p>
 *
 * <h3>Un panneau, pas une liste déroulante</h3>
 * <p>Il s'agit d'une multi-sélection sur des dizaines d'établissements, avec une
 * recherche. Un `Select` à choix multiple tiendrait mal dans une barre de filtres déjà
 * pleine, et cacherait le compte de ce qui est coché.</p>
 */
export function FiltrePartenaires({
  logique,
  onChanger,
  selection,
}: {
  logique: 'AU_MOINS_UN' | 'TOUS';
  onChanger: (valeurs: { logique?: 'AU_MOINS_UN' | 'TOUS'; partenaires?: string[] }) => void;
  selection: string[];
}) {
  const { data, isLoading } = usePartenairesQuery();
  const [recherche, setRecherche] = React.useState('');

  const visibles = React.useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const tous = data ?? [];
    return q === '' ? tous : tous.filter((p) => p.libelle.toLowerCase().includes(q));
  }, [data, recherche]);

  const basculer = (id: string, coche: boolean) =>
    onChanger({
      partenaires: coche ? [...selection, id] : selection.filter((x) => x !== id),
    });

  const libelle =
    selection.length === 0
      ? 'Tous les restaurants'
      : selection.length === 1
        ? ((data ?? []).find((p) => p.id === selection[0])?.libelle ?? '1 restaurant')
        : `${formatNombre(selection.length)} restaurants`;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-foreground">Restaurants</span>
      <div className="flex items-center gap-2">
        <Popover>
          <Button size="sm" variant="ghost">
            <Store aria-hidden="true" className="size-4" />
            <span className="max-w-[12rem] truncate">{libelle}</span>
            <ChevronDown aria-hidden="true" className="size-4" />
          </Button>
          <Popover.Content className="w-72 p-2">
            <input
              aria-label="Chercher un restaurant"
              className="mb-2 w-full rounded-medium border border-separator bg-surface px-2 py-1.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Chercher…"
              value={recherche}
            />
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {isLoading ? (
                <p className="p-2 text-sm text-muted">Chargement…</p>
              ) : visibles.length === 0 ? (
                <p className="p-2 text-sm text-muted">
                  {(data ?? []).length === 0
                    ? 'Aucun restaurant n’a encore de commande saisie.'
                    : 'Aucun restaurant ne porte ce nom.'}
                </p>
              ) : (
                visibles.map((p) => (
                  <Checkbox
                    isSelected={selection.includes(p.id)}
                    key={p.id}
                    onChange={(coche) => basculer(p.id, coche)}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <span className="truncate text-sm">{p.libelle}</span>
                    </Checkbox.Content>
                  </Checkbox>
                ))
              )}
            </div>
            {selection.length > 0 ? (
              <Button
                className="mt-2 w-full"
                onPress={() => onChanger({ partenaires: [] })}
                size="sm"
                variant="ghost"
              >
                Tout décocher
              </Button>
            ) : null}
          </Popover.Content>
        </Popover>

        {/*
          Le croisement n'a de sens qu'à partir de DEUX restaurants : sur un seul, les
          deux réponses sont identiques, et proposer un choix sans effet fait douter de
          celui qu'on vient de faire.
        */}
        {selection.length > 1 ? (
          <ToggleButtonGroup
            aria-label="Croisement des restaurants"
            disallowEmptySelection
            onSelectionChange={(k) =>
              onChanger({ logique: [...k][0] === 'TOUS' ? 'TOUS' : 'AU_MOINS_UN' })
            }
            selectedKeys={[logique]}
            selectionMode="single"
            size="sm"
          >
            <ToggleButton id="AU_MOINS_UN">Chez l&apos;un</ToggleButton>
            <ToggleButton id="TOUS">
              <ToggleButtonGroup.Separator />
              Chez tous
            </ToggleButton>
          </ToggleButtonGroup>
        ) : null}
      </div>
    </div>
  );
}
