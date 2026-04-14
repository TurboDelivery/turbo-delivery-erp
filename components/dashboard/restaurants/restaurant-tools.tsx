'use client';

import { Restaurant } from '@/types/models';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import RestaurantValidate from './restaurant-validate';
import Link from 'next/link';
import { PaginatedResponse } from '@/types';
import { useAbility } from '@/hooks/use-ability';

const RestaurantTools = ({ restaurant, validateBy = 'no-body', setData, type }: {
    restaurant: Restaurant; validateBy: 'auth' | 'ops' | 'no-body',
    setData?: (data: PaginatedResponse<Restaurant> | null) => void; type?: string
}) => {
    const [open, setOpen] = useState<boolean>(false);
    const ability = useAbility();
    const canValidate = ability.can('valider', 'Restaurant');

    return (
      <>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="light" isIconOnly>
              <IconDotsVertical />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Static Actions">
            <DropdownItem as={Link} href={`/restaurants/${restaurant.id}`} key="details">
              Détails
            </DropdownItem>
            {validateBy !== 'no-body' && canValidate ? (
              <DropdownItem key="edit" onPress={() => setOpen(true)}>
                Valider
              </DropdownItem>
            ) : null}
          </DropdownMenu>
        </Dropdown>

        <RestaurantValidate restaurant={restaurant} open={open} setOpen={setOpen} validateBy={validateBy} setData={setData} type={type} />
      </>
    );
};

export default RestaurantTools;
