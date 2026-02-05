import { useMutation } from '@tanstack/react-query';
import { IRestaurantRecouvrementSearchParams } from '@/features/recouvrements/types/restaurant-recouvrement.types';
import { obtenirRestaurantRecouvrementsRequest } from '@/features/recouvrements/requests/recouvrements.request';
import { generateCAExcelTemplate } from '@/feature-finance/dashboard/utils/ca-export.utils';
import { startOfMonth } from 'date-fns';

interface UseCAExportParams {
  debut?: Date;
  fin?: Date;
  selectedMonth?: number | null;
  selectedYear?: number;
}

export type { UseCAExportParams };

export function useCAExport() {
  const { mutate: exportCAData, isPending: isLoadingCAExport, isError: isErrorCAExport, data: caExportData } = useMutation(
    async (params: UseCAExportParams) => {
      // Déterminer la période en fonction du mois sélectionné
      let periode: 'JOUR' | 'SEMAINE' | 'MOIS' | 'TRIMESTRE' | 'SEMESTRE' | 'ANNEE' = 'ANNEE';
      
      if (params.selectedMonth) {
        periode = 'MOIS';
      } else {
        periode = 'ANNEE';
      }

      // Préparer les paramètres avec la période
      const searchParams: IRestaurantRecouvrementSearchParams = {
        debut: params.debut,
        fin: params.fin,
        page: 0,
        limit: 1000,
        restaurantId: undefined,
        periode: periode // Utiliser le paramètre période
      };

      try {
        // Utiliser la même fonction que le tableau restaurants
        console.log('🔍 CA Export - Params envoyés à l\'API:', searchParams);
        console.log('🔍 CA Export - Période utilisée:', periode);
        
        // Récupérer la première page pour connaître le nombre total de pages
        const firstResult = await obtenirRestaurantRecouvrementsRequest({
          ...searchParams,
          page: 0,
          limit: 1000
        });
        
        if (!firstResult.success || !firstResult.data) {
          throw new Error(firstResult.error || 'Aucune donnée récupérée');
        }
        
        console.log('📊 CA Export - Première page:', firstResult.data.totalPages, 'pages totales');
        
        // Récupérer toutes les pages si nécessaire
        let allData = [...firstResult.data.content];
        const totalPages = firstResult.data.totalPages;
        
        if (totalPages > 1) {
          console.log(`🔄 CA Export - Récupération des ${totalPages} pages...`);
          
          for (let page = 1; page < totalPages; page++) {
            const pageResult = await obtenirRestaurantRecouvrementsRequest({
              ...searchParams,
              page,
              limit: 1000
            });
            
            if (pageResult.success && pageResult.data?.content) {
              allData = [...allData, ...pageResult.data.content];
              console.log(`📊 CA Export - Page ${page + 1}/${totalPages} récupérée`);
            }
          }
        }
        
        // Combiner toutes les données
        const combinedData = {
          ...firstResult.data,
          content: allData,
          totalElements: allData.length
        };
        
        console.log('📊 CA Export - Données combinées:', combinedData);
        console.log('📋 CA Export - Total restaurants:', combinedData.content.length);

        // Générer le fichier Excel avec les données exactes du tableau
        const xlsxData = generateCAExcelTemplate(combinedData, params);
        
        // Créer le blob et télécharger
        const blob = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Nom de fichier dynamique
        const period = params.selectedMonth ? 
          `mois_${params.selectedMonth}_${params.selectedYear}` : 
          `annee_${params.selectedYear}`;
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `ca_${period}_${dateStr}.xlsx`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return combinedData;
      } catch (error) {
        console.error('Erreur lors de l\'exportation CA:', error);
        throw error;
      }
    }
  );

  const exportCAToExcel = (params: UseCAExportParams) => {
    exportCAData(params);
  };

  return {
    exportCAToExcel,
    isLoadingCAExport,
    isErrorCAExport,
    caExportData,
  };
}
