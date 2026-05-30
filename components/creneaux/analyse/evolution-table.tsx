'use client';

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from '@heroui/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface EvolutionRow {
  mois: string;
  previsionnel: number;
  reel: number;
  ecart: number;
  tendance: 'up' | 'down';
}

interface EvolutionTableProps {
  data: EvolutionRow[];
}

export function EvolutionTable({ data }: EvolutionTableProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Evolution Mensuelle</h3>
      <p className="text-sm text-default-500">Comparaison des derniers mois</p>
      {/* Table — desktop uniquement (≥ md) */}
      <Table aria-label="Evolution mensuelle" removeWrapper className="hidden md:block">
        <TableHeader>
          <TableColumn>MOIS</TableColumn>
          <TableColumn>TAUX PREVISIONNEL</TableColumn>
          <TableColumn>TAUX REEL</TableColumn>
          <TableColumn>ECART</TableColumn>
          <TableColumn>TENDANCE</TableColumn>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.mois}>
              <TableCell className="font-medium">{row.mois}</TableCell>
              <TableCell>{row.previsionnel}%</TableCell>
              <TableCell>{row.reel}%</TableCell>
              <TableCell>
                <Chip size="sm" color="danger" variant="flat">{row.ecart}%</Chip>
              </TableCell>
              <TableCell>
                {row.tendance === 'down'
                  ? <TrendingDown className="size-4 text-danger" />
                  : <TrendingUp className="size-4 text-success" />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Mobile — cartes tactiles (mêmes données que le tableau) */}
      <div className="md:hidden space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-default-400 text-center py-6">Aucune donnee</p>
        ) : (
          data.map((row) => (
            <div key={row.mois} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{row.mois}</span>
                {row.tendance === 'down'
                  ? <TrendingDown className="size-4 text-danger" />
                  : <TrendingUp className="size-4 text-success" />}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-default-400 shrink-0">Taux previsionnel</span>
                <span className="text-sm text-gray-700 text-right">{row.previsionnel}%</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-default-400 shrink-0">Taux reel</span>
                <span className="text-sm text-gray-700 text-right">{row.reel}%</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-default-400 shrink-0">Ecart</span>
                <Chip size="sm" color="danger" variant="flat">{row.ecart}%</Chip>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
