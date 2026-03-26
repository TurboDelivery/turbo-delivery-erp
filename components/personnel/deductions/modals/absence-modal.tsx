'use client';

import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea } from '@heroui/react';
import { isValid, parseISO } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';
import { Label } from '@/components/ui/label';
import { deductionAPI } from '@/features/personnel/apis/deduction.api';
import { deductionKeys } from '@/features/personnel/queries/deduction-list.query';
import { absenceDeductionFormSchema, AbsenceDeductionFormValues, createAbsenceDeductionSchema, CreateAbsenceDeductionDTO } from '@/features/personnel/schemas/deduction.schema';
import { IDeduction } from '@/features/personnel/types/deduction.types';
import { IAbsence } from '@/features/personnel/types/absence.types';

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

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date && isValid(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }
  return null;
};

const toDateInputValue = (value: unknown): string => {
  const date = toDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateDaysInclusive = (dateDebut: string, dateFin: string): number => {
  const start = new Date(`${dateDebut}T00:00:00`);
  const end = new Date(`${dateFin}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
};

export default function AbsenceModal({ isOpen, onClose, absence, deduction, onSubmit }: AbsenceModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(deduction?.id || absence?.id);

  const form = useForm<AbsenceDeductionFormValues>({
    resolver: zodResolver(absenceDeductionFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const isPending = isSubmitting;

  const initialValues = useMemo<AbsenceDeductionFormValues>(() => {
    if (!absence && !deduction) {
      return DEFAULT_VALUES;
    }

    const employeeId = deduction?.employee?.id || absence?.employeeId || absence?.employee?.id || '';
    const fallbackDate = deduction?.deductionDate || absence?.dateDebut;
    const fallbackEndDate = absence?.dateFin || deduction?.deductionDate;

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
        await onSubmit({
          mode: isEditMode ? 'update' : 'create',
          id: currentId,
          dto,
          motif: values.motif,
        });
      } else {
        await deductionAPI.createAbsenceDeduction(dto);
      }

      await queryClient.invalidateQueries({ queryKey: deductionKeys.all });
      toast.success(isEditMode ? 'Absence modifiée avec succès' : 'Absence enregistrée avec succès');
      reset(DEFAULT_VALUES);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement de l'absence");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader>{isEditMode ? 'Modifier une absence' : 'Signaler une absence'}</ModalHeader>
            <ModalBody>
              <form id="absence-form" className="space-y-4" onSubmit={handleSubmit(submitAbsence)}>
                <div>
                  <Label className="mb-1 block">Employe</Label>
                  <EmployeeSelect value={form.watch('employeeId')} onChange={(value) => setValue('employeeId', value || '', { shouldValidate: true, shouldDirty: true })} className="text-xs w-full" />
                  {errors.employeeId && <small className="text-red-500 text-sm">{errors.employeeId.message}</small>}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateDebut">Date debut</Label>
                    <Input id="dateDebut" type="date" {...register('dateDebut')} variant="bordered" isInvalid={!!errors.dateDebut} errorMessage={errors.dateDebut?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFin">Date fin</Label>
                    <Input id="dateFin" type="date" {...register('dateFin')} variant="bordered" isInvalid={!!errors.dateFin} errorMessage={errors.dateFin?.message} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motif">Motif</Label>
                  <Textarea id="motif" placeholder="Saisissez le motif" {...register('motif')} variant="bordered" minRows={3} isInvalid={!!errors.motif} errorMessage={errors.motif?.message} />
                </div>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" color="danger" onPress={closeModal} isDisabled={isPending}>
                Annuler
              </Button>
              <Button color="primary" type="submit" form="absence-form" isLoading={isPending}>
                {isEditMode ? 'Modifier' : 'Creer'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
