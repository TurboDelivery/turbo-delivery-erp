'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Modal, ModalBody, ModalContent, ModalHeader, Pagination } from '@heroui/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { flexRender } from '@tanstack/react-table';
import Link from 'next/link';
import { useChargesDetailsTable } from '../hooks/use-charges-details-table';
import { useActionChargeVariableMutation } from '../queries/charge-variable.mutation';

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
    onApproveVariable: (charge) => {
      actionVariableMutation.mutate({ id: charge.id, action: 'valider-dga', dto: { par: 'Utilisateur' } });
    },
    onRejectVariable: (charge) => {
      actionVariableMutation.mutate({ id: charge.id, action: 'rejeter-dga', dto: { par: 'Utilisateur' } });
    },
    onViewJustificatif: (url) => setPreviewUrl(url),
  });

  const table = activeTab === 'fixes' ? fixesTable : variablesTable;
  const isLoading = activeTab === 'fixes' ? isFixesLoading : isVariablesLoading;
  const isFetching = activeTab === 'fixes' ? isFixesFetching : isVariablesFetching;
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

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-500">Chargement...</div>
      ) : table.getRowModel().rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">Aucune donnée</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${isFetching ? 'opacity-70' : ''}`}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">Page {currentPage + 1} sur {pageCount}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="bordered"
              isDisabled={currentPage === 0 || isFetching}
              onPress={() => table.setPageIndex(currentPage - 1)}
            >
              Précédent
            </Button>
            <Pagination
              total={pageCount}
              page={currentPage + 1}
              onChange={(page) => table.setPageIndex(page - 1)}
              color="danger"
              size="sm"
              isDisabled={isFetching}
            />
            <Button
              size="sm"
              variant="bordered"
              isDisabled={currentPage >= pageCount - 1 || isFetching}
              onPress={() => table.setPageIndex(currentPage + 1)}
            >
              Suivant
            </Button>
          </div>
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
                : <img src={previewUrl} alt="Justificatif" className="w-full object-contain max-h-[70vh] rounded-lg" />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
