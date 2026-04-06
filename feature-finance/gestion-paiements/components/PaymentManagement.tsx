'use client';

import { useChargesFixesQuery } from '@/feature-finance/charges/queries/charges-fixes.query';
import { useChargesVariablesQuery } from '@/feature-finance/charges/queries/charges-variables.query';
import { useActionChargeFixeMutation } from '@/feature-finance/charges/queries/charge-fixe.mutation';
import { useActionChargeVariableMutation } from '@/feature-finance/charges/queries/charge-variable.mutation';
import { IChargeFixe, StatutChargeFixe } from '@/feature-finance/charges/types/charge-fixe.type';
import { IChargeVariable } from '@/feature-finance/charges/types/charge-variable.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { Button, Card, CardBody, Chip, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { ArrowLeft, CalendarDays, CheckCircle, Clock, Wallet } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUT_LABEL: Record<StatutChargeFixe, string> = {
  PENDING: 'Pending',
  EN_ATTENTE_DGA: 'Attente DGA',
  VALIDE_DGA: 'Validé DGA',
  REJETE_DGA: 'Rejeté DGA',
  APPROUVE_DG: 'Approuvé DG',
  REJETE_DG: 'Rejeté DG',
  DECAISSE: 'Décaissé',
  PAID: 'Payé',
};

const STATUT_COLOR: Record<StatutChargeFixe, 'warning' | 'primary' | 'success' | 'danger' | 'default'> = {
  PENDING: 'warning',
  EN_ATTENTE_DGA: 'warning',
  VALIDE_DGA: 'primary',
  REJETE_DGA: 'danger',
  APPROUVE_DG: 'primary',
  REJETE_DG: 'danger',
  DECAISSE: 'success',
  PAID: 'success',
};

const PENDING_STATUTS: StatutChargeFixe[] = ['PENDING', 'EN_ATTENTE_DGA', 'VALIDE_DGA', 'APPROUVE_DG'];
const PENDING_STATUTS_VAR = ['EN_ATTENTE_DGA', 'VALIDE_DGA', 'APPROUVE_DG'];

const MONTH_LABELS: Record<string, string> = {
  '01': 'Janvier',
  '02': 'Février',
  '03': 'Mars',
  '04': 'Avril',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juillet',
  '08': 'Août',
  '09': 'Septembre',
  '10': 'Octobre',
  '11': 'Novembre',
  '12': 'Décembre',
};

function getEffectiveStatut(charge: IChargeFixe): StatutChargeFixe {
  if (charge.statut === 'PENDING' || charge.statut === 'EN_ATTENTE_DGA' || charge.statut === 'VALIDE_DGA') {
    if (charge.approuvePar && charge.dateApprobationDG) return 'APPROUVE_DG';
    if (charge.validePar && charge.dateValidationDGA) return 'VALIDE_DGA';
  }
  return charge.statut;
}

function getEffectiveStatutVariable(charge: IChargeVariable): string {
  if (charge.statut === 'EN_ATTENTE_DGA' || charge.statut === 'VALIDE_DGA') {
    if (charge.approuvePar && charge.dateApprobationDG) return 'APPROUVE_DG';
    if (charge.validePar && charge.dateValidationDGA) return 'VALIDE_DGA';
  }
  return charge.statut;
}

type UnifiedCharge = {
  id: string;
  type: 'FIXE' | 'VARIABLE';
  designation: string;
  montant: number;
  mois: string;
  effectiveStatut: string;
  dateDecaissement?: string | null;
};

function fixeToUnified(c: IChargeFixe): UnifiedCharge {
  const createdDate = c.createdAt ? new Date(c.createdAt) : new Date();
  const mois = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
  return {
    id: c.id,
    type: 'FIXE',
    designation: c.designation,
    montant: c.montant,
    mois,
    effectiveStatut: getEffectiveStatut(c),
    dateDecaissement: c.dateDecaissement,
  };
}

function variableToUnified(c: IChargeVariable): UnifiedCharge {
  const createdDate = c.createdAt ? new Date(c.createdAt) : new Date();
  const mois = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
  return {
    id: c.id,
    type: 'VARIABLE',
    designation: c.designation,
    montant: c.montant,
    mois,
    effectiveStatut: getEffectiveStatutVariable(c),
    dateDecaissement: c.dateDecaissement,
  };
}

