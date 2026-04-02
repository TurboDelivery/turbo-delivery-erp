'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Badge,
} from '@heroui/react';
import { Check, Plus, Save } from 'lucide-react';
import {
  useAjouterChargeFixeMutation,
  useModifierChargeFixeMutation,
} from '@/feature-finance/charges/queries/charge-fixe.mutation';
import { CyclePaiement, IChargeFixe } from '@/feature-finance/charges/types/charge-fixe.type';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';

interface AddChargeFixeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (charge: any) => void;
  chargeToEdit?: IChargeFixe | null;
}

const CYCLE_MAP: Record<string, CyclePaiement> = {
  mensuel:      'MENSUEL',
  trimestriel:  'TRIMESTRIEL',
  semestriel:   'SEMESTRIEL',
  annuel:       'ANNUEL',
};

const CYCLE_REVERSE: Record<CyclePaiement, string> = {
  MENSUEL:      'mensuel',
  TRIMESTRIEL:  'trimestriel',
  SEMESTRIEL:   'semestriel',
  ANNUEL:       'annuel',
};

const cycles = [
  { value: 'mensuel', label: 'Tous les mois' },
  { value: 'trimestriel', label: 'Tous les trimestres' },
  { value: 'semestriel', label: 'Tous les semestres' },
  { value: 'annuel', label: 'Tous les ans' },
];

const EMPTY_FORM = {
  name: '',
  category: '',
  cycle: 'mensuel',
  amount: '',
  dueDate: '01',
  description: '',
};

export default function AddChargeFixeModal({
  isOpen,
  onClose,
  onAdd,
  chargeToEdit,
}: AddChargeFixeModalProps) {
  const isEditMode = !!chargeToEdit;

  const { mutate: ajouterChargeFixe, isPending: isAdding } = useAjouterChargeFixeMutation();
  const { mutate: modifierChargeFixe, isPending: isUpdating } = useModifierChargeFixeMutation();
  const isPending = isAdding || isUpdating;

  const { categories, isLoading: isLoadingCategories } = useCategorieDepense();

  const [formData, setFormData] = useState(EMPTY_FORM);

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (isOpen && chargeToEdit) {
      setFormData({
        name: chargeToEdit.designation,
        category: chargeToEdit.categorie?.id ?? '',
        cycle: CYCLE_REVERSE[chargeToEdit.cyclePaiement] ?? 'mensuel',
        amount: String(chargeToEdit.montant),
        dueDate: String(chargeToEdit.echeanceJour),
        description: '',
      });
    } else if (isOpen && !chargeToEdit) {
      setFormData(EMPTY_FORM);
    }
  }, [isOpen, chargeToEdit]);

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() !== '' &&
      formData.category !== '' &&
      formData.amount !== ''
    );
  }, [formData]);

  const handleSubmit = () => {
    if (!isFormValid) return;

    const cyclePaiement = CYCLE_MAP[formData.cycle] ?? 'MENSUEL';
    const payload = {
      designation: formData.name.trim(),
      categorieId: formData.category,
      cyclePaiement,
      montant: parseInt(formData.amount, 10),
      echeanceJour: parseInt(formData.dueDate, 10),
      automatique: false,
    };

    if (isEditMode && chargeToEdit) {
      modifierChargeFixe(
        { id: chargeToEdit.id, data: payload },
        {
          onSuccess: () => {
            onClose();
          },
        },
      );
    } else {
      ajouterChargeFixe(payload, {
        onSuccess: (data) => {
          onAdd?.(data);
          onClose();
          setFormData(EMPTY_FORM);
        },
      });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const Step = ({
    label,
    sub,
    active,
  }: {
    label: string;
    sub: string;
    active?: boolean;
  }) => (
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
        <ModalHeader className="text-blue-600 text-xl font-semibold">
          {isEditMode ? 'Modifier la charge fixe' : 'Ajouter une charge fixe'}
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            <Input
              label="Désignation"
              placeholder="Ex: Loyer Bureau, Internet..."
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
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

            <Select
              label="Cycle de paiement"
              selectedKeys={[formData.cycle]}
              onSelectionChange={(keys) =>
                handleInputChange('cycle', Array.from(keys)[0] as string)
              }
              variant="bordered"
            >
              {cycles.map((cycle) => (
                <SelectItem key={cycle.value}>{cycle.label}</SelectItem>
              ))}
            </Select>

            <Input
              label="Montant FCFA"
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              variant="bordered"
            />

            <Select
              label="Date d'échéance (jour du mois)"
              selectedKeys={[formData.dueDate]}
              onSelectionChange={(keys) =>
                handleInputChange('dueDate', Array.from(keys)[0] as string)
              }
              variant="bordered"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day.toString()}>
                  {day.toString()}
                </SelectItem>
              ))}
            </Select>

            {/* Steps validation */}
            <div className="flex items-center justify-between pt-6">
              <Step label="Comptable" sub="Saisie" active={isFormValid} />

              <div className="flex-1 h-[2px] bg-gray-300 mx-2" />

              <Step label="DGA" sub="Visa" />

              <div className="flex-1 h-[2px] bg-gray-300 mx-2" />

              <Step label="DG" sub="Approbation" />

              <div className="flex-1 h-[2px] bg-gray-300 mx-2" />

              <Step label="Paiement" sub="Décaissement" />
            </div>

            {/* Aperçu */}
            {/* {isFormValid && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">{formData.name}</p>
                <Badge color="primary" variant="flat">
                  {categories.find((c) => c.id === formData.category)?.nomCategorie}
                </Badge>
                <p className="text-blue-600 font-bold mt-2">
                  {parseInt(formData.amount).toLocaleString()} FCFA
                </p>
              </div>
            )} */}
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
