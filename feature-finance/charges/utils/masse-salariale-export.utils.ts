import * as XLSX from 'xlsx';
import { IHistoriqueMasseSalariale } from '../types/charge-fixe.type';
import { autoFitColumns } from '@/features/tickets/utils/export.utils';

export function generateMasseSalarialeXlsx(data: IHistoriqueMasseSalariale) {
  const worksheetData = data.details.map((d) => ({
    Employé: d.nomEmploye,
    Poste: d.poste,
    Département: d.departement,
    Email: d.email,
    'Salaire brut': d.salaireBrut,
    'Déductions payées': d.totalDeductionsPayees,
    'Déductions en attente': d.totalDeductionsEnAttente,
    'Net à payer': d.netAPayer,
    Statut: d.statut,
  }));

  worksheetData.push({
    Employé: 'TOTAL',
    Poste: '',
    Département: '',
    Email: '',
    'Salaire brut': data.details.reduce((sum, d) => sum + d.salaireBrut, 0),
    'Déductions payées': data.details.reduce((sum, d) => sum + d.totalDeductionsPayees, 0),
    'Déductions en attente': data.details.reduce((sum, d) => sum + d.totalDeductionsEnAttente, 0),
    'Net à payer': data.montantTotal,
    Statut: '',
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  worksheet['!cols'] = autoFitColumns(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Masse Salariale');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}
