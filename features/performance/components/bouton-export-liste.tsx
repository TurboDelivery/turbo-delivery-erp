'use client';

import { Button } from '@heroui-v3/react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  exporterListeFlotteExcel,
  type LigneFlotteExport,
} from '@/features/performance/utils/flotte-excel.utils';

/**
 * Les deux exports de la liste d'une catégorie, exigence 6.
 *
 * <p>Ils ne portent PAS l'accent : un export ne change rien, il recopie ce qui est déjà à
 * l'écran. C'est la règle appliquée au rapport de performance partenaires et au classement,
 * et les écrans se lisent les uns après les autres.</p>
 *
 * <p>Désactivés quand la liste est vide : un document à en-têtes sans une seule ligne se
 * lirait comme « aucun livreur », alors que l'écran, lui, explique pourquoi.</p>
 *
 * <p>⚠ Le PDF est produit à la demande et son module ne pèse sur la page que si l'on clique.
 * Il PEUT échouer, et un export qui échoue en silence est ce qui a fait cliquer trois fois
 * un opérateur sur l'écran Coursiers sans jamais obtenir de fichier ni d'explication. D'où
 * le `catch` et le message.</p>
 */
export function BoutonExportListe({
  categorie,
  lignes,
  periode,
}: {
  categorie: string;
  lignes: LigneFlotteExport[];
  periode: string;
}) {
  const [enCours, setEnCours] = useState(false);
  const vide = lignes.length === 0;

  async function exporterPdf() {
    setEnCours(true);
    try {
      const { exporterListeFlottePdf } = await import(
        '@/features/performance/utils/flotte-pdf.utils'
      );
      await exporterListeFlottePdf({ categorie, lignes, periode });
    } catch (erreur) {
      console.error('Export PDF de la liste de flotte :', erreur);
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
        onPress={() => exporterListeFlotteExcel({ categorie, lignes, periode })}
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
