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

  // 1. Feuille de résumé
  const summaryData = [
    ['RAPPORT FINANCIER - CHIFFRE D\'AFFAIRES'],
    [],
    ['Période', params.selectedMonth ? 
      `Mois ${params.selectedMonth} ${params.selectedYear}` : 
      `Année ${params.selectedYear}`
    ],
    ['Date de génération', new Date().toLocaleDateString('fr-FR', { 
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })],
    ['Date de début', params.debut?.toLocaleDateString('fr-FR')],
    ['Date de fin', params.fin?.toLocaleDateString('fr-FR')],
    [],
    ['Statistiques'],
    ['Nombre total de restaurants', data.totalElements || 0],
    ['Nombre de pages', data.totalPages || 0],
    [],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

  // 2. Feuille principale avec les données du tableau restaurants
  if (data.content && data.content.length > 0) {
    // En-têtes exacts comme dans le tableau
    const headers = [
      'Partenaire',
      'Total Livraison',
      'Total Commission', 
      'Total Facture'
    ];

    // Préparer les données exactement comme dans le tableau
    const tableData = data.content.map((item: IRestaurantRecouvrement) => [
      item.nomRestaurant || '',
      item.totalFraisLivraisons || 0,
      item.totalCommission || 0,
      item.totalCommande || 0 // Utiliser totalCommande au lieu de totalFacture
    ]);

    // Combiner en-têtes et données
    const fullData = [headers, ...tableData];
    const wsTable = XLSX.utils.aoa_to_sheet(fullData);

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 30 }, // Partenaire
      { wch: 20 }, // Total Livraison
      { wch: 20 }, // Total Commission
      { wch: 20 }, // Total Facture
    ];
    wsTable['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, wsTable, 'Liste des restaurants');

    // 3. Feuille de statistiques par restaurant
    const restaurantStats = data.content.map((item: IRestaurantRecouvrement) => ({
      nom: item.nomRestaurant || 'Restaurant Inconnu',
      totalLivraison: item.totalFraisLivraisons || 0,
      totalCommission: item.totalCommission || 0,
      totalFacture: item.totalCommande || 0, // Utiliser totalCommande
      pourcentageCommission: (item.totalCommande || 0) > 0 ? ((item.totalCommission || 0) / (item.totalCommande || 0) * 100).toFixed(2) : '0'
    }));

    const statsHeaders = [
      'Restaurant',
      'Total Livraison (FCFA)',
      'Total Commission (FCFA)',
      'Total Facture (FCFA)',
      '% Commission'
    ];

    const statsData = restaurantStats.map(stat => [
      stat.nom,
      stat.totalLivraison,
      stat.totalCommission,
      stat.totalFacture,
      stat.pourcentageCommission + '%'
    ]);

    const fullStatsData = [statsHeaders, ...statsData];
    const wsStats = XLSX.utils.aoa_to_sheet(fullStatsData);

    // Ajuster la largeur des colonnes pour les stats
    const statsColWidths = [
      { wch: 30 }, // Restaurant
      { wch: 25 }, // Total Livraison
      { wch: 25 }, // Total Commission
      { wch: 20 }, // Total Facture
      { wch: 15 }, // % Commission
    ];
    wsStats['!cols'] = statsColWidths;

    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques détaillées');

    // 4. Feuille de totaux globaux
    const totals = data.content.reduce((acc, item: IRestaurantRecouvrement) => ({
      totalLivraison: acc.totalLivraison + (item.totalFraisLivraisons || 0),
      totalCommission: acc.totalCommission + (item.totalCommission || 0),
      totalFacture: acc.totalFacture + (item.totalCommande || 0) // Utiliser totalCommande
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
