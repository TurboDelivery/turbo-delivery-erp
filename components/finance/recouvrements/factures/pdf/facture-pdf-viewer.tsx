import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import FacturePdf from '@/components/finance/recouvrements/factures/pdf/facture-pdf';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

function FacturePdfViewer() {
  const [isOpen, setIsOpen] = React.useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  return (
    <>
      <Button onClick={onOpen} variant="link">
        <Eye className="h-4 w-4 mr-2" />
        <span>Voir détails</span>
      </Button>
      <Drawer open={isOpen} onClose={onClose} direction="right">
        <DrawerContent className="h-[95vh]">
          <DrawerHeader>Détails de la facture</DrawerHeader>
          <PDFViewer className="flex-1">
            <FacturePdf />
          </PDFViewer>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default FacturePdfViewer;
