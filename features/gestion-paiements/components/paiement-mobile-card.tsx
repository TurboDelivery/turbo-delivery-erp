'use client';

import type { Row } from '@tanstack/react-table';
import { Button, Card, Chip } from '@heroui-v3/react';
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
    <Card>
      <Card.Content className="gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} disabled={decaisse} aria-label="Sélectionner la charge" className="mt-0.5" />
            <p className="text-sm font-semibold text-foreground min-w-0 wrap-break-word">{charge.designation}</p>
          </div>
          <Chip className="shrink-0" color={config.color} size="sm" variant="soft">
            <Chip.Label className="whitespace-nowrap">{config.label}</Chip.Label>
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
              <Button className="w-full" isPending={isPending} onPress={() => onDecaisser(charge.id)} size="sm" variant="primary">
                <Wallet aria-hidden="true" className="size-3.5" />
                Décaisser
              </Button>
            )}
            {decaisse && charge.codeSysteme === 'MASSE_SALARIALE_NETTE' && (
              <Button className="w-full" onPress={() => onRapport?.(charge)} size="sm" variant="outline">
                <FileText aria-hidden="true" className="size-3.5" />
                Rapport
              </Button>
            )}
            {onDelete && (
              <Can I="delete" a="ChargeVariable">
                <Button className="w-full" isPending={isDeleting} onPress={() => onDelete(charge.id)} size="sm" variant="danger-soft">
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  Supprimer
                </Button>
              </Can>
            )}
            {onDeleteFixe && (
              <Can I="delete" a="ChargeFixe">
                <Button className="w-full" isPending={isDeletingFixe} onPress={() => onDeleteFixe(charge.id)} size="sm" variant="danger-soft">
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  Supprimer la dépense du mois
                </Button>
              </Can>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
