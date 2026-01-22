import { useLivreurFilters } from '@/features/tickets/hooks/use-livreur-filters';
import { useLivreurTicketsListQuery } from '@/features/tickets/queries/livreur-ticket-list.query';
import ReactPDF from '@react-pdf/renderer';
import { RelevePaiePdf } from '@/components/tickets/export/releve-paie-pdf';
import { saveAs } from 'file-saver';
import { genererReleveDePaie } from '@/features/tickets/utils/tickets-livreur-export.utils';
import { format } from 'date-fns';
import { useLivreurStats } from '@/features/tickets/hooks/use-livreur-stats';

export default function useTicketsLivreurPdf() {
  const { filters } = useLivreurFilters();

  const currentFilters = {
    idLivreur: filters.idLivreur,
    creneauDebut: filters.creneauDebut,
    creneauFin: filters.creneauFin,
    livreurPage: 0,
    livreurPageSize: 1000,
  };

  const { data: ticketsData, isLoading: isLoadingTicketsPdf, isError: isErrorTicketsPdf } = useLivreurTicketsListQuery(currentFilters);
  const {
    livreurStats: { primeHebdo },
    isLoading: isLoadingStats,
    isError: isErrorStats,
  } = useLivreurStats();

  let pdfData = null;
  if (ticketsData?.content[0] && !isLoadingStats && !isErrorStats) {
    const pourcentageApplicable = primeHebdo ? 0.7 : 0.6;
    pdfData = genererReleveDePaie(ticketsData.content[0], pourcentageApplicable, 0);
  }

  const handleGeneratePdf = async () => {
    if (!pdfData) return;
    // Date to period string
    const period = format(filters.creneauDebut, 'dd/MM/yyyy') + ' - ' + format(filters.creneauFin, 'dd/MM/yyyy');
    const blob = await ReactPDF.pdf(RelevePaiePdf({ data: pdfData, period })).toBlob();
    saveAs(blob, `releve_paie_${pdfData.livreur.replace(/\s+/g, '_').toLowerCase()}_${period.replace(/\s+/g, '_')}.pdf`);
  };

  return {
    isLoadingTicketsPdf: isLoadingTicketsPdf || isLoadingStats,
    isErrorTicketsPdf: isErrorTicketsPdf || isErrorStats,
    handleGeneratePdf,
  };
}
