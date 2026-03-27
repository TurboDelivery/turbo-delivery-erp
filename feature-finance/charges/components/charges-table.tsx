'use client';

import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Pagination } from '@heroui/react';
import { useState } from 'react';
import { Eye, Edit, Trash2, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function ChargesTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const charges = [
    {
      id: 1,
      name: 'Loyer bureau principal',
      category: 'Loyer',
      amount: 800000,
      dueDate: '2024-03-01',
      status: 'payé',
      paymentDate: '2024-02-28',
      description: 'Loyer mensuel du siège social',
    },
    {
      id: 2,
      name: 'Électricité - Février',
      category: 'Électricité',
      amount: 250000,
      dueDate: '2024-03-05',
      status: 'payé',
      paymentDate: '2024-03-03',
      description: 'Consommation électrique du mois de février',
    },
    {
      id: 3,
      name: 'Eau - Février',
      category: 'Eau',
      amount: 120000,
      dueDate: '2024-03-10',
      status: 'en attente',
      paymentDate: null,
      description: 'Facture eau du mois de février',
    },
    {
      id: 4,
      name: 'Internet Fibre',
      category: 'Internet',
      amount: 80000,
      dueDate: '2024-03-15',
      status: 'en attente',
      paymentDate: null,
      description: 'Abonnement internet fibre optique',
    },
    {
      id: 5,
      name: 'Carburant véhicules',
      category: 'Transport',
      amount: 450000,
      dueDate: '2024-03-07',
      status: 'payé',
      paymentDate: '2024-03-06',
      description: 'Carburant pour la flotte de livraison',
    },
    {
      id: 6,
      name: 'Salaires employés',
      category: 'Salaires',
      amount: 550000,
      dueDate: '2024-03-25',
      status: 'en attente',
      paymentDate: null,
      description: 'Salaires du mois de mars',
    },
    {
      id: 7,
      name: 'Fournitures bureau',
      category: 'Fournitures',
      amount: 150000,
      dueDate: '2024-03-12',
      status: 'payé',
      paymentDate: '2024-03-10',
      description: 'Achat de matériel de bureau',
    },
    {
      id: 8,
      name: 'Maintenance climatisation',
      category: 'Autres',
      amount: 50000,
      dueDate: '2024-03-20',
      status: 'en attente',
      paymentDate: null,
      description: 'Entretien système climatisation',
    },
  ];

  const getStatusChip = (status: string) => {
    const statusConfig = {
      payé: {
        color: 'success',
        icon: CheckCircle,
        label: 'Payé',
      },
      'en attente': {
        color: 'warning',
        icon: Clock,
        label: 'En attente',
      },
      retard: {
        color: 'danger',
        icon: XCircle,
        label: 'En retard',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['en attente'];
    const Icon = config.icon;

    return (
      <Chip
        color={config.color as any}
        variant="flat"
        size="sm"
        startContent={<Icon size={12} />}
      >
        {config.label}
      </Chip>
    );
  };

  const totalPages = Math.ceil(charges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCharges = charges.slice(startIndex, endIndex);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Liste des Charges
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {charges.length} charges au total
        </div>
      </CardHeader>
      <CardBody>
        <Table aria-label="Liste des charges">
          <TableHeader>
            <TableColumn>NOM</TableColumn>
            <TableColumn>CATÉGORIE</TableColumn>
            <TableColumn>MONTANT</TableColumn>
            <TableColumn>DATE D'ÉCHÉANCE</TableColumn>
            <TableColumn>STATUT</TableColumn>
            <TableColumn>DATE DE PAIEMENT</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {currentCharges.map((charge) => (
              <TableRow key={charge.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {charge.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {charge.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip variant="flat" size="sm">
                    {charge.category}
                  </Chip>
                </TableCell>
                <TableCell>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {charge.amount.toLocaleString()} FCFA
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span className="text-sm">
                      {new Date(charge.dueDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusChip(charge.status)}
                </TableCell>
                <TableCell>
                  {charge.paymentDate ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-sm">
                        {new Date(charge.paymentDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="primary"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="warning"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
