'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from '@heroui/react';
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
      <Dropdown>
        <DropdownTrigger>
          <Button variant="light" isIconOnly aria-label="Actions">
            <IconDotsVertical />
          </Button>
        </DropdownTrigger>

        <DropdownMenu aria-label="Actions de la course">
          <DropdownSection showDivider title="Actions">
            <DropdownItem
              key="details"
              startContent={<Eye className="w-4 h-4 text-primary" />}
              onPress={() => router.push(`/external_delivery/${delivery.id}`)}
            >
              Voir le détail
            </DropdownItem>

            {enAttente && canUpdate ? (
              <DropdownItem
                key="assign"
                startContent={<UserRoundPlus className="w-4 h-4 text-success" />}
                onPress={() => setOpenAssign(true)}
              >
                Assigner un livreur
              </DropdownItem>
            ) : null}

            {enAttente && canUpdate ? (
              <DropdownItem
                key="cancel"
                className="text-danger"
                color="danger"
                startContent={<XCircle className="w-4 h-4" />}
                onPress={() => setOpenCancel(true)}
              >
                Annuler la course
              </DropdownItem>
            ) : null}
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>

      <DeliveryAssign delivery={delivery} delivers={delivers} open={openAssign} setOpen={setOpenAssign} />

      <ConfirmModal
        isOpen={openCancel}
        onClose={() => setOpenCancel(false)}
        title={`Annuler la course ${delivery.code ?? ''}`}
        isLoading={cancelPending}
        size="sm"
        actions={[
          { label: 'Retour', color: 'default', variant: 'bordered', onPress: () => setOpenCancel(false) },
          { label: 'Annuler la course', color: 'danger', variant: 'solid', onPress: handleCancel },
        ]}
      >
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-gray-700">
            La course sera annulée et ne sera plus proposée aux livreurs. Le partenaire{' '}
            <b>{delivery.restaurant?.nomEtablissement ?? ''}</b> devra renvoyer une commande si besoin.
          </p>
          <p className="text-gray-500 text-xs">Possible uniquement tant que la course est en attente.</p>
        </div>
      </ConfirmModal>
    </>
  );
};

export default DeliveryTools;
