'use client';

import { ReactNode } from 'react';
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { IEncoursReleve, MOIS_COURTS, cycleLabel, formatFcfa } from '@/features/encours';

type Cell = { node: ReactNode; cn?: string };
type Line = { key: string; cn?: string; cells: Cell[] };

/**
 * Tableau cascade Partenaire → Store (en-tête collant). Colonnes mensuelles dynamiques,
 * badge de cycle, sous-total par partenaire, total général. Cellule vide = « — ».
 */
export function EncoursTable({ releve }: { releve: IEncoursReleve }) {
  const mois = releve.moisColonnes ?? [];
  const numCn = 'text-right tabular-nums whitespace-nowrap';

  const cols = [
    { key: 'libelle', label: 'Partenaire / Store', cn: 'text-left' },
    ...mois.map((m) => ({ key: `m${m}`, label: MOIS_COURTS[m] ?? `M${m}`, cn: 'text-right' })),
    { key: 'totalFact', label: 'Total fact.', cn: 'text-right' },
    { key: 'deduction', label: 'Avance / Déd.', cn: 'text-right' },
    { key: 'reste', label: 'Reste', cn: 'text-right' },
  ];

  const empties = (n: number): Cell[] => Array.from({ length: n }, () => ({ node: '' }));
  const lines: Line[] = [];

  (releve.partenaires ?? []).forEach((p, pi) => {
    // En-tête de groupe (ombré) + badge cycle
    lines.push({
      key: `g-${pi}`,
      cn: 'bg-default-100/80',
      cells: [
        {
          node: (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-default-800">{p.groupe}</span>
              <Chip
                size="sm"
                variant="flat"
                color={p.cycle === 'QUINZAINE' ? 'secondary' : 'default'}
                className="h-5"
              >
                {cycleLabel(p.cycle)}
              </Chip>
            </div>
          ),
        },
        ...empties(mois.length + 3),
      ],
    });

    // Stores
    p.stores.forEach((s, si) => {
      lines.push({
        key: `g${pi}-s${si}`,
        cn: 'hover:bg-primary/5 transition-colors',
        cells: [
          {
            node: (
              <span className="flex items-center gap-2 pl-3 text-default-600">
                <span className="h-1.5 w-1.5 rounded-full bg-default-300" />
                {s.store}
              </span>
            ),
          },
          ...mois.map((m) => ({ node: cellMoney(s.factureParMois?.[String(m)]), cn: numCn })),
          { node: formatFcfa(s.totalFacture), cn: numCn },
          { node: '', cn: numCn },
          { node: <span className="font-medium text-foreground">{formatFcfa(s.reste)}</span>, cn: numCn },
        ],
      });
    });

    // Sous-total partenaire
    lines.push({
      key: `g${pi}-st`,
      cn: 'bg-amber-50/70',
      cells: [
        { node: <span className="font-semibold text-amber-800">Sous-total {p.groupe}</span> },
        ...empties(mois.length),
        { node: <span className="font-semibold text-amber-800">{formatFcfa(p.sousTotalFacture)}</span>, cn: numCn },
        {
          node: (
            <span className="font-medium text-amber-700">
              {p.deduction ? `- ${formatFcfa(p.deduction)}` : '—'}
            </span>
          ),
          cn: numCn,
        },
        { node: <span className="font-bold text-amber-900">{formatFcfa(p.sousTotalReste)}</span>, cn: numCn },
      ],
    });
  });

  // Total général
  lines.push({
    key: 'total-general',
    cn: 'bg-primary/10',
    cells: [
      { node: <span className="font-bold text-primary">TOTAL GÉNÉRAL</span> },
      ...empties(mois.length),
      { node: <span className="font-bold text-primary">{formatFcfa(releve.totalFacture)}</span>, cn: numCn },
      {
        node: (
          <span className="font-semibold text-primary/80">
            {releve.totalDeductions ? `- ${formatFcfa(releve.totalDeductions)}` : '—'}
          </span>
        ),
        cn: numCn,
      },
      { node: <span className="text-base font-bold text-primary">{formatFcfa(releve.totalReste)}</span>, cn: numCn },
    ],
  });

  return (
    <Table
      aria-label="Relevé des restes à payer"
      isHeaderSticky
      classNames={{
        wrapper: 'max-h-[64vh] overflow-auto rounded-xl border border-default-200 p-0 shadow-none',
        th: 'bg-default-100 text-[11px] font-semibold uppercase tracking-wide text-default-600',
        td: 'py-2.5',
      }}
      className="min-w-[760px]"
    >
      <TableHeader>
        {cols.map((c) => (
          <TableColumn key={c.key} className={c.cn}>
            {c.label}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent="Aucun reste à payer pour cette sélection.">
        {lines.map((l) => (
          <TableRow key={l.key} className={l.cn}>
            {l.cells.map((cell, i) => (
              <TableCell key={cols[i].key} className={cell.cn}>
                {cell.node}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function cellMoney(n?: number | null): ReactNode {
  if (n === null || n === undefined) return <span className="text-default-300">—</span>;
  return formatFcfa(n);
}
