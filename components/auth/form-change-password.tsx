'use client';

import { Lock } from 'lucide-react';
import { Input } from "@heroui/react";
import { toast } from 'sonner';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { body, title } from '@/components/primitives';
import { changePassword } from '@/src/actions/users.actions';
import { SubmitButton } from '@/components/ui/form-ui/submit-button';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";


export function FormChangePassword({ userName }: {
    userName: string
}) {
    const router = useRouter();
    const [state, formAction] = useFormState(
        async (_: any, formData: FormData) => {

            formData.set('username', userName);
            const result = await changePassword(formData);

            if (result.status === 'success') {
                toast.success(result.message || 'Bravo ! vous avez réussi');
                router.push('/');
                router.refresh();
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

    return (
        <Modal isOpen={true}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className={title({ size: 'h3' })}>Nouveau mot de passe</h2>
                    <p className={body({ size: 'caption', class: 'mt-4' })}>Veuillez saisir votre nouveau mot de passe.</p>
                </ModalHeader>
                <ModalBody>
                    <form action={formAction} className="space-y-6">
                        <div className="grid gap-4">
                            <Input
                                isRequired
                                required
                                errorMessage={state?.errors?.oldPassword ?? ''}
                                isInvalid={!!state?.errors?.oldPassword}
                                label="Mot de passe actuel"
                                name="oldPassword"
                                startContent={<Lock className="size-4 text-default-400" />}
                                type="password"
                                variant="bordered"
                                radius="sm"
                            />
                            <Input
                                isRequired
                                required
                                errorMessage={state?.errors?.password ?? ''}
                                isInvalid={!!state?.errors?.password}
                                label="Nouveau mot de passe"
                                name="newPassword"
                                startContent={<Lock className="size-4 text-default-400" />}
                                type="password"
                                variant="bordered"
                                radius="sm"
                            />
                            <Input
                                isRequired required
                                errorMessage={state?.errors?.confirm_password ?? ''}
                                isInvalid={!!state?.errors?.confirm_password}
                                label="Confirmer le nouveau mot de passe"
                                name="confirm_password"
                                startContent={<Lock className="size-4 text-default-400" />}
                                type="password" variant="bordered" radius="sm"
                            />

                            <ModalFooter>
                                <SubmitButton>Enregistrer</SubmitButton>
                            </ModalFooter>
                        </div>
                    </form>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
