import { Ticket } from '@/types/bon-livraison.model';
import { formatDateFR, formatHoursMinutes, formatNumberFR } from '@/src/actions/bonLivraison.mapper';
import * as XLSX from 'xlsx';
import { newTicket } from '@/features/tickets/types/tickets.type';
import { autoFitColumns } from '@/features/tickets/utils/export.utils';

export function generatePdfTemplate(tickets: Ticket[]): string {
  const totalLivraison = tickets.reduce((sum, t) => sum + parseFloat(t.montantLivraison.replace(/[^0-9]/g, '')), 0);
  const totalCommission = tickets.reduce((sum, t) => sum + parseFloat(t.commission?.replace(/[^0-9]/g, '') ?? '0'), 0);
  const totalRevenu = totalLivraison + totalCommission;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Export Tickets PDF</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }

    h1 {
      color: #ef4444;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    th {
      background-color: #fed7aa;
      padding: 10px;
      text-align: left;
      border: 1px solid #ddd;
    }

    td {
      padding: 8px;
      border: 1px solid #ddd;
    }

    tr:nth-child(even) {
      background-color: #f9fafb;
    }

    .stats {
      margin: 20px 0;
      padding: 15px;
      background: #fef3c7;
      border-radius: 8px;
    }
  </style>
</head>
<body>
<h1>📋 Rapport des Tickets de Livraison</h1>
<div class="stats">
  <p><strong>Date d'export:</strong> ${new Date().toLocaleString('fr-FR')}</p>
  <p><strong>Nombre total de tickets:</strong> ${tickets.length}</p>
  <p>
    <strong>Montant total des livraisons :</strong> ${formatNumberFR(totalLivraison)} CFA
  </p>
  <p>
    <strong>Montant total des commissions :</strong> ${formatNumberFR(totalCommission)} CFA
  </p>
  <p><strong>Revenu total:</strong> ${formatNumberFR(totalRevenu)} CFA</p>
</div>
<table>
  <thead>
  <tr>
    <th>Code Check</th>
    <th>Livreur</th>
    <th>Partner</th>
    <th>Montant de Livraison</th>
    <th>Montant de Commande</th>
    <th>Commission</th>
    <th>Date</th>
    <th>Heure</th>
  </tr>
  </thead>
  <tbody>
  ${tickets
            .map(
              (t) => `
            <tr>
              <td>${t.code}</td>
              <td>${t.livreur}</td>
              <td>${t.restaurant}</td>
              <td>${formatNumberFR(t.montantLivraison ?? 0)}</td>
              <td>${formatNumberFR(t.montantCommande ?? 0)}</td>
              <td>${formatNumberFR(t.commission ?? 0)}</td>
              <td>${formatDateFR(t.date)}</td>
              <td>${formatHoursMinutes(t.heure)}</td>
            </tr>
          `,
            )
            .join('')}
  </tbody>
</table>
</body>
</html>
  `;
}

export function generateXlsTickets(tickets: Ticket[]) {
  const worksheetData = tickets.map((t) => ({
    'Code Check': t.code,
    Livreur: t.livreur,
    Partner: t.restaurant,
    'Montant de Livraison': t.montantLivraison,
    'Montant de Commande': t.montantCommande,
    Commission: t.commission,
    Date: formatDateFR(t.date),
    Heure: formatHoursMinutes(t.heure),
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  worksheet['!cols'] = autoFitColumns(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets de Livraison');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

export function generateXlsTemplate(tickets: newTicket[]) {
  const worksheetData = tickets.map((t) => ({
    'Code Check': t.reference,
    Partner: t.restaurant,
    'Montant de Livraison': t.coutLivraison,
    'Montant de Commande': t.coutCommande,
    Commission: Number(t.coutLivraison ?? 0) * 0.6,
    Date: formatDateFR(t.date),
    Heure: formatHoursMinutes(t.heure),
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  worksheet['!cols'] = autoFitColumns(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets de Livraison');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}
