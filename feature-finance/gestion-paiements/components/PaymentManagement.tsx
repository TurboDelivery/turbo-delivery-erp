'use client';

import { useChargesFixesQuery } from '@/feature-finance/charges/queries/charges-fixes.query';
import { useChargesVariablesQuery } from '@/feature-finance/charges/queries/charges-variables.query';
import { useActionChargeFixeMutation } from '@/feature-finance/charges/queries/charge-fixe.mutation';
import { useActionChargeVariableMutation } from '@/feature-finance/charges/queries/charge-variable.mutation';
import { IChargeFixe, StatutChargeFixe } from '@/feature-finance/charges/types/charge-fixe.type';
import { IChargeVariable } from '@/feature-finance/charges/types/charge-variable.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { Button, Card, CardBody, Chip, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { CheckCircle, Clock, Wallet } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

const CYCLE_TO_LABEL: Record<string, string> = {
  MENSUEL: 'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  SEMESTRIEL: 'Semestriel',
  ANNUEL: 'Annuel',
};

const STATUT_LABEL: Record<StatutChargeFixe, string> = {
  PENDING: 'En attente',
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
  cyclePaiement?: string;
  effectiveStatut: string;
  dateDecaissement?: string | null;
};

function fixeToUnified(c: IChargeFixe): UnifiedCharge {
  return {
    id: c.id,
    type: 'FIXE',
    designation: c.designation,
    montant: c.montant,
    cyclePaiement: c.cyclePaiement,
    effectiveStatut: getEffectiveStatut(c),
    dateDecaissement: c.dateDecaissement,
  };
}

function variableToUnified(c: IChargeVariable): UnifiedCharge {
  return {
    id: c.id,
    type: 'VARIABLE',
    designation: c.designation,
    montant: c.montant,
    cyclePaiement: undefined,
    effectiveStatut: getEffectiveStatutVariable(c),
    dateDecaissement: c.dateDecaissement,
  };
}