function formatMoisLabel(mois: string): string {
  const [year, month] = mois.split('-');
  return `${MONTH_LABELS[month] ?? month} ${year}`;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function PaymentManagement() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());

  const { data: chargesFixesPage, isLoading: isLoadingFixes } = useChargesFixesQuery({ page: 0, size: 200 });
  const { data: chargesVariablesPage, isLoading: isLoadingVariables } = useChargesVariablesQuery({ page: 0, size: 200 });
  const actionFixeMutation = useActionChargeFixeMutation();
  const actionVariableMutation = useActionChargeVariableMutation();

  const isLoading = isLoadingFixes || isLoadingVariables;

  const allCharges: UnifiedCharge[] = [
    ...(chargesFixesPage?.content ?? []).map(fixeToUnified),
    ...(chargesVariablesPage?.content ?? []).map(variableToUnified),
  ];

  const availableMonths = useMemo(() => {
    const monthSet = new Set(allCharges.map((c) => c.mois));
    if (!monthSet.has(selectedMonth)) monthSet.add(selectedMonth);
    return Array.from(monthSet).sort().reverse();
  }, [allCharges, selectedMonth]);

  const filteredCharges = allCharges.filter((c) => c.mois === selectedMonth);

  const pendingCharges = filteredCharges.filter((c) =>
    c.type === 'FIXE'
      ? PENDING_STATUTS.includes(c.effectiveStatut as StatutChargeFixe)
      : PENDING_STATUTS_VAR.includes(c.effectiveStatut),
  );
  const paidCharges = filteredCharges.filter((c) => c.effectiveStatut === 'DECAISSE' || c.effectiveStatut === 'PAID');

  const totalPending = pendingCharges.reduce((sum, c) => sum + c.montant, 0);
  const totalPaid = paidCharges.reduce((sum, c) => sum + c.montant, 0);
  const totalAll = filteredCharges.reduce((sum, c) => sum + c.montant, 0);

  const handleMarkPaid = (charge: UnifiedCharge) => {
    const dto = { par: session?.user?.name ?? 'Inconnu' };
    if (charge.type === 'FIXE') {
      actionFixeMutation.mutate({ id: charge.id, action: 'decaisser', dto });
    } else {
      actionVariableMutation.mutate({ id: charge.id, action: 'decaisser', dto });
    }
  };

  const isMutating = actionFixeMutation.isPending || actionVariableMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au Module Finance
      </button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-orange-500">Gestion des Paiements</h1>
          <p className="text-sm text-gray-500">Suivez et validez les décaissements</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-50 border border-orange-100 shadow-none">
          <CardBody className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">En Attente</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCFA(totalPending)}</p>
            <p className="text-sm text-gray-500 mt-0.5">{pendingCharges.length} paiement(s)</p>
          </CardBody>
        </Card>

        <Card className="bg-green-50 border border-green-100 shadow-none">
          <CardBody className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Payé</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCFA(totalPaid)}</p>
            <p className="text-sm text-gray-500 mt-0.5">{paidCharges.length} paiement(s)</p>
          </CardBody>
        </Card>

        <Card className="bg-gray-50 border border-gray-200 shadow-none">
          <CardBody className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCFA(totalAll)}</p>
            <p className="text-sm text-gray-500 mt-0.5">{filteredCharges.length} paiement(s)</p>
          </CardBody>
        </Card>
      </div>

      {/* Pending Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-semibold text-gray-900">
              En attente ({pendingCharges.length})
            </h2>
          </div>
          <Select
            selectedKeys={[selectedMonth]}
            onSelectionChange={(keys) => setSelectedMonth(Array.from(keys)[0] as string)}
            className="max-w-[180px]"
            size="sm"
            startContent={<CalendarDays className="w-4 h-4 text-gray-400" />}
            aria-label="Filtrer par mois"
          >
            {availableMonths.map((m) => (
              <SelectItem key={m} value={m}>
                {formatMoisLabel(m)}
              </SelectItem>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500 py-8 text-center">Chargement...</p>
        ) : pendingCharges.length === 0 ? (
          <Card className="shadow-none border">
            <CardBody className="py-8">
              <p className="text-sm text-gray-500 text-center">Aucun paiement en attente</p>
            </CardBody>
          </Card>
        ) : (
          <Table aria-label="Charges en attente" className="border rounded-lg" removeWrapper={false}>
            <TableHeader>
              <TableColumn>Désignation</TableColumn>
              <TableColumn>Mois</TableColumn>
              <TableColumn>Montant</TableColumn>
              <TableColumn>Statut</TableColumn>
              <TableColumn className="text-right">Action</TableColumn>
            </TableHeader>
            <TableBody>
              {pendingCharges.map((charge) => (
                <TableRow key={`${charge.type}-${charge.id}`}>
                  <TableCell className="text-sm text-gray-900">{charge.designation}</TableCell>
                  <TableCell className="text-sm text-gray-600">{charge.mois}</TableCell>
                  <TableCell className="text-sm text-gray-900 font-medium">{formatCFA(charge.montant)}</TableCell>
                  <TableCell>
                    <Chip
                      color={STATUT_COLOR[charge.effectiveStatut as StatutChargeFixe] ?? 'default'}
                      variant="bordered"
                      size="sm"
                    >
                      {STATUT_LABEL[charge.effectiveStatut as StatutChargeFixe] ?? charge.effectiveStatut}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      color="danger"
                      size="sm"
                      radius="full"
                      startContent={<CheckCircle className="w-4 h-4" />}
                      onClick={() => handleMarkPaid(charge)}
                      isLoading={isMutating}
                    >
                      Marquer payé
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Paid History Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h2 className="text-base font-semibold text-gray-900">
            Historique payés ({paidCharges.length})
          </h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500 py-8 text-center">Chargement...</p>
        ) : paidCharges.length === 0 ? (
          <Card className="shadow-none border">
            <CardBody className="py-12">
              <p className="text-sm text-gray-400 text-center">Aucun paiement effectué</p>
            </CardBody>
          </Card>
        ) : (
          <Table aria-label="Historique des paiements" className="border rounded-lg" removeWrapper={false}>
            <TableHeader>
              <TableColumn>Désignation</TableColumn>
              <TableColumn>Mois</TableColumn>
              <TableColumn>Montant</TableColumn>
              <TableColumn>Date paiement</TableColumn>
              <TableColumn>Statut</TableColumn>
            </TableHeader>
            <TableBody>
              {paidCharges.map((charge) => (
                <TableRow key={`${charge.type}-${charge.id}`}>
                  <TableCell className="text-sm text-gray-900">{charge.designation}</TableCell>
                  <TableCell className="text-sm text-gray-600">{charge.mois}</TableCell>
                  <TableCell className="text-sm text-gray-900 font-medium">{formatCFA(charge.montant)}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {charge.dateDecaissement
                      ? new Date(charge.dateDecaissement).toLocaleDateString('fr-FR')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip color="success" variant="flat" size="sm">Payé</Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}