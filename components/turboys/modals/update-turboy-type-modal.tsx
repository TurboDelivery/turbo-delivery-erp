'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal } from '@heroui-v3/react';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ChampListe, ChampMontant } from '@/components/commons/champs-formulaire';
import { useUpdateTurboyTypeMutation } from '@/features/turboys/queries/turboy.mutations';
import {
  UpdateTurboyTypeDTO,
  UpdateTurboyTypeSchema,
} from '@/features/turboys/schemas/turboy.schema';
import { ITurboy, TurboyType } from '@/features/turboys/types/turboys.types';

interface UpdateTurboyTypeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  turboy: ITurboy | null;
}

// V54 (2026-05) — Ajout de la nouvelle population SUPERVISEUR_LIVREUR pour
// que la RH puisse requalifier les superviseurs actuellement classés
// "Indépendant" (cf. §6.2 cadrage DGA).
const TURBOY_TYPES: { label: string; value: TurboyType }[] = [
  { label: 'Indépendant', value: 'INDEPENDANT' },
  { label: 'Journalier', value: 'JOURNALIER' },
  { label: 'Superviseur-livreur', value: 'SUPERVISEUR_LIVREUR' },
];

/**
 * Requalifier un livreur : indépendant, journalier, superviseur.
 *
 * <h3>Ce qui change</h3>
 * <p>Chaque erreur de validation était rendue DEUX FOIS : une par la prop `errorMessage`
 * du champ, une par un `&lt;small className="text-red-500"&gt;` placé juste en dessous. Le
 * second était peint dans une palette Tailwind brute, donc sans variante sombre.</p>
 *
 * <p>« Annuler » était un bouton ROUGE. Se raviser n'est pas un geste dangereux, et le seul
 * geste dangereux de cette fenêtre — changer la population, donc la façon dont un livreur
 * est payé — était, lui, en bleu.</p>
 *
 * <p>Le salaire journalier ne s'affiche que pour un journalier, et la valeur saisie est
 * effacée dès qu'on repasse sur un autre type : sans cela, un montant restait attaché à un
 * indépendant, qui n'en a pas.</p>
 */
export function UpdateTurboyTypeModal({
  isOpen,
  onOpenChange,
  turboy,
}: UpdateTurboyTypeModalProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<UpdateTurboyTypeDTO>({
    defaultValues: {
      id: turboy?.id || '',
      salaire: turboy?.salaire,
      typeLivreur: turboy?.typeLivreur,
    },
    mode: 'onChange',
    resolver: zodResolver(UpdateTurboyTypeSchema),
  });

  const mutation = useUpdateTurboyTypeMutation(
    () => {
      onOpenChange(false);
      reset();
    },
    () => {
      // Error callback handled by mutation
    },
  );

  const selectedType = watch('typeLivreur');
  const salaire = watch('salaire');
  const isSalaryRequired = selectedType === 'JOURNALIER';

  // Synchronize form when turboy changes
  useEffect(() => {
    if (turboy && isOpen) {
      setValue('id', turboy.id);
      setValue('typeLivreur', turboy.typeLivreur);
      setValue('salaire', turboy.salaire);
    }
  }, [turboy, isOpen, setValue]);

  const onSubmit = async (data: UpdateTurboyTypeDTO) => {
    await mutation.mutateAsync({
      id: data.id,
      salaire: data.salaire,
      typeLivreur: data.typeLivreur,
    });
  };

  const isLoading = mutation.isPending || isSubmitting;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Modifier le type de livreur</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              {turboy ? (
                <form
                  className="flex flex-col gap-4"
                  id="update-turboy-type-form"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {turboy.prenoms} {turboy.nom}
                  </p>

                  <Controller
                    control={control}
                    name="typeLivreur"
                    render={({ field }) => (
                      <ChampListe
                        erreur={errors.typeLivreur?.message}
                        label="Type de livreur"
                        onChange={(v) => {
                          field.onChange(v as TurboyType);
                          // Un salaire journalier n'a de sens que pour un journalier.
                          if (v !== 'JOURNALIER') setValue('salaire', undefined);
                        }}
                        options={TURBOY_TYPES}
                        placeholder="Rechercher un type"
                        valeur={field.value ?? ''}
                      />
                    )}
                  />

                  {isSalaryRequired && (
                    <Controller
                      control={control}
                      name="salaire"
                      render={({ field }) => (
                        <ChampMontant
                          aide="En francs CFA, par jour travaillé"
                          erreur={errors.salaire?.message}
                          label="Salaire journalier"
                          onChange={field.onChange}
                          valeur={field.value}
                        />
                      )}
                    />
                  )}
                </form>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isLoading}
                onPress={() => onOpenChange(false)}
                variant="ghost"
              >
                Annuler
              </Button>
              <Button
                form="update-turboy-type-form"
                isDisabled={!selectedType || isLoading || (isSalaryRequired && !salaire)}
                isPending={isLoading}
                type="submit"
                variant="primary"
              >
                Modifier
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
