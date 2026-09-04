import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  } = useMutation({
    // v5 : la fonction ne se passe plus en positionnel, elle a son nom.
    mutationFn: async (params: UseDepenseExportParams) => {
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

      /*
       * Dedoublonnage par IDENTIFIANT seulement.
       *
       * <p>Un second filtre retirait aussi les lignes de meme signature — description
       * normalisee, montant et date. Or deux depenses DISTINCTES partagent souvent ces
       * trois valeurs : deux pleins de carburant le meme jour au meme prix, deux achats
       * identiques pour deux etablissements. Chacune etait silencieusement retiree de
       * l'export, et le total du fichier ne correspondait plus a celui de l'ecran.</p>
       *
       * <p>L'identifiant suffit a ecarter les vrais doublons : deux lignes de meme id
       * sont la meme depense vue deux fois, deux lignes d'id different sont deux
       * depenses.</p>
       */
      const idsVus = new Set<string>();
      allDepenses = allDepenses.filter((d) => {
        if (idsVus.has(d.id)) return false;
        idsVus.add(d.id);
        return true;
      });

      // Calculer le total des montants pour comparaison
      const totalMontant = allDepenses.reduce((somme, depense) => somme + depense.montant, 0);

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
  },
    /*
     * L'echec ne se disait NULLE PART. La mutation relancait bien, mais sans `onError` et
     * sans que l'appelant lise `isErrorDepenseExport` : l'operateur cliquait « Exporter »,
     * le bouton se rallumait, et aucun fichier n'arrivait. Rien ne distinguait un export
     * en panne d'un export lent.
     */
    onSuccess: (resultat) => {
      toast.success(`${resultat.totalDepenses} dépense(s) exportée(s).`, {
        description: resultat.fileName,
      });
    },
    onError: (error) => {
      toast.error("L'export des dépenses a échoué.", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
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
