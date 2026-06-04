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
import { IEncoursReleve, cycleLabel, formatFcfa } from '@/features/encours';
import { formatPeriodeFactureeEncours } from '@/lib/finance/periode-facturee';

type Cell = { node: ReactNode; cn?: string };
type Line = { key: string; cn?: string; cells: Cell[] };

const STATUT_COLOR: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  Payé: 'success',
  Partiel: 'warning',
  'En retard': 'danger',
  'En cours': 'default',
};

function StatutChip({ statut }: { statut: string }) {
  return (
    <Chip size="sm" variant="flat" color={STATUT_COLOR[statut] ?? 'default'} className="h-5">
      {statut}
    </Chip>
  );
}

/**
 * Tableau ENCOURS v3 — détail FACTURE PAR FACTURE (§6.1). Cascade Partenaire → Store →
 * factures (mois / quinzaine / semaine), colonnes Total à payer · Acompte · Solde · Statut,
 * sous-total par partenaire, total général. En-tête collant. (Desktop — voir cartes mobile.)
 */
export function EncoursTable({ releve }: { releve: IEncoursReleve }) {
  const numCn = 'text-right tabular-nums whitespace-nowrap';
  const cols = [
    { key: 'store', label: 'Store', cn: 'text-left' },
    // « Période facturée » : fusion des anciennes colonnes Période + Facture,
    // formatée selon le cycle du partenaire (logique partagée avec Finance-Recouvrement).
    { key: 'periode', label: 'Période facturée', cn: 'text-left' },
    { key: 'tap', label: 'Total à payer', cn: 'text-right' },
    { key: 'acompte', label: 'Acompte', cn: 'text-right' },
    { key: 'solde', label: 'Solde', cn: 'text-right' },
    { key: 'statut', label: 'Statut', cn: 'text-center' },
  ];

  const empt = (n: number): Cell[] => Array.from({ length: n }, () => ({ node: '' }));
  const lines: Line[] = [];

  (releve.partenaires ?? []).forEach((p, pi) => {
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
                color={p.cycle === 'QUINZAINE' ? 'secondary' : p.cycle === 'HEBDOMADAIRE' ? 'primary' : 'default'}
                className="h-5"
              >
                {cycleLabel(p.cycle)}
              </Chip>
            </div>
          ),
        },
        ...empt(5),
      ],
    });

    p.stores.forEach((s, si) => {
      s.factures.forEach((f, fi) => {
        const aVenir = f.statut === 'À venir';
        lines.push({
          key: `g${pi}-s${si}-f${fi}`,
          cn: aVenir ? 'text-default-300' : 'hover:bg-primary/5 transition-colors',
          cells: [
            {
              node:
                fi === 0 ? (
                  <span className="flex items-center gap-2 pl-3 font-medium text-default-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-default-300" />
                    {s.store}
                  </span>
                ) : (
                  ''
                ),
            },
            { node: formatPeriodeFactureeEncours(releve.annee, f.mois, p.cycle, f.libelle), cn: 'text-default-600 whitespace-nowrap' },
            { node: formatFcfa(f.totalAPayer), cn: numCn },
            {
              node: f.acompte ? formatFcfa(f.acompte) : <span className="text-default-300">—</span>,
              cn: numCn,
            },
            { node: <span className="font-semibold text-foreground">{formatFcfa(f.solde)}</span>, cn: numCn },
            { node: <StatutChip statut={f.statut} />, cn: 'text-center' },
          ],
        });
      });
    });

    lines.push({
      key: `g${pi}-st`,
      cn: 'bg-amber-50/70',
      cells: [
        { node: <span className="font-semibold text-amber-800">Sous-total {p.groupe}</span> },
        { node: '' },
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
        { node: '' },
      ],
    });
  });

  lines.push({
    key: 'total-general',
    cn: 'bg-primary/10',
    cells: [
      { node: <span className="font-bold text-primary">TOTAL GÉNÉRAL</span> },
      { node: '' },
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
      { node: '' },
    ],
  });

  return (
    <Table
      aria-label="Relevé des restes à payer — détail factures"
      isHeaderSticky
      classNames={{
        wrapper: 'max-h-[64vh] overflow-auto rounded-xl border border-default-200 p-0 shadow-none',
        th: 'bg-default-100 text-[11px] font-semibold uppercase tracking-wide text-default-600',
        td: 'py-2.5',
      }}
      className="min-w-[820px]"
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
