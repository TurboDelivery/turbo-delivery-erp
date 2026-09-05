'use client';

import { ColumnDef } from '@tanstack/react-table';
import { IRestaurant } from '@/features/restaurants/types/restaurant.type';
import { Avatar, Button, Chip, Dropdown } from '@heroui-v3/react';
import { AlertTriangle, BadgeCheck, CheckCircle2, Diamond, Eye, MoreHorizontal, Pencil, PowerOff, RefreshCw, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ui/confirm-modal';
import { useDeleteRestaurantMutation, useToggleRestaurantMutation } from '@/features/restaurants/queries/restaurant-list.query';
import { toast } from 'sonner';

/**
 * La pastille d'initiale d'un partenaire.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait une pastille peinte parmi DIX couleurs Tailwind brutes, choisie par le code
 * de la premiere lettre : `bg-red-500`, `bg-yellow-500`, `bg-pink-500`… Trois problemes.
 * Le rouge de la liste tombait sur le meme rouge que la marque et que le danger, sur des
 * lignes ou rien n'allait mal. Le texte etait ecrit en BLANC sur les dix, y compris sur le
 * jaune, ou le contraste vaut moins de 2:1 — l'initiale y etait illisible. Et un arc-en-ciel
 * sur toute une liste de partenaires ne laisse plus rien pour signaler ce qui appelle une
 * action.</p>
 *
 * <p>L'identite d'un partenaire, c'est son NOM, ecrit juste a cote.</p>
 */
export function PastilleNom({ nom, taille = 'md' }: { nom: string; taille?: 'md' | 'sm' }) {
  return (
    <Avatar className={taille === 'sm' ? 'size-8 shrink-0' : 'size-9 shrink-0'}>
      <Avatar.Fallback>{nom?.[0]?.toUpperCase() ?? '?'}</Avatar.Fallback>
    </Avatar>
  );
}

// ── Statut ───────────────────────────────────────────────────────────────────
// Codes backend (RestaurantTable.status) : 0 = désactivé, 2 = partiellement
// validé (état legacy intermédiaire), 1/3 = compte actif normal. Même source de
// vérité et même règle que le badge ACTIF/INACTIF de la fiche (actif = status ≠ 0).
/**
 * Le statut d'un partenaire, et sa commission quand elle est gratuite.
 *
 * <p>La commission GRATUITE etait testee EN PREMIER et rendait a la place du statut : un
 * partenaire desactive dont la commission est gratuite s'affichait « Gratuite », jamais
 * « Inactif ». La colonne « Statut » mentait donc sur toute une population, et rien
 * ailleurs dans la ligne ne rattrapait l'information. Ce sont deux choses : le statut, qui
 * dit si le compte fonctionne, et la commission, qui dit combien il paie. Les deux
 * s'affichent.</p>
 */
export function StatusChip({
  status,
  typeCommission,
}: {
  status: number | null | undefined;
  typeCommission?: string;
}) {
  const statut =
    status === 0
      ? { libelle: 'Inactif', ton: 'danger' as const }
      : status === 2
        ? { libelle: 'Partiellement validé', ton: 'warning' as const }
        : status != null && status >= 1
          ? { libelle: 'Validé', ton: 'success' as const }
          : { libelle: '—', ton: 'default' as const };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Chip color={statut.ton} size="sm" variant="soft">
        <Chip.Label>{statut.libelle}</Chip.Label>
      </Chip>
      {typeCommission === 'GRATUIT' && (
        <Chip size="sm" variant="soft">
          <Chip.Label>Commission gratuite</Chip.Label>
        </Chip>
      )}
    </div>
  );
}

// ── Cycle de paiement ────────────────────────────────────────────────────────
const RECOUVREMENT_LABELS: Record<string, string> = {
  MENSUEL: 'Mensuel',
  QUOTIDIEN: 'Quotidien',
  HEBDOMADAIRE: 'Hebdomadaire',
  QUINZAINE: 'Quinzaine',
};

