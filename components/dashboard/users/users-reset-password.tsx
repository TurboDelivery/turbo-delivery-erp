'use client';

import IconX from '@/components/icon/icon-x';
import { reinitialiserMotDePasseUtilisateur } from '@/src/actions/users.actions';
import { User } from '@/types/models';
import { Transition, Dialog, TransitionChild, DialogPanel } from '@headlessui/react';
import { Button, Snippet } from '@/components/heroui';
import React, { Fragment, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * Réinitialisation du mot de passe d'un utilisateur, par un administrateur.
 *
 * <p>L'écran de connexion de l'ERP ne propose aucun « mot de passe oublié » : quand
 * quelqu'un perd son accès, c'est le seul chemin pour le lui rendre.</p>
 *
 * <p>Deux temps volontairement séparés. D'abord une confirmation, parce que l'action
 * invalide immédiatement le mot de passe actuel de la personne : la déclencher par erreur
 * met quelqu'un dehors. Ensuite l'affichage du mot de passe provisoire, une seule fois —
 * le serveur ne le conserve qu'en haché et ne saura pas le redonner.</p>
 */
const UsersResetPassword = ({
    user,
    open,
    setOpen,
}: {
    user: User;
    open: boolean;
    setOpen: (open: boolean) => void;
}) => {
    const router = useRouter();
    const [enCours, setEnCours] = useState(false);
    const [motDePasse, setMotDePasse] = useState<string | null>(null);

    useEffect(() => {
        // Le mot de passe ne doit jamais survivre à la fermeture : rouvrir la fenêtre sur
        // un AUTRE utilisateur afficherait sinon l'accès du précédent.
        if (!open) {
            setMotDePasse(null);
            setEnCours(false);
        }
    }, [open]);

    const reinitialiser = async () => {
        setEnCours(true);
        const resultat = await reinitialiserMotDePasseUtilisateur(user.id);
        setEnCours(false);

        if (resultat.status === 'success' && resultat.data?.newPassword) {
            setMotDePasse(resultat.data.newPassword);
            toast.success(resultat.message || 'Mot de passe réinitialisé');
            router.refresh();
        } else {
            toast.error(resultat.message || 'Erreur lors de la réinitialisation du mot de passe');
        }
    };

    const fermer = () => setOpen(false);

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" open={open} onClose={fermer} className="relative z-50">
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
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
                                    onClick={fermer}
                                    className="absolute top-4 text-muted outline-hidden hover:text-foreground ltr:right-4 rtl:left-4 dark:hover:text-muted"
                                >
                                    <IconX />
                                </button>
                                <div className="bg-surface-secondary py-3 text-lg font-medium text-primary ltr:pl-5 ltr:pr-[50px] rtl:pl-[50px] rtl:pr-5 ">
                                    {motDePasse
                                        ? 'Nouvel accès provisoire'
                                        : 'Réinitialiser le mot de passe'}
                                </div>

                                {motDePasse ? (
                                    <div className="grid gap-4 p-5">
                                        <ul className="list-inside list-disc space-y-4">
                                            <li>
                                                Nom d&apos;utilisateur :{' '}
                                                <Snippet symbol="" color="success" size="sm">
                                                    {user.username}
                                                </Snippet>
                                            </li>
                                            <li>
                                                Mot de passe provisoire :{' '}
                                                <Snippet symbol="" color="success" size="sm">
                                                    {motDePasse}
                                                </Snippet>
                                            </li>
                                        </ul>
                                        <div className="rounded border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-800">
                                            <p className="font-medium">
                                                Ce mot de passe ne sera plus jamais affiché.
                                            </p>
                                            <p className="mt-1">
                                                Le serveur ne le conserve que haché : s&apos;il est perdu, il
                                                faudra recommencer. Transmettez-le à la personne concernée
                                                par un canal sûr. Elle devra choisir son propre mot de
                                                passe à sa prochaine connexion.
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-end">
                                            <Button className="btn btn-primary" color="primary" onClick={fermer}>
                                                J&apos;ai noté le mot de passe
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 p-5">
                                        <p className="text-muted">
                                            Générer un nouveau mot de passe pour{' '}
                                            <strong>
                                                {[user.prenoms, user.nom].filter(Boolean).join(' ') ||
                                                    user.username}
                                            </strong>{' '}
                                            ?
                                        </p>
                                        <div className="rounded border border-danger/30 bg-danger/5 p-3 text-sm">
                                            <p className="font-medium text-danger-soft-foreground">
                                                Son mot de passe actuel cessera immédiatement de
                                                fonctionner.
                                            </p>
                                            <p className="mt-1 text-muted">
                                                À n&apos;utiliser que si la personne a réellement perdu son
                                                accès : l&apos;ERP n&apos;a pas de « mot de passe oublié », donc
                                                elle ne pourra pas se dépanner seule.
                                            </p>
                                        </div>
                                        <div className="mt-8 flex items-center justify-end">
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger"
                                                onClick={fermer}
                                            >
                                                Annuler
                                            </button>
                                            <Button
                                                className="btn btn-primary ltr:ml-4 rtl:mr-4"
                                                color="primary"
                                                disabled={enCours}
                                                isLoading={enCours}
                                                onClick={reinitialiser}
                                            >
                                                Réinitialiser
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default UsersResetPassword;
