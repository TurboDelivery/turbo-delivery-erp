'use client';

import IconX from '@/components/icon/icon-x';
import { updateTypePlat } from '@/src/actions/type-plats.actions';
import { _createTypePlatSchema, createTypePlatSchema } from '@/src/schemas/type-plats.schema';
import { Collection } from '@/types/models';
import { Transition, Dialog, TransitionChild, DialogPanel } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from "@/components/heroui";
import { useRouter } from 'next/navigation';
import React, { Fragment } from 'react';
import { useActionState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SubmitButton } from '@/components/ui/form-ui/submit-button';

const TypePlatEdit = ({ typePlat, open, setOpen }: { typePlat: Collection; open: boolean; setOpen: (open: boolean) => void }) => {
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
        async (prevState: any, formData: FormData) => {
            const result = await updateTypePlat(formData, typePlat.id);

            if (result.status === 'success') {
                toast.success(result.message || 'Bravo ! vous avez réussi');
                router.refresh();
                setOpen(false);
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

    const {
        formState: { errors },
        control,
    } = useForm<_createTypePlatSchema>({
        resolver: zodResolver(createTypePlatSchema),
        defaultValues: {
            libelle: typePlat.libelle,
            description: typePlat.description,
            picture: undefined,
        },
    });

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" open={open} onClose={() => setOpen(false)} className="relative z-50">
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
                                    onClick={() => setOpen(false)}
                                    className="absolute top-4 text-muted outline-hidden hover:text-gray-800 ltr:right-4 rtl:left-4 dark:hover:text-gray-600"
                                >
                                    <IconX />
                                </button>
                                <div className="bg-surface-secondary py-3 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pl-[50px] rtl:pr-5 text-primary">Modifier un type de plat</div>
                                <form action={formAction}>
                                    <div className="grid gap-4 p-5">
                                        <Controller
                                            control={control}
                                            name="libelle"
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    isRequired
                                                    aria-invalid={errors.libelle ? 'true' : 'false'}
                                                    aria-label="libelle input"
                                                    errorMessage={errors.libelle?.message ?? ''}
                                                    isInvalid={!!errors.libelle}
                                                    label="Libellé"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez le libellé"
                                                    name="libelle"
                                                    type="text"
                                                    variant="bordered"
                                                    radius="sm"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                        <Controller
                                            control={control}
                                            name="description"
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    isRequired
                                                    aria-invalid={errors.description ? 'true' : 'false'}
                                                    aria-label="description input"
                                                    errorMessage={errors.description?.message ?? ''}
                                                    isInvalid={!!errors.description}
                                                    label="Description"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez la description"
                                                    name="description"
                                                    type="text"
                                                    variant="bordered"
                                                    radius="sm"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                        <Controller
                                            control={control}
                                            name="picture"
                                            render={({ field: { onChange, value, ...field } }) => (
                                                <Input
                                                    {...field}
                                                    isRequired
                                                    aria-invalid={errors.picture ? 'true' : 'false'}
                                                    aria-label="picture input"
                                                    errorMessage={errors.picture?.message ?? ''}
                                                    isInvalid={!!errors.picture}
                                                    label="Image"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez l'image"
                                                    name="picture"
                                                    type="file"
                                                    accept=".png,.jpeg,.jpg"
                                                    variant="bordered"
                                                    radius="sm"
                                                    onChange={(e) => onChange(e.target.files?.[0])}
                                                />
                                            )}
                                        />

                                        <div className="mt-8 flex items-center justify-end">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => setOpen(false)}>
                                                Annuler
                                            </button>
                                            <SubmitButton className="btn btn-primary ltr:ml-4 rtl:mr-4">Modifier</SubmitButton>
                                        </div>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default TypePlatEdit;
