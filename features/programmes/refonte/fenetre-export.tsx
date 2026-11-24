'use client';

import { Button, Modal } from '@heroui-v3/react';
import { ClipboardList, FileSpreadsheet, Printer } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import type { IProgramme } from '@/features/turboys/types/programme.types';
import { programmesEnCsv } from '@/features/turboys/utils/programmes-csv.utils';

interface FenetreExportProps {
  ouvert: boolean;
  onFermer: () => void;
  /** Ce qui part dans le fichier : la sélection, ou tout ce que la semaine affiche. */
  programmes: IProgramme[];
  /** Vrai quand `programmes` est la sélection cochée, faux quand c'est la vue. */
  estSelection: boolean;
  nomSite: Map<string, string>;
  onExcel: () => void;
  onPdf: () => void;
}

/**
 * La fenêtre d'export (maquette).
 *
 * <p>L'export était un menu de deux formats qui ne disait pas ce qu'il prenait : on
 * découvrait dans le fichier si la sélection avait compté. La fenêtre ÉNONCE son périmètre
 * avant de partir, et rend le CSV que le menu avait perdu.</p>
 *
 * <p>⚠ « Voir l'aperçu de l'export » de la maquette n'est PAS fait : le PDF est dessiné
 * directement dans le fichier, il n'existe pas de rendu à l'écran à montrer. Le PDF lui-même
 * sert d'aperçu avant impression.</p>
 */
export function FenetreExport({ estSelection, nomSite, onExcel, onFermer, onPdf, ouvert, programmes }: FenetreExportProps) {
  const n = programmes.length;

  const copierCsv = async () => {
    const csv = programmesEnCsv(programmes, nomSite);
    try {
      await navigator.clipboard.writeText(csv);
      toast.success(`CSV copié : ${n} programme${n > 1 ? 's' : ''}. Collez-le dans un tableur.`);
    } catch {
      /*
       * Le presse-papiers est refusé hors HTTPS, sans geste direct, ou par réglage du
       * navigateur. Un message d'échec laisserait l'utilisateur sans son export : on lui
       * donne le MÊME contenu en fichier. Le BOM en tête fait lire les accents à un
       * tableur qui ouvrirait sinon « ANGRÃ‰ ».
       */
      const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `programmes_${n}.csv`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      URL.revokeObjectURL(url);
      toast.info('Copie refusée par le navigateur : le CSV a été téléchargé en fichier.');
    }
    onFermer();
  };

  const choix: { cle: string; description: string; icone: React.ReactNode; onPress: () => void; titre: string }[] = [
    {
      cle: 'excel',
      description: 'Regroupé par base, jours en colonnes, présents et sous-totaux, détail des surplus.',
      icone: <FileSpreadsheet aria-hidden="true" className="size-5 shrink-0 text-muted" />,
      onPress: () => {
        onExcel();
        onFermer();
      },
      titre: 'Excel (.xlsx)',
    },
    {
      cle: 'pdf',
      description: 'Même mise en page, en paysage, prête à imprimer.',
      icone: <Printer aria-hidden="true" className="size-5 shrink-0 text-muted" />,
      onPress: () => {
        onPdf();
        onFermer();
      },
      titre: 'PDF / impression',
    },
    {
      cle: 'csv',
      description: 'Données brutes, une ligne par programme, dans le presse-papiers (ou en fichier si le navigateur refuse).',
      icone: <ClipboardList aria-hidden="true" className="size-5 shrink-0 text-muted" />,
      onPress: () => void copierCsv(),
      titre: 'Copier en CSV',
    },
  ];

  return (
    <Modal
      isOpen={ouvert}
      onOpenChange={(o) => {
        if (!o) onFermer();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.Header>
              <div className="flex flex-col gap-0.5">
                <Modal.Heading>Exporter le programme</Modal.Heading>
                <span className="text-sm text-muted">
                  {n} programme{n > 1 ? 's' : ''} · {estSelection ? 'la sélection cochée' : 'toute la semaine affichée'}
                </span>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-2">
              {choix.map((c) => (
                <Button
                  className="h-auto shrink-0 justify-start gap-3 whitespace-normal px-3 py-2.5 text-start"
                  isDisabled={n === 0}
                  key={c.cle}
                  onPress={c.onPress}
                  variant="outline"
                >
                  {c.icone}
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{c.titre}</span>
                    <span className="text-xs font-normal text-muted">{c.description}</span>
                  </span>
                </Button>
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button onPress={onFermer} variant="ghost">
                Fermer
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
