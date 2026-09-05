'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Dropdown } from '@heroui-v3/react';
import { IconDotsVertical } from '@tabler/icons-react';
import { Eye, UserRoundPlus, XCircle } from 'lucide-react';

import { CourseExterne, LivreurDisponible } from '@/types/models';
import { cancelCourseExterne } from '@/src/actions/courses.actions';
import { useAbility } from '@/hooks/use-ability';
import ConfirmModal from '@/components/ui/confirm-modal';
import DeliveryAssign from './delivery-assign';

/**
 * Menu d'actions d'une course externe (liste). Le détail complet est une page :
 * /external_delivery/{id}. L'annulation n'est possible que tant que la course
 * est EN_ATTENTE (règle backend).
 */
const DeliveryTools = ({ delivery, delivers }: { delivery: CourseExterne; delivers: LivreurDisponible[] }) => {
  const router = useRouter();
  const [openAssign, setOpenAssign] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const ability = useAbility();
  const canUpdate = ability.can('update', 'Commande');

  const enAttente = delivery?.statut?.toUpperCase() === 'EN_ATTENTE';

  async function handleCancel() {
    const restaurantId = delivery.restaurant?.id;
    if (!restaurantId) {
      toast.error('Restaurant de la course introuvable.');
      return;
    }
    setCancelPending(true);
    try {
      const result = await cancelCourseExterne(delivery.id, restaurantId);
      if (result.status === 'success') {
        toast.success('Course annulée.');
        setOpenCancel(false);
        router.refresh();
      } else {
        toast.error(result.message || "Impossible d'annuler la course.");
      }
    } finally {
      setCancelPending(false);
    }
  }

  return (
    <>
      {/*
       * `Dropdown.Trigger` rend son PROPRE bouton : le `Button` est enfant DIRECT du
       * `Dropdown`, faute de quoi on obtient un bouton dans un bouton.
       */}
      <Dropdown>
        <Button aria-label="Actions sur cette course" isIconOnly variant="ghost">
          <IconDotsVertical />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu aria-label="Actions de la course">
            <Dropdown.Item
              id="details"
              onAction={() => router.push(`/external_delivery/${delivery.id}`)}
              textValue="Voir le détail"
            >
              <Eye aria-hidden="true" className="size-4" />
              Voir le détail
            </Dropdown.Item>

            {enAttente && canUpdate ? (
              <Dropdown.Item
                id="assign"
                onAction={() => setOpenAssign(true)}
                textValue="Assigner un livreur"
              >
                <UserRoundPlus aria-hidden="true" className="size-4" />
                Assigner un livreur
              </Dropdown.Item>
            ) : null}

            {enAttente && canUpdate ? (
              <Dropdown.Item
                className="text-danger-soft-foreground"
                id="cancel"
                onAction={() => setOpenCancel(true)}
                textValue="Annuler la course"
              >
                <XCircle aria-hidden="true" className="size-4" />
                Annuler la course
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <DeliveryAssign delivery={delivery} delivers={delivers} open={openAssign} setOpen={setOpenAssign} />

      <ConfirmModal
        isOpen={openCancel}
        onClose={() => setOpenCancel(false)}
        title={`Annuler la course ${delivery.code ?? ''}`}
        isLoading={cancelPending}
        annuler="Retour"
        actions={[{ label: 'Annuler la course', onPress: handleCancel, variante: 'danger' }]}
      >
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-foreground">
            La course sera annulée et ne sera plus proposée aux livreurs. Le partenaire{' '}
            <b>{delivery.restaurant?.nomEtablissement ?? ''}</b> devra renvoyer une commande si besoin.
          </p>
          <p className="text-muted text-xs">Possible uniquement tant que la course est en attente.</p>
        </div>
      </ConfirmModal>
    </>
  );
};

export default DeliveryTools;
