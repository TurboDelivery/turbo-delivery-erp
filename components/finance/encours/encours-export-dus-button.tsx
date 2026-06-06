'use client';

import { Button } from '@heroui/react';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import type { IEncoursReleve } from '@/features/encours';

interface PartenaireResumeDu {
  partenaire: string;
  cycle: string;
  totalDu: number;
  nbFactures: number;
  periodes: string[];
}

/**
 * Construit un resume par partenaire des factures encore dues *jusqu'a
 * aujourd'hui* (statut != "A venir" et solde > 0). Une ligne par partenaire,
 * avec le total du et la liste compacte des periodes concernees.
 *
 * Le filtre exploite les donnees deja chargees dans `releve` (cote client),
 * donc respecte les filtres actuels (annee/mois/cycle/partenaire). Pour avoir
 * la vue globale, l'utilisateur met le filtre Mois sur "Tous (cumul annuel)".
 */
function buildResumeDus(releve: IEncoursReleve): PartenaireResumeDu[] {
  return releve.partenaires
    .map<PartenaireResumeDu | null>((p) => {
      const facturesDues = p.stores
        .flatMap((s) => s.factures)
        // "A venir" = la periode n'est pas encore arrivee, on l'exclut.
        // libelle "—" = placeholder vide (cf. IEncoursFacture), aucun montant non plus.
        .filter((f) => (f.solde ?? 0) > 0 && f.statut !== 'À venir' && f.libelle !== '—');

      if (facturesDues.length === 0) return null;

      const totalDu = facturesDues.reduce((sum, f) => sum + (f.solde ?? 0), 0);
      const periodes = facturesDues.map((f) =>
        // ex. "Avril 2026 — Quinzaine 2"
        `${f.periode}${f.libelle ? ' — ' + f.libelle : ''}`.trim()
      );

      return {
        partenaire: p.groupe,
        cycle: p.cycle,
        totalDu,
        nbFactures: facturesDues.length,
        periodes,
      };
    })
    .filter((x): x is PartenaireResumeDu => x !== null)
    .sort((a, b) => b.totalDu - a.totalDu); // les plus gros dus en haut
}

/** Echappe une chaine pour CSV (RFC 4180 : double les guillemets internes). */
function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n;]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function toCsv(rows: PartenaireResumeDu[], totalDuGlobal: number, dateRef: string): string {
  // Separateur ';' pour qu'Excel FR ouvre directement les colonnes (','
  // est utilise comme decimal en FR -> ',' separateur casse la lecture).
  const SEP = ';';
  const header = ['Partenaire', 'Cycle', 'Total dû (FCFA)', 'Nb factures', 'Périodes dues'];
  const lines = [header.map(csvEscape).join(SEP)];
  for (const r of rows) {
    lines.push([
      csvEscape(r.partenaire),
      csvEscape(r.cycle),
      csvEscape(r.totalDu),
      csvEscape(r.nbFactures),
      csvEscape(r.periodes.join(' | ')),
    ].join(SEP));
  }
  // Ligne de total + en-tete d'information
  lines.push('');
  lines.push([csvEscape('TOTAL'), '', csvEscape(totalDuGlobal), csvEscape(rows.reduce((s, r) => s + r.nbFactures, 0)), ''].join(SEP));
  lines.push('');
  lines.push(csvEscape(`Export genere le ${dateRef} — partenaires avec restes a payer (periodes passees ou en cours)`));
  // BOM UTF-8 pour qu'Excel reconnaisse les accents.
  return '﻿' + lines.join('\r\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const fmtFcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

interface EncoursExportDusButtonProps {
  releve?: IEncoursReleve;
  isDisabled?: boolean;
}

/**
 * Bouton d'export "rapide" des partenaires qui doivent encore, jusqu'a la
 * date du jour. Filtre cote client a partir du releve deja charge :
 *   solde > 0 ET statut != "A venir" ET libelle != "—".
 *
 * Format CSV (UTF-8 BOM + separateur ';') ouvrable directement dans Excel FR.
 * Une ligne par partenaire ; les plus gros dus en premier.
 */
export function EncoursExportDusButton({ releve, isDisabled }: EncoursExportDusButtonProps) {
  const handleClick = () => {
    if (!releve) return;

    const rows = buildResumeDus(releve);
    if (rows.length === 0) {
      toast.info('Aucun partenaire avec des restes à payer', {
        description: 'Toutes les périodes passées sont soldées sur le filtre actuel.',
      });
      return;
    }

    const totalDu = rows.reduce((sum, r) => sum + r.totalDu, 0);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const csv = toCsv(rows, totalDu, today);

    downloadCsv(`partenaires_dus_${today}.csv`, csv);
    toast.success(`${rows.length} partenaire${rows.length > 1 ? 's' : ''} doivent ${fmtFcfa(totalDu)}`, {
      description: 'Fichier CSV téléchargé — ouvrable dans Excel.',
    });
  };

  return (
    <Button
      size="sm"
      variant="bordered"
      color="warning"
      isDisabled={isDisabled || !releve}
      startContent={<FileDown className="h-4 w-4" />}
      onPress={handleClick}
    >
      Dus (jusqu&apos;à aujourd&apos;hui)
    </Button>
  );
}
