import jsPDF from 'jspdf';
import type { ITurboy, TurboyType } from '@/features/turboys/types/turboys.types';

function statusLabel(status: number): string {
  if (status === 1) return 'Actif';
  if (status === 0) return 'Inactif';
  return 'Suspendu';
}

function typeLabel(type: TurboyType): string {
  return type === 'JOURNALIER' ? 'Journalier' : 'Indépendant';
}

function filterLabel(typeLivreur?: string): string {
  if (typeLivreur === 'JOURNALIER') return 'Journaliers';
  if (typeLivreur === 'INDEPENDANT') return 'Indépendants';
  return 'tous';
}

function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
}

interface Col {
  header: string;
  w: number;
  maxChars: number;
  value: (t: ITurboy) => string;
}

const COLS: Col[] = [
  { header: 'Matricule',  w: 26, maxChars: 12, value: (t) => t.matricule ?? '—' },
  { header: 'Nom',        w: 30, maxChars: 16, value: (t) => t.nom },
  { header: 'Prénoms',    w: 38, maxChars: 20, value: (t) => t.prenoms },
  { header: 'Téléphone',  w: 30, maxChars: 16, value: (t) => t.telephone ?? '—' },
  { header: 'Email',      w: 58, maxChars: 32, value: (t) => t.email ?? '—' },
  { header: 'Type',       w: 26, maxChars: 14, value: (t) => typeLabel(t.typeLivreur) },
  { header: 'Statut',     w: 20, maxChars: 10, value: (t) => statusLabel(t.status) },
  { header: 'Habitation', w: 45, maxChars: 24, value: (t) => t.habitation ?? '—' },
];

const TABLE_W = COLS.reduce((s, c) => s + c.w, 0);
const START_X = 14;
const ROW_H = 7;
const HEADER_H = 9;
const PAGE_MARGIN_BOTTOM = 15;

export function exportTurboysPdf(turboys: ITurboy[], typeLivreur?: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  function drawHeader() {
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(30, 64, 175); // primary blue
    doc.text('Turbo Delivery — Liste des Coursiers', START_X, 16);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100);
    doc.text(
      `Type : ${filterLabel(typeLivreur)}   •   ${turboys.length} coursier(s)   •   Exporté le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      START_X,
      23,
    );
    doc.setTextColor(0);
  }

  function drawTableHeader(y: number) {
    doc.setFillColor(30, 64, 175);
    doc.roundedRect(START_X, y, TABLE_W, HEADER_H, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255);
    let x = START_X;
    for (const col of COLS) {
      doc.text(col.header, x + 2.5, y + 6);
      x += col.w;
    }
    doc.setTextColor(0);
    return y + HEADER_H;
  }

  // ---- First page ----
  drawHeader();
  let y = drawTableHeader(29);

  // ---- Data rows ----
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (let i = 0; i < turboys.length; i++) {
    if (y + ROW_H > pageH - PAGE_MARGIN_BOTTOM) {
      doc.addPage();
      y = drawTableHeader(10);
    }

    // Alternating background
    if (i % 2 === 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(START_X, y, TABLE_W, ROW_H, 'F');
    }

    // Row bottom border
    doc.setDrawColor(210, 218, 230);
    doc.line(START_X, y + ROW_H, START_X + TABLE_W, y + ROW_H);

    // Cell text
    doc.setTextColor(40);
    let x = START_X;
    for (const col of COLS) {
      const raw = col.value(turboys[i]);
      doc.text(truncate(raw, col.maxChars), x + 2.5, y + 5);
      x += col.w;
    }

    y += ROW_H;
  }

  // ---- Page numbers ----
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text(`Page ${p} / ${totalPages}`, pageW - 28, pageH - 6);
  }

  doc.save(`coursiers-${new Date().toISOString().slice(0, 10)}.pdf`);
}
