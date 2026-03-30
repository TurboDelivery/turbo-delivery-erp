'use client';

import { useState } from 'react';
import { ArrowLeft, Wallet, CheckCircle, Clock, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@heroui/react';
import { Card, CardBody } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { usePaymentStatusQuery } from '@/feature-finance/depenses/queries/depense-status.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useModifierStatutDepenseMutation } from '@/feature-finance/depenses/queries/depense.mutation';
import { useModifierDepenseMutation } from '@/feature-finance/depenses/queries/depense.mutation';

interface Payment {
  id: string;
  designation: string;
  month: string;
  amount: string;
  status: 'pending' | 'paid';
  paymentDate?: string;
}

export default function PaymentManagement() {
  const [selectedMonth, setSelectedMonth] = useState('2026-03');

  const modifierStatutDepenseMutation = useModifierStatutDepenseMutation();

  // Convertir le mois sélectionné en dates de début et fin
  const getMonthDates = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    const debut = new Date(year, month - 1, 1); // 1er jour du mois
    const fin = new Date(year, month, 0); // Dernier jour du mois
    return { debut, fin };
  };

  const { debut, fin } = getMonthDates(selectedMonth);

  const { data: paymentStatus, isLoading } = usePaymentStatusQuery({ debut, fin });

  // Fonction pour marquer une dépense comme payée
  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      console.log('🚀 Marquer comme payé:', paymentId);
      
      await modifierStatutDepenseMutation.mutateAsync({
        id: paymentId,
        statut: 'PAID'
      });
      
      console.log('✅ Statut modifié avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme payé:', error);
    }
  };

  // Debug: Afficher les données de l'API
  console.log('Données de l\'API PaymentStatus:', paymentStatus);
  console.log('Filtre appliqué:', { debut, fin, selectedMonth });

  const months = [
    { key: '2026-01', label: 'Janvier 2026' },
    { key: '2026-02', label: 'Février 2026' },
    { key: '2026-03', label: 'Mars 2026' },
    { key: '2026-04', label: 'Avril 2026' },
    { key: '2026-05', label: 'Mai 2026' },
    { key: '2026-06', label: 'Juin 2026' },
  ];

  // Transformer les données de l'API pour correspondre à l'interface
  const pendingPayments = paymentStatus?.pending?.map(payment => ({
    id: payment.id,
    designation: payment.description,
    month: new Date(payment.dateDepense).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit' }),
    amount: formatCFA(payment.montant),
    status: 'pending' as const,
    paymentDate: payment.dateDepense,
  })) || [];

  const paidPayments = paymentStatus?.paid?.map(payment => ({
    id: payment.id,
    designation: payment.description,
    month: new Date(payment.dateDepense).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit' }),
    amount: formatCFA(payment.montant),
    status: 'paid' as const,
    paymentDate: payment.dateDepense,
  })) || [];

  const stats = {
    pending: { 
      amount: formatCFA(paymentStatus?.totalPending || 0), 
      count: paymentStatus?.pending?.length || 0 
    },
    paid: { 
      amount: formatCFA(paymentStatus?.totalPaid || 0), 
      count: paymentStatus?.paid?.length || 0 
    },
    total: { 
      amount: formatCFA(paymentStatus?.total || 0), 
      count: (paymentStatus?.pending?.length || 0) + (paymentStatus?.paid?.length || 0) 
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gestion des Paiements</h1>
                <p className="text-sm text-gray-500">Suivez et validez les décaissements</p>
              </div>
            </div>

            <Select
              label="Mois"
              selectedKeys={[selectedMonth]}
              onSelectionChange={(keys) => setSelectedMonth(Array.from(keys)[0] as string)}
              className="max-w-xs"
            >
              {months.map((month) => (
                <SelectItem key={month.key} value={month.key}>
                  {month.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* En Attente */}
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">En Attente</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stats.pending.amount}</p>
              <p className="text-sm text-gray-600">{stats.pending.count} paiement(s)</p>
            </CardBody>
          </Card>

          {/* Payé */}
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">Payé</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stats.paid.amount}</p>
              <p className="text-sm text-gray-600">{stats.paid.count} paiement(s)</p>
            </CardBody>
          </Card>

          {/* Total */}
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stats.total.amount}</p>
              <p className="text-sm text-gray-600">{stats.total.count} paiement(s)</p>
            </CardBody>
          </Card>
        </div>

        {/* Pending Payments Section */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">En attente ({pendingPayments.length})</h2>
              </div>
            </div>

            <Table aria-label="Paiements en attente">
              <TableHeader>
                <TableColumn>DÉSIGNATION</TableColumn>
                <TableColumn>MOIS</TableColumn>
                <TableColumn>MONTANT</TableColumn>
                <TableColumn>STATUT</TableColumn>
                <TableColumn className="text-right">ACTION</TableColumn>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm font-medium text-gray-900">
                      {payment.designation}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {payment.month}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900">
                      {payment.amount}
                    </TableCell>
                    <TableCell>
                      <Chip color="warning" variant="flat" size="sm">
                        Pending
                      </Chip>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        color="success"
                        size="sm"
                        startContent={<CheckCircle className="w-4 h-4" />}
                        onClick={() => handleMarkAsPaid(payment.id)}
                        disabled={modifierStatutDepenseMutation.isPending}
                      >
                        {modifierStatutDepenseMutation.isPending ? 'En cours...' : 'Marquer payé'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Paid History Section */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Historique payés ({paidPayments.length})</h2>
            </div>

            <Table aria-label="Historique des paiements">
              <TableHeader>
                <TableColumn>DÉSIGNATION</TableColumn>
                <TableColumn>MOIS</TableColumn>
                <TableColumn>MONTANT</TableColumn>
                <TableColumn>DATE PAIEMENT</TableColumn>
                <TableColumn>STATUT</TableColumn>
              </TableHeader>
              <TableBody>
                {paidPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm font-medium text-gray-900">
                      {payment.designation}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {payment.month}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900">
                      {payment.amount}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {payment.paymentDate}
                    </TableCell>
                    <TableCell>
                      <Chip color="success" variant="flat" size="sm">
                        Payé
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
