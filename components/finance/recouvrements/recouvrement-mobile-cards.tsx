'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertCircle, MoreHorizontal } from 'lucide-react';
import { IconFileInvoice } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { getStatutBadgeVariant, getStatutColor, getStatutLabel } from '@/features/recouvrements/utils/facture.utils';
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
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-700 text-right wrap-break-word">{value}</span>
    </div>
  );
}

export function FactureRecouvrementMobileCard({ facture }: { facture: IFacture }) {
  const montantRestant = Math.max(0, (facture.montant || 0) - (facture.montantRegle || 0));
  const isFullyPaid = montantRestant <= 0;
  const hasContestation = facture.contestationActive > 0;

  return (
    <div className={cn('bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-2', hasContestation && 'bg-red-50 border-l-4 border-l-red-500')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{facture.restaurantName}</p>
          <p className="text-xs text-gray-500">{facture.code}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={getStatutBadgeVariant(facture.statut)} className={cn('capitalize text-nowrap', getStatutColor(facture.statut))}>
            {getStatutLabel(facture.statut)}
          </Badge>
          {hasContestation && (
            <span className="flex items-center gap-0.5 text-red-600">
              <AlertCircle className="size-4" />
              <span className="text-xs font-semibold">{facture.contestationActive}</span>
            </span>
          )}
        </div>
      </div>

      <Row label="Type" value={<span className="capitalize">{facture.type}</span>} />
      <Row label="Période" value={`${formatDate(facture.periodeDebut)} → ${formatDate(facture.periodeFin)}`} />
      <Row label="Montant total" value={<span className="font-bold">{formatCFA(facture.montant || 0)}</span>} />
      <Row label="Restant" value={<span className={cn('font-bold', isFullyPaid ? 'text-green-600' : 'text-red-600')}>{formatCFA(montantRestant)}</span>} />
      <Row label="Créée le" value={formatDate(facture.createdAt)} />

      <div className="pt-1 flex justify-end">
        <FactureActions facture={facture} />
      </div>
    </div>
  );
}

export function RecouvrementMobileCard({ recouvrement }: { recouvrement: IRecouvrement }) {
  const codes = recouvrement.factures?.length ? recouvrement.factures.map((f) => f.code).join(', ') : '-';
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 min-w-0 wrap-break-word">{recouvrement.nomRestaurant || '-'}</p>
        <span className="text-sm font-bold text-gray-900 shrink-0">{formatCFA(recouvrement.montant)}</span>
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
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 min-w-0 wrap-break-word">{accompte.nomRestaurant || '-'}</p>
        <span className="text-sm font-bold text-gray-900 shrink-0">
          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(accompte.montant)}
        </span>
      </div>
      <Row label="Date" value={accompte.dateAccompte ? format(new Date(accompte.dateAccompte), 'dd/MM/yyyy') : '-'} />
    </div>
  );
}

export function RestaurantRecouvrementMobileCard({ restaurant }: { restaurant: IRestaurantRecouvrement }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 min-w-0 wrap-break-word">{restaurant.nomRestaurant}</p>
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
