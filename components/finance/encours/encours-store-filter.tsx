'use client';

import { Button, Checkbox, CheckboxGroup, Popover, Separator } from '@heroui-v3/react';
import { ChevronDown, Store } from 'lucide-react';
import { useMemo } from 'react';

import { useEncoursStoresQuery } from '@/features/encours';

/**
 * Filtre « Points de vente » (§4) : multi-sélection des stores d'UN partenaire précis,
 * boutons Tout / Aucun. Désactivé tant qu'aucun partenaire n'est sélectionné.
 * value = [] signifie « tous les points de vente ».
 */
export function EncoursStoreFilter({
  onChange,
  partenaire,
  value,
}: {
  onChange: (ids: string[]) => void;
  partenaire: string;
  value: string[];
}) {
  const enabled = Boolean(partenaire);
  const { data: stores } = useEncoursStoresQuery(partenaire);
  const options = useMemo(() => stores ?? [], [stores]);
  const allIds = useMemo(() => options.map((o) => o.id), [options]);

  if (!enabled) {
    return (
      <Button isDisabled size="sm" variant="outline">
        <Store aria-hidden="true" className="size-4" />
        Points de vente
      </Button>
    );
  }

  const label =
    value.length === 0
      ? 'Tous les points de vente'
      : `${value.length} sélectionné${value.length > 1 ? 's' : ''}`;

  return (
    <Popover>
      <Button className="max-w-[220px]" size="sm" variant="outline">
        <Store aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
      </Button>
      <Popover.Content className="w-72">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted">Points de vente</span>
          <div className="flex gap-1">
            <Button onPress={() => onChange(allIds)} size="sm" variant="ghost">
              Tout
            </Button>
            <Button onPress={() => onChange([])} size="sm" variant="ghost">
              Aucun
            </Button>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="max-h-64 w-full overflow-y-auto">
          {options.length > 0 ? (
            <CheckboxGroup onChange={onChange} value={value}>
              {options.map((o) => (
                <Checkbox key={o.id} value={o.id}>
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    {o.nom}
                  </Checkbox.Content>
                </Checkbox>
              ))}
            </CheckboxGroup>
          ) : (
            <p className="text-sm text-muted">Aucun point de vente.</p>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}
