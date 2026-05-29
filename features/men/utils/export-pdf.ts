import jsPDF from 'jspdf';
import type { ITurboy, TurboyType } from '@/features/turboys/types/turboys.types';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';

// ── Brand colors ─────────────────────────────────────────────────────────────
const RED   = [220, 38,  38]  as const;  // primary
const YELLOW= [250, 204, 21]  as const;  // accent
const DARK  = [30,  30,  30]  as const;
const GRAY  = [100, 100, 100] as const;
const LIGHT = [241, 245, 249] as const;
const BORDER= [210, 218, 230] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusLabel(status: number | null): string {
  if (status === 1) return 'Actif';
  if (status === 0) return 'Inactif';
  if (status == null) return '—';
  return 'Suspendu';
}
// V54 (2026-05-29) — Helpers locaux délégant au mapping central. Avant :
// ternaire à 2 branches qui transformait n'importe quel SUPERVISEUR_LIVREUR
// en "Indépendant" sur l'export PDF.
function typeLabel(type: TurboyType): string {
  return getTurboyTypeDisplay(type).label;
}
function filterLabel(typeLivreur?: string): string {
  if (!typeLivreur) return 'Tous';
  return getTurboyTypeDisplay(typeLivreur).labelPlural;
}
function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
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

// ── Columns ───────────────────────────────────────────────────────────────────
interface Col { header: string; w: number; maxChars: number; value: (t: ITurboy) => string; }

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

const TABLE_W         = COLS.reduce((s, c) => s + c.w, 0);
const START_X         = 14;
const ROW_H           = 7;
const HEADER_H        = 9;
const PAGE_MARGIN_BOTTOM = 15;
const HEADER_BAND_H   = 30;

export async function exportTurboysPdf(turboys: ITurboy[], typeLivreur?: string) {
  const logoBase64 = await loadLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  function drawPageHeader() {
    // Red header band
    doc.setFillColor(...RED);
    doc.rect(0, 0, pageW, HEADER_BAND_H, 'F');

    // Yellow accent stripe at bottom of band
    doc.setFillColor(...YELLOW);
    doc.rect(0, HEADER_BAND_H - 3, pageW, 3, 'F');

    // Logo (top-left inside band)
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', START_X, 2, 26, 26);
    }

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Turbo Delivery — Liste des Coursiers', logoBase64 ? 44 : START_X, 13);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 230, 150);
    doc.text(
      `Type : ${filterLabel(typeLivreur)}   •   ${turboys.length} coursier(s)   •   Exporté le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
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
    for (const col of COLS) {
      doc.text(col.header, x + 2.5, y + 6);
      x += col.w;
    }
    doc.setTextColor(...DARK);
    return y + HEADER_H;
  }

  // ── First page ──────────────────────────────────────────────────────────────
  drawPageHeader();
  let y = drawTableHeader(HEADER_BAND_H + 4);

  // ── Data rows ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (let i = 0; i < turboys.length; i++) {
    if (y + ROW_H > pageH - PAGE_MARGIN_BOTTOM) {
      doc.addPage();
      drawPageHeader();
      y = drawTableHeader(HEADER_BAND_H + 4);
    }

    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(...LIGHT);
      doc.rect(START_X, y, TABLE_W, ROW_H, 'F');
    }

    // Row border
    doc.setDrawColor(...BORDER);
    doc.line(START_X, y + ROW_H, START_X + TABLE_W, y + ROW_H);

    // Status badge color
    const t = turboys[i];

    doc.setTextColor(...DARK);
    let x = START_X;
    for (const col of COLS) {
      const raw = col.value(t);

      // Highlight status
      if (col.header === 'Statut') {
        if (raw === 'Actif') doc.setTextColor(22, 163, 74);
        else if (raw === 'Inactif') doc.setTextColor(220, 38, 38);
        else doc.setTextColor(217, 119, 6);
      } else if (col.header === 'Type') {
        doc.setTextColor(t.typeLivreur === 'INDEPENDANT' ? 22 : 99, t.typeLivreur === 'INDEPENDANT' ? 163 : 102, t.typeLivreur === 'INDEPENDANT' ? 74 : 241);
      } else {
        doc.setTextColor(...DARK);
      }

      doc.text(truncate(raw, col.maxChars), x + 2.5, y + 5);
      x += col.w;
    }

    y += ROW_H;
  }

  // ── Page numbers ────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(`Page ${p} / ${totalPages}`, pageW - 28, pageH - 6);
    // Bottom bar
    doc.setFillColor(...RED);
    doc.rect(0, pageH - 5, pageW, 5, 'F');
  }

  doc.save(`coursiers-${filterLabel(typeLivreur).toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
