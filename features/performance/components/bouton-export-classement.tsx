'use client';

import { Button } from '@heroui-v3/react';
import { FileSpreadsheet } from 'lucide-react';

import {
  exporterClassementExcel,
  type LigneClassementExport,
} from '@/features/performance/utils/flotte-excel.utils';

/** L'export du classement, troisième niveau de l'exigence 6. Sans accent : il ne change rien. */
export function BoutonExportClassement({
  lignes,
  periode,
  tri,
}: {
  lignes: LigneClassementExport[];
  periode: string;
  tri: string;
}) {
  return (
    <Button
      isDisabled={lignes.length === 0}
      onPress={() => exporterClassementExcel({ lignes, periode, tri })}
      variant="outline"
    >
      <FileSpreadsheet aria-hidden="true" className="size-4" />
      Excel
    </Button>
  );
}
