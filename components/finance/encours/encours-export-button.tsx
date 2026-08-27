'use client';

import { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@/components/heroui';
import { ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';
import { encoursAPI, IEncoursParams } from '@/features/encours';

/** Export serveur du relevé (PDF OpenPDF / Excel POI) — télécharge le blob renvoyé. */
export function EncoursExportButton({
  params,
  isDisabled,
}: {
  params: IEncoursParams;
  isDisabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setLoading(true);
    const id = toast.loading('Génération du fichier…');
    try {
      const blob = await encoursAPI.exporter(params, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const moisSuffix = params.mois ? `_${params.mois}` : '';
      a.download = `encours_${params.annee}${moisSuffix}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export prêt', { id });
    } catch (error) {
      toast.error("Échec de l'export", {
        id,
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="bordered"
          isLoading={loading}
          isDisabled={isDisabled}
          startContent={!loading && <Download className="h-4 w-4" />}
          endContent={<ChevronDown className="h-4 w-4" />}
        >
          Exporter
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Format d'export"
        onAction={(key) => handleExport(key as 'pdf' | 'xlsx')}
      >
        <DropdownItem key="pdf">PDF (relevé)</DropdownItem>
        <DropdownItem key="xlsx">Excel (valeurs)</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
