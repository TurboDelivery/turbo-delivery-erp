import * as XLSX from 'xlsx';
import { IGrillePaiementCreneau, IGrillePaiementLigne } from '../types/grille-paiement.type';

function autoFitColumns(data: Record<string, unknown>[]): { wch: number }[] {
  const keys = Object.keys(data[0] ?? {});
  return keys.map((key) => {
    const maxLen = Math.max(key.length, ...data.map((row) => String(row[key] ?? '').length));
    return { wch: Math.min(maxLen + 2, 40) };
  });
}

export function generateXlsGrillePaiement(
  grille: IGrillePaiementCreneau,
  lignes: IGrillePaiementLigne[],
): ArrayBuffer {
  const worksheetData = lignes.map((l) => ({
    'Nom Turboy': l.turboy.nom,
    'Code Turboy': l.turboy.code,
    'Nb Tickets': l.tickets,
    'Montant Brut': l.brut,
    'Taux (%)': l.taux,
    Bonus: l.bonus ? 'Oui' : 'Non',
    'Déductions': l.deductions,
    'Net à payer': l.netAPayer,
    'N° Wave': l.numeroWave ?? '',
    Statut: l.statut === 'OK' ? 'OK' : 'Wave manquant',
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  worksheet['!cols'] = autoFitColumns(worksheetData as Record<string, unknown>[]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Grille de paiement');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}
