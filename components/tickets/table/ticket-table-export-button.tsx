'use client';

import React, { useCallback } from 'react';
import { Button, Dropdown } from '@heroui-v3/react';
import { ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';
import { InfiniteData, QueryClient, useQueryClient } from '@tanstack/react-query';

import { BonLivraisonTerminee, Ticket } from '@/types/bon-livraison.model';
import { PaginatedResponse } from '@/types/general';
import { generatePdfTemplate, generateXlsTickets } from '@/features/tickets/utils/ticket-export.utils';
import { getBonLivraisonRequest } from '@/features/tickets/request/tickets.request';
import { ticketsKeyQuery } from '@/features/tickets/queries/index.query';
import { ITicketParams } from '@/features/tickets/types/tickets.type';
import { bonLivraisonToTicket } from '@/src/actions/bonLivraison.mapper';

type ExportFormat = 'EXCEL' | 'PDF';

// Pages volontairement modestes : une requête « size=5000 » sur /tous/termines
// peut dépasser le timeout (gros volume → requête lente côté backend). On découpe
// en pages plus petites récupérées en parallèle (EXPORT_CONCURRENCY), chacune avec
// un timeout étendu (EXPORT_TIMEOUT_MS).
const EXPORT_PAGE_SIZE = 200;
const EXPORT_CONCURRENCY = 6;
const EXPORT_TIMEOUT_MS = 120000;
const CACHE_REUSE_THRESHOLD = 0.5;

interface TicketTableExportButtonProps {
  filters: ITicketParams;
  totalItems: number;
  isDisabled?: boolean;
}

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

function buildCacheParams(filters: ITicketParams): ITicketParams {
  const params: ITicketParams = {
    page: filters.page,
    size: filters.size,
    search: filters.search,
    livreurId: filters.livreurId,
    restaurantId: filters.restaurantId,
    debut: filters.debut,
    fin: filters.fin,
  };
  if (params.search?.trim()) {
    params.restaurantId = '';
    params.livreurId = '';
    params.debut = undefined;
    params.fin = undefined;
  }
  return params;
}

async function fetchAllTickets(
  filters: ITicketParams,
  queryClient: QueryClient,
  onProgress: (loaded: number, total: number) => void,
): Promise<Ticket[]> {
  const cacheParams = buildCacheParams(filters);

  const cached = queryClient.getQueryData<InfiniteData<PaginatedResponse<BonLivraisonTerminee>>>(
    ticketsKeyQuery('list', cacheParams),
  );

  if (cached && cached.pages.length > 0) {
    const totalElements = cached.pages[0].totalElements ?? 0;
    const totalPages = cached.pages[0].totalPages ?? 1;
    const loadedCount = cached.pages.reduce((sum, p) => sum + p.content.length, 0);
    const coverage = totalElements ? loadedCount / totalElements : 0;

    if (coverage >= CACHE_REUSE_THRESHOLD) {
      const cachedSize = cached.pages[0].pageable?.pageSize ?? cacheParams.size ?? 50;
      const cachedByIndex = new Map<number, BonLivraisonTerminee[]>();
      for (const page of cached.pages) {
        cachedByIndex.set(page.pageable.pageNumber, page.content);
      }

      const missingIndexes: number[] = [];
      for (let i = 0; i < totalPages; i++) {
        if (!cachedByIndex.has(i)) missingIndexes.push(i);
      }

      let progress = loadedCount;
      onProgress(progress, totalElements);

      const fetchedByIndex = new Map<number, BonLivraisonTerminee[]>();
      const tasks = missingIndexes.map((pageIndex) => async () => {
        const r = await getBonLivraisonRequest({ ...cacheParams, size: cachedSize, page: pageIndex }, { timeoutMs: EXPORT_TIMEOUT_MS });
        return { pageIndex, content: r.content };
      });

      await runWithConcurrency(tasks, EXPORT_CONCURRENCY, (v) => {
        fetchedByIndex.set(v.pageIndex, v.content);
        progress += v.content.length;
        onProgress(progress, totalElements);
      });

      const out: BonLivraisonTerminee[] = [];
      for (let i = 0; i < totalPages; i++) {
        const content = cachedByIndex.get(i) ?? fetchedByIndex.get(i);
        if (content) out.push(...content);
      }
      return out.map(bonLivraisonToTicket);
    }
  }

  const baseParams: ITicketParams = { ...cacheParams, size: EXPORT_PAGE_SIZE };
  const first = await getBonLivraisonRequest({ ...baseParams, page: 0 }, { timeoutMs: EXPORT_TIMEOUT_MS });
  const totalPages = first.totalPages || 1;
  const totalElements = first.totalElements || first.content.length;

  const pagesByIndex: BonLivraisonTerminee[][] = new Array(totalPages);
  pagesByIndex[0] = first.content;
  let progress = first.content.length;
  onProgress(progress, totalElements);

  if (totalPages > 1) {
    const indices = Array.from({ length: totalPages - 1 }, (_, k) => k + 1);
    const tasks = indices.map((pageIndex) => async () => {
      const r = await getBonLivraisonRequest({ ...baseParams, page: pageIndex }, { timeoutMs: EXPORT_TIMEOUT_MS });
      return { pageIndex, content: r.content };
    });

    await runWithConcurrency(tasks, EXPORT_CONCURRENCY, (v) => {
      pagesByIndex[v.pageIndex] = v.content;
      progress += v.content.length;
      onProgress(progress, totalElements);
    });
  }

  return pagesByIndex.flat().map(bonLivraisonToTicket);
}

export function TicketTableExportButton({ filters, totalItems, isDisabled }: TicketTableExportButtonProps) {
  const queryClient = useQueryClient();

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (totalItems === 0) {
        toast.warning('Aucune donnée à exporter');
        return;
      }

      const toastId = toast.loading('Préparation de l\'export...');

      try {
        const tickets = await fetchAllTickets(filters, queryClient, (loaded, total) => {
          toast.loading(`Chargement des tickets (${loaded}/${total})`, { id: toastId });
        });

        if (tickets.length === 0) {
          toast.warning('Aucune donnée à exporter', { id: toastId });
          return;
        }

        toast.loading(`Génération du fichier ${format === 'EXCEL' ? 'Excel' : 'PDF'}...`, { id: toastId });
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        if (format === 'EXCEL') {
          const xlsxData = generateXlsTickets(tickets);
          const blob = new Blob([xlsxData], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `tickets_${new Date().toISOString().split('T')[0]}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);

          toast.success(`${tickets.length} ligne(s) exportée(s) en Excel`, { id: toastId });
          return;
        }

        const htmlContent = generatePdfTemplate(tickets);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast.error("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.", { id: toastId });
          return;
        }
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);

        toast.success(`${tickets.length} ligne(s) prêtes pour export PDF`, { id: toastId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur lors de l'export", {
          id: toastId,
        });
      }
    },
    [filters, queryClient, totalItems],
  );

  return (
    /*
     * `color` et `startContent`/`endContent` sont des props de la v2 : posees sur un
     * composant v3 elles sont ignorees EN SILENCE — le bouton perdait ses deux icones
     * sans qu'aucune erreur ne le signale. En v3 les icones sont des enfants, et la
     * couleur passe par `variant`.
     */
    <Dropdown>
      <Dropdown.Trigger>
        <Button isDisabled={isDisabled} variant="outline">
          <Download aria-hidden="true" className="size-4" />
          Exporter
          <ChevronDown aria-hidden="true" className="size-4" />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu
          aria-label="Format d'export"
          onAction={(key) => handleExport(key as ExportFormat)}
        >
          <Dropdown.Item id="PDF">PDF</Dropdown.Item>
          <Dropdown.Item id="EXCEL">Excel</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
