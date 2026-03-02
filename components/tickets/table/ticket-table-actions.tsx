'use client';

import React from 'react';
import { toast } from 'react-toastify';
import { Ticket } from '@/types/bon-livraison.model';
import { generatePdfTemplate, generateXlsTickets } from '@/features/tickets/utils/ticket-export.utils';
import { ChevronDown, File, FileText, Loader2, Trash } from 'lucide-react';
import { Button as UIButton } from '@heroui/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type ExportFormat = 'csv' | 'excel' | 'pdf';

interface TicketTableActionsProps {
  ticketsData: Ticket[];
  selectedRows: string[];
  permissions: { canDelete: boolean };
  isDeletingBonLivraison: boolean;
  onDeleteRows: () => void;
}

export function TicketTableActions({ ticketsData, selectedRows, permissions, isDeletingBonLivraison, onDeleteRows }: TicketTableActionsProps) {
  const handleExport = (format: ExportFormat) => {
    const dataToExport = ticketsData;

    if (dataToExport.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    if (format === 'excel') {
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
        toast.success(`${dataToExport.length} ligne(s) prêtes pour export PDF. Utilisez "Enregistrer en PDF" dans la boîte de dialogue d'impression.`);
      }, 250);
    }
  };

  return (
    <div className="px-1 py-4">
      <div className="flex flex-wrap gap-2 items-center">
        <UIButton onPress={onDeleteRows} variant="bordered" color="danger" disabled={!permissions.canDelete || selectedRows.length === 0 || isDeletingBonLivraison}>
          {isDeletingBonLivraison ? <Loader2 className="size-4 animate-spin" /> : <Trash className="w-3 h-3" />} Supprimer
        </UIButton>

        <div className="ml-auto flex gap-2 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs sm:text-sm hover:bg-green-600">
                <FileText className="size-3" /> Exporter
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <File className="size-3 mr-2" /> Exporter en PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <File className="size-3 mr-2" /> Exporter en Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
