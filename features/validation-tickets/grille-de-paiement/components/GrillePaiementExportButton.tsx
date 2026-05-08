'use client';

import { useCallback, useState } from 'react';
import { Button } from '@heroui/react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { getGrillePaiementApi } from '../apis/grille-paiement.api';
import { generateXlsGrillePaiement } from '../utils/grille-paiement-export.utils';

interface GrillePaiementExportButtonProps {
  creneauId?: string;
  grilleCode: string;
  totalItems: number;
  isDisabled?: boolean;
}

export default function GrillePaiementExportButton({
  creneauId,
  grilleCode,
  totalItems,
  isDisabled,
}: GrillePaiementExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (totalItems === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Préparation de l'export...");

    try {
      const grille = await getGrillePaiementApi({ creneauId, size: 1000, page: 0 });

      if (!grille || grille.lignes.length === 0) {
        toast.dismiss(toastId);
        toast.warning('Aucune donnée à exporter');
        return;
      }

      toast.loading('Génération du fichier Excel...', { id: toastId });
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      const xlsxData = generateXlsGrillePaiement(grille, grille.lignes);
      const blob = new Blob([xlsxData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grille-paiement_${grilleCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`${grille.lignes.length} ligne(s) exportée(s) en Excel`, { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'export", {
        id: toastId,
      });
    } finally {
      setIsExporting(false);
    }
  }, [creneauId, grilleCode, totalItems]);

  return (
    <Button
      variant="bordered"
      color="primary"
      startContent={<Download size={16} />}
      isDisabled={isDisabled || isExporting}
      isLoading={isExporting}
      onPress={handleExport}
    >
      Exporter Excel
    </Button>
  );
}
