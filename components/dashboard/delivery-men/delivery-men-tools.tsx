'use client';

import { DeliveryMan } from '@/types/models';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@/components/heroui';
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import DeliveryMenValidate from './delivery-men-validate';
import Link from 'next/link';
import { useAbility } from '@/hooks/use-ability';

const DeliveryMenTools = ({ deliveryMan, validateBy }: { deliveryMan: DeliveryMan; validateBy: 'auth' | 'ops' | 'no-body' }) => {
  const [open, setOpen] = useState<boolean>(false);
  const ability = useAbility();
  const canValidate = ability.can('update', 'Livreur');

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button variant="light" isIconOnly>
            <IconDotsVertical />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Static Actions">
          <DropdownItem as={Link} href={`/delivery-men/men/${deliveryMan.id}`} key="details">
            Détails
          </DropdownItem>

          {validateBy !== 'no-body' && canValidate ? (
            <DropdownItem key="edit" onPress={() => setOpen(true)}>
              Valider
            </DropdownItem>
          ) : null}
        </DropdownMenu>
      </Dropdown>
      <DeliveryMenValidate deliveryMan={deliveryMan} open={open} setOpen={setOpen} validateBy={validateBy} />
    </>
  );
};

export default DeliveryMenTools;
