'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import ReactPDF from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { livreurTicketsListQueryOption } from '@/features/tickets/queries/livreur-ticket-list.query';
import { livreurStatsQueryOption } from '@/features/tickets/queries/livreur-stats.query';
import { genererReleveDePaie } from '@/features/tickets/utils/tickets-livreur-export.utils';
import { RelevePaiePdf } from '@/components/tickets/export/releve-paie-pdf';

interface Props {
  turboyId: string;
  turboyNom: string;
  creneauDebut: Date;
  creneauFin: Date;
}

export default function FichePaieButton({ turboyId, turboyNom, creneauDebut, creneauFin }: Props) {
  const [loading, setLoading] = useState(false);

  const ticketsQuery = useQuery({
    ...livreurTicketsListQueryOption({
      idLivreur: turboyId,
      creneauDebut,
      creneauFin,
      livreurPage: 0,
      livreurPageSize: 1000,
    }),
    enabled: false,
  });

  const statsQuery = useQuery({
    ...livreurStatsQueryOption({
      livreurId: turboyId,
      debut: creneauDebut,
      fin: creneauFin,
    }),
    enabled: false,
  });

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const [ticketsResult, statsResult] = await Promise.all([
        ticketsQuery.refetch(),
        statsQuery.refetch(),
      ]);

      const livreurData = ticketsResult.data?.content[0];
      if (!livreurData) return;

      const primeHebdo = statsResult.data?.primeHebdo ?? false;
      const pourcentageApplicable = primeHebdo ? 0.7 : 0.6;
      const pdfData = genererReleveDePaie(livreurData, pourcentageApplicable, 0);
      const period =
        format(creneauDebut, 'dd/MM/yyyy') + ' - ' + format(creneauFin, 'dd/MM/yyyy');
      const blob = await ReactPDF.pdf(RelevePaiePdf({ data: pdfData, period })).toBlob();
      saveAs(blob, `releve_paie_${turboyNom.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={loading}
      className="h-7 gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-xs whitespace-nowrap"
      onClick={handleClick}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent inline-block" />
      ) : (
        <FileText className="h-3.5 w-3.5" />
      )}
      {loading ? 'Génération…' : 'Fiche de paie'}
    </Button>
  );
}
