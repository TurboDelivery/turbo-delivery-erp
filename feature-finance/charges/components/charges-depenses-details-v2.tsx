'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Modal, ModalBody, ModalContent, ModalHeader, Select, SelectItem } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import { useQueryStates } from 'nuqs';
import Link from 'next/link';
import { chargesDepensesFiltersClient } from '../filters/charges-depenses.filter';
import { buildMonthOptions, monthKeyToRange, rangeToMonthKey } from '../utils/month-filter.utils';
import { useChargesDetailsTable } from '../hooks/use-charges-details-table';
import { useActionChargeVariableMutation } from '../queries/charge-variable.mutation';
import ChargesTableV2 from './charges-table-v2';

export default function ChargesDepensesDetailsV2() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'variables' ? 'variables' : 'fixes';
  const [activeTab, setActiveTab] = useState<'fixes' | 'variables'>(initialTab);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [filters, setFilters] = useQueryStates(
    chargesDepensesFiltersClient.filter,
    chargesDepensesFiltersClient.option,
  );

  const actionVariableMutation = useActionChargeVariableMutation();

  const {
    fixesTable,
    variablesTable,
    isFixesLoading,
    isVariablesLoading,
    isFixesFetching,
    isVariablesFetching,
    fixesTotalElements,
    fixesPageCount,
    variablesTotalElements,
    variablesPageCount,
  } = useChargesDetailsTable({
    onApproveChargeVariable: (charge) => {
      actionVariableMutation.mutate({ id: charge.id, action: 'valider-dga', dto: { par: 'Utilisateur' } });
    },
    onRejectChargeVariable: (charge) => {
      actionVariableMutation.mutate({ id: charge.id, action: 'rejeter-dga', dto: { par: 'Utilisateur' } });
    },
    onViewJustificatif: (url) => setPreviewUrl(url),
  });

  const totalElements = activeTab === 'fixes' ? fixesTotalElements : variablesTotalElements;

  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const selectedMonth = rangeToMonthKey(filters.debut);

  const handleMonthChange = useCallback((keys: Set<string> | any) => {
    const key = Array.from(keys)[0] as string;
    setFilters(monthKeyToRange(key));
  }, [setFilters]);

  const isPdf = (url: string) => url.toLowerCase().includes('.pdf');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button as={Link} href="/finance/charges" variant="light" size="sm" startContent={<ArrowLeft size={16} />} className="mb-2 text-gray-500">
            Retour à la synthèse
          </Button>
          <h1 className="text-2xl font-bold text-primary">Toutes les Dépenses</h1>
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

      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden border">
        <button
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'fixes' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('fixes')}
        >
          Charges fixes
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'variables' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('variables')}
        >
          Dépenses Variables
        </button>
      </div>

      {/* Counter */}
      <div className="text-right">
        <span className="text-sm font-medium text-primary">{totalElements} dépenses enregistrées</span>
      </div>

      {/* Tables */}
      <div className="border rounded-lg overflow-hidden">
        {activeTab === 'fixes' ? (
          <ChargesTableV2
            table={fixesTable}
            isLoading={isFixesLoading}
            isFetching={isFixesFetching}
            pageCount={fixesPageCount}
            emptyMessage="Aucune charge fixe"
            getRowClassName={(row: any) => row.automatique ? 'bg-green-100' : ''}
          />
        ) : (
          <ChargesTableV2
            table={variablesTable}
            isLoading={isVariablesLoading}
            isFetching={isVariablesFetching}
            pageCount={variablesPageCount}
            emptyMessage="Aucune dépense variable"
          />
        )}
      </div>

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
