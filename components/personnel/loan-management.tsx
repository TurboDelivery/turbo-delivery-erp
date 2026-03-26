'use client';

import { useState } from 'react';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@heroui/react';
import { Select, SelectItem } from '@heroui/select';
import { LoanTable } from './loan-table';
import { IEmployee, Loan, LoanStats } from '@/features/personnel/types/types';

interface LoanManagementProps {
  loans: Loan[];
  loanStats: LoanStats;
  employees: IEmployee[];
  onAddLoan: (loan: Omit<Loan, 'id'>) => void;
  onUpdateLoanStatus: (loanId: string, action: 'hold' | 'extend') => void;
  onDeleteLoan?: (loanId: string) => void;
}

export function LoanManagement({ loans, employees, onAddLoan, onUpdateLoanStatus }: LoanManagementProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [newLoan, setNewLoan] = useState({
    employeeId: '',
    employeeName: '',
    type: 'Avance sur salaire' as Loan['type'],
    amount: 0,
    reason: '',
    repaymentDuration: 3,
    status: 'En attente' as Loan['status'],
  });

  const handleSubmitLoan = () => {
    if (!newLoan.employeeId || !newLoan.amount || !newLoan.reason) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const employee = employees.find((emp) => emp.id === newLoan.employeeId);
    if (!employee) return;

    onAddLoan({
      employeeId: newLoan.employeeId,
      employeeName: employee.name,
      type: newLoan.type,
      amount: newLoan.amount,
      reason: newLoan.reason,
      date: new Date().toISOString().split('T')[0],
      statut: newLoan.status || 'En attente',
      repaymentDuration: newLoan.repaymentDuration,
    });

    setNewLoan({
      employeeId: '',
      employeeName: '',
      type: 'Avance sur salaire',
      amount: 0,
      reason: '',
      repaymentDuration: 3,
      status: 'En attente',
    });

    onOpenChange();
  };

  const handleDeleteLoan = (loanId: string) => {
    console.log('Supprimer prêt:', loanId);
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    setNewLoan((prev) => ({
      ...prev,
      employeeId,
      employeeName: employee?.name || '',
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Historique des prêts</h2>
        <Button color="primary" onPress={onOpen}>
          + Enregistrer un prêt
        </Button>
      </div>

      {/* Modal nouveau prêt */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Nouveau prêt</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Select
                    label="Employé"
                    placeholder="Sélectionnez un employé"
                    selectedKeys={newLoan.employeeId ? [newLoan.employeeId] : []}
                    onSelectionChange={(keys) => handleEmployeeChange(Array.from(keys)[0] as string)}
                  >
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Type de prêt"
                    placeholder="Sélectionnez le type"
                    selectedKeys={[newLoan.type]}
                    onSelectionChange={(keys) => setNewLoan((prev) => ({ ...prev, type: Array.from(keys)[0] as Loan['type'] }))}
                  >
                    <SelectItem key="Avance sur salaire" value="Avance sur salaire">
                      Avance sur salaire
                    </SelectItem>
                    <SelectItem key="Prêt personnel" value="Prêt personnel">
                      Prêt personnel
                    </SelectItem>
                    <SelectItem key="Aide d'urgence" value="Aide d'urgence">
                      Aide d&#39;urgence
                    </SelectItem>
                  </Select>

                  <Input
                    type="number"
                    label="Montant"
                    placeholder="Entrez le montant"
                    value={newLoan.amount.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLoan((prev) => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    startContent={<span className="text-gray-500">FCFA</span>}
                  />

                  <Input
                    type="number"
                    label="Durée de remboursement (mois)"
                    placeholder="Nombre de mois"
                    value={newLoan.repaymentDuration.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLoan((prev) => ({ ...prev, repaymentDuration: parseInt(e.target.value) || 1 }))}
                  />

                  <Select
                    label="Statut"
                    placeholder="Sélectionnez le statut"
                    selectedKeys={newLoan.status ? [newLoan.status] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0];
                      if (selectedKey) {
                        setNewLoan((prev) => ({ ...prev, status: selectedKey as Loan['status'] }));
                      }
                    }}
                  >
                    <SelectItem key="En attente" value="En attente">
                      En attente
                    </SelectItem>
                    <SelectItem key="Approuvé" value="Approuvé">
                      Approuvé
                    </SelectItem>
                    <SelectItem key="Rejeté" value="Rejeté">
                      Rejeté
                    </SelectItem>
                    <SelectItem key="En cours" value="En cours">
                      En cours
                    </SelectItem>
                    <SelectItem key="Terminé" value="Terminé">
                      Terminé
                    </SelectItem>
                  </Select>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Motif</label>
                    <textarea
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      placeholder="Décrivez le motif du prêt"
                      value={newLoan.reason}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewLoan((prev) => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button color="primary" onPress={handleSubmitLoan}>
                  Enregistrer le prêt
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Tableau des prêts */}
      <LoanTable loans={loans} onUpdateLoanStatus={onUpdateLoanStatus} onDeleteLoan={handleDeleteLoan} />
    </div>
  );
}
