import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { autoFitColumns } from '@/features/tickets/utils/export.utils';
import { formatCfa, formatDateFr } from '@/lib/date-utils';
import { IEmployeeExport } from '@/features/personnel/apis/employee.api';

const RED = [220, 38, 38] as const;
const YELLOW = [250, 204, 21] as const;
const DARK = [30, 30, 30] as const;
const GRAY = [100, 100, 100] as const;
const LIGHT = [241, 245, 249] as const;
const BORDER = [210, 218, 230] as const;

type WorksheetRow = {
  Nom: string;
  Email: string;
  Telephone: string;
  Poste: string;
  Departement: string;
  Statut: string;
  "Date d'entree": string;
  Salaire: number;
  Deductions: string;
  'Total deductions': number;
  'Net a payer': number;
};

const buildWorksheetRows = (data: IEmployeeExport[]): WorksheetRow[] => {
  return data.map((e) => ({
    Nom: e.name ?? '',
    Email: e.email ?? '',
    Telephone: e.phone ?? '',
    Poste: e.position ?? '',
    Departement: e.department ?? '',
    Statut: e.statut ?? '',
    "Date d'entree": e.entryDate ? formatDateFr(e.entryDate) : '',
    Salaire: e.salary ?? 0,
    Deductions: e.deductionsResume ?? '',
    'Total deductions': e.totalDeductions ?? 0,
    'Net a payer': e.netToPay ?? 0,
  }));
};

const buildTotalsRow = (data: IEmployeeExport[]): WorksheetRow => ({
  Nom: 'TOTAL',
  Email: '',
  Telephone: '',
  Poste: '',
  Departement: '',
  Statut: '',
  "Date d'entree": '',
  Salaire: data.reduce((sum, e) => sum + (e.salary ?? 0), 0),
  Deductions: '',
  'Total deductions': data.reduce((sum, e) => sum + (e.totalDeductions ?? 0), 0),
  'Net a payer': data.reduce((sum, e) => sum + (e.netToPay ?? 0), 0),
});

