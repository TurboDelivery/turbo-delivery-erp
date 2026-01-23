import { IRecapPaiementLivreur } from '@/features/tickets/types/livreur.type';
import * as XLSX from 'xlsx';
import { autoFitColumns } from '@/features/tickets/utils/export.utils';

export function generateRecapPaieXlsxTemplate(recapLivreurs: IRecapPaiementLivreur[]) {
  const totaux = {
    totalLivraison: 0,
    commission: 0,
    prime: 0,
    gainTotal: 0,
  }
  const worksheetData = recapLivreurs.map((recap) => {
    const gain = recap.commission + recap.prime;
    totaux.totalLivraison += recap.totalLivraison;
    totaux.commission += recap.commission;
    totaux.prime += recap.prime;
    totaux.gainTotal += gain;
    return {
      turboys: recap.nomLivreur,
      'total realise': recap.totalLivraison,
      commission: recap.commission,
      prime: recap.prime,
      'gain total': gain,
    };
  });

  // Ajouter une ligne des totaux à la fin
  worksheetData.push({
    turboys: 'Totaux',
    'total realise': totaux.totalLivraison,
    commission: totaux.commission,
    prime: totaux.prime,
    'gain total': totaux.gainTotal,
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  worksheet['!cols'] = autoFitColumns(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recap Paie Livreurs');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}