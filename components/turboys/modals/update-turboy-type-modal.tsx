'use client';

import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Input,
} from '@heroui/react';
import { ITurboy, TurboyType } from '@/features/turboys/types/turboys.types';
import { useUpdateTurboyTypeMutation } from '@/features/turboys/queries/turboy.mutations';
import { UpdateTurboyTypeSchema, UpdateTurboyTypeDTO } from '@/features/turboys/schemas/turboy.schema';

interface UpdateTurboyTypeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  turboy: ITurboy | null;
}

// V54 (2026-05) — Ajout de la nouvelle population SUPERVISEUR_LIVREUR pour
// que la RH puisse requalifier les superviseurs actuellement classés
// "Indépendant" (cf. §6.2 cadrage DGA).
const TURBOY_TYPES: { value: TurboyType; label: string }[] = [
  { value: 'INDEPENDANT', label: 'Indépendant' },
  { value: 'JOURNALIER', label: 'Journalier' },
  { value: 'SUPERVISEUR_LIVREUR', label: 'Superviseur-livreur' },
];

export function UpdateTurboyTypeModal({ isOpen, onOpenChange, turboy }: UpdateTurboyTypeModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<UpdateTurboyTypeDTO>({
    resolver: zodResolver(UpdateTurboyTypeSchema),
    mode: 'onChange',
    defaultValues: {
      id: turboy?.id || '',
      typeLivreur: turboy?.typeLivreur,
      salaire: turboy?.salaire,
    },
  });

  const mutation = useUpdateTurboyTypeMutation(
    () => {
      onOpenChange(false);
      reset();
    },
    () => {
      // Error callback handled by mutation
    }
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
      typeLivreur: data.typeLivreur,
      salaire: data.salaire,
    });
  };

  const isLoading = mutation.isPending || isSubmitting;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Modifier le type de livreur
            </ModalHeader>
            <ModalBody>
              {turboy ? (
                <form id="update-turboy-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">
                      <span className="font-semibold">{turboy.prenoms} {turboy.nom}</span>
                    </p>
                  </div>

                  <Controller
                    name="typeLivreur"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Select
                          label="Type de livreur"
                          placeholder="Sélectionner un type"
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={(keys) => {
                            const newType = Array.from(keys)[0] as TurboyType;
                            field.onChange(newType);
                            // Reset salary when changing type
                            if (newType !== 'JOURNALIER') {
                              setValue('salaire', undefined);
                            }
                          }}
                          isDisabled={isLoading}
                          className="w-full"
                          isInvalid={!!errors.typeLivreur}
                          errorMessage={errors.typeLivreur?.message}
                        >
                          {TURBOY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </Select>
                        {errors.typeLivreur && (
                          <small className="text-red-500 text-sm">{errors.typeLivreur.message}</small>
                        )}
                      </div>
                    )}
                  />

                  {isSalaryRequired && (
                    <Controller
                      name="salaire"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <Input
                            label="Salaire journalier"
                            placeholder="0.00"
                            type="number"
                            min="0"
                            step="0.01"
                            value={field.value?.toString() || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val ? parseFloat(val) : undefined);
                            }}
                            isDisabled={isLoading}
                            isInvalid={!!errors.salaire}
                            errorMessage={errors.salaire?.message}
                            startContent={
                              <div className="flex items-center">
                                <span className="text-default-400 text-small">FCFA</span>
                              </div>
                            }
                          />
                          {errors.salaire && (
                            <small className="text-red-500 text-sm">{errors.salaire.message}</small>
                          )}
                        </div>
                      )}
                    />
                  )}
                </form>
              ) : null}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose} isDisabled={isLoading}>
                Annuler
              </Button>
              <Button
                type="submit"
                form="update-turboy-type-form"
                color="primary"
                isDisabled={!selectedType || isLoading || (isSalaryRequired && !salaire)}
                isLoading={isLoading}
              >
                Modifier
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

