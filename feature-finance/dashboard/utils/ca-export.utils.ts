import * as XLSX from 'xlsx';
import { PaginatedResponse } from '@/types';
import { IRestaurantRecouvrement } from '@/features/recouvrements/types/restaurant-recouvrement.types';
import { UseCAExportParams } from '../hooks/use-ca-export';

export function generateCAExcelTemplate(
  data: PaginatedResponse<IRestaurantRecouvrement>, 
  params: UseCAExportParams
): ArrayBuffer {
  console.log('📊 Excel Generation - Data reçue:', data);
  console.log('📊 Excel Generation - Content:', data.content);
  console.log('📊 Excel Generation - Content length:', data.content?.length);
  
  // Créer le classeur Excel
  const wb = XLSX.utils.book_new();

  // Feuille principale avec les données du tableau restaurants
  if (data.content && data.content.length > 0) {
    // En-têtes exacts comme dans le tableau
    const headers = [
      'Partenaire',
      'Total Livraison',
      'Total Commission', 
      'Total Facture'
    ];

    // Préparer les données exactement comme dans le tableau
    const tableData = data.content.map((item: IRestaurantRecouvrement) => {
      console.log('🔍 Restaurant item:', item);
      console.log('📊 totalFacture:', item.totalFacture);
      console.log('📊 totalCommande:', item.totalCommande);
      
      return [
        item.nomRestaurant || '',
        item.totalFraisLivraisons || 0,
        item.totalCommission || 0,
        item.totalFacture || 0 // Utiliser seulement totalFacture (sera 0 pour le moment)
      ];
    });

    // Calculer les totaux pour chaque colonne
    const tableTotals = data.content.reduce((acc, item: IRestaurantRecouvrement) => ({
      totalLivraison: acc.totalLivraison + (item.totalFraisLivraisons || 0),
      totalCommission: acc.totalCommission + (item.totalCommission || 0),
      totalFacture: acc.totalFacture + (item.totalFacture || 0) // Utiliser seulement totalFacture (sera 0 pour le moment)
    }), { totalLivraison: 0, totalCommission: 0, totalFacture: 0 });

    // Ajouter la ligne des totaux
    const totalRow = [
      'TOTAL',
      tableTotals.totalLivraison,
      tableTotals.totalCommission,
      tableTotals.totalFacture
    ];

    // Calculer le Total Revenue (somme des trois colonnes)
    const totalRevenue = tableTotals.totalLivraison + tableTotals.totalCommission + tableTotals.totalFacture;
    
    // Ajouter la ligne Total Revenue
    const totalRevenueRow = [
      'TOTAL REVENUE',
      totalRevenue,
      '', // Laisser vide pour Total Commission
      ''  // Laisser vide pour Total Facture
    ];

    // Combiner en-têtes, données, ligne de totaux et ligne Total Revenue
    const fullData = [headers, ...tableData, totalRow, totalRevenueRow];
    const wsTable = XLSX.utils.aoa_to_sheet(fullData);

    // Mettre en gras la ligne TOTAL (avant-dernière ligne)
    const totalRowIndex = fullData.length - 2;
    for (let col = 0; col < 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
      if (!wsTable[cellAddress]) wsTable[cellAddress] = {};
      wsTable[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFE6E6FA" } } // Fond violet clair
      };
    }

    // Mettre en gras la ligne TOTAL REVENUE (dernière ligne) avec une couleur différente
    const totalRevenueRowIndex = fullData.length - 1;
    for (let col = 0; col < 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: totalRevenueRowIndex, c: col });
      if (!wsTable[cellAddress]) wsTable[cellAddress] = {};
      wsTable[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FF90EE90" } } // Fond vert clair
      };
    }

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 30 }, // Partenaire
      { wch: 20 }, // Total Livraison
      { wch: 20 }, // Total Commission
      { wch: 20 }, // Total Facture
    ];
    wsTable['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, wsTable, 'Liste des restaurants');

    // Feuille de totaux globaux
    const totals = data.content.reduce((acc, item: IRestaurantRecouvrement) => ({
      totalLivraison: acc.totalLivraison + (item.totalFraisLivraisons || 0),
      totalCommission: acc.totalCommission + (item.totalCommission || 0),
      totalFacture: acc.totalFacture + (item.totalFacture || 0) // Utiliser seulement totalFacture (sera 0 pour le moment)
    }), { totalLivraison: 0, totalCommission: 0, totalFacture: 0 });

    const totalsData = [
      ['TOTAUX GLOBAUX'],
      [],
      ['Total Livraison', totals.totalLivraison + ' FCFA'],
      ['Total Commission', totals.totalCommission + ' FCFA'],
      ['Total Facture', totals.totalFacture + ' FCFA'],
      [],
      ['Pourcentage Commission / Total Facture', totals.totalFacture > 0 ? ((totals.totalCommission / totals.totalFacture) * 100).toFixed(2) + '%' : '0%'],
      ['Pourcentage Livraison / Total Facture', totals.totalFacture > 0 ? ((totals.totalLivraison / totals.totalFacture) * 100).toFixed(2) + '%' : '0%'],
    ];

    const wsTotals = XLSX.utils.aoa_to_sheet(totalsData);
    XLSX.utils.book_append_sheet(wb, wsTotals, 'Totaux globaux');
  }

  // Générer le fichier Excel
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}
