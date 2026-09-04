'use client';

import type { Row } from '@tanstack/react-table';
import { Button, Chip } from '@/components/heroui';
import { FileText, Trash2, Wallet } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Can } from '@/components/auth/Can';
import { IChargeFixe } from '@/features/charges/types/charge-fixe.type';
import { getPaiementStatutConfig, isDecaisse } from '../columns/paiements.columns';
import { formatMontant } from '@/utils/format.utils';

/**
 * Carte mobile d'une charge à décaisser (cf. PaiementTable, wrapper
 * `hidden md:block` / `md:hidden`). Reçoit la `Row` tanstack pour réutiliser la
 * sélection multiple (décaissement par lot) à l'identique du tableau, et les
 * mêmes handlers/config de statut que `paiements.columns`.
 */
export default function PaiementMobileCard({
  row,
  onDecaisser,
  isPending,
  onDelete,
  isDeleting,
  onDeleteFixe,
  isDeletingFixe,
  onRapport,
}: {
  row: Row<IChargeFixe>;
  onDecaisser: (id: string) => void;
  isPending: boolean;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  onDeleteFixe?: (id: string) => void;
  isDeletingFixe?: boolean;
  onRapport?: (charge: IChargeFixe) => void;
}) {
  const charge = row.original;
  const decaisse = isDecaisse(charge);
  const config = getPaiementStatutConfig(charge.statut);

  return (
    <div className="bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            disabled={decaisse}
            aria-label="Sélectionner la charge"
            className="mt-0.5"
          />
          <p className="text-sm font-semibold text-foreground min-w-0 wrap-break-word">{charge.designation}</p>
        </div>
        <Chip color={config.color} variant="flat" size="sm" className="shrink-0">
          {config.label}
        </Chip>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Catégorie</span>
        <span className="text-sm text-foreground text-right wrap-break-word">{charge.categorie?.nomCategorie ?? '—'}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Montant</span>
        <span className="text-sm font-medium text-foreground">{formatMontant(charge.montant)}</span>
      </div>

      {(!decaisse || (decaisse && charge.codeSysteme === 'MASSE_SALARIALE_NETTE') || onDelete || onDeleteFixe) && (
        <div className="pt-1 flex flex-col gap-2">
          {!decaisse && (
            <Button size="sm" color="warning" variant="flat" className="w-full gap-1.5" startContent={<Wallet size={14} />} isLoading={isPending} onPress={() => onDecaisser(charge.id)}>
              Décaisser
            </Button>
          )}
          {decaisse && charge.codeSysteme === 'MASSE_SALARIALE_NETTE' && (
            <Button size="sm" color="success" variant="flat" className="w-full gap-1.5" startContent={<FileText size={14} />} onPress={() => onRapport?.(charge)}>
              Rapport
            </Button>
          )}
          {onDelete && (
            <Can I="delete" a="ChargeVariable">
              <Button size="sm" color="danger" variant="flat" className="w-full gap-1.5" onPress={() => onDelete(charge.id)} isLoading={isDeleting} startContent={<Trash2 size={14} />}>
                Supprimer
              </Button>
            </Can>
          )}
          {onDeleteFixe && (
            <Can I="delete" a="ChargeFixe">
              <Button size="sm" color="danger" variant="flat" className="w-full gap-1.5" onPress={() => onDeleteFixe(charge.id)} isLoading={isDeletingFixe} startContent={<Trash2 size={14} />}>
                Supprimer la dépense du mois
              </Button>
            </Can>
          )}
        </div>
      )}
    </div>
  );
}
