'use client';


import { useState } from 'react';
import { AiOutlineEye } from 'react-icons/ai';
import DeliveryAssign from './delivery-assign';
import DeliveryDetails from './delivery-details';
import { IconDotsVertical } from '@tabler/icons-react';
import { MdAssignmentInd, MdCancel } from 'react-icons/md';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@heroui/react";


const DeliveryTools = ({ delivery, delivers }: { delivery: CourseExterne; delivers: LivreurDisponible[] }) => {
    const [openAssign, setOpenAssign] = useState<boolean>(false);
    const [openDetail, setOpenDetail] = useState<boolean>(false);

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
                            onClick={() => setOpenDetail(true)}
                        >
                            Voir les détails
                        </DropdownItem>

                        {delivery?.statut === 'EN_ATTENTE' ? (
                            <DropdownItem
                                key="assign"
                                startContent={<MdAssignmentInd className="text-success text-lg" />}
                                onClick={() => setOpenAssign(true)}
                            >
                                Assigner la course
                            </DropdownItem>
                        ) : null}

                        <DropdownItem
                            key="cancel"
                            startContent={<MdCancel className="text-danger text-lg" />}
                            onClick={() => console.log('Annuler la course')}
                        >
                            Annuler
                        </DropdownItem>
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
