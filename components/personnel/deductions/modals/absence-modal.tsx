'use client';

import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Modal } from '@heroui-v3/react';
import { toast } from 'sonner';
import { ChampEnveloppe, ChampTexte, ChampZoneTexte } from '@/components/personnel/common/champs-personnel';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';
import { absenceDeductionFormSchema, AbsenceDeductionFormValues, CreateAbsenceDeductionDTO, createAbsenceDeductionSchema } from '@/features/personnel/schemas/deduction.schema';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { IAbsence } from '@/features/personnel/types/absence.types';
import { calculateDaysInclusive, computeEndDateFromDays, toDateInputValue } from '@/lib/date-utils';

type AbsenceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  absence?: IAbsence | null;
  deduction?: IDeduction | null;
  onSubmit?: (args: { mode: 'create' | 'update'; id?: string; dto: CreateAbsenceDeductionDTO; motif?: string }) => Promise<void> | void;
};

const DEFAULT_VALUES: AbsenceDeductionFormValues = {
  employeeId: '',
  dateDebut: '',
  dateFin: '',
  motif: '',
};

export default function AbsenceModal({ isOpen, onClose, absence, deduction, onSubmit }: AbsenceModalProps) {
  const isEditMode = Boolean(deduction?.id || absence?.id);

  const form = useForm<AbsenceDeductionFormValues>({
    resolver: zodResolver(absenceDeductionFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const initialValues = useMemo<AbsenceDeductionFormValues>(() => {
    if (!absence && !deduction) return DEFAULT_VALUES;

    const employeeId = deduction?.employee?.id || absence?.employeeId || absence?.employee?.id || '';
    const fallbackDate = deduction?.deductionDate || absence?.dateDebut;
    const fallbackEndDate = absence?.dateFin || computeEndDateFromDays(absence?.dateDebut, absence?.days) || deduction?.deductionDate;

    return {
      employeeId,
      motif: deduction?.description || absence?.motif || '',
      dateDebut: toDateInputValue(fallbackDate),
      dateFin: toDateInputValue(fallbackEndDate),
    };
  }, [absence, deduction]);

  useEffect(() => {
    if (!isOpen) {
      reset(DEFAULT_VALUES);
      return;
    }
    reset(initialValues);
  }, [initialValues, isOpen, reset]);

  const submitAbsence = async (values: AbsenceDeductionFormValues) => {
    const dto: CreateAbsenceDeductionDTO = createAbsenceDeductionSchema.parse({
      employeeId: values.employeeId,
      days: calculateDaysInclusive(values.dateDebut, values.dateFin),
      date: values.dateDebut,
      motif: values.motif,
    });

    try {
      const currentId = deduction?.id || absence?.id;

      if (onSubmit) {
        await onSubmit({ mode: isEditMode ? 'update' : 'create', id: currentId, dto, motif: values.motif });
      }

      toast.success(isEditMode ? 'Absence modifiée avec succès' : 'Absence enregistrée avec succès');
      reset(DEFAULT_VALUES);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement de l'absence");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading>
                {isEditMode ? 'Modifier une absence' : 'Signaler une absence'}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              <form className="flex flex-col gap-4" id="absence-form" onSubmit={handleSubmit(submitAbsence)}>
                <ChampEnveloppe erreur={errors.employeeId?.message} label="Employé">
                  <EmployeeSelect
                    className="w-full"
                    onChange={(value) =>
                      setValue('employeeId', value || '', { shouldDirty: true, shouldValidate: true })
                    }
                    value={form.watch('employeeId')}
                  />
                </ChampEnveloppe>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    control={control}
                    name="dateDebut"
                    render={({ field }) => (
                      <ChampTexte
                        erreur={errors.dateDebut?.message}
                        label="Date début"
                        onChange={field.onChange}
                        type="date"
                        valeur={field.value ?? ''}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="dateFin"
                    render={({ field }) => (
                      <ChampTexte
                        erreur={errors.dateFin?.message}
                        label="Date fin"
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
              <Button form="absence-form" isPending={isSubmitting} type="submit" variant="primary">
                {isEditMode ? 'Modifier' : 'Créer'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
