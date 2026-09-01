'use client'

import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownSection,
    DropdownItem,
} from "@/components/heroui";
import { IconMap, IconUser } from "@tabler/icons-react";



export default function DropDownAction({ id }: { id: string }) {
    const iconClasses = "text-xl text-default-500 pointer-events-none shrink-0";

    return (
        <Dropdown>
            <DropdownTrigger>
                <span className="cursor-pointer">•••</span>
            </DropdownTrigger>
            <DropdownMenu aria-label="Dropdown menu with description" variant="faded">
                <DropdownSection showDivider title="Actions">
                    <DropdownItem
                        key="profile"
                        href={`/delivery-men/profil/${id}`}
                        description="Voir Profile"
                        startContent={<IconUser className={iconClasses} />}
                    >
                        Voir profile
                    </DropdownItem>
                    <DropdownItem
                        key="carte"
                        href={`/trafic?turboysId=${id}`}
                        description="position sur la carte du livreur"
                        startContent={<IconMap className={iconClasses} />}

                    >
                        Voir la position sur la carte
                    </DropdownItem>
                    <DropdownItem
                        key="performance-details"
                        href={`/delivery-men/creneau-progressionById/${id}`}
                        description="voir les details"
                        startContent={<IconUser className={iconClasses} />}
                    >
                        Afficher les créneaux
                    </DropdownItem>
                </DropdownSection>
            </DropdownMenu>
        </Dropdown>
    );
}
