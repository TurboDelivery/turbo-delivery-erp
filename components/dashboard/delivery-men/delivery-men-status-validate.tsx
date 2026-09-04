'use client';

import IconX from '@/components/icon/icon-x';
import { DeliveryMan, LivreurStatutVM } from '@/types/models';
import { Transition, Dialog, TransitionChild, DialogPanel } from '@headlessui/react';
import { Button } from '@/components/heroui';
import React, { Fragment } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { validateDeliveryMan } from '@/src/actions/delivery-men.actions';

const DeliveryMenStatusValidate = ({
  deliveryMan,
  open,
  setOpen,
  validateBy = 'no-body',
  onSuccess,
}: {
  deliveryMan: LivreurStatutVM;
  open: boolean;
  setOpen: (open: boolean) => void;
  validateBy: 'auth' | 'ops' | 'no-body';
  onSuccess?: () => void;
}) => {
    /*
     * `useFormStatus()` renvoyait toujours `pending: false` ici.
     *
     * Ce hook ne lit l'etat que d'un `<form>` ANCESTRAL, et depuis un composant
     * ENFANT de ce formulaire. Appele dans le composant qui rend le formulaire — ou,
     * pire, dans une modale qui n'en contient aucun — il ne peut rien observer.
     * Consequence : le bouton restait actif pendant l'attente, sans indicateur, et
     * rien n'empechait un second clic. Sur « desactiver un utilisateur » ou
     * « valider un livreur », cela declenche l'action deux fois.
     *
     * L'etat est desormais tenu localement, autour de l'appel.
     */
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const handleSubmit = async () => {
    const result = await validateDeliveryMan(deliveryMan.livreurId ?? '', validateBy);
    if (result.status === 'success') {
      toast.success(result.message || 'Bravo ! vous avez réussi');
      router.refresh();
      onSuccess?.();
    } else {
      toast.error(result.message || "Erreur lors de l'envoi de l'email");
    }
    setOpen(false);
    return result;
  };

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
                <button type="button" onClick={() => setOpen(false)} className="absolute top-4 text-muted outline-hidden hover:text-foreground ltr:right-4 rtl:left-4 dark:hover:text-muted">
                  <IconX />
                </button>
                <div className="bg-surface-secondary py-3 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pl-[50px] rtl:pr-5 text-primary">
                  {validateBy == 'auth' ? 'Valider' : 'Activer'} le livreur
                </div>
                <div className="grid gap-4 p-5">
                  <p className="text-muted">{validateBy == 'auth' ? 'Voulez-vous valider le livreur ?' : 'Voulez-vous activer le livreur ?'}</p>
                  <div className="mt-8 flex items-center justify-end">
                    <button type="button" className="btn btn-outline-danger" onClick={() => setOpen(false)}>
                      Annuler
                    </button>
                    <Button aria-disabled={pending} className="btn btn-primary ltr:ml-4 rtl:mr-4" color="primary" disabled={pending} isLoading={pending} onClick={() => {
                                            if (pending) return;
                                            setPending(true);
                                            void handleSubmit().finally(() => setPending(false));
                                        }}>
                      {validateBy == 'auth' ? 'Valider' : 'Activer'}
                    </Button>
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

export default DeliveryMenStatusValidate;
