'use client';

import React, { useState } from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { MoreVertical } from 'lucide-react';
import { type ITurboy } from '@/features/turboys/types/turboys.types';
import { type LivreurStatutVM } from '@/types/models';
import DeliveryMenStatusValidate from '@/components/dashboard/delivery-men/delivery-men-status-validate';

export function turboyToLivreurStatut(turboy: ITurboy): LivreurStatutVM {
  return {
    livreurId: turboy.id,
    nomPrenom: `${turboy.prenoms} ${turboy.nom}`,
    telephone: turboy.telephone ?? '',
    avatarUrl: turboy.avatarUrl ?? '',
    // ITurboy: 0=Inactif, 1=Activé, other=En attente
    // LivreurStatutVM: 2=En attente(auth), 3=Validé(ops), 4=Activé, 5=Rejeté
    status: turboy.status === 1 ? 4 : turboy.status === 0 ? 5 : 2,
    type: 'TURBO',
  };
}

type MenuItem = { key: string; label: string };

export function TurboyActionMenu({ turboy }: { turboy: ITurboy }) {
  const router = useRouter();
  const [openValidate, setOpenValidate] = useState(false);
  const mapped = turboyToLivreurStatut(turboy);
  const validateBy: 'auth' | 'ops' | 'no-body' =
    mapped.status === 2 ? 'auth' : mapped.status === 3 ? 'ops' : 'no-body';

  const items: MenuItem[] = [
    { key: 'details', label: 'Détails' },
    ...(validateBy === 'auth' ? [{ key: 'validate', label: 'Valider' }] : []),
    ...(validateBy === 'ops' ? [{ key: 'activate', label: 'Activer' }] : []),
  ];

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button variant="light" isIconOnly size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Actions du livreur"
          items={items}
          onAction={(key) => {
            if (key === 'details') router.push(`/delivery-men/${turboy.id}`);
            if (key === 'validate' || key === 'activate') setOpenValidate(true);
          }}
        >
          {(item) => <DropdownItem key={item.key}>{item.label}</DropdownItem>}
        </DropdownMenu>
      </Dropdown>
      {validateBy !== 'no-body' && (
        <DeliveryMenStatusValidate
          deliveryMan={mapped}
          open={openValidate}
          setOpen={setOpenValidate}
          validateBy={validateBy}
        />
      )}
    </>
  );
}
