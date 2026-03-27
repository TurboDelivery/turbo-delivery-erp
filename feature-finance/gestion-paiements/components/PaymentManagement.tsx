'use client';

import { ArrowLeft, Wallet, CheckCircle, Clock, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@heroui/react';
import { Card, CardBody } from '@heroui/react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { useState } from 'react';

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

  const months = [
    { key: '2026-01', label: 'Janvier 2026' },
    { key: '2026-02', label: 'Février 2026' },
    { key: '2026-03', label: 'Mars 2026' },
    { key: '2026-04', label: 'Avril 2026' },
    { key: '2026-05', label: 'Mai 2026' },
    { key: '2026-06', label: 'Juin 2026' },
  ];

  const pendingPayments: Payment[] = [
    { id: '1', designation: 'Internet & Téléphone', month: '2026-03', amount: '45 000 FCFA', status: 'pending' },
    { id: '2', designation: 'Masse Salariale', month: '2026-03', amount: '1 200 000 FCFA', status: 'pending' },
  ];

  const paidPayments: Payment[] = [
    { id: '3', designation: 'Loyer Bureau', month: '2026-02', amount: '350 000 FCFA', status: 'paid', paymentDate: '2026-02-28' },
  ];

  const stats = {
    pending: { amount: '0 FCFA', count: 0 },
    paid: { amount: '625 000 FCFA', count: 3 },
    total: { amount: '625 000 FCFA', count: 3 },
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
                        color="danger"
                        size="sm"
                        startContent={<CheckCircle className="w-4 h-4" />}
                      >
                        Marquer payé
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
