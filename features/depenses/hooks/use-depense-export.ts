import { useMutation } from '@tanstack/react-query';
import { depenseAPI } from '../apis/depense.api';
import { IDepense, IDepenseStats } from '../types/depense.type';
import { saveAsExcelFile } from '@/utils/reporting-file';
import * as XLSX from 'xlsx';

interface UseDepenseExportParams {
  debut?: Date;
  fin?: Date;
  categoriesDepense?: string[]; // Tableau de catégories pour le filtre
  page?: number;
  limit?: number;
}

export type { UseDepenseExportParams };

export function useDepenseExport() {
  const {
    mutate: exportDepensesData,
    isPending: isLoadingDepenseExport,
    isError: isErrorDepenseExport,
    data: depenseExportData,
  } = useMutation(async (params: UseDepenseExportParams) => {
    try {
      // Utiliser la même API que le dashboard pour la cohérence
      const statsData: IDepenseStats = await depenseAPI.obtenirStatsDepenses({
        debut: params.debut,
        fin: params.fin,
      });

      // Récupérer les dépenses individuelles pour le détail
      let allDepenses: IDepense[] = [];
      let currentPage = params.page || 0;
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await depenseAPI.obtenirTousDepenses({
          debut: params.debut,
          fin: params.fin,
          categoriesDepense: params.categoriesDepense,
          page: currentPage,
          limit: params.limit || 1000,
        });

        if (response.content && response.content.length > 0) {
          allDepenses = [...allDepenses, ...response.content];
          hasMoreData = currentPage < (response.totalPages || 1) - 1;
          currentPage++;
        } else {
          hasMoreData = false;
        }
      }

      // Dédoublonnage : par id d'abord, puis par (description normalisée + montant + date)
      const seenIds = new Set<string>();
      const seenSignatures = new Set<string>();
      allDepenses = allDepenses.filter((d) => {
        if (seenIds.has(d.id)) return false;
        seenIds.add(d.id);
        // Normalise la description (retire tirets, espaces multiples, casse)
        const descNorm = (d.description ?? '').replace(/[-–]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
        const date = d.dateDepense ? new Date(d.dateDepense).toISOString().split('T')[0] : '';
        const sig = `${descNorm}|${d.montant}|${date}`;
        if (seenSignatures.has(sig)) return false;
        seenSignatures.add(sig);
        return true;
      });

      // Calculer le total des montants pour comparaison
      const totalMontant = allDepenses.reduce((sum, depense) => {
        console.log(`💰 Addition: ${sum} + ${depense.montant} = ${sum + depense.montant}`);
        return sum + depense.montant;
      }, 0);

      // Générer les données Excel
      const worksheetData = allDepenses.map((depense, index) => ({
        '#': index + 1,
        Designation: depense.description,
        Categorie: depense.categorie?.nomCategorie || '',
        Montant: depense.montant,
        Date: new Date(depense.dateDepense).toLocaleDateString('fr-FR'),
        'Ajoute le': new Date(depense.createdAt).toLocaleDateString('fr-FR'),
        Statut: depense.statut || '',
        Justificatif: depense.justificatif || '',
      }));

      // Créer le worksheet Excel
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Ajuster la largeur des colonnes

      worksheet['!cols'] = [
        { wch: 5 }, // #
        { wch: 30 }, // Designation
        { wch: 20 }, // Categorie
        { wch: 15 }, // Montant
        { wch: 12 }, // Date
        { wch: 12 }, // Ajoute le
        { wch: 18 }, // Statut
        { wch: 30 }, // Justificatif
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dépenses');

      // Générer le fichier Excel
      const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      // Nom de fichier personnalisé avec plage de dates et heure
      let fileName = 'depenses_export';
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '-');

      if (params.debut && params.fin) {
        // Plage personnalisée
        const debutStr = params.debut.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        const finStr = params.fin.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        fileName = `depenses_${debutStr}_au_${finStr}_${timeStr}`;
      } else {
        // Export général
        fileName = `depenses_export_${timeStr}`;
      }

      // Ajouter les catégories au nom si spécifiées
      if (params.categoriesDepense && params.categoriesDepense.length > 0) {
        const categoriesStr = params.categoriesDepense.slice(0, 3).join('_').toLowerCase();
        fileName = `depenses_${categoriesStr}_${timeStr}`;
      }

      // Créer le blob et télécharger
      const blob = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Utiliser l'utilitaire d'export
      saveAsExcelFile(blob, fileName);

      return {
        success: true,
        fileName,
        size: blob.size,
        totalDepenses: allDepenses.length,
        totalDashboard: statsData.montant_total,
        totalExport: totalMontant,
        params,
      };
    } catch (error) {
      console.error("Erreur lors de l'exportation des dépenses:", error);
      throw error;
    }
  });

  const exportDepensesToExcel = (params: UseDepenseExportParams) => {
    exportDepensesData(params);
  };

  return {
    exportDepensesToExcel,
    isLoadingDepenseExport,
    isErrorDepenseExport,
    depenseExportData,
  };
}
