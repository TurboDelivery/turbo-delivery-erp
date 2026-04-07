'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useChargesDetailsTable } from '../hooks/use-charges-details-table';
import { useActionChargeVariableMutation } from '../queries/charge-variable.mutation';
import ChargesTableV2 from './charges-table-v2';

export default function ChargesDepensesDetailsV2() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'variables' ? 'variables' : 'fixes';
  const [activeTab, setActiveTab] = useState<'fixes' | 'variables'>(initialTab);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    fixesPagination,
    variablesPagination,
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
  const pageCount = activeTab === 'fixes' ? fixesPageCount : variablesPageCount;
  const currentPage = activeTab === 'fixes' ? fixesPagination.pageIndex : variablesPagination.pageIndex;

  const today = new Date();
  const dateDisplay = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const isPdf = (url: string) => url.toLowerCase().includes('.pdf');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button as={Link} href="/finance/charges" variant="light" size="sm" startContent={<ArrowLeft size={16} />} className="mb-2 text-gray-500">
            Retour à la synthèse
          </Button>
          <h1 className="text-2xl font-bold text-red-500">Toutes les Dépenses</h1>
        </div>
        <div className="flex items-center gap-1 border rounded-lg px-2 py-1">
          <Button isIconOnly size="sm" variant="light"><ChevronLeft size={16} /></Button>
          <span className="text-sm font-medium text-gray-700 px-2">{dateDisplay}</span>
          <Button isIconOnly size="sm" variant="light"><ChevronRight size={16} /></Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden border">
        <button
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'fixes' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('fixes')}
        >
          Charges fixes
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'variables' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('variables')}
        >
          Dépenses Variables
        </button>
      </div>

      {/* Counter */}
      <div className="text-right">
        <span className="text-sm font-medium text-red-500">{totalElements} dépenses enregistrées</span>
      </div>

      {/* Tables — rendered separately to avoid type union issues */}
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

      {/* Counter */}
      {totalElements > 0 && (
        <div className="text-sm text-gray-500">
          Page {currentPage + 1} sur {pageCount}
        </div>
      )}

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
