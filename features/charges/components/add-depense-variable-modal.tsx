'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  Badge,
} from '@/components/heroui';
import ReactSelect from 'react-select';
import { Check, Plus, Save, Paperclip, X } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  useAjouterChargeVariableMutation,
  useModifierChargeVariableMutation,
} from '@/features/charges/queries/charge-variable.mutation';
import { IChargeVariable } from '@/features/charges/types/charge-variable.type';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { useSession } from 'next-auth/react';
import {
  ChargeVariableFormDTO,
  chargeVariableFormSchema,
} from '@/features/charges/schemas/charge-variable.schema';
import { getTodayDateInput } from '@/lib/date-utils';
import { createUrlFile } from '@/utils/createUrlFile';
import { formatMontant } from '@/utils/format.utils';

interface AddDepenseVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (depense: IChargeVariable) => void;
  chargeToEdit?: IChargeVariable | null;
}

const EMPTY_FORM: ChargeVariableFormDTO = {
  designation: '',
  categorieId: '',
  montant: 0,
  description: '',
  dateDepense: getTodayDateInput(),
};

function Step({ label, sub, active }: { label: string; sub: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center flex-1">
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
          active
            ? 'bg-green-500 border-green-500 text-white'
            : 'bg-gray-200 border-gray-300 text-gray-500'
        }`}
      >
        {active ? <Check size={18} /> : null}
      </div>
      <p className="text-sm mt-2 font-medium">{label}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}

export default function AddDepenseVariableModal({
  isOpen,
  onClose,
  onAdd,
  chargeToEdit,
}: AddDepenseVariableModalProps) {
  const isEditMode = !!chargeToEdit;

  const { mutate: ajouterChargeVariable, isPending: isAdding } = useAjouterChargeVariableMutation();
  const { mutate: modifierChargeVariable, isPending: isUpdating } = useModifierChargeVariableMutation();
  const isPending = isAdding || isUpdating;

  const { categories, isLoading: isLoadingCategories } = useCategorieDepense();
  const { data: session } = useSession();

  const [justificatifFile, setJustificatifFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    reset,
    register,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ChargeVariableFormDTO>({
    resolver: zodResolver(chargeVariableFormSchema),
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!isOpen) {
      reset(EMPTY_FORM);
      setJustificatifFile(null);
      return;
    }

    if (chargeToEdit) {
      reset({
        designation: chargeToEdit.designation,
        categorieId: chargeToEdit.categorie?.id ?? '',
        montant: chargeToEdit.montant,
        description: chargeToEdit.description ?? '',
        dateDepense: chargeToEdit.dateDepense ?? getTodayDateInput(),
      });
      return;
    }

    reset(EMPTY_FORM);
    setJustificatifFile(null);
  }, [chargeToEdit, isOpen, reset]);

  const formValues = watch();

  const hasJustificatif = justificatifFile !== null || !!chargeToEdit?.justificatif;

  // Aperçu du justificatif déjà enregistré : on sert le fichier via le proxy
  // /api/fichier (Content-Type correct + inline) plutôt que d'afficher son nom UUID.
  const justificatifUrl = chargeToEdit?.justificatif
    ? `/api/fichier?u=${encodeURIComponent(createUrlFile(chargeToEdit.justificatif, 'backend'))}`
    : null;
  const justificatifEstPdf = (chargeToEdit?.justificatif ?? '').toLowerCase().includes('.pdf');

  const onSubmit = (values: ChargeVariableFormDTO) => {
    if (!hasJustificatif) return;

    const payload = {
      ...values,
      cyclePaiement: 'MENSUEL' as const,
      echeanceJour: 5,
      creerPar: session?.user?.name ?? '',
    };

    if (isEditMode && chargeToEdit) {
      modifierChargeVariable(
        { id: chargeToEdit.id, data: payload, file: justificatifFile },
        {
          onSuccess: () => {
            reset(EMPTY_FORM);
            onClose();
          },
        },
      );
    } else {
      ajouterChargeVariable(
        { data: payload, file: justificatifFile },
        {
          onSuccess: (data) => {
            onAdd?.(data);
            reset(EMPTY_FORM);
            setJustificatifFile(null);
            onClose();
          },
        },
      );
    }
  };

  const handleClose = () => {
    reset(EMPTY_FORM);
    setJustificatifFile(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="text-purple-600 text-xl font-semibold">
          {isEditMode ? 'Modifier la dépense variable' : 'Ajouter une Dépense Variable'}
        </ModalHeader>

        <ModalBody>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Désignation"
                placeholder="Ex: Carburant, Maintenance..."
                {...register('designation')}
                variant="bordered"
                isInvalid={!!errors.designation}
                errorMessage={errors.designation?.message}
              />

              <div className="flex flex-col gap-1">
                <ReactSelect
                  options={categories.map((cat) => ({ label: cat.nomCategorie, value: cat.id }))}
                  value={
                    formValues.categorieId
                      ? { label: categories.find((c) => c.id === formValues.categorieId)?.nomCategorie ?? '', value: formValues.categorieId }
                      : null
                  }
                  onChange={(opt) =>
                    setValue('categorieId', opt?.value ?? '', { shouldValidate: true })
                  }
                  placeholder="Rechercher une catégorie..."
                  isClearable
                  isLoading={isLoadingCategories}
                  isDisabled={isLoadingCategories}
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: errors.categorieId ? '#f31260' : state.isFocused ? '#7828c8' : '#d4d4d8',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(120,40,200,0.2)' : 'none',
                      '&:hover': { borderColor: errors.categorieId ? '#f31260' : '#7828c8' },
                    }),
                  }}
                />
                {errors.categorieId && (
                  <p className="text-xs text-red-500">{errors.categorieId.message}</p>
                )}
              </div>
            </div>

            <Input
              label="Montant FCFA"
              type="number"
              placeholder="0"
              value={String(formValues.montant ?? 0)}
              onChange={(e) =>
                setValue('montant', Number(e.target.value), { shouldValidate: true })
              }
              variant="bordered"
              startContent={<span className="text-gray-500 text-sm">FCFA</span>}
              isInvalid={!!errors.montant}
              errorMessage={errors.montant?.message}
            />

            <Input
              label="Date de dépense"
              type="date"
              value={formValues.dateDepense ?? ''}
              onChange={(e) =>
                setValue('dateDepense', e.target.value, { shouldValidate: true })
              }
              variant="bordered"
              isInvalid={!!errors.dateDepense}
              errorMessage={errors.dateDepense?.message}
            />

            <Textarea
              label="Description (optionnel)"
              placeholder="Ajouter une description..."
              {...register('description')}
              variant="bordered"
              minRows={2}
              maxRows={4}
            />

            {/* Justificatif (fichier) */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Justificatif <span className="text-red-500">*</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setJustificatifFile(e.target.files?.[0] ?? null)}
              />
              {justificatifFile ? (
                <div className="flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-3">
                  <Paperclip size={16} className="text-purple-600 shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{justificatifFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setJustificatifFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
                >
                  <Paperclip size={16} />
                  Joindre un fichier (image ou PDF)
                </button>
              )}
              {justificatifUrl && !justificatifFile && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Justificatif actuel</p>
                  {justificatifEstPdf ? (
                    <iframe
                      src={justificatifUrl}
                      title="Justificatif actuel (PDF)"
                      className="w-full h-56 rounded-lg border border-gray-200 bg-gray-50"
                    />
                  ) : (
                    <a
                      href={justificatifUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ouvrir le justificatif en grand"
                      className="block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={justificatifUrl}
                        alt="Justificatif actuel"
                        className="max-h-56 w-auto rounded-lg border border-gray-200 object-contain hover:opacity-90 transition-opacity"
                      />
                    </a>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1">
                    Joindre un nouveau fichier remplacera ce justificatif.
                  </p>
                </div>
              )}
              {!hasJustificatif && (
                <p className="text-xs text-red-500 mt-1">Le justificatif est obligatoire</p>
              )}
            </div>

            {/* Workflow */}
            <div className="flex items-center justify-between pt-4">
              <Step label="Comptable" sub="Saisie" active />
              <div className="flex-1 h-[2px] bg-gray-300 mx-2" />
              <Step label="DGA" sub="Visa" />
              <div className="flex-1 h-[2px] bg-gray-300 mx-2" />
              <Step label="DG" sub="Approbation" />
              <div className="flex-1 h-[2px] bg-gray-300 mx-2" />
              <Step label="Paiement" sub="Décaissement" />
            </div>

            {/* Aperçu */}
            {isValid && hasJustificatif && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">{formValues.designation}</p>
                <Badge color="secondary" variant="flat">
                  {categories.find((c) => c.id === formValues.categorieId)?.nomCategorie}
                </Badge>
                <p className="text-purple-600 font-bold mt-2">
                  {formatMontant(formValues.montant)}
                </p>
              </div>
            )}

            <ModalFooter className="px-0">
              <Button variant="bordered" onPress={handleClose}>
                Annuler
              </Button>
              <Button
                color="primary"
                type="submit"
                isDisabled={!isValid || !hasJustificatif || isPending}
                isLoading={isPending}
                className="bg-purple-600"
              >
                {isEditMode ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer les modifications
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
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

