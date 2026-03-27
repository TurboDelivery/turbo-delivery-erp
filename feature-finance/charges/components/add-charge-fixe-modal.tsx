'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { Button } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { Badge } from '@heroui/react';
import { X, Plus } from 'lucide-react';

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

export default function AddChargeFixeModal({ isOpen, onClose, onAdd }: AddChargeFixeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    cycle: 'mensuel',
    amount: '',
    dueDate: '01',
    description: '',
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.amount) {
      return;
    }
    
    const newCharge = {
      id: Date.now().toString(),
      ...formData,
      status: 'Actif',
      isAutomatic: false,
    };
    
    onAdd(newCharge);
    onClose();
    
    // Reset form
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Ajouter une Charge Fixe
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Désignation *"
                placeholder="Ex: Loyer Bureau Principal"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                variant="bordered"
                isRequired
              />
              
              <Select
                label="Catégorie *"
                placeholder="Sélectionner une catégorie"
                selectedKeys={formData.category ? [formData.category] : []}
                onSelectionChange={(keys) => handleInputChange('category', Array.from(keys)[0] as string)}
                variant="bordered"
              >
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Cycle de paiement *"
                selectedKeys={[formData.cycle]}
                onSelectionChange={(keys) => handleInputChange('cycle', Array.from(keys)[0] as string)}
                variant="bordered"
              >
                {cycles.map((cycle) => (
                  <SelectItem key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </SelectItem>
                ))}
              </Select>
              
              <Input
                label="Montant (FCFA) *"
                type="number"
                placeholder="Ex: 350000"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                variant="bordered"
                isRequired
              />
              
              <Select
                label="Jour d'échéance *"
                selectedKeys={[formData.dueDate]}
                onSelectionChange={(keys) => handleInputChange('dueDate', Array.from(keys)[0] as string)}
                variant="bordered"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day.toString()} value={day.toString().padStart(2, '0')}>
                    {day.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Description */}
            <Input
              label="Description"
              placeholder="Description détaillée de la charge..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              variant="bordered"
            />
          </div>

          {/* Aperçu */}
          {formData.name && formData.category && formData.amount && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Aperçu de la charge</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{formData.name}</p>
                  <Badge color="primary" variant="flat" className="mt-1">
                    {categories.find(c => c.value === formData.category)?.label}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {parseInt(formData.amount).toLocaleString()} FCFA
                  </p>
                  <p className="text-sm text-gray-600">
                    {cycles.find(c => c.value === formData.cycle)?.label}
                  </p>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="bordered"
            onPress={onClose}
            className="px-6"
          >
            Annuler
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            className="px-6"
            isDisabled={!formData.name || !formData.category || !formData.amount}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter la charge
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
