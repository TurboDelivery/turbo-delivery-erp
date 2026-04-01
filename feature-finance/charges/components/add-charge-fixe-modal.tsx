'use client';

import { useState, useMemo } from 'react';
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
import { Check, Plus } from 'lucide-react';

interface AddChargeFixeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (charge: any) => void;
}

const categories = [
  { value: 'loyer', label: 'Loyer' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'logistique', label: 'Logistique' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'communication', label: 'Communication' },
  { value: 'assurance', label: 'Assurance' },
  { value: 'autre', label: 'Autre' },
];

const cycles = [
  { value: 'mensuel', label: 'Tous les mois' },
  { value: 'trimestriel', label: 'Tous les trimestres' },
  { value: 'semestriel', label: 'Tous les semestres' },
  { value: 'annuel', label: 'Tous les ans' },
];

export default function AddChargeFixeModal({
  isOpen,
  onClose,
  onAdd,
}: AddChargeFixeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    cycle: 'mensuel',
    amount: '',
    dueDate: '01',
    description: '',
  });

  // ✅ Validation formulaire
  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() !== '' &&
      formData.category !== '' &&
      formData.amount !== ''
    );
  }, [formData]);

  const handleSubmit = () => {
    if (!isFormValid) return;

    const newCharge = {
      id: Date.now().toString(),
      ...formData,
      status: 'Actif',
      isAutomatic: false,
    };

    onAdd(newCharge);
    onClose();

    setFormData({
      name: '',
      category: '',
      cycle: 'mensuel',
      amount: '',
      dueDate: '01',
      description: '',
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 🎯 Composant Step
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
          Ajouter une charge fixe
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Form */}
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
            >
              {categories.map((cat) => (
                <SelectItem key={cat.value}>{cat.label}</SelectItem>
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

            {/* ✅ Steps validation */}
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
            {isFormValid && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">{formData.name}</p>
                <Badge color="primary" variant="flat">
                  {
                    categories.find((c) => c.value === formData.category)
                      ?.label
                  }
                </Badge>
                <p className="text-blue-600 font-bold mt-2">
                  {parseInt(formData.amount).toLocaleString()} FCFA
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
            isDisabled={!isFormValid}
          >
            <Plus className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}