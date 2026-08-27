'use client';

import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from '@/components/heroui';
import { useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import PriceListeDelete from './price-liste-delete';
import { useAbility } from '@/hooks/use-ability';

const PriceListeTools = ({ id }: { id: string }) => {
  const [, setOpen] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const ability = useAbility();
  const canEdit = ability.can('update', 'Restaurant');
  const canDelete = ability.can('delete', 'Restaurant');
  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button variant="light" isIconOnly>
            <IconTrash />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Static Actions">
          <DropdownSection showDivider title="Actions">
            {canEdit ? (
              <DropdownItem key="edit" onPress={() => setOpen(true)}>
                Annuler
              </DropdownItem>
            ) : null}
          </DropdownSection>
          {canDelete ? (
            <DropdownItem key="delete" className="text-danger" color="danger" onPress={() => setOpenDelete(true)}>
              Suprimer
            </DropdownItem>
          ) : null}
        </DropdownMenu>
      </Dropdown>

      <PriceListeDelete id={id} open={openDelete} setOpen={setOpenDelete} />
    </>
  );
};

export default PriceListeTools;
