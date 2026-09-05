'use client';

import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Modal } from '@heroui-v3/react';
import { toast } from 'sonner';
import {
  ChampEnveloppe,
  ChampMontant,
  ChampTexte,
  ChampZoneTexte,
} from '@/components/commons/champs-formulaire';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';
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
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading>
                {isEditMode ? 'Modifier une avance' : 'Nouvelle avance sur salaire'}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              <form
                className="flex flex-col gap-4"
                id="avance-salaire-form"
                onSubmit={handleSubmit(submitForm)}
              >
                <Controller
                  control={control}
                  name="employeeId"
                  render={({ field }) => (
                    <ChampEnveloppe erreur={errors.employeeId?.message} label="Employé">
                      <EmployeeSelect
                        className="w-full"
                        onChange={(value) => field.onChange(value || '')}
                        value={field.value}
                      />
                    </ChampEnveloppe>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    control={control}
                    name="amount"
                    render={({ field }) => (
                      <ChampMontant
                        aide="En francs CFA"
                        erreur={errors.amount?.message}
                        label="Montant"
                        onChange={field.onChange}
                        valeur={field.value}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="date"
                    render={({ field }) => (
                      <ChampTexte
                        erreur={errors.date?.message}
                        label="Date de la demande"
                        onChange={field.onChange}
                        type="date"
                        valeur={field.value ?? ''}
                      />
                    )}
                  />
                </div>

                <Controller
                  control={control}
                  name="motif"
                  render={({ field }) => (
                    <ChampZoneTexte
                      erreur={errors.motif?.message}
                      label="Motif"
                      onChange={field.onChange}
                      placeholder="Saisissez le motif"
                      valeur={field.value ?? ''}
                    />
                  )}
                />
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button isDisabled={isSubmitting} onPress={onClose} variant="ghost">
                Annuler
              </Button>
              <Button
                form="avance-salaire-form"
                isPending={isSubmitting}
                type="submit"
                variant="primary"
              >
                {isEditMode ? 'Modifier' : 'Créer'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
export default AvanceSalaireModal;
