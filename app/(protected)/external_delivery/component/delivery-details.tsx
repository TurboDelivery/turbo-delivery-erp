'use client';

import { Fragment } from 'react';
import { Transition, Dialog, TransitionChild, DialogPanel } from '@headlessui/react';
import { Button, Chip, Card, CardHeader, CardBody } from "@heroui/react";
import IconX from '@/components/icon/icon-x';
import { CourseExterne } from '@/types/models';
import { User, MapPin, CreditCard, Clock } from 'lucide-react';
import dayjs from 'dayjs';

const DeliveryDetails = ({
    delivery,
    open,
    setOpen,
}: {
    delivery: CourseExterne;
    open: boolean;
    setOpen: (open: boolean) => void;
}) => {
    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" open={open} onClose={() => setOpen(false)} className="relative z-50">
                {/* Overlay */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60" />
                </TransitionChild>

                {/* Content */}
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
                            <DialogPanel className="panel w-full max-w-3xl overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                {/* Close button */}
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="absolute top-4 right-4 text-gray-400 outline-none hover:text-gray-800 dark:hover:text-gray-600"
                                >
                                    <IconX />
                                </button>

                                {/* Header */}
                                <div className="bg-[#fbfbfb] py-3 text-lg font-medium px-6 dark:bg-[#121c2c] text-primary border-b">
                                    Détails de la course
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-5">
                                    {/* Informations principales */}
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="text-gray-400 w-4 h-4" />
                                            <span>
                                                <strong>Créée le :</strong> {dayjs(delivery.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="text-gray-400 w-4 h-4" />
                                            <span>
                                                <strong>Montant Total : </strong> 
                                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(
                                                    (delivery.commandes?.reduce((sum, cmd) => sum + (cmd.prix ?? 0), 0) || 0) +
                                                    (delivery.commandes?.reduce((sum, cmd) => sum + (cmd.fraisLivraison ?? 0), 0) || 0)
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Chip color="secondary" size="sm" className='rounded-md' variant="flat">
                                                {delivery.statut}
                                            </Chip>
                                        </div>
                                    </div>

                                    <hr className="border-gray-200 dark:border-gray-700" />

                                    {/* Liste des commandes */}
                                    <div>
                                        <h3 className="text-md font-semibold mb-2 text-gray-700">Commandes associées</h3>
                                        {delivery.commandes.length > 0 ? (
                                            delivery.commandes.map((commande, idx) => (
                                                <Card key={commande.id} className="w-full bg-gray-50 shadow-sm mb-2 rounded-md">
                                                    <CardHeader className="flex justify-between px-3 py-2 bg-gray-100 border-b">
                                                        <div className="flex items-center gap-3">
                                                            <Chip size="sm" variant="flat" color="secondary">
                                                                {commande.statut ?? 'EN_ATTENTE'}
                                                            </Chip>
                                                            <span className="text-gray-700 font-semibold">Commande #{idx + 1}</span>
                                                        </div>
                                                        <span className="text-gray-500 font-bold">{commande.numero}</span>
                                                    </CardHeader>

                                                    <CardBody className="px-3 py-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <User className="text-gray-400 w-4 h-4" />
                                                            <span>{commande?.destinataire?.nomComplet} ({commande?.destinataire?.contact})</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <MapPin className="text-gray-400 w-4 h-4" />
                                                            <span>{commande?.lieuLivraison?.latitude}, {commande?.lieuLivraison?.longitude}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <CreditCard className="text-gray-400 w-4 h-4" />
                                                            <span>{commande.modePaiement}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <CreditCard className="text-gray-400 w-4 h-4" />
                                                            <span className="font-semibold">
                                                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(
                                                                    (commande.prix || 0)
                                                                )}
                                                            </span>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">Aucune commande associée.</p>
                                        )}
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default DeliveryDetails;
