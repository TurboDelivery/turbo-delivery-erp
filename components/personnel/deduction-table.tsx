'use client';

import { Badge } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Deduction } from '../../features/personnel/types/types';

interface DeductionTableProps {
  deductions: Deduction[];
}

export function DeductionTable({ deductions }: DeductionTableProps) {
  const getStatusColor = (status: Deduction['status']) => {
    switch (status) {
      case 'Appliquée': return 'success';
      case 'En attente': return 'warning';
      default: return 'default';
    }
  };

  const getTypeColor = (type: Deduction['type']) => {
    switch (type) {
      case 'Retard': return 'warning';
      case 'Absence injustifiée': return 'danger';
      case 'Dommage matériel': return 'secondary';
      case 'Avance sur salaire': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Table aria-label="Liste des déductions">
      <TableHeader>
        <TableColumn>Employé</TableColumn>
        <TableColumn>Type de déduction</TableColumn>
        <TableColumn>Montant</TableColumn>
        <TableColumn>Date</TableColumn>
        <TableColumn>Motif</TableColumn>
        <TableColumn>Statut</TableColumn>
        <TableColumn>Durée de remboursement</TableColumn>
      </TableHeader>
      <TableBody>
        {deductions.map((deduction) => (
          <TableRow key={deduction.id}>
            <TableCell>
              <div className="font-medium">{deduction.employeeName}</div>
            </TableCell>
            <TableCell>
              <Badge 
                color={getTypeColor(deduction.type)} 
                variant="flat"
                className="capitalize"
              >
                {deduction.type}
              </Badge>
            </TableCell>
            <TableCell>{deduction.amount.toLocaleString()} F</TableCell>
            <TableCell>{deduction.date}</TableCell>
            <TableCell>
              <div className="max-w-xs truncate" title={deduction.reason}>
                {deduction.reason}
              </div>
            </TableCell>
            <TableCell>
              <Badge color={getStatusColor(deduction.status)} variant="flat">
                {deduction.status}
              </Badge>
            </TableCell>
            <TableCell>
              {deduction.repaymentDuration ? `${deduction.repaymentDuration} mois` : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
