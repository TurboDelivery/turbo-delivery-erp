'use client';

import { Collection } from '@/types/models';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@heroui/react";
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import TypePlatEdit from './type-plats-edit';
import { useAbility } from '@/hooks/use-ability';

const TypePlatsTools = ({ typePlat }: { typePlat: Collection }) => {
    const [open, setOpen] = useState<boolean>(false);
    const ability = useAbility();
    const canUpdate = ability.can('manage', 'Menu');
    return (
      <>
        {' '}
        <Dropdown>
          <DropdownTrigger>
            <Button variant="light" isIconOnly>
              <IconDotsVertical />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Static Actions">
            <DropdownSection showDivider title="Actions">
              {canUpdate ? (
                <DropdownItem key="edit" onPress={() => setOpen(true)}>
                  Modifier
                </DropdownItem>
              ) : null}
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
        <TypePlatEdit typePlat={typePlat} open={open} setOpen={setOpen} />
      </>
    );
};

export default TypePlatsTools;
