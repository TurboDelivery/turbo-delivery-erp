import { IRecapPaiementLivreur } from '@/features/tickets/types/livreur.type';
import * as XLSX from 'xlsx';
import { autoFitColumns } from '@/features/tickets/utils/export.utils';

export function generateRecapPaieXlsxTemplate(recapLivreurs: IRecapPaiementLivreur[]) {
  const worksheetData = recapLivreurs.map((recap) => ({
    turboys: recap.nomLivreur,
    'total realise': recap.totalLivraison,
    commission: recap.commission,
    prime: recap.prime,
    'gain total': recap.commission + recap.prime,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  worksheet['!cols'] = autoFitColumns(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recap Paie Livreurs');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}