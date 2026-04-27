'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IRestaurant } from '@/features/restaurants/types/restaurant.type';
import { AlertTriangle, BadgeCheck, CheckCircle2, Diamond, Eye, MoreHorizontal, Pencil, PowerOff, RefreshCw, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import Link from 'next/link';
import { Chip } from '@heroui/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConfirmModal from '@/components/ui/confirm-modal';
import { useDeleteRestaurantMutation, useToggleRestaurantMutation } from '@/features/restaurants/queries/restaurant-list.query';
import { toast } from 'react-toastify';

// ── Avatar coloré basé sur la première lettre ───────────────────────────────
const AVATAR_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-green-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-purple-500', 'bg-pink-500',
];
function getAvatarColor(name: string) {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ── Statut ───────────────────────────────────────────────────────────────────
function StatusChip({ status, typeCommission }: { status: number; typeCommission?: string }) {
  if (typeCommission === 'GRATUIT') return <Chip color="warning" size="sm" variant="flat">Gratuite</Chip>;
  if (status === 3) return <Chip color="success" size="sm" variant="flat">Validé</Chip>;
  if (status === 2) return <Chip color="warning" size="sm" variant="flat">En attente</Chip>;
  if (status === 1) return <Chip color="secondary" size="sm" variant="flat">Validé Auth</Chip>;
  return <Chip color="default" size="sm" variant="flat">Inactif</Chip>;
}

// ── Cycle de paiement ────────────────────────────────────────────────────────
const RECOUVREMENT_LABELS: Record<string, string> = {
  MENSUEL: 'Mensuel',
  QUOTIDIEN: 'Quotidien',
  HEBDOMADAIRE: 'Hebdomadaire',
  QUINZAINE: 'Quinzaine',
};

// ── Actions dropdown ─────────────────────────────────────────────────────────
function ActionsMenu({ id, name, status }: { id: string; name: string; status: number }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const { softDelete, hardDelete } = useDeleteRestaurantMutation();
  const toggleMutation = useToggleRestaurantMutation();

  const isActive = status !== 0;
  const isLoading = softDelete.isPending || hardDelete.isPending;

  const handleSoftDelete = () => {
    softDelete.mutate(id, {
      onSuccess: () => {
        toast.success('Partenaire supprimé (historique conservé).');
        setDeleteModalOpen(false);
      },
      onError: () => toast.error('Erreur lors de la suppression.'),
    });
  };

  const handleHardDelete = () => {
    hardDelete.mutate(id, {
      onSuccess: () => {
        toast.success('Partenaire et toutes ses données supprimés.');
        setDeleteModalOpen(false);
      },
      onError: () => toast.error('Erreur lors de la suppression.'),
    });
  };

  const handleToggle = () => {
    toggleMutation.mutate({ id, activate: !isActive }, {
      onSuccess: () => {
        toast.success(isActive ? 'Partenaire désactivé.' : 'Partenaire réactivé.');
        setToggleModalOpen(false);
      },
      onError: () => toast.error('Erreur lors de la mise à jour du statut.'),
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Actions"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/restaurants/${id}`} className="flex items-center gap-2 cursor-pointer">
              <Eye className="w-4 h-4" />
              Voir
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/restaurants/${id}/edit`} className="flex items-center gap-2 cursor-pointer">
              <Pencil className="w-4 h-4" />
              Modifier
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-orange-600 focus:text-orange-600 focus:bg-orange-50"
            onSelect={() => setToggleModalOpen(true)}
          >
            {isActive ? <PowerOff className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
            {isActive ? 'Désactiver' : 'Réactiver'}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            onSelect={() => setDeleteModalOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmModal
        isOpen={toggleModalOpen}
        onClose={() => setToggleModalOpen(false)}
        title={isActive ? `Désactiver "${name}"` : `Réactiver "${name}"`}
        isLoading={toggleMutation.isPending}
        size="sm"
        actions={[
          {
            label: 'Annuler',
            color: 'default',
            variant: 'bordered',
            onPress: () => setToggleModalOpen(false),
          },
          {
            label: isActive ? 'Désactiver' : 'Réactiver',
            color: isActive ? 'warning' : 'success',
            variant: 'solid',
            onPress: handleToggle,
          },
        ]}
      >
        <div className="flex flex-col gap-2 text-sm">
          {isActive ? (
            <>
              <p className="text-gray-700">Le partenaire sera désactivé. Il n'apparaîtra plus comme actif et aucune nouvelle commande ne lui sera attribuée.</p>
              <p className="text-gray-500 text-xs">Les données historiques (avant désactivation) restent intactes. Le partenaire peut être réactivé à tout moment.</p>
            </>
          ) : (
            <p className="text-gray-700">Le partenaire sera réactivé et pourra à nouveau recevoir des commandes.</p>
          )}
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={`Supprimer "${name}"`}
        isLoading={isLoading}
        size="md"
        actions={[
          {
            label: 'Annuler',
            color: 'default',
            variant: 'bordered',
            onPress: () => setDeleteModalOpen(false),
          },
          {
            label: 'Supprimer (historique conservé)',
            color: 'warning',
            variant: 'flat',
            onPress: handleSoftDelete,
          },
          {
            label: 'Suppression totale',
            color: 'danger',
            variant: 'solid',
            onPress: handleHardDelete,
          },
        ]}
      >
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Supprimer en conservant l'historique</p>
              <p className="text-gray-500 text-xs mt-0.5">Le partenaire est supprimé mais les données de livraison associées sont conservées.</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-700">Suppression totale — irréversible</p>
              <p className="text-red-500 text-xs mt-0.5">Le partenaire <strong>et toutes ses données</strong> de livraison seront définitivement supprimés. Cette action ne peut pas être annulée.</p>
            </div>
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}

export const restaurantColumns: ColumnDef<IRestaurant>[] = [
  {
    id: 'nomEtablissement',
    accessorKey: 'nomEtablissement',
    header: 'NAME',
    cell: ({ row }) => {
      const r = row.original;
      const letter = r.nomEtablissement?.[0]?.toUpperCase() ?? '?';
      const color = getAvatarColor(r.nomEtablissement ?? '');
      const isVerified = r.status === 3;
      const isGratuite = r.typeCommission === 'GRATUIT';
      return (
        <div className="flex items-center gap-3 min-w-[160px]">
          <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
            {letter}
          </div>
          <span className="font-medium text-sm text-gray-800 capitalize">{r.nomEtablissement}</span>
          {isVerified && !isGratuite && (
            <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
          )}
          {isGratuite && (
            <Diamond className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'EMAIL',
    cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.email || '-'}</span>,
    enableSorting: true,
  },
  {
    id: 'telephone',
    accessorKey: 'telephone',
    header: 'TÉLÉPHONE',
    cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.telephone || '-'}</span>,
    enableSorting: true,
  },
  {
    id: 'localisation',
    accessorKey: 'localisation',
    header: 'LOCALISATION',
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">{row.original.localisation || row.original.commune || '-'}</span>
    ),
    enableSorting: true,
  },
  {
    id: 'methodRecouvrement',
    accessorKey: 'methodRecouvrement',
    header: 'CYCLE DE PAIEMENT',
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">
        {RECOUVREMENT_LABELS[row.original.methodRecouvrement] ?? row.original.methodRecouvrement ?? '-'}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'STATUS',
    cell: ({ row }) => (
      <StatusChip status={row.original.status} typeCommission={row.original.typeCommission} />
    ),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'ACTION',
    cell: ({ row }) => <ActionsMenu id={row.original.id} name={row.original.nomEtablissement} status={row.original.status} />,
    enableSorting: false,
  },
];

