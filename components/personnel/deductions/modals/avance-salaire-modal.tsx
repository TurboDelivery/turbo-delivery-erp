'use client';

import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea } from '@heroui/react';
import { toast } from 'sonner';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';
import { Label } from '@/components/ui/label';
import { createAvanceSchema, CreateAvanceDTO } from '@/features/personnel/schemas/deduction.schema';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { getTodayDateInput } from '@/lib/date-utils';

interface AvanceSalaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  deduction?: IDeduction | null;
  onSubmit?: (args: { mode: 'create' | 'update'; id?: string; dto: CreateAvanceDTO }) => Promise<void> | void;
}

const DEFAULT_VALUES: CreateAvanceDTO = {
  employeeId: '',
  amount: 0,
  date: getTodayDateInput(),
  motif: '',
};

function AvanceSalaireModal({ isOpen, onClose, deduction, onSubmit }: AvanceSalaireModalProps) {
  const isEditMode = Boolean(deduction?.id);

  const form = useForm<CreateAvanceDTO>({
    resolver: zodResolver(createAvanceSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!isOpen) {
      reset(DEFAULT_VALUES);
      return;
    }

    if (deduction) {
      reset({
        employeeId: deduction.employee?.id || '',
        amount: deduction.amount || 0,
        date: getTodayDateInput(),
        motif: deduction.description || '',
      });
      return;
    }

    reset({ ...DEFAULT_VALUES, date: getTodayDateInput() });
  }, [deduction, isOpen, reset]);

  const submitForm = async (values: CreateAvanceDTO) => {
    const dto: CreateAvanceDTO = {
      employeeId: values.employeeId,
      amount: values.amount,
      date: values.date,
      motif: values.motif,
    };

    try {
      if (onSubmit) {
        await onSubmit({ mode: isEditMode ? 'update' : 'create', id: deduction?.id, dto });
      }

      toast.success(isEditMode ? 'Avance modifiée avec succès' : 'Avance enregistrée avec succès');
      onClose();
      reset(DEFAULT_VALUES);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement de l'avance");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader>{isEditMode ? 'Modifier une avance' : 'Nouvelle avance sur salaire'}</ModalHeader>
            <ModalBody>
              <form id="avance-salaire-form" className="space-y-4" onSubmit={handleSubmit(submitForm)}>
                <div>
                  <Label className="mb-1 block">Employé</Label>
                  <Controller
                    name="employeeId"
                    control={control}
                    render={({ field }) => <EmployeeSelect value={field.value} onChange={(value) => field.onChange(value || '')} className="text-xs w-full" />}
                  />
                  {errors.employeeId && <small className="text-sm text-red-500">{errors.employeeId.message}</small>}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="amount">Montant</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={String(field.value ?? 0)}
                          onChange={(e) => field.onChange(Number(e.target.value || 0))}
                          variant="bordered"
                          endContent="FCFA"
                          isInvalid={!!errors.amount}
                          errorMessage={errors.amount?.message}
                        />
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="date">Date de la demande</Label>
                      <Input
                        id="date"
                        type="date"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        variant="bordered"
                        isInvalid={!!errors.date}
                        errorMessage={errors.date?.message}
                      />
                    </div>
                  )}
                />

                <Controller
                  name="motif"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="motif">Motif</Label>
                      <Textarea
                        id="motif"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="Saisissez le motif"
                        variant="bordered"
                        minRows={3}
                        isInvalid={!!errors.motif}
                        errorMessage={errors.motif?.message}
                      />
                    </div>
                  )}
                />

                <div className="rounded-md border border-yellow-400 bg-yellow-100 p-3">
                  <p className="font-semibold text-red-600">Important</p>
                  <p className="mt-1 text-sm text-red-600">L&#39;avance sur salaire sera déduite intégralement du salaire du mois prochain.</p>
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
