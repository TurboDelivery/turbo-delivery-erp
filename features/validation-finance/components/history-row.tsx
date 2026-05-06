'use client';

import { Download, Eye, X } from 'lucide-react';
import { IDepense } from '@/features/depenses/types/depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { fmtDate } from './validation.constants';
import { TypeBadge, StatusBadge } from './validation-badges';
import { createUrlFile } from '@/utils/createUrlFile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useState } from 'react';

export function HistoryRow({ depense }: { depense: IDepense }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="p-5 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <TypeBadge type={depense.typeDepense} />
              <span className="text-sm text-gray-500">{fmtDate(depense.dateDepense)}</span>
            </div>
            <h3 className="mb-1 font-semibold text-gray-900">{depense.libelle}</h3>
            <p className="mb-3 text-sm text-gray-500">{depense.categorie?.nomCategorie}</p>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-blue-600">{formatCFA(depense.montant)}</span>
              <StatusBadge statut={depense.statut} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {depense.justificatif && (
              <button
                onClick={() => window.open(createUrlFile(depense.justificatif!, 'backend'), '_blank')}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Justificatif</span>
              </button>
            )}
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Détails</span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la dépense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <TypeBadge type={depense.typeDepense} />
              <StatusBadge statut={depense.statut} />
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Libellé</p>
                <p className="font-medium text-gray-800">{depense.libelle}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Montant</p>
                <p className="font-bold text-blue-600">{formatCFA(depense.montant)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="font-medium text-gray-800">{fmtDate(depense.dateDepense)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Catégorie</p>
                <p className="font-medium text-gray-800">{depense.categorie?.nomCategorie ?? '—'}</p>
              </div>
              {depense.sourcePaiement && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Source de paiement</p>
                  <p className="font-medium text-gray-800">{depense.sourcePaiement}</p>
                </div>
              )}
              {depense.description && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Description</p>
                  <p className="font-medium text-gray-800">{depense.description}</p>
                </div>
              )}
            </div>
            {depense.justificatif && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Justificatif</p>
                <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img
                    src={createUrlFile(depense.justificatif, 'backend')}
                    alt="Justificatif"
                    className="max-h-64 w-full object-contain"
                    onError={(e) => {
                      // Si pas une image (PDF etc.), afficher un lien de téléchargement
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <a
                    href={createUrlFile(depense.justificatif, 'backend')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden w-full items-center justify-center gap-2 py-8 text-sm text-blue-600 hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    Ouvrir le fichier
                  </a>
                </div>
                <a
                  href={createUrlFile(depense.justificatif, 'backend')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
