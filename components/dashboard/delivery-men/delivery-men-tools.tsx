'use client';

import { DeliveryMan } from '@/types/models';
import { Button, Dropdown } from '@heroui-v3/react';
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
      {/*
       * `Dropdown.Trigger` rend son PROPRE bouton : le `Button` est enfant DIRECT du
       * `Dropdown`, faute de quoi on obtient un bouton dans un bouton.
       */}
      <Dropdown>
        <Button aria-label="Actions sur ce livreur" isIconOnly variant="ghost">
          <IconDotsVertical />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu aria-label="Actions sur ce livreur">
            <Dropdown.Item id="details" textValue="Détails">
              <Link href={`/delivery-men/men/${deliveryMan.id}`}>Détails</Link>
            </Dropdown.Item>
            {validateBy !== 'no-body' && canValidate ? (
              <Dropdown.Item id="valider" onAction={() => setOpen(true)} textValue="Valider">
                Valider
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <DeliveryMenValidate deliveryMan={deliveryMan} open={open} setOpen={setOpen} validateBy={validateBy} />
    </>
  );
};

export default DeliveryMenTools;
