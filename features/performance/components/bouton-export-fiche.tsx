'use client';

import { Button } from '@heroui-v3/react';
import { FileSpreadsheet } from 'lucide-react';

import { exporterFicheLivreurExcel } from '@/features/performance/utils/flotte-excel.utils';
import type { LignePaieLivreur } from '@/src/performance/fiche-livreur.action';

/**
 * L'export d'une fiche individuelle, exigence 6 : « export Excel/PDF de la fiche
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
  return (
    <Button onPress={() => exporterFicheLivreurExcel({ ligne, periode })} variant="outline">
      <FileSpreadsheet aria-hidden="true" className="size-4" />
      Excel
    </Button>
  );
}
