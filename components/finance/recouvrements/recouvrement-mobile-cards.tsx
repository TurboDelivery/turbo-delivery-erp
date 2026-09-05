'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Card, Chip } from '@heroui-v3/react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, MoreHorizontal } from 'lucide-react';
import { IconFileInvoice } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { getStatutChip, getStatutLabel } from '@/features/recouvrements/utils/facture.utils';
import { CreerRecouvrementModal } from '@/features/revenus/components/recouvrement/recouvrement-pret/creer-recouvrement-modal';
import { FactureActions } from '@/components/finance/recouvrements/factures/facture-table-columns';
import { RecouvrementActionsCell } from '@/features/recouvrements/columns/recouvrement-columns';
import type { IFacture } from '@/features/recouvrements/types/facture.types';
import type { IAccompte } from '@/features/recouvrements/types/accompte.types';
import type { IRestaurantRecouvrement } from '@/features/recouvrements/types/restaurant-recouvrement.types';
import type { IRecouvrement } from '@/features/revenus/types/recouvrement/recouvrement.types';

/**
 * Cartes mobiles des tableaux du module Recouvrements (cf. wrappers
 * `hidden md:block` / `md:hidden` dans chaque table). Réutilisent les
 * composants d'action et helpers de statut des colonnes desktop pour rester
 * strictement alignées avec le tableau (mêmes mutations, mêmes labels).
 */

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateString;
  }
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted shrink-0">{label}</span>
      <span className="text-sm text-foreground text-right wrap-break-word">{value}</span>
    </div>
  );
}

export function FactureRecouvrementMobileCard({ facture }: { facture: IFacture }) {
  const montantRestant = Math.max(0, (facture.montant || 0) - (facture.montantRegle || 0));
  const isFullyPaid = montantRestant <= 0;
  const hasContestation = facture.contestationActive > 0;

  return (
    // Une facture contestee garde son liseré : c'est la seule chose qui appelle un
    // geste sur cette carte. `bg-red-50 border-l-red-500` etaient deux teintes de
    // palette, indifferentes au theme sombre.
    <Card className={cn(hasContestation && 'border-l-4 border-l-danger bg-danger/5')}>
      <Card.Content className="gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{facture.restaurantName}</p>
          <p className="text-xs text-muted">{facture.code}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Chip color={getStatutChip(facture.statut).color} size="sm" variant={getStatutChip(facture.statut).variant}>
            <Chip.Label>{getStatutLabel(facture.statut)}</Chip.Label>
          </Chip>
          {hasContestation && (
            <span className="flex items-center gap-0.5 text-danger-soft-foreground">
              <AlertCircle aria-hidden="true" className="size-4" />
              <span className="text-xs font-semibold">{facture.contestationActive}</span>
            </span>
          )}
        </div>
      </div>

      <Row label="Type" value={<span className="capitalize">{facture.type}</span>} />
      <Row label="Période" value={`${formatDate(facture.periodeDebut)} → ${formatDate(facture.periodeFin)}`} />
      <Row label="Montant total" value={<span className="font-bold">{formatCFA(facture.montant || 0)}</span>} />
      <Row label="Restant" value={
          <span
            className={cn(
              'font-bold tabular-nums',
              isFullyPaid ? 'text-success-soft-foreground' : 'text-danger-soft-foreground',
            )}
          >
            {formatCFA(montantRestant)}
          </span>
        } />
      <Row label="Créée le" value={formatDate(facture.createdAt)} />

      <div className="flex justify-end pt-1">
        <FactureActions facture={facture} />
      </div>
      </Card.Content>
    </Card>
  );
}

export function RecouvrementMobileCard({ recouvrement }: { recouvrement: IRecouvrement }) {
  const codes = recouvrement.factures?.length ? recouvrement.factures.map((f) => f.code).join(', ') : '-';
  return (
    <div className="bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground min-w-0 wrap-break-word">{recouvrement.nomRestaurant || '-'}</p>
        <span className="text-sm font-bold text-foreground shrink-0">{formatCFA(recouvrement.montant)}</span>
      </div>
      <Row label="Date" value={formatDate(recouvrement.dateRecouvrement)} />
      <Row label="Factures" value={codes} />
      <div className="pt-1 flex justify-end">
        <RecouvrementActionsCell recouvrement={recouvrement} />
      </div>
    </div>
  );
}

export function AccompteMobileCard({ accompte }: { accompte: IAccompte }) {
  return (
    <div className="bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground min-w-0 wrap-break-word">{accompte.nomRestaurant || '-'}</p>
        <span className="text-sm font-bold text-foreground shrink-0">
          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(accompte.montant)}
        </span>
      </div>
      <Row label="Date" value={accompte.dateAccompte ? format(new Date(accompte.dateAccompte), 'dd/MM/yyyy') : '-'} />
    </div>
  );
}

export function RestaurantRecouvrementMobileCard({ restaurant }: { restaurant: IRestaurantRecouvrement }) {
  return (
    <div className="bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground min-w-0 wrap-break-word">{restaurant.nomRestaurant}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" className="shrink-0">
              <MoreHorizontal className="h-4 w-4 cursor-pointer" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/finance/recouvrement/${restaurant.id}/factures`}>
                <IconFileInvoice className="h-4 w-4 mr-2" />
                <span>Factures</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <CreerRecouvrementModal restaurantId={restaurant.id} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Row label="Total Livraison" value={formatCFA(restaurant.totalFraisLivraisons || 0)} />
      <Row label="Total Commission" value={formatCFA(restaurant.totalCommission || 0)} />
      <Row label="Total Facture" value={<span className="font-bold">{formatCFA(restaurant.totalFacture || 0)}</span>} />
    </div>
  );
}
