import { useMutation } from '@tanstack/react-query';
import { IRestaurantRecouvrementSearchParams } from '@/features/recouvrements/types/restaurant-recouvrement.types';
import { obtenirRestaurantRecouvrementsRequest } from '@/features/recouvrements/requests/recouvrements.request';
import { entreeCaisseAPI } from '@/features/entrees-caisse/apis/entree-caisse.api';
import { generateCAExcelTemplate } from '@/features/finance-dashboard/utils/ca-export.utils';
import { startOfMonth } from 'date-fns';

interface UseCAExportParams {
  debut?: Date;
  fin?: Date;
  selectedMonth?: number | null;
  selectedYear?: number;
}

export type { UseCAExportParams };

export function useCAExport() {
  const { mutate: exportCAData, isPending: isLoadingCAExport, isError: isErrorCAExport, data: caExportData } = useMutation({
    // v5 : la fonction ne se passe plus en positionnel, elle a son nom.
    mutationFn: async (params: UseCAExportParams) => {
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
        
        // Récupérer la première page
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const firstResult = await response.json();
        
        // Récupérer toutes les pages si nécessaire
        let allData = [...firstResult.content];
        const totalPages = firstResult.totalPages;
        
        if (totalPages > 1) {
          
          for (let page = 1; page < totalPages; page++) {
            const pageSearchParams = new URLSearchParams(searchParams.toString());
            pageSearchParams.set('page', page.toString());
            const pageUrl = `${baseUrl}?${pageSearchParams.toString()}`;
            const pageResponse = await fetch(pageUrl);
            
            if (pageResponse.ok) {
              const pageResult = await pageResponse.json();
              if (pageResult.content) {
                allData = [...allData, ...pageResult.content];
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

        /*
         * Les prestations hors livraison de la MEME periode. Elles comptent deja dans le
         * chiffre d'affaires affiche a l'ecran ; sans elles ici, le TOTAL du fichier reste
         * inferieur au chiffre annonce sans qu'aucune ligne ne l'explique.
         *
         * Les deux bornes sont obligatoires : la lecture passe par un `between` qui ne
         * tolere pas de borne nulle, alors que la somme du CA, elle, la tolere. Une plage a
         * demi bornee rendrait zero pendant que le CA compte.
         *
         * Un echec de cette lecture ne doit PAS emporter l'export : le fichier se construit
         * alors comme avant, sans la section, et la console dit pourquoi.
         */
        let entreesCaisse: Awaited<ReturnType<typeof entreeCaisseAPI.lister>> = [];
        if (params.debut && params.fin) {
          try {
            entreesCaisse = await entreeCaisseAPI.lister({
              debut: params.debut.toISOString().split('T')[0],
              fin: params.fin.toISOString().split('T')[0],
            });
          } catch (erreur) {
            console.error('[export CA] autres composantes illisibles, section omise', erreur);
          }
        }

        // Générer le fichier Excel avec les données exactes du tableau
        const xlsxData = generateCAExcelTemplate(combinedData, params, entreesCaisse ?? []);
        
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
    },
  });

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
