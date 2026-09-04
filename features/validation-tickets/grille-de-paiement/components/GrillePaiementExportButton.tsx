'use client';

import { useCallback, useState } from 'react';
import { Button, Spinner } from '@heroui-v3/react';
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

      if (!grille || grille.lignes.content.length === 0) {
        toast.dismiss(toastId);
        toast.warning('Aucune donnée à exporter');
        return;
      }

      toast.loading('Génération du fichier Excel...', { id: toastId });
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      const xlsxData = generateXlsGrillePaiement(grille, grille.lignes.content);
      const blob = new Blob([xlsxData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grille-paiement_${grilleCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`${grille.lignes.content.length} ligne(s) exportée(s) en Excel`, { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'export", {
        id: toastId,
      });
    } finally {
      setIsExporting(false);
    }
  }, [creneauId, grilleCode, totalItems]);

  return (
    /*
     * Un composant V3 ignore en SILENCE une prop qu'il ne connait pas, et cet export
     * en portait trois : `startContent`, `isLoading` et `color`. Les laisser telles
     * quelles aurait donne un bouton sans icone et surtout sans aucun signe d'attente
     * pendant la lecture des mille lignes puis la fabrication du classeur, deux temps
     * ou rien ne bouge a l'ecran. Le comptable aurait appuye une seconde fois et
     * relance l'export. L'icone redevient un enfant, l'attente passe par `isPending`,
     * qui coupe en plus la pression des l'appui au lieu d'attendre le rendu suivant.
     */
    <Button isDisabled={isDisabled} isPending={isExporting} variant="outline" onPress={handleExport}>
      {isExporting ? (
        <Spinner color="current" size="sm" />
      ) : (
        <Download aria-hidden="true" className="size-4" />
      )}
      Exporter Excel
    </Button>
  );
}
