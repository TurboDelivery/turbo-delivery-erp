'use client';

import EtatErreur from '@/components/commons/EtatErreur';
import IconUserPlus from '@/components/icon/icon-user-plus';
import IconX from '@/components/icon/icon-x';
import { getAllRoles } from '@/src/actions/roles.actions';
import { createUser } from '@/src/actions/users.actions';
import { _createUserSchema, createUserSchema } from '@/src/schemas/users.schema';
import { Role } from '@/types/models';
import { Transition, Dialog, TransitionChild, DialogPanel } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Select, SelectItem, Snippet } from "@/components/heroui";
import { useRouter } from 'next/navigation';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useActionState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SubmitButton } from '@/components/ui/form-ui/submit-button';

const UsersAdd = () => {
    const [open, setOpen] = useState<boolean>(false);
    /*
     * `useFormStatus()` etait appele ICI, dans le composant qui rend le `<form>`.
     * Le hook ne lit l'etat que depuis un composant ENFANT du formulaire : appele au
     * meme niveau, il renvoie toujours `pending: false`. Le bouton n'indiquait donc
     * jamais l'envoi en cours et restait cliquable.
     *
     * `SubmitButton` (components/ui/form-ui/submit-button.tsx) fait exactement cela
     * correctement — il appelle le hook depuis l'interieur du formulaire — et existait
     * deja dans le depot.
     */
    const router = useRouter();

    const [state, formAction] = useActionState(
        async (_: any, formData: FormData) => {
            const result = await createUser(formData);

            if (result.status === 'success') {
                toast.success(result.message || 'Bravo ! vous avez réussi');
            } else {
                toast.error(result.message || "Erreur lors de l'envoi de l'email");
            }

            return result;
        },
        {
            data: null,
            message: '',
            errors: {},
            status: 'idle',
            code: undefined,
        },
    );

    const [roles, setRoles] = useState<Role[]>([]);
    // getAllRoles relance desormais. Sans rattrapage ici, l echec restait invisible : le
    // selecteur de role s affichait VIDE, ce qui se lit comme « aucun role n existe »
    // alors que le role est obligatoire et que le formulaire est donc inutilisable.
    const [erreurRoles, setErreurRoles] = useState<boolean>(false);
    const [chargementRoles, setChargementRoles] = useState<boolean>(false);

    const rolesSelections = roles.map((r) => ({
        label: r.libelle,
        value: r.id,
    }));

    const fetchRole = useCallback(async () => {
        // Remis a faux a chaque tentative, sinon un succes apres reessai garderait l erreur
        setErreurRoles(false);
        setChargementRoles(true);
        try {
            const result = await getAllRoles();
            if (result) {
                setRoles(result);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des roles:', error);
            setErreurRoles(true);
        } finally {
            setChargementRoles(false);
        }
    }, []);

    useEffect(() => {
        fetchRole();
    }, [fetchRole]);

    const {
        formState: { errors },
        control,
    } = useForm<_createUserSchema>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            username: '',
            name: '',
            prenoms: '',
            email: '',
            role: '',
        },
    });

    return (
        <>
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
                <IconUserPlus className="ltr:mr-2 rtl:ml-2" />
                Ajouter un utilisateur
            </button>
            <Transition appear show={open} as={Fragment}>
                <Dialog
                    as="div"
                    open={open}
                    onClose={() => {
                        setOpen(false);
                        router.refresh();
                    }}
                    className="relative z-50"
                >
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="panel w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            router.refresh();
                                        }}
                                        className="absolute top-4 text-gray-400 outline-hidden hover:text-gray-800 ltr:right-4 rtl:left-4 dark:hover:text-gray-600"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="bg-[#fbfbfb] py-3 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pl-[50px] rtl:pr-5 dark:bg-[#121c2c] text-primary">
                                        {state.status === 'success' && state.data?.password ? "Les accès de l'utilisateur créé" : 'Ajouter un utilisateur'}
                                    </div>
                                    {state.status === 'success' ? (
                                        <div className="grid gap-4 p-5">
                                            <ul className="list-disc list-inside space-y-4">
                                                <li>
                                                    Nom d&apos;utilisateur: <Snippet symbol=""  color="success" size="sm">{state.data?.user.username}</Snippet>
                                                </li>
                                                <li>
                                                    Mot de passe: <Snippet  symbol=""  color="success" size="sm">{state.data?.password}</Snippet>
                                                </li>
                                            </ul>
                                        </div>
                                    ) : erreurRoles ? (
                                        <EtatErreur quoi="les rôles" onReessayer={() => fetchRole()} enCours={chargementRoles} />
                                    ) : (
                                        <form action={formAction}>
                                            <div className="grid gap-4 p-5">
                                                <Controller
                                                    control={control}
                                                    name="username"
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            isRequired
                                                            aria-invalid={errors.username ? 'true' : 'false'}
                                                            aria-label="username input"
                                                            errorMessage={errors.username?.message ?? ''}
                                                            isInvalid={!!errors.username}
                                                            label="Nom d'utilisateur"
                                                            labelPlacement="outside"
                                                            placeholder="Entrez le nom d'utilisateur"
                                                            name="username"
                                                            type="text"
                                                            variant="bordered"
                                                            radius="sm"
                                                            value={field.value ?? ''}
                                                        />
                                                    )}
                                                />
                                                <Controller
                                                    control={control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            isRequired
                                                            aria-invalid={errors.name ? 'true' : 'false'}
                                                            aria-label="name input"
                                                            errorMessage={errors.name?.message ?? ''}
                                                            isInvalid={!!errors.name}
                                                            label="Nom"
                                                            labelPlacement="outside"
                                                            placeholder="Entrez le nom"
                                                            name="name"
                                                            type="text"
                                                            variant="bordered"
                                                            radius="sm"
                                                            value={field.value ?? ''}
                                                        />
                                                    )}
                                                />
                                                <Controller
                                                    control={control}
                                                    name="prenoms"
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            isRequired
                                                            aria-invalid={errors.prenoms ? 'true' : 'false'}
                                                            aria-label="prenoms input"
                                                            errorMessage={errors.prenoms?.message ?? ''}
                                                            isInvalid={!!errors.prenoms}
                                                            label="Prénoms"
                                                            labelPlacement="outside"
                                                            placeholder="Entrez le prénom"
                                                            name="prenoms"
                                                            type="text"
                                                            variant="bordered"
                                                            radius="sm"
                                                            value={field.value ?? ''}
                                                        />
                                                    )}
                                                />
                                                <Controller
                                                    control={control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            isRequired
                                                            aria-invalid={errors.email ? 'true' : 'false'}
                                                            aria-label="email input"
                                                            errorMessage={errors.email?.message ?? ''}
                                                            isInvalid={!!errors.email}
                                                            label="Email"
                                                            labelPlacement="outside"
                                                            placeholder="Entrez l'email"
                                                            name="email"
                                                            type="email"
                                                            variant="bordered"
                                                            radius="sm"
                                                            value={field.value ?? ''}
                                                        />
                                                    )}
                                                />
                                                <Controller
                                                    control={control}
                                                    name="role"
                                                    render={({ field }) => (
                                                        <Select
                                                            {...field}
                                                            isRequired
                                                            required
                                                            errorMessage={errors.role?.message ?? ''}
                                                            isInvalid={!!errors.role}
                                                            name="role"
                                                            className="w-full"
                                                            label="Rôle"
                                                            labelPlacement="outside"
                                                            placeholder="Entrez le rôle"
                                                            variant="bordered"
                                                            radius="sm"
                                                        >
                                                            {rolesSelections.map((role) => (
                                                                <SelectItem key={role.value} textValue={role.label} value={role.value}>
                                                                    {role.label}
                                                                </SelectItem>
                                                            ))}
                                                        </Select>
                                                    )}
                                                />

                                                <div className="mt-8 flex items-center justify-end">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        onClick={() => {
                                                            setOpen(false);
                                                            router.refresh();
                                                        }}
                                                    >
                                                        Annuler
                                                    </button>
                                                    <SubmitButton className="btn btn-primary ltr:ml-4 rtl:mr-4">Ajouter</SubmitButton>
                                                </div>
                                            </div>
                                        </form>
                                    )}
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default UsersAdd;
