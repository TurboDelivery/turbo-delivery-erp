'use client';

import { User } from '@/types/models';
import UsersEdit from './users-edit';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@/components/heroui";
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import UsersDeleteRestaure from './users-delete-restaure';
import UsersDisableEnable from './users-disable-enable';
import UsersResetPassword from './users-reset-password';
import { useAbility } from '@/hooks/use-ability';

const UsersTools = ({ user, value }: { user: User; value: 'list' | 'grid' }) => {
    const [open, setOpen] = useState<boolean>(false);
    const [openDelete, setOpenDelete] = useState<boolean>(false);
    const [openDisableEnable, setOpenDisableEnable] = useState<boolean>(false);
    const [openResetPassword, setOpenResetPassword] = useState<boolean>(false);
    const ability = useAbility();
    const canUpdate = ability.can('update', 'Utilisateur');
    const canDelete = ability.can('delete', 'Utilisateur');
    return (
        <>
            {value === 'list' && (
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
                            {canUpdate ? (
                                <DropdownItem key="resetPassword" onPress={() => setOpenResetPassword(true)}>
                                    Réinitialiser le mot de passe
                                </DropdownItem>
                            ) : null}
                            {canUpdate ? (
                                <DropdownItem key="disableEnable" className="text-danger" color="danger" onPress={() => setOpenDisableEnable(true)}>
                                    {user.status ? 'Désactiver' : 'Activer'}
                                </DropdownItem>
                            ) : null}
                        </DropdownSection>
                        {canDelete ? (
                            <DropdownItem key="delete" className="text-danger" color="danger" onPress={() => setOpenDelete(true)}>
                                {user.deleted ? 'Restaurer' : 'Supprimer'}
                            </DropdownItem>
                        ) : null}
                    </DropdownMenu>
                </Dropdown>
            )}

            {value === 'grid' && (
                <div className="absolute bottom-0 mt-6 flex w-full gap-4 p-6 ltr:left-0 rtl:right-0">
                    {canDelete && (
                        <button type="button" onClick={() => setOpenDelete(true)} className="btn btn-sm btn-outline-danger w-1/2">
                            {user.deleted ? 'Restaurer' : 'Supprimer'}
                        </button>
                    )}
                    {canUpdate && (
                        <button type="button" onClick={() => setOpenDisableEnable(true)} className="btn btn-sm btn-outline-danger w-1/2">
                            {user.status === 1 ? 'Désactiver' : 'Activer'}
                        </button>
                    )}
                    {canUpdate && (
                        <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-outline-primary w-1/2">
                            Modifier
                        </button>
                    )}
                    {canUpdate && (
                        <button type="button" onClick={() => setOpenResetPassword(true)} className="btn btn-sm btn-outline-primary w-1/2">
                            Mot de passe
                        </button>
                    )}
                </div>
            )}

            <UsersEdit user={user} open={open} setOpen={setOpen} />
            <UsersDeleteRestaure user={user} open={openDelete} setOpen={setOpenDelete} />
            <UsersDisableEnable user={user} open={openDisableEnable} setOpen={setOpenDisableEnable} />
            <UsersResetPassword user={user} open={openResetPassword} setOpen={setOpenResetPassword} />
        </>
    );
};

export default UsersTools;
