'use client';

import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Modal } from '@heroui-v3/react';
import { toast } from 'sonner';
import {
  ChampEnveloppe,
  ChampListe,
  ChampMontant,
  ChampTexte,
  ChampZoneTexte,
} from '@/components/commons/champs-formulaire';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';
import { CreatePretDTO, createPretSchema } from '@/features/personnel/schemas/deduction.schema';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { getTodayDateInput } from '@/lib/date-utils';

/** Le cahier n'ouvre le prêt que sur trois à six mois. */
const DUREES = [
  { label: '3 mois', value: '3' },
  { label: '4 mois', value: '4' },
  { label: '5 mois', value: '5' },
  { label: '6 mois', value: '6' },
] as const;

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
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading>{isEditMode ? 'Modifier un prêt' : 'Nouveau prêt'}</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              <form className="flex flex-col gap-4" id="pret-form" onSubmit={handleSubmit(submitForm)}>
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
                    name="totalAmount"
                    render={({ field }) => (
                      <ChampMontant
                        aide="En francs CFA"
                        erreur={errors.totalAmount?.message}
                        label="Montant total"
                        onChange={field.onChange}
                        valeur={field.value}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="duration"
                    render={({ field }) => (
                      <ChampListe
                        erreur={errors.duration?.message}
                        label="Durée (mois)"
                        onChange={(v) => field.onChange(Number(v))}
                        options={DUREES}
                        placeholder="Sélectionner une durée"
                        valeur={String(field.value ?? '')}
                      />
                    )}
                  />
                </div>

                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <ChampTexte
                      erreur={errors.startDate?.message}
                      label="Date de début"
                      onChange={field.onChange}
                      type="date"
                      valeur={field.value ?? ''}
                    />
                  )}
                />

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
              <Button form="pret-form" isPending={isSubmitting} type="submit" variant="primary">
                {isEditMode ? 'Modifier' : 'Créer'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default PretModal;
