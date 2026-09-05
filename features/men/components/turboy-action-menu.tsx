'use client';

import React, { useState } from 'react';
import { Button, Dropdown, Separator, Tooltip } from '@heroui-v3/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { MoreVertical } from 'lucide-react';
import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { type LivreurStatutVM, type Restaurant } from '@/types/models';
import DeliveryMenStatusValidate from '@/components/dashboard/delivery-men/delivery-men-status-validate';
import { UpdateTurboyTypeModal } from '@/components/turboys/modals';
import { useRejectTurboyMutation, usePasserEnBirdMutation, turboyKeys } from '@/features/turboys/queries';
import { UpdateDeliveryDialog } from '@/app/(protected)/delivery-men/update-delivery/update-delivery';
import { useAbility } from '@/hooks/use-ability';
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

type MenuItem = { danger?: boolean; key: string; label: string };

export function TurboyActionMenu({
  turboy,
  restaurants,
  hideNavigation,
}: {
  turboy: ITurboy;
  restaurants?: Restaurant[];
  // Masque « Détails » / « Modifier » quand le menu est rendu DANS la fiche détail
  // (ces items y sont redondants — on ne garde que le cycle de vie / l'affectation).
  hideNavigation?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const ability = useAbility();
  const canEdit = ability.can('update', 'Livreur');
  const [openValidate, setOpenValidate] = useState(false);
  const [openUpdateType, setOpenUpdateType] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openBird, setOpenBird] = useState(false);
  const rejectMutation = useRejectTurboyMutation();
  const birdMutation = usePasserEnBirdMutation();

  const invalidateTurboys = () => {
    queryClient.invalidateQueries({ queryKey: turboyKeys.lists() });
    // Rafraîchit aussi la fiche détail (le menu peut y être rendu — l'en-tête,
    // le statut et le panneau habilitation doivent refléter la nouvelle valeur).
    queryClient.invalidateQueries({ queryKey: turboyKeys.detail(turboy.id) });
  };

  if (turboy.status == null) {
    return (
      // Un bouton desactive n'emet ni survol ni focus : l'info-bulle doit envelopper
      // autre chose que lui, sinon elle ne s'ouvre jamais.
      <Tooltip>
        <span className="inline-flex">
          <Button aria-label="Aucune action disponible" isDisabled isIconOnly size="sm" variant="ghost">
            <MoreVertical aria-hidden="true" className="size-4" />
          </Button>
        </span>
        <Tooltip.Content className="max-w-[220px] text-xs">
          Ce livreur est à l&apos;étape 1 de son inscription. Aucune action n&apos;est disponible
          pour le moment.
        </Tooltip.Content>
      </Tooltip>
    );
  }

  const mapped = turboyToLivreurStatut(turboy);
  const validateBy: 'auth' | 'ops' | 'no-body' =
    mapped.status === 2 ? 'auth' : mapped.status === 3 ? 'ops' : 'no-body';

  const isInactive = turboy.status === 0 || turboy.status === 5;
  const isActive = turboy.status === 4;

  // Pour le modal : on réutilise 'ops' pour réactiver un livreur inactif
  const modalValidateBy: 'auth' | 'ops' = validateBy !== 'no-body' ? validateBy : 'ops';

  const isAssigned = turboy.type === 'TURBO';
  const isWaiting = turboy.type === 'WAITING';

  const assignLabel = isAssigned
    ? 'Réassigner'
    : isWaiting
    ? "Confirmer l'assignation"
    : 'Assigner';

  // Actions regroupées par finalité, visibilité contextuelle selon l'état du
  // compte (status) et de l'assignation (type). Tout sauf « Détails » exige le
  // droit d'édition. « Supprimer » n'est volontairement plus dans le menu rapide
  // (action trop sensible — réservée à la fiche détail).
  const groups: MenuItem[][] = [
    // Consulter / éditer (masqué dans la fiche détail — cf. hideNavigation)
    hideNavigation
      ? []
      : [
          { key: 'details', label: 'Détails' },
          ...(canEdit ? [{ key: 'edit', label: 'Modifier' }] : []),
        ],
    // Cycle de vie du compte
    canEdit
      ? [
          ...(validateBy === 'auth' ? [{ key: 'validate', label: 'Valider' }] : []),
          ...(validateBy === 'ops' || isInactive ? [{ key: 'activate', label: 'Activer' }] : []),
          ...(isActive ? [{ key: 'reject', label: 'Désactiver', danger: true }] : []),
        ]
      : [],
    // Affectation (pertinente seulement pour un compte actif ou en attente d'assignation)
    canEdit
      ? [
          ...(isWaiting || isActive ? [{ key: 'assign', label: assignLabel }] : []),
          ...(isAssigned ? [{ key: 'bird', label: 'Passer en Bird', danger: true }] : []),
        ]
      : [],
    // Classification (sensible — uniquement sur un compte actif)
    canEdit && isActive ? [{ key: 'change-type', label: 'Changer le type' }] : [],
  ];

  // Les groupes vides disparaissent ; ceux qui restent sont séparés à l'affichage.
  const visibleGroups = groups.filter((g) => g.length > 0);

  return (
    <>
      {/*
       * Le `Button` est enfant DIRECT de `Dropdown`, sans `Dropdown.Trigger` : ce dernier
       * rend son propre `<button>`, et lui en donner un produisait un bouton DANS un
       * bouton — balisage invalide et erreur d'hydratation a chaque rendu de ligne.
       */}
      <Dropdown>
        <Button aria-label={`Actions pour ${turboy.prenoms} ${turboy.nom}`} isIconOnly size="sm" variant="ghost">
          <MoreVertical aria-hidden="true" className="size-4" />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu
            aria-label="Actions du livreur"
            onAction={(key) => {
              if (key === 'details') router.push(`/delivery-men/men/${turboy.id}`);
              if (key === 'edit') router.push(`/delivery-men/men/${turboy.id}`);
              if (key === 'change-type') setOpenUpdateType(true);
              if (key === 'validate' || key === 'activate') setOpenValidate(true);
              if (key === 'assign') setOpenAssign(true);
              if (key === 'bird') setOpenBird(true);
              if (key === 'reject') setOpenReject(true);
            }}
          >
            {/*
             * Les actions restent groupées par finalité — consulter, cycle de vie,
             * affectation, classification — avec un trait entre les groupes.
             */}
            {visibleGroups.flatMap((groupe, gi) => [
              ...(gi > 0 ? [<Separator key={`sep-${gi}`} />] : []),
              ...groupe.map((item) => (
                <Dropdown.Item id={item.key} key={item.key} variant={item.danger ? 'danger' : undefined}>
                  {item.label}
                </Dropdown.Item>
              )),
            ])}
          </Dropdown.Menu>
        </Dropdown.Popover>
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
            <AlertDialogTitle>Désactiver le livreur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir désactiver{' '}
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
              {rejectMutation.isPending ? 'Désactivation...' : 'Désactiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={openBird} onOpenChange={setOpenBird}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Passer en Bird</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir dissocier{' '}
              <strong>
                {turboy.prenoms} {turboy.nom}
              </strong>{' '}
              de son restaurant et le remettre dans le pool Bird ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={birdMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={birdMutation.isPending}
              onClick={() => birdMutation.mutate(turboy.id)}
            >
              {birdMutation.isPending ? 'En cours...' : 'Passer en Bird'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
