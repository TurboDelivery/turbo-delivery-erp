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
        // Utiliser le nouvel endpoint API factures
        console.log('🔍 CA Export - Plage de dates:', params.debut, 'à', params.fin);
        
        // Construire l'URL pour l'API locale (proxy)
        const baseUrl = '/api/factures/pagination';
        const searchParams = new URLSearchParams();
        
        if (params.debut) {
          searchParams.append('debut', params.debut.toISOString().split('T')[0]);
        }
        if (params.fin) {
          searchParams.append('fin', params.fin.toISOString().split('T')[0]);
        }
        
        searchParams.append('date', 'MOIS');
        searchParams.append('page', '0');
        searchParams.append('size', '1000');
        
        const apiUrl = `${baseUrl}?${searchParams.toString()}`;
        console.log('🔍 CA Export - URL appelée:', apiUrl);
        
        // Récupérer la première page
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const firstResult = await response.json();
        console.log('📊 CA Export - Première page:', firstResult.totalPages, 'pages totales');
        
        // Récupérer toutes les pages si nécessaire
        let allData = [...firstResult.content];
        const totalPages = firstResult.totalPages;
        
        if (totalPages > 1) {
          console.log(`🔄 CA Export - Récupération des ${totalPages} pages...`);
          
          for (let page = 1; page < totalPages; page++) {
            const pageSearchParams = new URLSearchParams(searchParams.toString());
            pageSearchParams.set('page', page.toString());
            const pageUrl = `${baseUrl}?${pageSearchParams.toString()}`;
            const pageResponse = await fetch(pageUrl);
            
            if (pageResponse.ok) {
              const pageResult = await pageResponse.json();
              if (pageResult.content) {
                allData = [...allData, ...pageResult.content];
                console.log(`📊 CA Export - Page ${page + 1}/${totalPages} récupérée`);
              }
            }
          }
        }
        
        // Combiner toutes les données
        const combinedData = {
          ...firstResult,
          content: allData,
          totalElements: allData.length
        };
        
        console.log('📊 CA Export - Données combinées:', combinedData);
        console.log('📋 CA Export - Total restaurants:', combinedData.content.length);

        // Générer le fichier Excel avec les données exactes du tableau
        const xlsxData = generateCAExcelTemplate(combinedData, params);
        
        // Créer le blob et télécharger
        const blob = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Nom de fichier personnalisé avec plage de dates et heure
        let fileName = '';
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '-');
        
        if (params.debut && params.fin) {
          // Plage personnalisée
          const debutStr = params.debut.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
          const finStr = params.fin.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
          fileName = `ca_${debutStr}_au_${finStr}_${timeStr}.xlsx`;
        } else if (params.selectedMonth) {
          // Mois spécifique
          const monthNames = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
          const monthName = monthNames[params.selectedMonth - 1];
          fileName = `ca_${monthName}_${params.selectedYear}_${timeStr}.xlsx`;
        } else {
          // Année complète
          fileName = `ca_annee_${params.selectedYear}_${timeStr}.xlsx`;
        }
        
        link.setAttribute('download', fileName);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
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
