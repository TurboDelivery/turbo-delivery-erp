'use client';

import React, { useState } from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Tooltip } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { MoreVertical } from 'lucide-react';
import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { type LivreurStatutVM, type Restaurant } from '@/types/models';
import DeliveryMenStatusValidate from '@/components/dashboard/delivery-men/delivery-men-status-validate';
import { UpdateTurboyTypeModal } from '@/components/turboys/modals';
import { useDeleteTurboyMutation, useRejectTurboyMutation, turboyKeys } from '@/features/turboys/queries';
import { UpdateDeliveryDialog } from '@/app/(protected)/delivery-men/update-delivery/update-delivery';
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
  const status = turboy.status === 1 ? 4 : turboy.status === 0 ? 5 : turboy.status ?? undefined;
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

export function TurboyActionMenu({ turboy, restaurants }: { turboy: ITurboy; restaurants?: Restaurant[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openValidate, setOpenValidate] = useState(false);
  const [openUpdateType, setOpenUpdateType] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const deleteMutation = useDeleteTurboyMutation();
  const rejectMutation = useRejectTurboyMutation();

  const invalidateTurboys = () => {
    queryClient.invalidateQueries({ queryKey: turboyKeys.lists() });
  };

  if (turboy.status == null) {
    return (
      <Tooltip
        content="Ce livreur est à l'étape 1 de son inscription. Aucune action n'est disponible pour le moment."
        color="secondary"
        placement="left"
        classNames={{ content: 'max-w-[220px] text-xs' }}
      >
        <span>
          <Button variant="light" isIconOnly size="sm" isDisabled>
            <MoreVertical className="w-4 h-4 opacity-30" />
          </Button>
        </span>
      </Tooltip>
    );
  }

  const mapped = turboyToLivreurStatut(turboy);
  const validateBy: 'auth' | 'ops' | 'no-body' =
    mapped.status === 2 ? 'auth' : mapped.status === 3 ? 'ops' : 'no-body';

  const isInactive = turboy.status === 0 || turboy.status === 5;

  // Pour le modal : on réutilise 'ops' pour réactiver un livreur inactif
  const modalValidateBy: 'auth' | 'ops' = validateBy !== 'no-body' ? validateBy : 'ops';

  const isAssigned = turboy.type === 'TURBO';
  const isWaiting = turboy.type === 'WAITING';

  const assignLabel = isAssigned
    ? 'Réassigner'
    : isWaiting
    ? "Confirmer l'assignation"
    : 'Assigner';

  const items: MenuItem[] = [
    { key: 'details', label: 'Détails' },
    { key: 'edit', label: 'Modifier' },
    { key: 'change-type', label: 'Changer le type' },
    ...(validateBy === 'auth' ? [{ key: 'validate', label: 'Valider' }] : []),
    ...(validateBy === 'ops' || isInactive ? [{ key: 'activate', label: 'Activer' }] : []),
    { key: 'assign', label: assignLabel },
    { key: 'reject', label: 'Rejeter' },
    { key: 'delete', label: 'Supprimer' },
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
            if (key === 'assign') setOpenAssign(true);
            if (key === 'reject') setOpenReject(true);
            if (key === 'delete') setOpenDelete(true);
          }}
        >
          {(item) => (
            <DropdownItem
              key={item.key}
              className={item.key === 'delete' || item.key === 'reject' ? 'text-danger' : ''}
              color={item.key === 'delete' || item.key === 'reject' ? 'danger' : 'default'}
            >
              {item.label}
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
      {(validateBy !== 'no-body' || isInactive) && (
        <DeliveryMenStatusValidate
          deliveryMan={mapped}
          open={openValidate}
          setOpen={setOpenValidate}
          validateBy={modalValidateBy}
          onSuccess={invalidateTurboys}
        />
      )}
      <UpdateTurboyTypeModal isOpen={openUpdateType} onOpenChange={setOpenUpdateType} turboy={turboy} />
      <UpdateDeliveryDialog
        isOpen={openAssign}
        onClose={() => setOpenAssign(false)}
        livreur={mapped}
        typeLiveur="TURBO"
        isReassign={isAssigned}
        title={assignLabel}
        restaurants={restaurants ?? []}
        onSuccess={invalidateTurboys}
      />
      <AlertDialog open={openReject} onOpenChange={setOpenReject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter le livreur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir rejeter{' '}
              <strong>
                {turboy.prenoms} {turboy.nom}
              </strong>{' '}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate(turboy.id)}
            >
              {rejectMutation.isPending ? 'Rejet en cours...' : 'Rejeter'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le livreur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong>
                {turboy.prenoms} {turboy.nom}
              </strong>{' '}? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(turboy.id)}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
