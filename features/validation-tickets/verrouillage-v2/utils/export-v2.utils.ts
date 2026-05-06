import { TicketControleV2 } from '../types/tickets-v2.type';
import { formatCFA, formatDateFR, formatHoursMinutes, formatNumberFR } from '@/src/actions/bonLivraison.mapper';

export function generatePdfTemplateV2(tickets: TicketControleV2[]): string {
  const totalCommande = tickets.reduce((sum, t) => sum + (t.coutCommande ?? 0), 0);
  const totalLivraison = tickets.reduce((sum, t) => sum + (t.coutLivraison ?? 0), 0);
  const totalCommission = tickets.reduce((sum, t) => sum + (t.commission ?? 0), 0);

  const rows = tickets
    .map((t) => {
      const agentV1 = t.v1Agent ? `${t.v1Agent.prenoms} ${t.v1Agent.nom}` : '—';
      const dateV1 = t.v1ValideAt ? formatDateFR(t.v1ValideAt.split('T')[0]) : '—';
      const heureV1 = t.v1ValideAt ? formatHoursMinutes(t.v1ValideAt.split('T')[1]?.substring(0, 5) ?? '') : '—';

      return `
        <tr>
          <td>${t.reference ?? '—'}</td>
          <td>${t.livreur ?? '—'}</td>
          <td>${t.restaurant ?? '—'}</td>
          <td>${formatNumberFR(t.coutCommande ?? 0)}</td>
          <td>${formatNumberFR(t.coutLivraison ?? 0)}</td>
          <td>${formatNumberFR(t.commission ?? 0)}</td>
          <td>${agentV1}</td>
          <td>${dateV1} ${heureV1}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Rapport V2 — Tickets V1 Validés</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
    h1 { color: #dc2626; margin-bottom: 4px; }
    .stats {
      margin: 16px 0;
      padding: 12px 16px;
      background: #fef3c7;
      border-radius: 8px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .stat-item { display: flex; flex-direction: column; }
    .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 15px; font-weight: 600; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th {
      background-color: #fee2e2;
      padding: 8px 10px;
      text-align: left;
      border: 1px solid #fca5a5;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td { padding: 7px 10px; border: 1px solid #e5e7eb; }
    tr:nth-child(even) { background-color: #f9fafb; }
    @media print {
      body { padding: 10px; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <h1>Rapport V2 — Tickets V1 Validés</h1>
  <p style="color:#6b7280;margin:0 0 12px">Date d'export : ${new Date().toLocaleString('fr-FR')}</p>

  <div class="stats">
    <div class="stat-item">
      <span class="stat-label">Tickets</span>
      <span class="stat-value">${tickets.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Total commandes</span>
      <span class="stat-value">${formatCFA(totalCommande)}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Total livraisons</span>
      <span class="stat-value">${formatCFA(totalLivraison)}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Total commissions</span>
      <span class="stat-value">${formatCFA(totalCommission)}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Livreur</th>
        <th>Restaurant</th>
        <th>Montant commande</th>
        <th>Montant livraison</th>
        <th>Commission</th>
        <th>Agent V1</th>
        <th>Validation V1</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}
