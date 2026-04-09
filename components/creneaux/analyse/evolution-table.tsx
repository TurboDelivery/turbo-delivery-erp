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
      <Table aria-label="Evolution mensuelle" removeWrapper>
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
    </div>
  );
}
