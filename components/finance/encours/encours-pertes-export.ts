/**
 * Export du registre des pertes et vols : PDF et CSV.
 *
 * <p>Généré côté CLIENT, comme l'export des dus, et pour la même raison : la donnée est
 * déjà à l'écran, un aller-retour serveur n'ajouterait qu'une latence et un endpoint de
 * plus à maintenir.</p>
 *
 * <p>⚠ Le CSV n'est pas un `.xlsx`. Excel l'ouvre sans rien installer, avec le
 * point-virgule comme séparateur (convention française) et un BOM UTF-8 sans lequel les
 * accents sortent en mojibake. Le cahier des charges dit « Excel/PDF » ; c'est un fichier
 * qu'Excel ouvre, pas un classeur natif, et mieux vaut le dire que le laisser croire.</p>
 */
import jsPDF from 'jspdf';

import type { ICategoriePerte, IPerteVol } from '@/features/encours';

const ENCRE: [number, number, number] = [17, 24, 39];
const GRIS: [number, number, number] = [107, 114, 128];
const ROUGE: [number, number, number] = [185, 28, 28];

/**
 * Formate un montant pour le PDF.
 *
 * <p>⚠ `toLocaleString('fr-FR')` insère des espaces fines insécables (U+202F) entre les
 * milliers. La police Helvetica intégrée à jsPDF (encodage WinAnsi) ne connaît pas ce
 * glyphe et l'imprime en « / » : « 20/000 FCFA » au lieu de « 20 000 FCFA ». On les
 * remplace par des espaces ordinaires, U+00A0 compris.</p>
 */
function fmtFcfa(n: number): string {
  const formatted = Math.round(n)
    .toLocaleString('fr-FR')
    .replace(/ /g, ' ')
    .replace(/ /g, ' ');
  return `${formatted} FCFA`;
}

function libelleCategorie(code: string, categories: ICategoriePerte[]): string {
  return categories.find((c) => c.code === code)?.libelle ?? code;
}

function dateCourte(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
}

/** Le registre en PDF, une ligne par perte, total en pied. */
export function construirePertesPdf(lignes: IPerteVol[], categories: ICategoriePerte[]): Blob {
  const doc = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'pt' });
  const margeX = 40;
  let y = 56;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...ENCRE);
  doc.text('Pertes et vols', margeX, y);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(
    `Montants sortis des encours a recouvrer — edite le ${new Date().toLocaleDateString('fr-FR')}`,
    margeX,
    y,
  );

  y += 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ENCRE);
  doc.text('Date', margeX, y);
  doc.text('Motif', margeX + 70, y);
  doc.text('Commentaire', margeX + 230, y);
  doc.text('Montant', 555, y, { align: 'right' });

  y += 6;
  doc.setDrawColor(...GRIS);
  doc.line(margeX, y, 555, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  let total = 0;

  lignes.forEach((l) => {
    if (y > 780) {
      doc.addPage();
      y = 56;
    }
    total += Number(l.montant) || 0;
    doc.setTextColor(...ENCRE);
    doc.text(dateCourte(l.createdAt), margeX, y);
    doc.text(
      doc.splitTextToSize(libelleCategorie(l.categorieCode, categories), 150)[0] ?? '',
      margeX + 70,
      y,
    );
    doc.text(doc.splitTextToSize(l.commentaire ?? '—', 250)[0] ?? '', margeX + 230, y);
    doc.setTextColor(...ROUGE);
    doc.text(fmtFcfa(Number(l.montant) || 0), 555, y, { align: 'right' });
    y += 16;
  });

  y += 6;
  doc.setDrawColor(...GRIS);
  doc.line(margeX, y, 555, y);
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ENCRE);
  doc.text(`Total — ${lignes.length} ligne${lignes.length > 1 ? 's' : ''}`, margeX, y);
  doc.setTextColor(...ROUGE);
  doc.text(fmtFcfa(total), 555, y, { align: 'right' });

  return doc.output('blob');
}

/**
 * Le registre en CSV, ouvrable par Excel.
 *
 * <p>⚠ Point-virgule et BOM UTF-8 : sans le premier Excel francais met tout dans une
 * colonne, sans le second les accents sortent en mojibake.</p>
 */
export function construirePertesCsv(lignes: IPerteVol[], categories: ICategoriePerte[]): Blob {
  const echapper = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const entetes = ['Date', 'Motif', 'Precision', 'Commentaire', 'Montant'];
  const corps = lignes.map((l) =>
    [
      dateCourte(l.createdAt),
      libelleCategorie(l.categorieCode, categories),
      l.precisionLibre ?? '',
      l.commentaire ?? '',
      String(Math.round(Number(l.montant) || 0)),
    ]
      .map(echapper)
      .join(';'),
  );
  const contenu = ['﻿' + entetes.map(echapper).join(';'), ...corps].join('\r\n');
  return new Blob([contenu], { type: 'text/csv;charset=utf-8;' });
}

/** Déclenche le téléchargement, sans laisser l'URL objet derrière soi. */
export function telecharger(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
}
