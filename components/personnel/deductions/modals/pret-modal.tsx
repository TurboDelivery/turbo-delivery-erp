'use client';

import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea } from '@heroui/react';
import { toast } from 'sonner';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreatePretDTO, createPretSchema } from '@/features/personnel/schemas/deduction.schema';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { getTodayDateInput } from '@/lib/date-utils';

type PretModalProps = {
  isOpen: boolean;
  onClose: () => void;
  deduction?: IDeduction | null;
  onSubmit?: (args: { mode: 'create' | 'update'; id?: string; dto: CreatePretDTO }) => Promise<void> | void;
};

const DEFAULT_VALUES: CreatePretDTO = {
  employeeId: '',
  totalAmount: 0,
  duration: 3,
  startDate: getTodayDateInput(),
  motif: '',
};

function PretModal({ isOpen, onClose, deduction, onSubmit }: PretModalProps) {
  const isEditMode = Boolean(deduction?.id);

  const form = useForm<CreatePretDTO>({
    resolver: zodResolver(createPretSchema),
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
        totalAmount: deduction.amount || 0,
        duration: 3,
        startDate: deduction.deductionDate || getTodayDateInput(),
        motif: deduction.description || '',
      });
      return;
    }

    reset({ ...DEFAULT_VALUES, startDate: getTodayDateInput() });
  }, [deduction, isOpen, reset]);

  const submitForm = async (values: CreatePretDTO) => {
    const dto: CreatePretDTO = {
      employeeId: values.employeeId,
      totalAmount: values.totalAmount,
      duration: values.duration,
      startDate: values.startDate,
      motif: values.motif,
    };

    try {
      if (onSubmit) {
        await onSubmit({ mode: isEditMode ? 'update' : 'create', id: deduction?.id, dto });
      }

      toast.success(isEditMode ? 'Prêt modifié avec succès' : 'Prêt enregistré avec succès');
      reset(DEFAULT_VALUES);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement du pret");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader>{isEditMode ? 'Modifier un prêt' : 'Nouveau prêt'}</ModalHeader>
            <ModalBody>
              <form id="pret-form" className="space-y-4" onSubmit={handleSubmit(submitForm)}>
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
                    name="totalAmount"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="totalAmount">Montant total</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          value={String(field.value ?? 0)}
                          onChange={(e) => field.onChange(Number(e.target.value || 0))}
                          variant="bordered"
                          endContent="FCFA"
                          isInvalid={!!errors.totalAmount}
                          errorMessage={errors.totalAmount?.message}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    name="duration"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor="duration">Durée (mois)</Label>
                        <Select value={String(field.value ?? 3)} onValueChange={(value) => field.onChange(Number(value))}>
                          <SelectTrigger id="duration">
                            <SelectValue placeholder="Sélectionner une durée" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 mois</SelectItem>
                            <SelectItem value="4">4 mois</SelectItem>
                            <SelectItem value="5">5 mois</SelectItem>
                            <SelectItem value="6">6 mois</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.duration && <small className="text-sm text-red-500">{errors.duration.message}</small>}
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Date de début</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        variant="bordered"
                        isInvalid={!!errors.startDate}
                        errorMessage={errors.startDate?.message}
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
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" color="danger" onPress={closeModal} isDisabled={isSubmitting}>
                Annuler
              </Button>
              <Button color="primary" type="submit" form="pret-form" isLoading={isSubmitting}>
                {isEditMode ? 'Modifier' : 'Créer'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default PretModal;
