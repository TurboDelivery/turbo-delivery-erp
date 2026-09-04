'use client';

import { useCallback, useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Tooltip } from '@heroui-v3/react';
import { listerTicketsParStatutRequest } from '@/features/tickets/request/tickets.request';
import { StatutControle } from '@/types/statut-controle.enum';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { generatePdfTemplateV2 } from '@/features/validation-tickets/verrouillage-v2/utils/export-v2.utils';
import { PaginatedResponse } from '@/types/general';

const EXPORT_PAGE_SIZE = 400;
const EXPORT_CONCURRENCY = 3;

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
  onResolved: (value: T) => void,
): Promise<void> {
  let next = 0;
  const workerCount = Math.min(concurrency, tasks.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (true) {
        const i = next++;
        if (i >= tasks.length) return;
        const value = await tasks[i]();
        onResolved(value);
      }
    }),
  );
}

async function fetchAllV1ValideTickets(
  onProgress: (loaded: number, total: number) => void,
): Promise<TicketControleV2[]> {
  const first = await listerTicketsParStatutRequest({
    statuts: [StatutControle.V1_VALIDE],
    page: 0,
    size: EXPORT_PAGE_SIZE,
  }) as PaginatedResponse<TicketControleV2>;

  const totalPages = first.totalPages || 1;
  const totalElements = first.totalElements || first.content.length;

  const pagesByIndex: TicketControleV2[][] = new Array(totalPages);
  pagesByIndex[0] = first.content;
  let progress = first.content.length;
  onProgress(progress, totalElements);

  if (totalPages > 1) {
    const indices = Array.from({ length: totalPages - 1 }, (_, k) => k + 1);
    const tasks = indices.map((pageIndex) => async () => {
      const r = await listerTicketsParStatutRequest({
        statuts: [StatutControle.V1_VALIDE],
        page: pageIndex,
        size: EXPORT_PAGE_SIZE,
      }) as PaginatedResponse<TicketControleV2>;
      return { pageIndex, content: r.content };
    });

    await runWithConcurrency(tasks, EXPORT_CONCURRENCY, (v) => {
      pagesByIndex[v.pageIndex] = v.content;
      progress += v.content.length;
      onProgress(progress, totalElements);
    });
  }

  return pagesByIndex.flat();
}

interface VerrouillageV2ExportButtonProps {
  totalItems: number;
}

export function VerrouillageV2ExportButton({ totalItems }: VerrouillageV2ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (totalItems === 0) {
      toast.warning('Aucun ticket à exporter');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Préparation de l'export PDF...");

    try {
      const tickets = await fetchAllV1ValideTickets((loaded, total) => {
        toast.loading(`Chargement des tickets (${loaded} / ${total})`, { id: toastId });
      });

      if (tickets.length === 0) {
        toast.warning('Aucun ticket à exporter', { id: toastId });
        return;
      }

      toast.loading('Génération du PDF...', { id: toastId });
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      const htmlContent = generatePdfTemplateV2(tickets);
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        toast.error("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.", { id: toastId });
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);

      toast.success(`${tickets.length} ticket(s) prêt(s) pour export PDF`, { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'export", {
        id: toastId,
      });
    } finally {
      setIsExporting(false);
    }
  }, [totalItems]);

  const rienAExporter = totalItems === 0;

  // Le bouton se grisait pour deux causes distinctes reunies dans un seul `disabled` :
  // rien a exporter, ou export deja lance. La premiere ne s'ecrivait nulle part, et un
  // bouton grise sans motif se lit comme une panne de la page a l'etape 4 de la chaine
  // de paiement. L'attente passe par `isPending` et l'impossibilite par `isDisabled`,
  // et l'info-bulle nomme laquelle des deux s'applique. `isPending` grise le bouton
  // comme `disabled` le faisait — il pose `aria-disabled` — et ne dessine aucun rond :
  // c'est a l'appelant de le rendre, ce que fait le libelle ci-dessous.
  const motifInfoBulle = rienAExporter
    ? 'Aucun ticket à exporter'
    : isExporting
      ? 'Export en cours, patientez'
      : `Exporter ${totalItems} ticket(s) en PDF`;

  return (
    <Tooltip>
      {/* Un bouton DESACTIVE n'emet ni survol ni focus : pose directement sous `Tooltip`,
          il n'ouvrirait jamais l'info-bulle, et c'est justement grise que son motif doit
          se lire. Le declencheur, lui, n'est pas desactive et porte l'evenement. */}
      <Tooltip.Trigger>
        <Button
          isDisabled={rienAExporter}
          isPending={isExporting}
          onPress={handleExport}
          variant="outline"
        >
          <FileText aria-hidden="true" className="size-4" />
          {isExporting ? 'Export en cours...' : 'Exporter PDF'}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>{motifInfoBulle}</Tooltip.Content>
    </Tooltip>
  );
}
