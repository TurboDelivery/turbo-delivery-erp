'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Plus } from 'lucide-react';
import { Button, Card, Modal, ModalBody, ModalContent, ModalHeader, Select, SelectItem } from '@heroui/react';
import ConfirmModal from '@/components/ui/confirm-modal';
import Link from 'next/link';
import { useChargesDepensesV2 } from '../hooks/use-charges-depenses-v2';
import { IChargeFixe } from '../types/charge-fixe.type';
import { IChargeVariable } from '../types/charge-variable.type';
import { useSupprimerChargeFixeMutation, useToggleEnableChargeFixeMutation } from '../queries/charge-fixe.mutation';
import { useActionChargeVariableMutation } from '../queries/charge-variable.mutation';
import ChargesStatsCardsV2 from './statistiques/charges-stats-cards-v2';
import ChargesTableV2 from './charges-table-v2';
import AddChargeFixeModal from './add-charge-fixe-modal';
import AddDepenseVariableModal from './add-depense-variable-modal';
import { buildMonthOptions, monthKeyToRange, rangeToMonthKey } from '../utils/month-filter.utils';

export default function ChargesPageContentV2() {
  const [isFixeModalOpen, setIsFixeModalOpen] = useState(false);
  const [chargeToEdit, setChargeToEdit] = useState<IChargeFixe | null>(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [chargeVariableToEdit, setChargeVariableToEdit] = useState<IChargeVariable | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<{ charge: IChargeFixe; enable: boolean } | null>(null);
  const [chargeToDelete, setChargeToDelete] = useState<IChargeFixe | null>(null);

  const actionVariableMutation = useActionChargeVariableMutation();
  const toggleMutation = useToggleEnableChargeFixeMutation();
  const { mutate: supprimerChargeFixe, isPending: isDeleting } = useSupprimerChargeFixeMutation();

  const {
    fixesTable, variablesTable,
    isFixesLoading, isVariablesLoading,
    fixesRemainingCount, variablesRemainingCount,
    stats, isStatsLoading,
    filters, setFilters,
  } = useChargesDepensesV2({
    onEditChargeFixe: (charge) => { setChargeToEdit(charge); setIsFixeModalOpen(true); },
    onDeleteChargeFixe: (charge) => { setChargeToDelete(charge); },
    onToggleChargeFixe: (charge, enabled) => { setToggleTarget({ charge, enable: enabled }); },
    onEditChargeVariable: (charge) => { setChargeVariableToEdit(charge); setIsVariableModalOpen(true); },
    onApproveChargeVariable: (charge) => { actionVariableMutation.mutate({ id: charge.id, action: 'valider-dga', dto: { par: 'Utilisateur' } }); },
    onRejectChargeVariable: (charge) => { actionVariableMutation.mutate({ id: charge.id, action: 'rejeter-dga', dto: { par: 'Utilisateur' } }); },
    onViewJustificatif: (url) => setPreviewUrl(url),
  });

  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const selectedMonth = rangeToMonthKey(filters.debut);

  const handleMonthChange = useCallback((keys: Set<string> | any) => {
    const key = Array.from(keys)[0] as string;
    setFilters(monthKeyToRange(key));
  }, [setFilters]);

  const isPdf = (url: string) => url.toLowerCase().includes('.pdf');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Finance — Charges & Dépenses</h1>
          <p className="text-sm text-gray-500 mt-1">Pilotage de la rentabilité en temps réel</p>
        </div>
        <Select
          selectedKeys={[selectedMonth]}
          onSelectionChange={handleMonthChange}
          className="w-[200px]"
          size="sm"
          aria-label="Période"
        >
          {monthOptions.map((m) => (
            <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Stats Cards */}
      <ChargesStatsCardsV2 stats={stats} isLoading={isStatsLoading} />

      {/* Charges Fixes Table */}
      <Card className="border shadow-none overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Configuration des Charges Fixes</h2>
          <Button color="danger" size="sm" startContent={<Plus size={16} />} onPress={() => { setChargeToEdit(null); setIsFixeModalOpen(true); }}>
            Ajouter
          </Button>
        </div>
        <ChargesTableV2
          table={fixesTable}
          isLoading={isFixesLoading}
          emptyMessage="Aucune charge fixe configurée"
          getRowClassName={(row: IChargeFixe) => row.automatique ? 'bg-green-100' : ''}
        />
        <div className="py-3 text-center border-t">
          <Link href="/finance/charges/details?tab=fixes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronDown size={14} /> Voir plus ({fixesRemainingCount} restantes)
          </Link>
        </div>
      </Card>

      {/* Dépenses Variables Table */}
      <Card className="border shadow-none overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Dépenses Variables (Au jour le jour)</h2>
          <Button color="danger" size="sm" startContent={<Plus size={16} />} onPress={() => { setChargeVariableToEdit(null); setIsVariableModalOpen(true); }}>
            Nouvelle dépense
          </Button>
        </div>
        <ChargesTableV2 table={variablesTable} isLoading={isVariablesLoading} emptyMessage="Aucune dépense variable" />
        <div className="py-3 text-center border-t">
          <Link href="/finance/charges/details?tab=variables" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronDown size={14} /> Voir plus ({variablesRemainingCount} restantes)
          </Link>
        </div>
      </Card>

      {/* Modals */}
      <AddChargeFixeModal isOpen={isFixeModalOpen} onClose={() => { setIsFixeModalOpen(false); setChargeToEdit(null); }} chargeToEdit={chargeToEdit} />
      <AddDepenseVariableModal isOpen={isVariableModalOpen} onClose={() => { setIsVariableModalOpen(false); setChargeVariableToEdit(null); }} chargeToEdit={chargeVariableToEdit} />

      {/* Toggle Enable Confirmation */}
      <ConfirmModal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        title={`${toggleTarget?.enable ? 'Activer' : 'Désactiver'} la charge fixe`}
        isLoading={toggleMutation.isPending}
        actions={toggleTarget?.enable
          ? [
              { label: 'Annuler', variant: 'bordered', onPress: () => setToggleTarget(null) },
              { label: 'Activer', color: 'primary', onPress: () => { toggleMutation.mutate({ id: toggleTarget!.charge.id, enable: true, supprimerDepense: false }); setToggleTarget(null); } },
            ]
          : [
              { label: 'Conserver les dépenses', variant: 'bordered', onPress: () => { toggleMutation.mutate({ id: toggleTarget!.charge.id, enable: false, supprimerDepense: false }); setToggleTarget(null); } },
              { label: 'Supprimer les dépenses', color: 'danger', onPress: () => { toggleMutation.mutate({ id: toggleTarget!.charge.id, enable: false, supprimerDepense: true }); setToggleTarget(null); } },
            ]
        }
      >
        <p className="text-sm text-gray-700">
          Voulez-vous {toggleTarget?.enable ? 'activer' : 'désactiver'}{' '}
          <span className="font-semibold">{toggleTarget?.charge.designation}</span> ?
        </p>
        {!toggleTarget?.enable && (
          <p className="text-sm text-gray-500 mt-2">
            Souhaitez-vous également supprimer les anciennes dépenses associées ?
          </p>
        )}
      </ConfirmModal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!chargeToDelete}
        onClose={() => setChargeToDelete(null)}
        title="Supprimer la charge fixe"
        isLoading={isDeleting}
        actions={[
          { label: 'Annuler', variant: 'bordered', onPress: () => setChargeToDelete(null) },
          { label: 'Supprimer', color: 'danger', onPress: () => { supprimerChargeFixe(chargeToDelete!.id, { onSuccess: () => setChargeToDelete(null) }); } },
        ]}
      >
        <p className="text-sm text-gray-700">
          Voulez-vous vraiment supprimer <span className="font-semibold">{chargeToDelete?.designation}</span> ? Cette action est irréversible.
        </p>
      </ConfirmModal>

      {/* Justificatif Preview */}
      <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="text-gray-900">Justificatif</ModalHeader>
          <ModalBody className="pb-6">
            {previewUrl && (
              isPdf(previewUrl)
                ? <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg border" title="Justificatif PDF" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={previewUrl} alt="Justificatif" className="w-full object-contain max-h-[70vh] rounded-lg" />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
