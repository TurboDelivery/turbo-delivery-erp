'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Check } from 'lucide-react';

import menuData, { IMenuData } from '@/config/menu-data';
import { APP_ROLES, AppRole, defineAbilityFor } from '@/lib/casl/ability';

interface FlatRow {
  key: string;
  title: string;
  isParent: boolean;
  can?: IMenuData['can'];
}

/** Aplatit l'arbre du menu : parents (groupe) puis leurs enfants indentés. */
function flatten(items: IMenuData[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const it of items) {
    if (it.children?.length) {
      rows.push({ key: it.title, title: it.title, isParent: true, can: it.can });
      for (const c of it.children) {
        rows.push({ key: `${it.title}>${c.title}`, title: c.title, isParent: false, can: c.can });
      }
    } else {
      rows.push({ key: it.title, title: it.title, isParent: false, can: it.can });
    }
  }
  return rows;
}

// Abilities pré-calculées une fois par rôle (fonctions pures).
const ABILITIES: Record<string, ReturnType<typeof defineAbilityFor>> = Object.fromEntries(
  APP_ROLES.map((r) => [r, defineAbilityFor(r as AppRole)]),
);

// Colonnes : "Menu / Page" + un rôle par colonne. Un seul tableau mappé
// (pattern React-Aria du codebase).
const COLONNES = [{ key: '__item', label: 'Menu / Page' }, ...APP_ROLES.map((r) => ({ key: r, label: r }))];

export function PrivilegesMatrix() {
  const rows = React.useMemo(() => flatten(menuData), []);

  return (
    <div className="overflow-x-auto rounded-xl border border-default-200 bg-white">
      <Table
        aria-label="Matrice des privilèges par rôle"
        removeWrapper
        isCompact
        classNames={{
          th: 'bg-default-100 text-[10px] font-semibold uppercase tracking-wide text-default-600 whitespace-nowrap',
          td: 'border-b border-default-50',
        }}
      >
        <TableHeader>
          {COLONNES.map((c) => (
            <TableColumn key={c.key} className={c.key === '__item' ? 'sticky left-0 z-10 bg-default-100' : 'text-center'}>
              {c.label}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} className={row.isParent ? 'bg-default-50' : undefined}>
              {COLONNES.map((c) => {
                if (c.key === '__item') {
                  return (
                    <TableCell key={c.key} className="sticky left-0 z-10 bg-inherit">
                      {row.isParent ? (
                        <span className="font-semibold text-default-800">{row.title}</span>
                      ) : (
                        <span className="pl-4 text-default-600">{row.title}</span>
                      )}
                    </TableCell>
                  );
                }
                const allowed = row.can ? ABILITIES[c.key].can(row.can.action, row.can.subject) : null;
                return (
                  <TableCell key={c.key} className="text-center">
                    {allowed === null ? (
                      <span className="text-default-200">—</span>
                    ) : allowed ? (
                      <Check className="mx-auto h-4 w-4 text-success-600" />
                    ) : (
                      <span className="text-default-200">·</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
