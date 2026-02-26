'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Ticket } from '@/types/bon-livraison.model';
import { generatePdfTemplate, generateXlsTickets } from '@/features/tickets/utils/ticket-export.utils';
import { CheckSquare, ChevronDown, File, FileText, Loader2, Trash, X } from 'lucide-react';

type ExportFormat = 'csv' | 'excel' | 'pdf';

interface TicketTableActionsProps {
  ticketsData: Ticket[];
  selectedRows: Set<string>;
  permissions: { canDelete: boolean };
  isDeletingBonLivraison: boolean;
  onSelectAll: () => void;
  onDeleteRows: () => void;
  onDeselectAll: () => void;
}

export function TicketTableActions({
  ticketsData,
  selectedRows,
  permissions,
  isDeletingBonLivraison,
  onSelectAll,
  onDeleteRows,
  onDeselectAll,
}: TicketTableActionsProps) {
  const [exportOpen, setExportOpen] = useState(false);

  const handleExport = (format: ExportFormat) => {
    const dataToExport = ticketsData;

    if (dataToExport.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    if (format === 'csv') {
      const headers = ['Code Check', 'Livreur', 'Partner', 'Montant de Livraison', 'Montant de Commande', 'Commission', 'Date', 'Heure'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map((t) =>
          [t.id, `"${t.livreur}"`, `"${t.restaurant}"`, t.montantLivraison, t.montantCommande, t.coutLivraison, t.date, t.heure].join(',')
        ),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`${dataToExport.length} ligne(s) exportée(s) en CSV`);
    } else if (format === 'excel') {
      const xlsxData = generateXlsTickets(dataToExport);
      const blob = new Blob([xlsxData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets_${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${dataToExport.length} ligne(s) exportée(s) en Excel`);
    } else if (format === 'pdf') {
      const htmlContent = generatePdfTemplate(dataToExport);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.");
        return;
      }
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        toast.success(
          `${dataToExport.length} ligne(s) prêtes pour export PDF. Utilisez "Enregistrer en PDF" dans la boîte de dialogue d'impression.`
        );
      }, 250);
    }
  };

  return (
    <div className="px-1 py-4">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={onSelectAll}
          className="px-2 py-1 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-1"
        >
          <CheckSquare className="w-3 h-3" /> Sélectionner
        </button>

        <button
          onClick={onDeleteRows}
          disabled={!permissions.canDelete || selectedRows.size === 0 || isDeletingBonLivraison}
          className={`px-2 py-1 border rounded-full text-xs sm:text-sm flex items-center gap-1 ${
            !permissions.canDelete || selectedRows.size === 0
              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
              : 'border-red-300 text-red-500 hover:bg-red-50'
          }`}
        >
          {isDeletingBonLivraison ? <Loader2 className="size-4 animate-spin" /> : <Trash className="w-3 h-3" />} Supprimer
        </button>

        {selectedRows.size > 0 && (
          <button
            onClick={onDeselectAll}
            className="px-2 py-1 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Désélectionner
          </button>
        )}

        <div className="ml-auto flex gap-2 items-center">
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs sm:text-sm hover:bg-green-600"
            >
              <FileText className="w-3 h-3" /> Exporter
              <ChevronDown className="w-4 h-4" />
            </button>
            {exportOpen && (
              <ul className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <li>
                  <button
                    onClick={() => {
                      handleExport('pdf');
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 whitespace-nowrap flex items-center gap-2"
                  >
                    <File className="w-3 h-3" /> Exporter en PDF
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      handleExport('excel');
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 whitespace-nowrap flex items-center gap-2"
                  >
                    <File className="w-3 h-3" /> Exporter en Excel
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      handleExport('csv');
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 whitespace-nowrap flex items-center gap-2"
                  >
                    <File className="w-3 h-3" /> Exporter en CSV
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

