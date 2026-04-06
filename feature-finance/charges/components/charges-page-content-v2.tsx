'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Download, Plus } from 'lucide-react';
import { Button, Card, Modal, ModalBody, ModalContent, ModalHeader, Select, SelectItem } from '@heroui/react';
import Link from 'next/link';
import { useChargesDepensesV2 } from '../hooks/use-charges-depenses-v2';
import { useSupprimerChargeFixeMutation } from '../queries/charge-fixe.mutation';
import { useActionChargeVariableMutation } from '../queries/charge-variable.mutation';
import { IChargeFixe } from '../types/charge-fixe.type';
import { IChargeVariable } from '../types/charge-variable.type';
import ChargesStatsCardsV2 from './statistiques/charges-stats-cards-v2';
import ChargesTableV2 from './charges-table-v2';
import AddChargeFixeModal from './add-charge-fixe-modal';
import AddDepenseVariableModal from './add-depense-variable-modal';

export default function ChargesPageContentV2() {
  const [isFixeModalOpen, setIsFixeModalOpen] = useState(false);
  const [chargeToEdit, setChargeToEdit] = useState<IChargeFixe | null>(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [variableToEdit, setVariableToEdit] = useState<IChargeVariable | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const actionVariableMutation = useActionChargeVariableMutation();

  const {
    fixesTable,
    variablesTable,
    isFixesLoading,
    isVariablesLoading,
    fixesRemainingCount,
    variablesRemainingCount,
    cardStats,
  } = useChargesDepensesV2({
    onEditChargeVariable: (charge) => {
      setVariableToEdit(charge);
      setIsVariableModalOpen(true);
    },
    onApproveChargeVariable: (charge) => {
      actionVariableMutation.mutate({ id: charge.id, action: 'valider-dga', dto: { par: 'Utilisateur' } });
    },
    onRejectChargeVariable: (charge) => {
      actionVariableMutation.mutate({ id: charge.id, action: 'rejeter-dga', dto: { par: 'Utilisateur' } });
    },
    onViewJustificatif: (url) => setPreviewUrl(url),
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const monthOptions = useMemo(() => {
    const options: { key: string; label: string }[] = [];
    const now = new Date();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth();
    for (let y = 2024; y <= endYear; y++) {
      const lastM = y === endYear ? endMonth : 11;
      for (let m = 0; m <= lastM; m++) {
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        options.push({ key, label: `${MONTH_NAMES[m]} ${y}` });
      }
    }
    return options.reverse();
  }, []);

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
        <div className="flex items-center gap-3">
          <Button variant="bordered" size="sm" startContent={<Download size={15} />}>Export</Button>
          <Select
            selectedKeys={[selectedMonth]}
            onSelectionChange={(keys) => setSelectedMonth(Array.from(keys)[0] as string)}
            className="w-[200px]"
            size="sm"
            aria-label="Période"
          >
            {monthOptions.map((m) => (
              <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <ChargesStatsCardsV2 stats={cardStats} />

      {/* Charges Fixes Table */}
      <Card className="border shadow-none overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Configuration des Charges Fixes</h2>
          <Button
            color="danger"
            size="sm"
            startContent={<Plus size={16} />}
            onPress={() => { setChargeToEdit(null); setIsFixeModalOpen(true); }}
          >
            Ajouter
          </Button>
        </div>
        <ChargesTableV2 table={fixesTable} isLoading={isFixesLoading} emptyMessage="Aucune charge fixe configurée" />
        <div className="py-3 text-center border-t">
          <Link
            href="/finance/charges/details?tab=fixes"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronDown size={14} /> Voir plus ({fixesRemainingCount} restantes)
          </Link>
        </div>
      </Card>

      {/* Dépenses Variables Table */}
      <Card className="border shadow-none overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Dépenses Variables (Au jour le jour)</h2>
          <Button
            color="danger"
            size="sm"
            startContent={<Plus size={16} />}
            onPress={() => { setVariableToEdit(null); setIsVariableModalOpen(true); }}
          >
            Nouvelle dépense
          </Button>
        </div>
        <ChargesTableV2 table={variablesTable} isLoading={isVariablesLoading} emptyMessage="Aucune dépense variable" />
        <div className="py-3 text-center border-t">
          <Link
            href="/finance/charges/details?tab=variables"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronDown size={14} /> Voir plus ({variablesRemainingCount} restantes)
          </Link>
        </div>
      </Card>

      {/* Modals */}
      <AddChargeFixeModal isOpen={isFixeModalOpen} onClose={() => { setIsFixeModalOpen(false); setChargeToEdit(null); }} chargeToEdit={chargeToEdit} />
      <AddDepenseVariableModal isOpen={isVariableModalOpen} onClose={() => { setIsVariableModalOpen(false); setVariableToEdit(null); }} chargeToEdit={variableToEdit} />

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
