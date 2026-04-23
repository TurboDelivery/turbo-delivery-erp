'use client';

import React, { useState } from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { MoreVertical } from 'lucide-react';
import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { type LivreurStatutVM } from '@/types/models';
import DeliveryMenStatusValidate from '@/components/dashboard/delivery-men/delivery-men-status-validate';
import { UpdateTurboyTypeModal } from '@/components/turboys/modals';
import { useRejectTurboyMutation } from '@/features/turboys/queries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function turboyToLivreurStatut(turboy: ITurboy): LivreurStatutVM {
  // L'API renvoie directement 2=auth pending, 3=ops pending, 4=actif, 5=rejeté
  // Les valeurs 0 et 1 (ancien format) sont converties
  const status = turboy.status === 1 ? 4 : turboy.status === 0 ? 5 : turboy.status;
  return {
    livreurId: turboy.id,
    nomPrenom: `${turboy.prenoms} ${turboy.nom}`,
    telephone: turboy.telephone ?? '',
    avatarUrl: turboy.avatarUrl ?? '',
    status,
    type: 'TURBO',
  };
}

type MenuItem = { key: string; label: string };

export function TurboyActionMenu({ turboy }: { turboy: ITurboy }) {
  const router = useRouter();
  const [openValidate, setOpenValidate] = useState(false);
  const [openUpdateType, setOpenUpdateType] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const rejectMutation = useRejectTurboyMutation();
  const mapped = turboyToLivreurStatut(turboy);
  const validateBy: 'auth' | 'ops' | 'no-body' =
    mapped.status === 2 ? 'auth' : mapped.status === 3 ? 'ops' : 'no-body';

  const items: MenuItem[] = [
    { key: 'details', label: 'Détails' },
    { key: 'edit', label: 'Modifier' },
    { key: 'change-type', label: 'Changer le type' },
    ...(validateBy === 'auth' ? [{ key: 'validate', label: 'Valider' }] : []),
    ...(validateBy === 'ops' ? [{ key: 'activate', label: 'Activer' }] : []),
    { key: 'delete', label: 'Rejeter' },
  ];

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button variant="light" isIconOnly size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Actions du livreur"
          items={items}
          onAction={(key) => {
            if (key === 'details') router.push(`/delivery-men/men/${turboy.id}`);
            if (key === 'edit') router.push(`/delivery-men/men/${turboy.id}`);
            if (key === 'change-type') setOpenUpdateType(true);
            if (key === 'validate' || key === 'activate') setOpenValidate(true);
            if (key === 'delete') setOpenDelete(true);
          }}
        >
          {(item) => (
            <DropdownItem
              key={item.key}
              className={item.key === 'delete' ? 'text-danger' : ''}
              color={item.key === 'delete' ? 'danger' : 'default'}
            >
              {item.label}
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
      {validateBy !== 'no-body' && (
        <DeliveryMenStatusValidate
          deliveryMan={mapped}
          open={openValidate}
          setOpen={setOpenValidate}
          validateBy={validateBy}
        />
      )}
      <UpdateTurboyTypeModal isOpen={openUpdateType} onOpenChange={setOpenUpdateType} turboy={turboy} />
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter le livreur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir rejeter{' '}
              <strong>
                {turboy.prenoms} {turboy.nom}
              </strong>{' '}? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate(turboy.id)}
            >
              {rejectMutation.isPending ? 'Rejet...' : 'Rejeter'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
