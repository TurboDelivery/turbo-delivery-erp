'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal } from '@heroui-v3/react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
  ChampListe,
  ChampMontant,
  ChampTexte,
} from '@/components/personnel/common/champs-personnel';
import { DEPARTMENTS, POSTES } from '@/features/personnel/constants/employee.constants';
import { useModifierEmployeMutation } from '@/features/personnel/mutations/employee.mutation';
import { EmployeeSchema, type EmployeeDTO } from '@/features/personnel/schemas/employee.schema';
import { IEmployee } from '@/features/personnel/types/types';

const POSTES_OPTIONS = POSTES.map((p) => ({ label: p, value: p }));
const DEPARTEMENTS_OPTIONS = DEPARTMENTS.map((d) => ({ label: d.name, value: d.name }));
const STATUTS_OPTIONS = [
  { label: 'Actif', value: 'Actif' },
  { label: 'Inactif', value: 'Inactif' },
  { label: 'Congé', value: 'Congé' },
] as const;

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

  const enCours = isSubmitting || modifierEmployeMutation.isPending;

  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading>Modifier l&apos;employé</Modal.Heading>
              {/* La croix etait un caractere « ✕ » dans un bouton : la fenetre en a une. */}
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              <form
                className="flex flex-col gap-4"
                id="edit-employee-form"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <ChampTexte
                        erreur={errors.name?.message}
                        label="Nom complet"
                        onChange={field.onChange}
                        placeholder="Entrez le nom complet"
                        valeur={field.value ?? ''}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <ChampTexte
                        erreur={errors.email?.message}
                        label="Email"
                        onChange={field.onChange}
                        placeholder="Entrez l'email"
                        type="email"
                        valeur={field.value ?? ''}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="position"
                    render={({ field }) => (
                      <ChampListe
                        erreur={errors.position?.message}
                        label="Fonction"
                        onChange={field.onChange}
                        options={POSTES_OPTIONS}
                        placeholder="Rechercher une fonction"
                        valeur={field.value ?? ''}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="department"
                    render={({ field }) => (
                      <ChampListe
                        erreur={errors.department?.message}
                        label="Département"
                        onChange={field.onChange}
                        options={DEPARTEMENTS_OPTIONS}
                        placeholder="Rechercher un département"
                        valeur={field.value ?? ''}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="salary"
                    render={({ field }) => (
                      <ChampMontant
                        aide="En francs CFA"
                        erreur={errors.salary?.message}
                        label="Salaire"
                        onChange={field.onChange}
                        valeur={field.value}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="entryDate"
                    render={({ field }) => (
                      <ChampTexte
                        erreur={errors.entryDate?.message}
                        label="Date d'entrée"
                        onChange={field.onChange}
                        type="date"
                        valeur={field.value ?? ''}
                      />
                    )}
                  />
                </div>

                <Controller
                  control={control}
                  name="statut"
                  render={({ field }) => (
                    <ChampListe
                      erreur={errors.statut?.message}
                      label="Statut"
                      onChange={field.onChange}
                      options={STATUTS_OPTIONS}
                      placeholder="Sélectionnez le statut"
                      valeur={field.value ?? ''}
                    />
                  )}
                />
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button isDisabled={enCours} onPress={onClose} variant="ghost">
                Annuler
              </Button>
              <Button
                form="edit-employee-form"
                isPending={enCours}
                type="submit"
                variant="primary"
              >
                Modifier l&apos;employé
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
