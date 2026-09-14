'use client';

import { Button } from '@heroui-v3/react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { exporterFicheLivreurExcel } from '@/features/performance/utils/flotte-excel.utils';
import type { LignePaieLivreur } from '@/src/performance/fiche-livreur.action';

/**
 * Les deux exports d'une fiche individuelle, exigence 6 : « export Excel/PDF de la fiche
 * individuelle sur la période filtrée, Y COMPRIS LE DÉTAIL JOURNALIER si consulté ».
 *
 * <p>Le détail y est TOUJOURS, consulté ou non. Le cahier des charges le conditionne à la
 * consultation ; ce serait un piège à l'usage : deux exports du même livreur sur la même
 * semaine rendraient deux fichiers différents selon qu'on a déplié un jour ou non, sans que
 * rien ne le dise. Le fichier porte tout, et son second onglet se referme si on n'en veut
 * pas.</p>
 */
export function BoutonExportFiche({
  ligne,
  periode,
}: {
  ligne: LignePaieLivreur;
  periode: string;
}) {
  const [enCours, setEnCours] = useState(false);

  async function exporterPdf() {
    setEnCours(true);
    try {
      const { exporterFicheLivreurPdf } = await import(
        '@/features/performance/utils/flotte-pdf.utils'
      );
      await exporterFicheLivreurPdf({ ligne, periode });
    } catch (erreur) {
      // Un export qui echoue en silence fait recliquer l'operateur sans resultat.
      console.error('Export PDF de la fiche livreur :', erreur);
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
      <Button onPress={() => exporterFicheLivreurExcel({ ligne, periode })} variant="outline">
        <FileSpreadsheet aria-hidden="true" className="size-4" />
        Excel
      </Button>

      <Button isDisabled={enCours} onPress={exporterPdf} variant="outline">
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
