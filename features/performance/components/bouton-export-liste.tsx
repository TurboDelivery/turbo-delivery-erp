'use client';

import { Button } from '@heroui-v3/react';
import { FileSpreadsheet } from 'lucide-react';

import {
  exporterListeFlotteExcel,
  type LigneFlotteExport,
} from '@/features/performance/utils/flotte-excel.utils';

/**
 * L'export de la liste d'une catégorie, exigence 6.
 *
 * <p>Il ne porte PAS l'accent : un export ne change rien, il recopie ce qui est déjà à
 * l'écran. C'est la règle appliquée au rapport de performance partenaires et au classement,
 * et les écrans se lisent les uns après les autres.</p>
 *
 * <p>Désactivé quand la liste est vide : un classeur à en-têtes sans une seule ligne se
 * lirait comme « aucun livreur », alors que l'écran, lui, explique pourquoi.</p>
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
  return (
    <Button
      isDisabled={lignes.length === 0}
      onPress={() => exporterListeFlotteExcel({ categorie, lignes, periode })}
      variant="outline"
    >
      <FileSpreadsheet aria-hidden="true" className="size-4" />
      Excel
    </Button>
  );
}
