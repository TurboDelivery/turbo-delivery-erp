import { useGetLivreurRecapPaie } from '@/features/tickets/queries/recap-paie-livreur.mutation';
import { useLivreurFilters } from '@/features/tickets/hooks/use-livreur-filters';
import { IRecapPaiementLivreurSearchParams } from '@/features/tickets/types/livreur.type';
import { generateRecapPaieXlsxTemplate } from '@/features/tickets/utils/recap-paie-export.utils';

export default function useRecapPaieLivreurs() {
  const { filters } = useLivreurFilters();

  const currentFilters: IRecapPaiementLivreurSearchParams = {
    debut: filters.creneauDebut,
    fin: filters.creneauFin,
  };

  const { mutate: getLivreurRecapPaie, isLoading: isLoadingLivreurRecapPaie, isError: isErrorLivreurRecapPaie, data: livreurRecapPaie } = useGetLivreurRecapPaie();

  const exportLivreurRecapPaieToExcel = () => {
    getLivreurRecapPaie(currentFilters, {
      onSuccess: (data) => {
        const xlsxData = generateRecapPaieXlsxTemplate(data);
        const blob = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `recap_paie_livreurs_${currentFilters.debut?.toISOString().split('T')[0]}-${currentFilters.fin?.toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    });
  };

  return {
    exportLivreurRecapPaieToExcel,
    isLoadingLivreurRecapPaie,
    isErrorLivreurRecapPaie,
    livreurRecapPaie,
  };
}