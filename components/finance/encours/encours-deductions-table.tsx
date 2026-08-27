'use client';

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { IEncoursDeduction, formatFcfa } from '@/features/encours';

/** Bloc « Récapitulatif des déductions & avances » (spec §6). */
export function EncoursDeductionsTable({
  deductions,
  total,
}: {
  deductions: IEncoursDeduction[];
  total: number;
}) {
  if (!deductions || deductions.length === 0) return null;

  return (
    <div className="mt-6 max-w-2xl">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">Récapitulatif des déductions &amp; avances</h3>
      <Table aria-label="Déductions et avances" isStriped removeWrapper>
        <TableHeader>
          <TableColumn>PARTENAIRE</TableColumn>
          <TableColumn>MOTIF</TableColumn>
          <TableColumn className="text-right">MONTANT DÉDUIT</TableColumn>
        </TableHeader>
        <TableBody>
          {[
            ...deductions.map((d, i) => (
              <TableRow key={`d-${i}`}>
                <TableCell className="whitespace-nowrap font-medium">{d.partenaire}</TableCell>
                <TableCell>{d.motif || '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-right">{formatFcfa(d.montant)}</TableCell>
              </TableRow>
            )),
            <TableRow key="d-total" className="bg-gray-100 font-bold">
              <TableCell className="whitespace-nowrap">TOTAL</TableCell>
              <TableCell>{''}</TableCell>
              <TableCell className="whitespace-nowrap text-right">{formatFcfa(total)}</TableCell>
            </TableRow>,
          ]}
        </TableBody>
      </Table>
    </div>
  );
}
