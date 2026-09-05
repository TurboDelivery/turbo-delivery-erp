'use client';

import { Button, Dropdown } from '@heroui-v3/react';
import { useState } from 'react';
/*
 * Le declencheur du menu portait une icone de POUBELLE alors qu'il OUVRE un menu :
 * il annonçait une suppression a chaque ligne, y compris pour qui n'a pas le droit de
 * supprimer. Les trois points disent ce qu'il fait.
 */
import { IconDotsVertical as IconEllipsis } from '@tabler/icons-react';
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
        <Button aria-label="Actions sur cette zone tarifaire" isIconOnly variant="ghost">
          <IconEllipsis />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu aria-label="Actions sur cette zone tarifaire">
            {canEdit ? (
              <Dropdown.Item id="edit" onAction={() => setOpen(true)} textValue="Annuler">
                Annuler
              </Dropdown.Item>
            ) : null}
            {canDelete ? (
              <Dropdown.Item
                className="text-danger-soft-foreground"
                id="delete"
                onAction={() => setOpenDelete(true)}
                textValue="Supprimer"
              >
                Supprimer
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <PriceListeDelete id={id} open={openDelete} setOpen={setOpenDelete} />
    </>
  );
};

export default PriceListeTools;
