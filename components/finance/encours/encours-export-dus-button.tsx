'use client';

import { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { ChevronDown, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import type { IEncoursReleve } from '@/features/encours';
import { buildEncoursDusPdf } from './encours-export-dus-pdf';

interface PartenaireResumeDu {
  partenaire: string;
  cycle: string;
  totalDu: number;
  nbFactures: number;
  periodes: string[];
}

/**
 * Resume client-side : factures encore dues sur les periodes passees ou en
 * cours (exclut "A venir" et placeholder "—"), groupees par partenaire,
 * triees du plus gros du au plus petit.
 *
 * Reutilise par les 2 formats d'export (CSV resume rapide + PDF executive
 * report) pour garantir une coherence du filtre.
 */
function buildResumeDus(releve: IEncoursReleve): PartenaireResumeDu[] {
  return releve.partenaires
    .map<PartenaireResumeDu | null>((p) => {
      const facturesDues = p.stores
        .flatMap((s) => s.factures)
        .filter(
          (f) => (f.solde ?? 0) > 0 && f.statut !== 'À venir' && f.libelle !== '—',
        );
      if (facturesDues.length === 0) return null;
      return {
        partenaire: p.groupe,
        cycle: p.cycle,
        totalDu: facturesDues.reduce((sum, f) => sum + (f.solde ?? 0), 0),
        nbFactures: facturesDues.length,
        periodes: facturesDues.map((f) =>
          `${f.periode}${f.libelle ? ' — ' + f.libelle : ''}`.trim(),
        ),
      };
    })
    .filter((x): x is PartenaireResumeDu => x !== null)
    .sort((a, b) => b.totalDu - a.totalDu);
}

// ── CSV (Excel-friendly, UTF-8 BOM + ';' separator) ──────────────────────
function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n;]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function buildCsv(rows: PartenaireResumeDu[], totalDu: number, dateRef: string): string {
  const SEP = ';';
  const header = ['Partenaire', 'Cycle', 'Total dû (FCFA)', 'Nb factures', 'Périodes dues'];
  const lines = [header.map(csvEscape).join(SEP)];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.partenaire),
        csvEscape(r.cycle),
        csvEscape(r.totalDu),
        csvEscape(r.nbFactures),
        csvEscape(r.periodes.join(' | ')),
      ].join(SEP),
    );
  }
  lines.push('');
  lines.push(
    [
      csvEscape('TOTAL'),
      '',
      csvEscape(totalDu),
      csvEscape(rows.reduce((s, r) => s + r.nbFactures, 0)),
      '',
    ].join(SEP),
  );
  lines.push('');
  lines.push(
    csvEscape(
      `Export généré le ${dateRef} — partenaires avec restes à payer (périodes passées ou en cours)`,
    ),
  );
  return '﻿' + lines.join('\r\n');
}

function downloadBlob(filename: string, blob: Blob) {
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
  // Necessaire pour les filtres affiches dans le PDF (annee/mois/cycle/partenaire)
  params: { annee: number; mois?: number | null; cycle?: string | null; partenaire?: string | null };
  isDisabled?: boolean;
}

/**
 * Bouton d'export "rapide" des partenaires qui doivent encore, jusqu'a la
 * date du jour. Dropdown 2 formats :
 *   - CSV (Excel) : resume tabulaire simple, ouvre directement Excel FR.
 *   - PDF : rapport executive avec bandeau de marque, KPIs et table dense.
 * Tout est genere cote client a partir du releve deja charge — aucun nouvel
 * appel API.
 */
export function EncoursExportDusButton({
  releve,
  params,
  isDisabled,
}: EncoursExportDusButtonProps) {
  const [loading, setLoading] = useState<'csv' | 'pdf' | null>(null);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!releve) return;
    setLoading(format);
    const tid = toast.loading('Génération du fichier…');
    try {
      const rows = buildResumeDus(releve);
      if (rows.length === 0) {
        toast.info('Aucun partenaire avec des restes à payer', {
          id: tid,
          description: 'Toutes les périodes passées sont soldées sur le filtre actuel.',
        });
        return;
      }
      const totalDu = rows.reduce((s, r) => s + r.totalDu, 0);
      const today = new Date().toISOString().slice(0, 10);

      if (format === 'csv') {
        const csv = buildCsv(rows, totalDu, today);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(`partenaires_dus_${today}.csv`, blob);
      } else {
        const blob = buildEncoursDusPdf(releve, params);
        downloadBlob(`releve_dus_${today}.pdf`, blob);
      }

      toast.success(
        `${rows.length} partenaire${rows.length > 1 ? 's' : ''} doivent ${fmtFcfa(totalDu)}`,
        {
          id: tid,
          description: format === 'pdf' ? 'PDF téléchargé — relevé prêt à partager.' : 'CSV téléchargé — ouvrable dans Excel.',
        },
      );
    } catch (error) {
      toast.error("Échec de l'export", {
        id: tid,
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="bordered"
          color="warning"
          isLoading={loading !== null}
          isDisabled={isDisabled || !releve}
          startContent={!loading && <FileDown className="h-4 w-4" />}
          endContent={<ChevronDown className="h-4 w-4" />}
        >
          Dus (jusqu&apos;à aujourd&apos;hui)
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Format d'export des dus"
        onAction={(key) => handleExport(key as 'csv' | 'pdf')}
      >
        <DropdownItem key="pdf" description="Rapport exécutif, prêt à partager">
          PDF (relevé Turbo)
        </DropdownItem>
        <DropdownItem key="csv" description="Résumé tableur (Excel-ready)">
          CSV (Excel)
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
