'use client';


import { useState } from 'react';
import { AiOutlineEye } from 'react-icons/ai';
import DeliveryAssign from './delivery-assign';
import DeliveryDetails from './delivery-details';
import { IconDotsVertical } from '@tabler/icons-react';
import { MdAssignmentInd, MdCancel } from 'react-icons/md';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@heroui/react";
import { useAbility } from '@/hooks/use-ability';


const DeliveryTools = ({ delivery, delivers }: { delivery: CourseExterne; delivers: LivreurDisponible[] }) => {
    const [openAssign, setOpenAssign] = useState<boolean>(false);
    const [openDetail, setOpenDetail] = useState<boolean>(false);
    const ability = useAbility();
    const canUpdate = ability.can('update', 'Commande');

    return (
        <>
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="light" isIconOnly>
                        <IconDotsVertical />
                    </Button>
                </DropdownTrigger>

                <DropdownMenu aria-label="Actions de livraison">
                    <DropdownSection showDivider title="Actions">
                        <DropdownItem
                            key="details"
                            startContent={<AiOutlineEye className="text-primary text-lg" />}
                            onPress={() => setOpenDetail(true)}
                        >
                            Voir les détails
                        </DropdownItem>

                        {delivery?.statut === 'EN_ATTENTE' && canUpdate ? (
                            <DropdownItem
                                key="assign"
                                startContent={<MdAssignmentInd className="text-success text-lg" />}
                                onPress={() => setOpenAssign(true)}
                            >
                                Assigner la course
                            </DropdownItem>
                        ) : null}

                        {canUpdate ? (
                            <DropdownItem
                                key="cancel"
                                startContent={<MdCancel className="text-danger text-lg" />}
                                onPress={() => console.log('Annuler la course')}
                            >
                                Annuler
                            </DropdownItem>
                        ) : null}
                    </DropdownSection>

                </DropdownMenu>
            </Dropdown>

            {/* Modal d’assignation */}
            <DeliveryAssign delivery={delivery} delivers={delivers} open={openAssign} setOpen={setOpenAssign} />
            <DeliveryDetails delivery={delivery} open={openDetail} setOpen={setOpenDetail} />
        </>
    );
};

export default DeliveryTools;
