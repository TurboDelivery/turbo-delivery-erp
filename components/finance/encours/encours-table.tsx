'use client';

import { ReactNode } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { IEncoursReleve, MOIS_COURTS, formatFcfa } from '@/features/encours';

/**
 * Tableau cascade Partenaire → Store du relevé des restes à payer.
 * Colonnes mensuelles dynamiques (selon les mois présents), sous-total par partenaire,
 * total général. Cellule vide = « — » (pas 0).
 */
export function EncoursTable({ releve }: { releve: IEncoursReleve }) {
  const mois = releve.moisColonnes ?? [];

  const cols = [
    { key: 'libelle', label: 'Partenaire / Store', align: 'text-left' },
    ...mois.map((m) => ({ key: `m${m}`, label: MOIS_COURTS[m] ?? `M${m}`, align: 'text-right' })),
    { key: 'totalFact', label: 'Total fact.', align: 'text-right' },
    { key: 'deduction', label: 'Avance / Déd.', align: 'text-right' },
    { key: 'reste', label: 'Reste', align: 'text-right' },
  ];

  const rows: { key: string; className?: string; cells: ReactNode[] }[] = [];

  (releve.partenaires ?? []).forEach((p, pi) => {
    // En-tête de groupe
    rows.push({
      key: `g-${pi}`,
      className: 'bg-gray-100 font-semibold',
      cells: [p.groupe, ...mois.map(() => '' as ReactNode), '', '', ''],
    });
    // Stores
    p.stores.forEach((s, si) => {
      rows.push({
        key: `g${pi}-s${si}`,
        cells: [
          <span className="pl-4">{s.store}</span>,
          ...mois.map((m) => formatFcfa(s.factureParMois?.[String(m)])),
          formatFcfa(s.totalFacture),
          '',
          formatFcfa(s.reste),
        ],
      });
    });
    // Sous-total partenaire
    rows.push({
      key: `g${pi}-st`,
      className: 'bg-gray-50 font-semibold',
      cells: [
        `Sous-total ${p.groupe}`,
        ...mois.map(() => '' as ReactNode),
        formatFcfa(p.sousTotalFacture),
        p.deduction ? `- ${formatFcfa(p.deduction)}` : '—',
        formatFcfa(p.sousTotalReste),
      ],
    });
  });

  // Total général
  rows.push({
    key: 'total-general',
    className: 'bg-primary/10 font-bold',
    cells: [
      'TOTAL GÉNÉRAL',
      ...mois.map(() => '' as ReactNode),
      formatFcfa(releve.totalFacture),
      releve.totalDeductions ? `- ${formatFcfa(releve.totalDeductions)}` : '—',
      formatFcfa(releve.totalReste),
    ],
  });

  return (
    <Table aria-label="Relevé des restes à payer" isStriped removeWrapper className="min-w-[760px]">
      <TableHeader>
        {cols.map((c) => (
          <TableColumn key={c.key} className={c.align}>
            {c.label}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent="Aucun reste à payer pour cette période.">
        {rows.map((r) => (
          <TableRow key={r.key} className={r.className}>
            {r.cells.map((cell, i) => (
              <TableCell key={cols[i].key} className={`${cols[i].align} whitespace-nowrap`}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