export default function PaymentManagement() {
  const { data: session } = useSession();
  const [selectedCycle, setSelectedCycle] = useState<string>('all');

  const { data: chargesFixesPage, isLoading: isLoadingFixes } = useChargesFixesQuery({ page: 0, size: 200 });
  const { data: chargesVariablesPage, isLoading: isLoadingVariables } = useChargesVariablesQuery({ page: 0, size: 200 });
  const actionFixeMutation = useActionChargeFixeMutation();
  const actionVariableMutation = useActionChargeVariableMutation();

  const isLoading = isLoadingFixes || isLoadingVariables;

  const allCharges: UnifiedCharge[] = [
    ...(chargesFixesPage?.content ?? []).map(fixeToUnified),
    ...(chargesVariablesPage?.content ?? []).map(variableToUnified),
  ];

  const filteredCharges =
    selectedCycle === 'all'
      ? allCharges
      : allCharges.filter((c) => c.cyclePaiement === selectedCycle);

  const pendingCharges = filteredCharges.filter((c) =>
    c.type === 'FIXE'
      ? PENDING_STATUTS.includes(c.effectiveStatut as StatutChargeFixe)
      : PENDING_STATUTS_VAR.includes(c.effectiveStatut),
  );
  const decaisseCharges = filteredCharges.filter((c) => c.effectiveStatut === 'DECAISSE' || c.effectiveStatut === 'PAID');
  const rejectedCharges = filteredCharges.filter((c) => c.effectiveStatut === 'REJETE_DGA' || c.effectiveStatut === 'REJETE_DG');

  const totalPending = pendingCharges.reduce((sum, c) => sum + c.montant, 0);
  const totalDecaisse = decaisseCharges.reduce((sum, c) => sum + c.montant, 0);
  const totalAll = filteredCharges.reduce((sum, c) => sum + c.montant, 0);

  const handleDecaisser = (charge: UnifiedCharge) => {
    const dto = { par: session?.user?.name ?? 'Inconnu' };
    if (charge.type === 'FIXE') {
      actionFixeMutation.mutate({ id: charge.id, action: 'decaisser', dto });
    } else {
      actionVariableMutation.mutate({ id: charge.id, action: 'decaisser', dto });
    }
  };

  const isPending = actionFixeMutation.isPending || actionVariableMutation.isPending;

  const cycles = [
    { key: 'all', label: 'Tous les cycles' },
    { key: 'MENSUEL', label: 'Mensuel' },
    { key: 'TRIMESTRIEL', label: 'Trimestriel' },
    { key: 'SEMESTRIEL', label: 'Semestriel' },
    { key: 'ANNUEL', label: 'Annuel' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gestion des Paiements</h1>
                <p className="text-sm text-gray-500">Suivez et validez les décaissements des charges fixes</p>
              </div>
            </div>
            <Select
              label="Cycle de paiement"
              selectedKeys={[selectedCycle]}
              onSelectionChange={(keys) => setSelectedCycle(Array.from(keys)[0] as string)}
              className="max-w-xs"
            >
              {cycles.map((cycle) => (
                <SelectItem key={cycle.key} value={cycle.key}>
                  {cycle.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">En Attente</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCFA(totalPending)}</p>
              <p className="text-sm text-gray-600">{pendingCharges.length} charge(s)</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">Décaissé</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCFA(totalDecaisse)}</p>
              <p className="text-sm text-gray-600">{decaisseCharges.length} charge(s)</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCFA(totalAll)}</p>
              <p className="text-sm text-gray-600">{filteredCharges.length} charge(s)</p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                En attente de décaissement ({pendingCharges.length})
              </h2>
            </div>
            {isLoading ? (
              <p className="text-sm text-gray-500 py-4 text-center">Chargement...</p>
            ) : pendingCharges.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">Aucune charge en attente</p>
            ) : (
              <Table aria-label="Charges en attente de décaissement">
                <TableHeader>
                  <TableColumn>DÉSIGNATION</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>CYCLE</TableColumn>
                  <TableColumn>MONTANT</TableColumn>
                  <TableColumn>STATUT</TableColumn>
                  <TableColumn className="text-right">ACTION</TableColumn>
                </TableHeader>
                <TableBody>
                  {pendingCharges.map((charge) => (
                    <TableRow key={`${charge.type}-${charge.id}`}>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {charge.designation}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={charge.type === 'FIXE' ? 'default' : 'warning'}
                          variant="flat"
                          size="sm"
                        >
                          {charge.type === 'FIXE' ? 'Fixe' : 'Variable'}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {charge.cyclePaiement ? (CYCLE_TO_LABEL[charge.cyclePaiement] ?? charge.cyclePaiement) : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-900">
                        {formatCFA(charge.montant)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={STATUT_COLOR[charge.effectiveStatut as StatutChargeFixe] ?? 'default'}
                          variant="flat"
                          size="sm"
                        >
                          {STATUT_LABEL[charge.effectiveStatut as StatutChargeFixe] ?? charge.effectiveStatut}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-right">
                        {charge.effectiveStatut === 'APPROUVE_DG' ? (
                          <Button
                            color="success"
                            size="sm"
                            startContent={<CheckCircle className="w-4 h-4" />}
                            onClick={() => handleDecaisser(charge)}
                            isLoading={isPending}
                          >
                            Décaisser
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">En cours de validation</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Historique décaissements ({decaisseCharges.length})
              </h2>
            </div>
            {isLoading ? (
              <p className="text-sm text-gray-500 py-4 text-center">Chargement...</p>
            ) : decaisseCharges.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">Aucun décaissement enregistré</p>
            ) : (
              <Table aria-label="Historique des décaissements">
                <TableHeader>
                  <TableColumn>DÉSIGNATION</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>CYCLE</TableColumn>
                  <TableColumn>MONTANT</TableColumn>
                  <TableColumn>DATE DÉCAISSEMENT</TableColumn>
                  <TableColumn>STATUT</TableColumn>
                </TableHeader>
                <TableBody>
                  {decaisseCharges.map((charge) => (
                    <TableRow key={`${charge.type}-${charge.id}`}>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {charge.designation}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={charge.type === 'FIXE' ? 'default' : 'warning'}
                          variant="flat"
                          size="sm"
                        >
                          {charge.type === 'FIXE' ? 'Fixe' : 'Variable'}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {charge.cyclePaiement ? (CYCLE_TO_LABEL[charge.cyclePaiement] ?? charge.cyclePaiement) : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-900">
                        {formatCFA(charge.montant)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {charge.dateDecaissement
                          ? new Date(charge.dateDecaissement).toLocaleDateString('fr-FR')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip color="success" variant="flat" size="sm">
                          Décaissé
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>

        {rejectedCharges.length > 0 && (
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-danger text-sm font-semibold">
                  Charges rejetées ({rejectedCharges.length})
                </span>
              </div>
              <Table aria-label="Charges rejetées">
                <TableHeader>
                  <TableColumn>DÉSIGNATION</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>CYCLE</TableColumn>
                  <TableColumn>MONTANT</TableColumn>
                  <TableColumn>STATUT</TableColumn>
                </TableHeader>
                <TableBody>
                  {rejectedCharges.map((charge) => (
                    <TableRow key={`${charge.type}-${charge.id}`}>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {charge.designation}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={charge.type === 'FIXE' ? 'default' : 'warning'}
                          variant="flat"
                          size="sm"
                        >
                          {charge.type === 'FIXE' ? 'Fixe' : 'Variable'}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {charge.cyclePaiement ? (CYCLE_TO_LABEL[charge.cyclePaiement] ?? charge.cyclePaiement) : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-900">
                        {formatCFA(charge.montant)}
                      </TableCell>
                      <TableCell>
                        <Chip color="danger" variant="flat" size="sm">
                          {STATUT_LABEL[charge.effectiveStatut as StatutChargeFixe] ?? charge.effectiveStatut}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
