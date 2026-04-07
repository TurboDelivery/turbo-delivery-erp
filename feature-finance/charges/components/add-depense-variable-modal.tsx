'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
  Badge,
} from '@heroui/react';
import { Check, Plus, Save, Paperclip, X } from 'lucide-react';
import {
  useAjouterChargeVariableMutation,
  useModifierChargeVariableMutation,
} from '@/feature-finance/charges/queries/charge-variable.mutation';
import { IChargeVariable } from '@/feature-finance/charges/types/charge-variable.type';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { useSession } from 'next-auth/react';

interface AddDepenseVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (depense: IChargeVariable) => void;
  chargeToEdit?: IChargeVariable | null;
}

const EMPTY_FORM = {
  designation: '',
  category: '',
  montant: '',
  description: '',
};

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

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [justificatifFile, setJustificatifFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && chargeToEdit) {
      setFormData({
        designation: chargeToEdit.designation,
        category: chargeToEdit.categorie?.id ?? '',
        montant: String(chargeToEdit.montant),
        description: chargeToEdit.description ?? '',
      });
    } else if (isOpen && !chargeToEdit) {
      setFormData(EMPTY_FORM);
      setJustificatifFile(null);
    }
  }, [isOpen, chargeToEdit]);

  const isFormValid = useMemo(
    () =>
      formData.designation.trim() !== '' &&
      formData.category !== '' &&
      formData.montant !== '',
    [formData],
  );

  const handleSubmit = () => {
    if (!isFormValid) return;

    const payload = {
      designation: formData.designation.trim(),
      categorieId: formData.category,
      montant: parseInt(formData.montant, 10),
      description: formData.description || undefined,
      creerPar: session?.user?.name ?? '',
    };

    if (isEditMode && chargeToEdit) {
      modifierChargeVariable(
        { id: chargeToEdit.id, data: payload, file: justificatifFile },
        { onSuccess: () => onClose() },
      );
    } else {
      ajouterChargeVariable(
        { data: payload, file: justificatifFile },
        {
          onSuccess: (data) => {
            onAdd?.(data);
            onClose();
            setFormData(EMPTY_FORM);
            setJustificatifFile(null);
          },
        },
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const Step = ({ label, sub, active }: { label: string; sub: string; active?: boolean }) => (
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="text-purple-600 text-xl font-semibold">
          {isEditMode ? 'Modifier la dépense variable' : 'Ajouter une Dépense Variable'}
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Désignation"
                placeholder="Ex: Carburant, Maintenance..."
                value={formData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                variant="bordered"
              />

              <Select
                label="Catégorie"
                selectedKeys={formData.category ? [formData.category] : []}
                onSelectionChange={(keys) =>
                  handleInputChange('category', Array.from(keys)[0] as string)
                }
                variant="bordered"
                isLoading={isLoadingCategories}
              >
                {categories.map((cat) => (
                  <SelectItem key={cat.id}>{cat.nomCategorie}</SelectItem>
                ))}
              </Select>
            </div>

            <Input
              label="Montant FCFA"
              type="number"
              placeholder="0"
              value={formData.montant}
              onChange={(e) => handleInputChange('montant', e.target.value)}
              variant="bordered"
              startContent={<span className="text-gray-500 text-sm">FCFA</span>}
            />

            <Textarea
              label="Description (optionnel)"
              placeholder="Ajouter une description..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              variant="bordered"
              minRows={2}
              maxRows={4}
            />

            {/* Justificatif (fichier) */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Justificatif (optionnel)</p>
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
              {chargeToEdit?.justificatif && !justificatifFile && (
                <p className="text-xs text-gray-400 mt-1">
                  Fichier actuel : {chargeToEdit.justificatif.split('/').pop()}
                </p>
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
            {isFormValid && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">{formData.designation}</p>
                <Badge color="secondary" variant="flat">
                  {categories.find((c) => c.id === formData.category)?.nomCategorie}
                </Badge>
                <p className="text-purple-600 font-bold mt-2">
                  {parseInt(formData.montant).toLocaleString()} FCFA
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="bordered" onPress={onClose}>
            Annuler
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={!isFormValid || isPending}
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
      </ModalContent>
    </Modal>
  );
}