export function exportEmployesToExcel(data: IEmployeeExport[], baseFilename: string) {
  const rows = [...buildWorksheetRows(data), buildTotalsRow(data)];
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = autoFitColumns(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employes');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${baseFilename}.xlsx`);
}

export function exportEmployesToCsv(data: IEmployeeExport[], baseFilename: string) {
  const rows = [...buildWorksheetRows(data), buildTotalsRow(data)];
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
  saveAs(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `${baseFilename}.csv`);
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const resp = await fetch('/assets/images/Logo officiel/Logo Turbo.png');
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

interface PdfCol {
  header: string;
  w: number;
  maxChars: number;
  align?: 'left' | 'right';
  value: (e: IEmployeeExport) => string;
}

const PDF_COLS: PdfCol[] = [
  { header: 'Nom', w: 38, maxChars: 22, value: (e) => e.name ?? '-' },
  { header: 'Telephone', w: 28, maxChars: 16, value: (e) => e.phone ?? '-' },
  { header: 'Poste', w: 30, maxChars: 18, value: (e) => e.position ?? '-' },
  { header: 'Departement', w: 30, maxChars: 18, value: (e) => e.department ?? '-' },
  { header: 'Statut', w: 20, maxChars: 12, value: (e) => e.statut ?? '-' },
  { header: "Entree", w: 22, maxChars: 12, value: (e) => (e.entryDate ? formatDateFr(e.entryDate) : '-') },
  { header: 'Salaire', w: 28, maxChars: 16, align: 'right', value: (e) => formatCfa(e.salary ?? 0) },
  { header: 'Deductions', w: 28, maxChars: 16, align: 'right', value: (e) => formatCfa(e.totalDeductions ?? 0) },
  { header: 'Net a payer', w: 30, maxChars: 18, align: 'right', value: (e) => formatCfa(e.netToPay ?? 0) },
];

const TABLE_W = PDF_COLS.reduce((s, c) => s + c.w, 0);
const START_X = 14;
const ROW_H = 7;
const HEADER_H = 9;
const PAGE_MARGIN_BOTTOM = 18;
const HEADER_BAND_H = 30;

function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? text.slice(0, maxChars - 1) + '...' : text;
}

export async function exportEmployesToPdf(data: IEmployeeExport[], baseFilename: string) {
  const logoBase64 = await loadLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  function drawPageHeader() {
    doc.setFillColor(...RED);
    doc.rect(0, 0, pageW, HEADER_BAND_H, 'F');
    doc.setFillColor(...YELLOW);
    doc.rect(0, HEADER_BAND_H - 3, pageW, 3, 'F');

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', START_X, 2, 26, 26);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Turbo Delivery — Liste des employes', logoBase64 ? 44 : START_X, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 230, 150);
    doc.text(
      `${data.length} employe(s)   •   Exporte le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      logoBase64 ? 44 : START_X,
      22,
    );

    doc.setTextColor(...DARK);
  }

  function drawTableHeader(y: number) {
    doc.setFillColor(...RED);
    doc.roundedRect(START_X, y, TABLE_W, HEADER_H, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    let x = START_X;
    for (const col of PDF_COLS) {
      const tx = col.align === 'right' ? x + col.w - 2.5 : x + 2.5;
      doc.text(col.header, tx, y + 6, { align: col.align === 'right' ? 'right' : 'left' });
      x += col.w;
    }
    doc.setTextColor(...DARK);
    return y + HEADER_H;
  }

  drawPageHeader();
  let y = drawTableHeader(HEADER_BAND_H + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (let i = 0; i < data.length; i++) {
    if (y + ROW_H > pageH - PAGE_MARGIN_BOTTOM) {
      doc.addPage();
      drawPageHeader();
      y = drawTableHeader(HEADER_BAND_H + 4);
    }

    if (i % 2 === 0) {
      doc.setFillColor(...LIGHT);
      doc.rect(START_X, y, TABLE_W, ROW_H, 'F');
    }

    doc.setDrawColor(...BORDER);
    doc.line(START_X, y + ROW_H, START_X + TABLE_W, y + ROW_H);

    const e = data[i];
    let x = START_X;

    for (const col of PDF_COLS) {
      const raw = col.value(e);

      if (col.header === 'Statut') {
        const statut = (raw || '').toLowerCase();
        if (statut.includes('actif') && !statut.includes('inactif')) doc.setTextColor(22, 163, 74);
        else if (statut.includes('inactif')) doc.setTextColor(220, 38, 38);
        else doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(...DARK);
      }

      const tx = col.align === 'right' ? x + col.w - 2.5 : x + 2.5;
      doc.text(truncate(raw, col.maxChars), tx, y + 5, { align: col.align === 'right' ? 'right' : 'left' });
      x += col.w;
    }

    y += ROW_H;
  }

  if (data.length > 0) {
    if (y + ROW_H > pageH - PAGE_MARGIN_BOTTOM) {
      doc.addPage();
      drawPageHeader();
      y = drawTableHeader(HEADER_BAND_H + 4);
    }

    const totals = {
      salary: data.reduce((s, e) => s + (e.salary ?? 0), 0),
      deductions: data.reduce((s, e) => s + (e.totalDeductions ?? 0), 0),
      net: data.reduce((s, e) => s + (e.netToPay ?? 0), 0),
    };

    doc.setFillColor(...YELLOW);
    doc.rect(START_X, y, TABLE_W, ROW_H, 'F');
    doc.setDrawColor(...BORDER);
    doc.line(START_X, y + ROW_H, START_X + TABLE_W, y + ROW_H);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);

    let x = START_X;
    for (const col of PDF_COLS) {
      let raw = '';
      if (col.header === 'Nom') raw = 'TOTAL';
      else if (col.header === 'Salaire') raw = formatCfa(totals.salary);
      else if (col.header === 'Deductions') raw = formatCfa(totals.deductions);
      else if (col.header === 'Net a payer') raw = formatCfa(totals.net);

      if (raw) {
        const tx = col.align === 'right' ? x + col.w - 2.5 : x + 2.5;
        doc.text(truncate(raw, col.maxChars), tx, y + 5, { align: col.align === 'right' ? 'right' : 'left' });
      }
      x += col.w;
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(`Page ${p} / ${totalPages}`, pageW - 28, pageH - 6);
    doc.setFillColor(...RED);
    doc.rect(0, pageH - 5, pageW, 5, 'F');
  }

  doc.save(`${baseFilename}.pdf`);
}
