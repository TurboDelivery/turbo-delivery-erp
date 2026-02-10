'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IRestaurant } from '@/features/restaurants/types/restaurant.type';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';
import Link from 'next/link';
import { Avatar, Badge } from '@heroui/react';
import { createUrlFile } from '@/utils/createUrlFile';

// Composant mémorisé pour les actions
const RestaurantActions = React.memo(({ restaurant }: { restaurant: IRestaurant }) => {
  return (
    <Button size="icon" variant="ghost" asChild>
      <Link href={`/restaurants/${restaurant.id}`}>
        <Eye className="h-4 w-4" />
      </Link>
    </Button>
  );
});

RestaurantActions.displayName = 'RestaurantActions';

// Fonction pour déterminer le statut du compte
const getAccountStatus = (status: number) => {
  if (status === 3) {
    return { label: 'Validé', variant: 'success' as const };
  }
  return { label: 'Inconnu', variant: 'secondary' as const };
};

export const restaurantColumns: ColumnDef<IRestaurant>[] = [
  {
    id: 'nomEtablissement',
    accessorKey: 'nomEtablissement',
    header: 'Nom établissement',
    cell: ({ row }) => {
      const restaurant = row.original;
      return (
        <div className="flex items-center gap-4">
          <Avatar src={createUrlFile(restaurant?.logo_Url ?? '', 'restaurant')} />
          <div className="font-medium capitalize">{restaurant.nomEtablissement}</div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.original.email || '-',
    enableSorting: true,
  },
  {
    id: 'telephone',
    accessorKey: 'telephone',
    header: 'Téléphone',
    cell: ({ row }) => row.original.telephone || '-',
    enableSorting: true,
  },
  {
    id: 'methodRecouvrement',
    accessorKey: 'methodRecouvrement',
    header: 'Cycle de paiement',
    cell: ({ row }) => row.original.methodRecouvrement || '-',
    enableSorting: true,
  },
  {
    id: 'localisation',
    accessorKey: 'localisation',
    header: 'Localisation',
    cell: ({ row }) => {
      const restaurant = row.original;
      return (
        <div className="max-w-xs">
          <div className="font-medium">{restaurant.commune}</div>
          <div className="text-xs text-muted-foreground truncate">{restaurant.localisation}</div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'État du compte',
    cell: ({ row }) => {
      const restaurant = row.original;
      const statusInfo = getAccountStatus(restaurant.status);
      return <Badge color={statusInfo.variant}>{statusInfo.label}</Badge>;
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <RestaurantActions restaurant={row.original} />,
    enableSorting: false,
  },
];