// ── Actions dropdown ─────────────────────────────────────────────────────────
export function ActionsMenu({ id, name, status }: { id: string; name: string; status: number }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const router = useRouter();
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
      {/*
       * Le menu venait de shadcn, la seule bibliotheque de composants encore melangee ici,
       * et son declencheur etait un `<button>` nu portant son propre anneau de focus a la
       * main. Les deux gestes destructifs etaient peints en `text-orange-600` et
       * `text-red-600`, avec des fonds de survol `bg-orange-50` / `bg-red-50` sans
       * variante sombre : en theme sombre, du rouge fonce sur un fond rouge tres clair.
       *
       * `Dropdown.Trigger` rend son PROPRE bouton : le `Button` est enfant DIRECT du
       * `Dropdown`, faute de quoi on obtient un bouton dans un bouton.
       */}
      <Dropdown>
        <Button aria-label={`Actions sur ${name}`} isIconOnly size="sm" variant="ghost">
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu aria-label={`Actions sur ${name}`}>
            <Dropdown.Item
              id="voir"
              onAction={() => router.push(`/restaurants/${id}`)}
              textValue="Voir"
            >
              <Eye aria-hidden="true" className="size-4" />
              Voir
            </Dropdown.Item>
            <Dropdown.Item
              id="modifier"
              onAction={() => router.push(`/restaurants/${id}/edit`)}
              textValue="Modifier"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Modifier
            </Dropdown.Item>
            <Dropdown.Item
              id="basculer"
              onAction={() => setToggleModalOpen(true)}
              textValue={isActive ? 'Désactiver' : 'Réactiver'}
            >
              {isActive ? (
                <PowerOff aria-hidden="true" className="size-4" />
              ) : (
                <RefreshCw aria-hidden="true" className="size-4" />
              )}
              {isActive ? 'Désactiver' : 'Réactiver'}
            </Dropdown.Item>
            <Dropdown.Item
              className="text-danger-soft-foreground"
              id="supprimer"
              onAction={() => setDeleteModalOpen(true)}
              textValue="Supprimer"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Supprimer
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <ConfirmModal
        isOpen={toggleModalOpen}
        onClose={() => setToggleModalOpen(false)}
        title={isActive ? `Désactiver "${name}"` : `Réactiver "${name}"`}
        isLoading={toggleMutation.isPending}
        actions={[
          {
            label: isActive ? 'Désactiver' : 'Réactiver',
            onPress: handleToggle,
            variante: isActive ? 'danger-soft' : 'primary',
          },
        ]}
      >
        <div className="flex flex-col gap-2 text-sm">
          {isActive ? (
            <>
              <p className="text-foreground">Le partenaire sera désactivé. Il n&apos;apparaîtra plus comme actif et aucune nouvelle commande ne lui sera attribuée.</p>
              <p className="text-muted text-xs">Les données historiques (avant désactivation) restent intactes. Le partenaire peut être réactivé à tout moment.</p>
            </>
          ) : (
            <p className="text-foreground">Le partenaire sera réactivé et pourra à nouveau recevoir des commandes.</p>
          )}
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={`Supprimer "${name}"`}
        isLoading={isLoading}
        actions={[
          {
            label: 'Supprimer, historique conservé',
            onPress: handleSoftDelete,
            variante: 'danger-soft',
          },
          { label: 'Suppression totale', onPress: handleHardDelete, variante: 'danger' },
        ]}
      >
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-start gap-2 p-3 bg-surface-secondary rounded-lg border border-separator">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
            <div>
              <p className="font-medium text-foreground">Supprimer en conservant l&apos;historique</p>
              <p className="text-muted text-xs mt-0.5">Le partenaire est supprimé mais les données de livraison associées sont conservées.</p>
            </div>
          </div>
          {/* Ce bloc etait peint en `bg-red-50 border-red-200 text-red-700 text-red-500` :
              quatre classes de la palette brute, sans variante sombre. Sur un poste en
              theme sombre, l'avertissement de SUPPRESSION DEFINITIVE — le seul texte qui
              distingue les deux boutons — etait du rouge fonce sur du rouge tres clair. */}
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
            <div>
              <p className="font-medium text-danger-soft-foreground">
                Suppression totale — irréversible
              </p>
              <p className="mt-0.5 text-xs text-danger-soft-foreground">
                Le partenaire <strong>et toutes ses données</strong> de livraison seront
                définitivement supprimés. Cette action ne peut pas être annulée.
              </p>
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
    header: 'Partenaire',
    cell: ({ row }) => {
      const r = row.original;
      const isVerified = r.status != null && r.status >= 1;
      const isGratuite = r.typeCommission === 'GRATUIT';
      return (
        <div className="flex min-w-[160px] items-center gap-3">
          <PastilleNom nom={r.nomEtablissement ?? ''} taille="sm" />
          <span className="text-sm font-medium text-foreground capitalize">
            {r.nomEtablissement}
          </span>
          {/* Les deux badges etaient peints en `text-blue-500` et `text-amber-500`, deux
              couleurs brutes qui n'appartiennent a aucune palette de l'ERP. Et ils
              n'avaient AUCUN titre : deux petits symboles a cote d'un nom, sans rien qui
              dise ce qu'ils veulent dire. */}
          {isVerified && !isGratuite && (
            <BadgeCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
          )}
          {isGratuite && (
            <Diamond aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span className="text-sm text-muted">{row.original.email || '-'}</span>,
    enableSorting: true,
  },
  {
    id: 'telephone',
    accessorKey: 'telephone',
    header: 'Téléphone',
    cell: ({ row }) => <span className="text-sm text-muted">{row.original.telephone || '-'}</span>,
    enableSorting: true,
  },
  {
    id: 'localisation',
    accessorKey: 'localisation',
    header: 'Localisation',
    cell: ({ row }) => (
      <span className="text-sm text-muted">{row.original.localisation || row.original.commune || '-'}</span>
    ),
    enableSorting: true,
  },
  {
    id: 'methodRecouvrement',
    accessorKey: 'methodRecouvrement',
    header: 'Cycle de paiement',
    cell: ({ row }) => (
      <span className="text-sm text-muted">
        {RECOUVREMENT_LABELS[row.original.methodRecouvrement] ?? row.original.methodRecouvrement ?? '-'}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => (
      <StatusChip status={row.original.status} typeCommission={row.original.typeCommission} />
    ),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ActionsMenu id={row.original.id} name={row.original.nomEtablissement} status={row.original.status} />,
    enableSorting: false,
  },
];

