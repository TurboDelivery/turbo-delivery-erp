'use client';

import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Textarea } from '@heroui/react';
import { isValid, parseISO } from 'date-fns';
import { EmployeeSelect } from '@/components/personnel/common/employee-select';
import { Label } from '@/components/ui/label';
import { useCreateAbsenceMutation, useUpdateAbsenceMutation } from '@/features/personnel/mutations/absence.mutation';
import { absenceFormSchema, AbsenceFormValues } from '@/features/personnel/schemas/absence.schema';
import { AbsenceTypeEnum, IAbsence, IAbsencePayload } from '@/features/personnel/types/absence.types';

type AbsenceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  absence?: IAbsence | null;
};

const DEFAULT_VALUES: AbsenceFormValues = {
  employeeId: '',
  type: 'ABSENCE',
  motif: '',
  dateDebut: '',
  dateFin: '',
  retardDate: '',
  heureDebut: '08:00',
  heureFin: '10:00',
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

const toTimeInputValue = (value: unknown): string => {
  const date = toDate(value);
  if (!date) return '';
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
};

const toIsoFromDateAndTime = (dateValue: string, timeValue: string): string => {
  return new Date(`${dateValue}T${timeValue}:00`).toISOString();
};

const toIsoFromDateStart = (dateValue: string): string => {
  return new Date(`${dateValue}T00:00:00`).toISOString();
};

const toIsoFromDateEnd = (dateValue: string): string => {
  return new Date(`${dateValue}T23:59:59`).toISOString();
};

export default function AbsenceModal({ isOpen, onClose, absence }: AbsenceModalProps) {
  const createAbsenceMutation = useCreateAbsenceMutation();
  const updateAbsenceMutation = useUpdateAbsenceMutation();
  const isEditMode = Boolean(absence?.id);

  const form = useForm<AbsenceFormValues>({
    resolver: zodResolver(absenceFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const currentType = watch('type');

  const isPending = isSubmitting || createAbsenceMutation.isPending || updateAbsenceMutation.isPending;

  const initialValues = useMemo<AbsenceFormValues>(() => {
    if (!absence) {
      return DEFAULT_VALUES;
    }

    const employeeId = absence.employeeId || absence.employee?.id || '';
    const type = absence.type === AbsenceTypeEnum.RETARD ? 'RETARD' : 'ABSENCE';

    if (type === 'RETARD') {
      return {
        employeeId,
        type,
        motif: absence.motif || '',
        dateDebut: '',
        dateFin: '',
        retardDate: toDateInputValue(absence.dateDebut),
        heureDebut: toTimeInputValue(absence.dateDebut) || '08:00',
        heureFin: toTimeInputValue(absence.dateFin) || '10:00',
      };
    }

    return {
      employeeId,
      type,
      motif: absence.motif || '',
      dateDebut: toDateInputValue(absence.dateDebut),
      dateFin: toDateInputValue(absence.dateFin),
      retardDate: '',
      heureDebut: '08:00',
      heureFin: '10:00',
    };
  }, [absence]);

  useEffect(() => {
    if (!isOpen) {
      reset(DEFAULT_VALUES);
      return;
    }

    reset(initialValues);
  }, [initialValues, isOpen, reset]);

  const onSubmit = async (values: AbsenceFormValues) => {
    const payload: IAbsencePayload =
      values.type === 'RETARD'
        ? {
            employeeId: values.employeeId,
            type: AbsenceTypeEnum.RETARD,
            motif: values.motif,
            dateDebut: toIsoFromDateAndTime(values.retardDate || '', values.heureDebut || '00:00'),
            dateFin: toIsoFromDateAndTime(values.retardDate || '', values.heureFin || '00:00'),
          }
        : {
            employeeId: values.employeeId,
            type: AbsenceTypeEnum.ABSENCE,
            motif: values.motif,
            dateDebut: toIsoFromDateStart(values.dateDebut || ''),
            dateFin: toIsoFromDateEnd(values.dateFin || ''),
          };

    try {
      if (isEditMode && absence?.id) {
        await updateAbsenceMutation.mutateAsync({
          id: absence.id,
          data: payload,
        });
      } else {
        await createAbsenceMutation.mutateAsync(payload);
      }

      reset(DEFAULT_VALUES);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader>{isEditMode ? 'Modifier une absence' : 'Signaler une absence'}</ModalHeader>
            <ModalBody>
              <form id="absence-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <Label className="mb-1 block">Employe</Label>
                  <EmployeeSelect value={watch('employeeId')} onChange={(value) => setValue('employeeId', value || '', { shouldValidate: true, shouldDirty: true })} className="text-xs w-full" />
                  {errors.employeeId && <small className="text-red-500 text-sm">{errors.employeeId.message}</small>}
                </div>
                <div>
                  <Label className="mb-1 block">Type</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        placeholder="Selectionnez un type"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys as Set<string>)[0] as 'ABSENCE' | 'RETARD' | undefined;
                          field.onChange(selected || 'ABSENCE');
                        }}
                        variant="bordered"
                        isInvalid={!!errors.type}
                        errorMessage={errors.type?.message}
                      >
                        <SelectItem key="ABSENCE" value="ABSENCE">
                          Absence
                        </SelectItem>
                        <SelectItem key="RETARD" value="RETARD">
                          Retard
                        </SelectItem>
                      </Select>
                    )}
                  />
                </div>
                {currentType === 'RETARD' ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="retardDate">Date</Label>
                      <Input id="retardDate" type="date" {...register('retardDate')} variant="bordered" isInvalid={!!errors.retardDate} errorMessage={errors.retardDate?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heureDebut">Heure debut</Label>
                      <Input id="heureDebut" type="time" {...register('heureDebut')} variant="bordered" isInvalid={!!errors.heureDebut} errorMessage={errors.heureDebut?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heureFin">Heure fin</Label>
                      <Input id="heureFin" type="time" {...register('heureFin')} variant="bordered" isInvalid={!!errors.heureFin} errorMessage={errors.heureFin?.message} />
                    </div>
                  </div>
                ) : (
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
                )}

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
