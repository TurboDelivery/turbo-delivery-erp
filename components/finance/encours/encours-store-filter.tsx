'use client';

import { useMemo } from 'react';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/heroui';
import { ChevronDown, Store } from 'lucide-react';
import { useEncoursStoresQuery } from '@/features/encours';

/**
 * Filtre « Points de vente » (§4) : multi-sélection des stores d'UN partenaire précis,
 * boutons Tout / Aucun. Désactivé tant qu'aucun partenaire n'est sélectionné.
 * value = [] signifie « tous les points de vente ».
 */
export function EncoursStoreFilter({
  partenaire,
  value,
  onChange,
}: {
  partenaire: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const enabled = !!partenaire;
  const { data: stores } = useEncoursStoresQuery(partenaire);
  const options = stores ?? [];
  const allIds = useMemo(() => options.map((o) => o.id), [options]);

  if (!enabled) {
    return (
      <Button size="sm" variant="flat" isDisabled startContent={<Store className="h-4 w-4" />}>
        Points de vente
      </Button>
    );
  }

  const label =
    value.length === 0
      ? 'Tous les points de vente'
      : `${value.length} sélectionné${value.length > 1 ? 's' : ''}`;

  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <Button
          size="sm"
          variant="bordered"
          className="max-w-[220px]"
          startContent={<Store className="h-4 w-4 shrink-0" />}
          endContent={<ChevronDown className="h-4 w-4 shrink-0" />}
        >
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <div className="flex w-full items-center justify-between gap-2 border-b border-default-200 px-3 py-2">
          <span className="text-xs font-medium text-default-500">Points de vente</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="light"
              className="h-6 min-w-0 px-2 text-xs"
              onPress={() => onChange(allIds)}
            >
              Tout
            </Button>
            <Button
              size="sm"
              variant="light"
              className="h-6 min-w-0 px-2 text-xs"
              onPress={() => onChange([])}
            >
              Aucun
            </Button>
          </div>
        </div>
        <div className="max-h-64 w-full overflow-y-auto p-3">
          {options.length > 0 ? (
            <CheckboxGroup value={value} onValueChange={onChange} size="sm">
              {options.map((o) => (
                <Checkbox key={o.id} value={o.id}>
                  {o.nom}
                </Checkbox>
              ))}
            </CheckboxGroup>
          ) : (
            <p className="text-sm text-default-400">Aucun point de vente.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
