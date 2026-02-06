import * as XLSX from 'xlsx';
import { UseCAExportParams } from '../hooks/use-ca-export';

export function generateCAExcelTemplate(
  data: any, // Changé pour accepter les données de l'API factures
  params: UseCAExportParams
): ArrayBuffer {
  console.log('📊 Excel Generation - Data reçue:', data);
  console.log('📊 Excel Generation - Content:', data.content);
  console.log('📊 Excel Generation - Content length:', data.content?.length);
  console.log('🔍 Excel Generation - Mois sélectionné:', params.selectedMonth, 'Année:', params.selectedYear);
  
  // Créer le classeur Excel
  const wb = XLSX.utils.book_new();

  // Utiliser directement les données retournées par l'API factures
  const facturesData = data.content;

  console.log('🔍 Excel Generation - Données utilisées:', facturesData.length);

  // Feuille principale avec les données des factures
  if (facturesData && facturesData.length > 0) {
    // Ajouter la période en haut du fichier
    const periodeData = [
      ['PÉRIODE SÉLECTIONNÉE'],
      [],
      ['Du', params.debut?.toISOString().split('T')[0] || 'Début'],
      ['Au', params.fin?.toISOString().split('T')[0] || 'Fin'],
      [],
      []
    ];
    
    // En-têtes selon les données de l'API factures (sans Total Commande)
    const headers = [
      'Nom Restaurant',
      'Total Frais Livraisons', 
      'Total Commission',
      'Total'
    ];

    // Préparer les données avec les champs de l'API factures
    const tableData = facturesData.map((item: any) => {
      console.log('🔍 Facture item:', item);
      
      const totalCA = (item.totalFraisLivraisons || 0) + (item.totalCommission || 0);
      
      return [
        item.nomRestaurant || '',
        item.totalFraisLivraisons || 0,
        item.totalCommission || 0,
        totalCA
      ];
    });

    // Calculer les totaux pour chaque colonne
    const tableTotals = facturesData.reduce((acc: any, item: any) => {
      const totalCA = (item.totalFraisLivraisons || 0) + (item.totalCommission || 0);
      return {
        totalFraisLivraisons: acc.totalFraisLivraisons + (item.totalFraisLivraisons || 0),
        totalCommission: acc.totalCommission + (item.totalCommission || 0),
        totalCA: acc.totalCA + totalCA
      };
    }, { totalFraisLivraisons: 0, totalCommission: 0, totalCA: 0 });

    // Ajouter la ligne des totaux
    const totalRow = [
      'TOTAL',
      tableTotals.totalFraisLivraisons,
      tableTotals.totalCommission,
      tableTotals.totalCA
    ];

    // Combiner en-têtes, données et ligne de totaux (avec la période en haut)
    const fullData = [...periodeData, headers, ...tableData, totalRow];
    const wsTable = XLSX.utils.aoa_to_sheet(fullData);

    // Mettre en gras la période et les en-têtes
    // Mettre en gras "PÉRIODE SÉLECTIONNÉE"
    const periodeCellAddress = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (!wsTable[periodeCellAddress]) wsTable[periodeCellAddress] = {};
    wsTable[periodeCellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "FFD3D3D3" } } // Fond gris clair
    };

    // Mettre en gras les en-têtes du tableau
    const headerRowIndex = periodeData.length;
    for (let col = 0; col < 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
      if (!wsTable[cellAddress]) wsTable[cellAddress] = {};
      wsTable[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFE6F3" } } // Fond bleu très clair
      };
    }

    // Mettre en gras la ligne TOTAL (dernière ligne)
    const totalRowIndex = fullData.length - 1;
    for (let col = 0; col < 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
      if (!wsTable[cellAddress]) wsTable[cellAddress] = {};
      wsTable[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFE6E6FA" } } // Fond violet clair
      };
    }

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 35 }, // Nom Restaurant
      { wch: 25 }, // Total Frais Livraisons
      { wch: 20 }, // Total Commission
      { wch: 25 }, // Total CA
    ];
    wsTable['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, wsTable, 'Détails Factures');

    // Ajouter le résumé directement sur la même feuille
    const summaryStartRow = fullData.length + 3; // Laisser 2 lignes vides après les données
    
    // Données de résumé
    const summaryData = [
      ['RÉSUMÉ'],
      [],
      ['Période', `${params.debut?.toISOString().split('T')[0] || 'Début'} au ${params.fin?.toISOString().split('T')[0] || 'Fin'}`],
      ['Nombre de restaurants', facturesData.length],
      [],
      ['Total Frais Livraisons', tableTotals.totalFraisLivraisons + ' FCFA'],
      ['Total Commissions', tableTotals.totalCommission + ' FCFA'],
      ['TOTAL', tableTotals.totalCA + ' FCFA'],
      [],
      ['% Frais Livraison / Total', tableTotals.totalCA > 0 ? ((tableTotals.totalFraisLivraisons / tableTotals.totalCA) * 100).toFixed(2) + '%' : '0%'],
      ['% Commission / Total', tableTotals.totalCA > 0 ? ((tableTotals.totalCommission / tableTotals.totalCA) * 100).toFixed(2) + '%' : '0%'],
    ];

    // Ajouter le résumé à la feuille existante
    summaryData.forEach((row, index) => {
      const rowIndex = summaryStartRow + index;
      row.forEach((cell, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        if (!wsTable[cellAddress]) wsTable[cellAddress] = {};
        wsTable[cellAddress].v = cell;
        
        // Mettre en gras les en-têtes du résumé
        if (index === 0 || (index >= 4 && index <= 6)) {
          if (!wsTable[cellAddress].s) wsTable[cellAddress].s = {};
          wsTable[cellAddress].s.font = { bold: true };
          wsTable[cellAddress].s.fill = { fgColor: { rgb: "FF90EE90" } }; // Fond vert clair
        }
      });
    });
  }

  // Générer le fichier Excel
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}
