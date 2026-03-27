'use client';

import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea } from '@heroui/react';
import { useState } from 'react';

interface AddDepenseVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (depense: any) => void;
}

export default function AddDepenseVariableModal({ isOpen, onClose, onAdd }: AddDepenseVariableModalProps) {
  const [formData, setFormData] = useState({
    designation: '',
    montant: '',
    date: '',
    justificatif: '',
  });

  const handleSubmit = () => {
    if (!formData.designation || !formData.montant || !formData.date) {
      return;
    }
    
    const newDepense = {
      id: Date.now().toString(),
      designation: formData.designation,
      amount: `${parseInt(formData.montant).toLocaleString()} FCFA`,
      date: formData.date,
      justificatif: formData.justificatif || '—',
      enabled: true,
    };
    
    onAdd(newDepense);
    onClose();
    
    // Reset form
    setFormData({
      designation: '',
      montant: '',
      date: '',
      justificatif: '',
    });
  };

  const handleInputChange = (field: string, value: string | any) => {
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
          Ajouter une Dépense Variable
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Désignation */}
            <Input
              label="Désignation"
              placeholder="Ex: Loyer Bureau, Internet..."
              value={formData.designation}
              onChange={(e) => handleInputChange('designation', e.target.value)}
              variant="bordered"
              isRequired
            />
            
            {/* Montant et Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Montant FCFA"
                type="number"
                placeholder="0.00"
                value={formData.montant}
                onChange={(e) => handleInputChange('montant', e.target.value)}
                variant="bordered"
                isRequired
                startContent={
                  <span className="text-gray-500 text-sm">FCFA</span>
                }
              />
              
              <Input
                type="date"
                label="Date de la Dépense"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                variant="bordered"
                isRequired
              />
            </div>

            {/* Justificatif */}
            <Textarea
              label="Justificatif (optionnel)"
              placeholder="Ajouter une description ou justificatif..."
              value={formData.justificatif}
              onChange={(e) => handleInputChange('justificatif', e.target.value)}
              variant="bordered"
              minRows={3}
              maxRows={6}
            />
          </div>

          {/* Aperçu */}
          {formData.designation && formData.montant && formData.date && (
            <div className="bg-gray-50 p-4 rounded-lg mt-6">
              <h3 className="font-semibold mb-2">Aperçu de la dépense</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{formData.designation}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.date || 'Date non sélectionnée'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">
                    {parseInt(formData.montant).toLocaleString()} FCFA
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
            className="px-6 bg-purple-600"
            isDisabled={!formData.designation || !formData.montant || !formData.date}
          >
            Enregistrer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
