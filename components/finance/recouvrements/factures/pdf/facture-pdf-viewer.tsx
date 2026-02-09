import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import FacturePdf from '@/components/finance/recouvrements/factures/pdf/facture-pdf';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer';
import { Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFactureDetailQuery } from '@/features/recouvrements/queries/facture.query';

interface FacturePdfViewerProps {
  factureId: string;
}

function FacturePdfViewer({ factureId }: FacturePdfViewerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Récupérer les détails de la facture uniquement quand le drawer est ouvert
  const { data: factureDetail, isLoading, isError, error } = useFactureDetailQuery(factureId, isOpen);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <>
      <Button size="icon" onClick={onOpen} variant="outline">
        <Eye className="size-4" />
      </Button>
      <Drawer open={isOpen} onClose={onClose} direction="right">
        <DrawerContent className="h-[95vh]">
          <DrawerHeader>Détails de la facture</DrawerHeader>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="flex-1 flex items-center justify-center text-destructive">
              <p>Erreur lors du chargement de la facture: {error instanceof Error ? error.message : 'Erreur inconnue'}</p>
            </div>
          ) : factureDetail ? (
            <PDFViewer className="flex-1">
              <FacturePdf factureDetail={factureDetail} />
            </PDFViewer>
          ) : null}
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" onClick={onClose}>Fermer</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default FacturePdfViewer;
