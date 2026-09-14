'use client';

import { Button } from '@heroui-v3/react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  exporterClassementExcel,
  type LigneClassementExport,
} from '@/features/performance/utils/flotte-excel.utils';

/**
 * Les deux exports du classement, troisième niveau de l'exigence 6.
 *
 * <p>Sans accent : ils ne changent rien, ils recopient l'écran. Le rang y figure tel quel,
 * ex æquo compris, sinon on croirait à une erreur de tri en relisant le document.</p>
 */
export function BoutonExportClassement({
  lignes,
  periode,
  tri,
}: {
  lignes: LigneClassementExport[];
  periode: string;
  tri: string;
}) {
  const [enCours, setEnCours] = useState(false);
  const vide = lignes.length === 0;

  async function exporterPdf() {
    setEnCours(true);
    try {
      const { exporterClassementFlottePdf } = await import(
        '@/features/performance/utils/flotte-pdf.utils'
      );
      await exporterClassementFlottePdf({ lignes, periode, tri });
    } catch (erreur) {
      console.error('Export PDF du classement :', erreur);
      toast.error("L'export PDF n'a pas abouti", {
        description:
          erreur instanceof Error ? erreur.message : "Le fichier n'a pas pu être produit.",
      });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        isDisabled={vide}
        onPress={() => exporterClassementExcel({ lignes, periode, tri })}
        variant="outline"
      >
        <FileSpreadsheet aria-hidden="true" className="size-4" />
        Excel
      </Button>

      <Button isDisabled={vide || enCours} onPress={exporterPdf} variant="outline">
        {enCours ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <FileText aria-hidden="true" className="size-4" />
        )}
        PDF
      </Button>
    </div>
  );
}
