'use client';

import React, { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea } from '@heroui/react';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';
import { Label } from '@/components/ui/label';
import { useEmployeeListQuery } from '@/features/personnel/queries';
import { AvanceSalaireFormValues, avanceSalaireSchema } from '@/features/personnel/schemas/avance-salaire.schema';

const getTodayDateInput = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export type AvanceSalairePayload = {
  employeeId: string;
  montant: number;
  dateDemande: string;
  motif: string;
};

interface AvanceSalaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: AvanceSalairePayload) => Promise<void> | void;
}

const DEFAULT_VALUES: AvanceSalaireFormValues = {
  employeeId: '',
  salaire: 0,
  montant: 0,
  dateDemande: getTodayDateInput(),
  motif: '',
};

function AvanceSalaireModal({ isOpen, onClose, onSubmit }: AvanceSalaireModalProps) {
  const form = useForm<AvanceSalaireFormValues>({
    resolver: zodResolver(avanceSalaireSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = form;

  const { data: employeesData, isLoading: isEmployeesLoading } = useEmployeeListQuery({
    page: 0,
    limit: 500,
  });

  const employeesById = useMemo(() => {
    const map = new Map<string, number>();
    (employeesData?.content ?? []).forEach((employee) => {
      map.set(employee.id, employee.salary ?? 0);
    });
    return map;
  }, [employeesData?.content]);

  const selectedSalary = watch('salaire');

  useEffect(() => {
    if (!isOpen) {
      reset(DEFAULT_VALUES);
      return;
    }

    reset({
      ...DEFAULT_VALUES,
      dateDemande: getTodayDateInput(),
    });
  }, [isOpen, reset]);

  const handleEmployeeChange = (employeeId?: string) => {
    const nextEmployeeId = employeeId || '';
    const salary = nextEmployeeId ? (employeesById.get(nextEmployeeId) ?? 0) : 0;

    setValue('employeeId', nextEmployeeId, { shouldValidate: true, shouldDirty: true });
    setValue('salaire', salary, { shouldValidate: true, shouldDirty: true });
    // Demande metier: pre-remplir le montant avec le salaire selectionne.
    setValue('montant', salary, { shouldValidate: true, shouldDirty: true });
    void trigger('montant');
  };

  const submitForm = async (values: AvanceSalaireFormValues) => {
    const payload: AvanceSalairePayload = {
      employeeId: values.employeeId,
      montant: values.montant,
      dateDemande: values.dateDemande,
      motif: values.motif,
    };

    if (onSubmit) {
      await onSubmit(payload);
    }

    onClose();
    reset(DEFAULT_VALUES);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader>Nouvelle avance sur salaire</ModalHeader>
            <ModalBody>
              <form id="avance-salaire-form" className="space-y-4" onSubmit={handleSubmit(submitForm)}>
                <div>
                  <Label className="mb-1 block">Employe</Label>
                  <Controller
                    name="employeeId"
                    control={control}
                    render={({ field }) => <EmployeeSelect value={field.value} onChange={handleEmployeeChange} isLoading={isEmployeesLoading} className="text-xs w-full" />}
                  />
                  {errors.employeeId && <small className="text-sm text-red-500">{errors.employeeId.message}</small>}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    name="montant"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="montant">Montant</Label>
                        <Input
                          id="montant"
                          type="number"
                          value={String(field.value ?? 0)}
                          onChange={(e) => field.onChange(Number(e.target.value || 0))}
                          variant="bordered"
                          endContent="FCFA"
                          isInvalid={!!errors.montant}
                          errorMessage={errors.montant?.message}
                        />
                      </div>
                    )}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="salaire">Salaire</Label>
                    <Input id="salaire" type="number" value={String(selectedSalary || 0)} variant="bordered" endContent="FCFA" isReadOnly />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateDemande">Date de la demande</Label>
                  <Input id="dateDemande" type="date" {...register('dateDemande')} variant="bordered" isInvalid={!!errors.dateDemande} errorMessage={errors.dateDemande?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motif">Motif</Label>
                  <Textarea
                    id="motif"
                    placeholder="Saisissez le motif de l'avance"
                    {...register('motif')}
                    variant="bordered"
                    minRows={3}
                    isInvalid={!!errors.motif}
                    errorMessage={errors.motif?.message}
                  />
                </div>

                <div className="rounded-md border border-yellow-400 bg-yellow-100 p-3">
                  <p className="font-semibold text-red-600">⚠️ Important</p>
                  <p className="mt-1 text-sm text-red-600">
                    L&apos;avance sur salaire sera deduite integralement du salaire du mois prochain. Assurez-vous que l&apos;employe est informe de cette deduction.
                  </p>
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" color="danger" onPress={closeModal} isDisabled={isSubmitting}>
                Annuler
              </Button>
              <Button color="primary" type="submit" form="avance-salaire-form" isLoading={isSubmitting}>
                Enregistrer
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default AvanceSalaireModal;
