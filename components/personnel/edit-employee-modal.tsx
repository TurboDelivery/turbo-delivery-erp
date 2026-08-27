'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/heroui';
import { Input } from '@/components/heroui';
import { Select, SelectItem } from '@/components/heroui';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/heroui';
import { IEmployee } from '@/features/personnel/types/types';
import { useModifierEmployeMutation } from '@/features/personnel/mutations/employee.mutation';
import { EmployeeSchema, type EmployeeDTO } from '@/features/personnel/schemas/employee.schema';
import { DEPARTMENTS, POSTES } from '@/features/personnel/constants/employee.constants';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: IEmployee | null;
}

const DEFAULT_VALUES: EmployeeDTO = {
  name: '',
  email: '',
  position: '',
  department: '',
  salary: 0,
  entryDate: '',
  statut: 'Actif',
};

export function EditEmployeeModal({ isOpen, onClose, employee }: EditEmployeeModalProps) {
  const modifierEmployeMutation = useModifierEmployeMutation();
  const form = useForm<EmployeeDTO>({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (isOpen && employee) {
      reset({
        name: employee.name,
        email: employee.email,
        position: employee.position,
        department: employee.department,
        salary: employee.salary,
        entryDate: employee.entryDate,
        statut: employee.statut,
      });
      return;
    }
    reset(DEFAULT_VALUES);
  }, [employee, isOpen, reset]);

  const onSubmit = async (data: EmployeeDTO) => {
    if (!employee) return;

    try {
      await modifierEmployeMutation.mutateAsync({
        id: employee.id,
        data,
      });
      onClose();
    } catch {
      // Le toast d'erreur est déjà géré dans la mutation.
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      isDismissable={false}
      hideCloseButton
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span>Modifier l&apos;employé</span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={onClose}
                >
                  ✕
                </Button>
              </div>
            </ModalHeader>
            <ModalBody>
              <form id="edit-employee-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nom complet"
                    placeholder="Entrez le nom complet"
                    {...register('name')}
                    variant="bordered"
                    isInvalid={!!errors.name}
                    errorMessage={errors.name?.message}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="Entrez l'email"
                    {...register('email')}
                    variant="bordered"
                    isInvalid={!!errors.email}
                    errorMessage={errors.email?.message}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="position"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Fonction"
                        placeholder="Sélectionnez une fonction"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const firstKey = Array.from(keys as Set<string>)[0];
                          field.onChange(firstKey ? String(firstKey) : '');
                        }}
                        variant="bordered"
                        isInvalid={!!errors.position}
                        errorMessage={errors.position?.message}
                      >
                        {POSTES.map((position) => (
                          <SelectItem key={position} value={position}>
                            {position.toLowerCase()}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />

                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Département"
                        placeholder="Sélectionnez un département"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const firstKey = Array.from(keys as Set<string>)[0];
                          field.onChange(firstKey ? String(firstKey) : '');
                        }}
                        variant="bordered"
                        isInvalid={!!errors.department}
                        errorMessage={errors.department?.message}
                      >
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept.name} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="salary"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Salaire mensuel"
                        type="number"
                        placeholder="Entrez le salaire"
                        value={field.value ? String(field.value) : ''}
                        onChange={(e) => field.onChange(Number(e.target.value || 0))}
                        variant="bordered"
                        endContent="CFA"
                        isInvalid={!!errors.salary}
                        errorMessage={errors.salary?.message}
                      />
                    )}
                  />
                  <Input
                    label="Date d'entrée"
                    type="date"
                    {...register('entryDate')}
                    variant="bordered"
                    isInvalid={!!errors.entryDate}
                    errorMessage={errors.entryDate?.message}
                  />
                </div>

                <Controller
                  name="statut"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Statut"
                      placeholder="Sélectionnez le statut"
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const firstKey = Array.from(keys as Set<string>)[0];
                        field.onChange(firstKey ? (firstKey as IEmployee['statut']) : 'Actif');
                      }}
                      variant="bordered"
                      isInvalid={!!errors.statut}
                      errorMessage={errors.statut?.message}
                    >
                      <SelectItem key="Actif" value="Actif">Actif</SelectItem>
                      <SelectItem key="Inactif" value="Inactif">Inactif</SelectItem>
                      <SelectItem key="Congé" value="Congé">Congé</SelectItem>
                    </Select>
                  )}
                />
              </form>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose} disabled={isSubmitting || modifierEmployeMutation.isPending}>
                Annuler
              </Button>
              <Button
                color="primary"
                type="submit"
                form="edit-employee-form"
                isLoading={isSubmitting || modifierEmployeMutation.isPending}
                disabled={isSubmitting || modifierEmployeMutation.isPending}
              >
                {isSubmitting || modifierEmployeMutation.isPending ? 'Modification...' : 'Modifier l\'employé'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
