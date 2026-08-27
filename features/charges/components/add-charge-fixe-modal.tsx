'use client';

import { useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { Plus, Save } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  useAjouterChargeFixeMutation,
  useModifierChargeFixeMutation,
} from '@/features/charges/queries/charge-fixe.mutation';
import { IChargeFixe } from '@/features/charges/types/charge-fixe.type';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import {
  ChargeFixeCreateDTO,
  chargeFixeFormSchema,
} from '@/features/charges/schemas/charge-fixe.schema';

interface AddChargeFixeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chargeToEdit?: IChargeFixe | null;
}

const cycles = [
  { value: 'MENSUEL', label: 'Tous les mois' },
  { value: 'TRIMESTRIEL', label: 'Tous les trimestres' },
  { value: 'SEMESTRIEL', label: 'Tous les semestres' },
  { value: 'ANNUEL', label: 'Tous les ans' },
];

const EMPTY_FORM: ChargeFixeCreateDTO = {
  designation: '',
  categorieId: '',
  cyclePaiement: 'MENSUEL',
  montant: 0,
  echeanceJour: 1,
};

export default function AddChargeFixeModal({
  isOpen,
  onClose,
  chargeToEdit,
}: AddChargeFixeModalProps) {
  const isEditMode = !!chargeToEdit;

  const { mutate: ajouterChargeFixe, isPending: isAdding } = useAjouterChargeFixeMutation();
  const { mutate: modifierChargeFixe, isPending: isUpdating } = useModifierChargeFixeMutation();
  const isPending = isAdding || isUpdating;

  const { categories, isLoading: isLoadingCategories } = useCategorieDepense();

  const {
    handleSubmit,
    reset,
    register,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ChargeFixeCreateDTO>({
    resolver: zodResolver(chargeFixeFormSchema),
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!isOpen) {
      reset(EMPTY_FORM);
      return;
    }

    if (chargeToEdit) {
      reset({
        designation: chargeToEdit.designation,
        categorieId: chargeToEdit.categorie?.id ?? '',
        cyclePaiement: chargeToEdit.cyclePaiement,
        montant: chargeToEdit.montant,
        echeanceJour: chargeToEdit.echeanceJour,
      });
      return;
    }

    reset(EMPTY_FORM);
  }, [chargeToEdit, isOpen, reset]);

  const formValues = watch();

  const onSubmit = (values: ChargeFixeCreateDTO) => {
    if (isEditMode && chargeToEdit) {
      modifierChargeFixe(
        { id: chargeToEdit.id, data: values },
        {
          onSuccess: () => {
            reset(EMPTY_FORM);
            onClose();
          },
        },
      );
      return;
    }

    ajouterChargeFixe(values, {
      onSuccess: () => {
        reset(EMPTY_FORM);
        onClose();
      },
    });
  };

  const handleClose = () => {
    reset(EMPTY_FORM);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="text-blue-600 text-xl font-semibold">
          {isEditMode ? 'Modifier la charge fixe' : 'Ajouter une charge fixe'}
        </ModalHeader>

        <ModalBody>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Designation"
                placeholder="Ex: Loyer Bureau, Internet..."
                {...register('designation')}
                variant="bordered"
                isInvalid={!!errors.designation}
                errorMessage={errors.designation?.message}
              />

              <Select
                label="Categorie"
                selectedKeys={formValues.categorieId ? [formValues.categorieId] : []}
                onSelectionChange={(keys) =>
                  setValue('categorieId', Array.from(keys)[0] as string, { shouldValidate: true })
                }
                variant="bordered"
                isLoading={isLoadingCategories}
                isInvalid={!!errors.categorieId}
                errorMessage={errors.categorieId?.message}
              >
                {categories.map((cat) => (
                  <SelectItem key={cat.id}>{cat.nomCategorie}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Cycle de paiement"
                selectedKeys={formValues.cyclePaiement ? [formValues.cyclePaiement] : []}
                onSelectionChange={(keys) =>
                  setValue('cyclePaiement', Array.from(keys)[0] as ChargeFixeCreateDTO['cyclePaiement'], {
                    shouldValidate: true,
                  })
                }
                variant="bordered"
                isInvalid={!!errors.cyclePaiement}
                errorMessage={errors.cyclePaiement?.message}
              >
                {cycles.map((cycle) => (
                  <SelectItem key={cycle.value}>{cycle.label}</SelectItem>
                ))}
              </Select>

              <Input
                label="Montant FCFA"
                type="number"
                value={String(formValues.montant ?? 0)}
                onChange={(e) =>
                  setValue('montant', Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
                variant="bordered"
                isInvalid={!!errors.montant}
                errorMessage={errors.montant?.message}
              />

              <Select
                label="Date d'echeance"
                selectedKeys={formValues.echeanceJour ? [String(formValues.echeanceJour)] : []}
                onSelectionChange={(keys) =>
                  setValue('echeanceJour', Number(Array.from(keys)[0] as string), { shouldValidate: true })
                }
                variant="bordered"
                isInvalid={!!errors.echeanceJour}
                errorMessage={errors.echeanceJour?.message}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day.toString()}>
                    {day.toString()}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <ModalFooter className="px-0">
              <Button variant="bordered" onPress={handleClose}>
                Annuler
              </Button>

              <Button
                color="primary"
                type="submit"
                isDisabled={!isValid || isPending}
                isLoading={isPending}
              >
                {isEditMode ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

