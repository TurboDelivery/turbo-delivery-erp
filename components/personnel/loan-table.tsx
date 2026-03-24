'use client';

import { Button } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loan } from '../../features/personnel/types/types';

interface LoanTableProps {
  loans: Loan[];
  onUpdateLoanStatus: (loanId: string, action: 'hold' | 'extend') => void;
  onDeleteLoan?: (loanId: string) => void;
}

export function LoanTable({ loans, onUpdateLoanStatus, onDeleteLoan }: LoanTableProps) {
  const getEmployeeInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (statut: Loan['statut']) => {
    switch (statut) {
      case 'En attente': return 'bg-yellow-500 text-white border-yellow-200';
      case 'Approuvé': return 'bg-green-600 text-white border-green-300';
      case 'Rejeté': return 'bg-red-600 text-white border-red-300';
      case 'En cours': return 'bg-blue-600 text-white border-blue-300';
      case 'Terminé': return 'bg-gray-600 text-white border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAction = (loanId: string, action: 'hold' | 'extend') => {
    onUpdateLoanStatus(loanId, action);
  };

  const handleDelete = (loanId: string) => {
    if (onDeleteLoan) {
      onDeleteLoan(loanId);
    }
  };

  return (
    <Table aria-label="Historique des prêts">
      <TableHeader>
        <TableColumn>Employé</TableColumn>
        <TableColumn>Type</TableColumn>
        <TableColumn>Montant</TableColumn>
        <TableColumn>Motif</TableColumn>
        <TableColumn>Date</TableColumn>
        <TableColumn>Statut</TableColumn>
        <TableColumn>Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {loans.map((loan) => (
          <TableRow key={loan.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                  {getEmployeeInitials(loan.employeeName)}
                </div>
                <div className="font-medium">{loan.employeeName}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                loan.type === 'Avance sur salaire' ? 'bg-blue-600 text-white border-blue-300' :
                loan.type === 'Prêt personnel' ? 'bg-purple-600 text-white border-purple-300' :
                loan.type === 'Aide d\'urgence' ? 'bg-orange-600 text-white border-orange-300' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {loan.type}
              </div>
            </TableCell>
            <TableCell>
              <div className="font-semibold text-red-600">
                -{loan.amount.toLocaleString()} FCFA
              </div>
            </TableCell>
            <TableCell>
              <div className="max-w-xs truncate" title={loan.reason}>
                {loan.reason}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm text-gray-600">
                {loan.date}
              </div>
            </TableCell>
            <TableCell>
              <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(loan.statut)}`}>
                {loan.statut}
              </div>
            </TableCell>
            <TableCell>
              {loan.statut === 'En attente' ? (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    color="warning" 
                    variant="flat"
                    onClick={() => onUpdateLoanStatus(loan.id, 'hold')}
                  >
                    Mettre en attente
                  </Button>
                  <Button 
                    size="sm" 
                    color="primary" 
                    variant="flat"
                    onClick={() => onUpdateLoanStatus(loan.id, 'extend')}
                  >
                    Prolonger
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    color="danger" 
                    variant="flat"
                    onClick={() => handleDelete(loan.id)}
                  >
                    Suppression de prêt
                  </Button>
                  {onDeleteLoan && (
                    <Button 
                      size="sm" 
                      color="default" 
                      variant="flat"
                      onClick={() => onUpdateLoanStatus(loan.id, 'extend')}
                    >
                      Prolonger
                    </Button>
                  )}
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
