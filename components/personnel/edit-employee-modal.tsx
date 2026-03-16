'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Employee } from '../../features/personnel/types/types';
import { useModifierEmployeMutation } from '../../features/personnel/mutations/employee.mutation';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  departments: Array<{ name: string; id: string }>;
  postes: string[];
}

export function EditEmployeeModal({ 
  isOpen, 
  onClose, 
  employee,
  departments, 
  postes 
}: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    salary: '',
    entryDate: '',
    statut: 'Actif' as Employee['statut']
  });

  const modifierEmployeMutation = useModifierEmployeMutation();

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        position: employee.position,
        department: employee.department,
        salary: employee.salary.toString(),
        entryDate: employee.entryDate,
        statut: employee.statut
      });
    }
  }, [employee]);

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.position || !formData.department || !formData.salary || !formData.entryDate) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (!employee) return;

    modifierEmployeMutation.mutate({
      id: employee.id,
      data: {
        name: formData.name,
        email: formData.email,
        position: formData.position,
        department: formData.department,
        salary: parseInt(formData.salary),
        statut: formData.statut,
        entryDate: formData.entryDate
      }
    });

    setFormData({
      name: '',
      email: '',
      position: '',
      department: '',
      salary: '',
      entryDate: '',
      statut: 'Actif'
    });

    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                <span>Modifier l'employé</span>
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nom complet"
                    placeholder="Entrez le nom complet"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                    variant="bordered"
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="Entrez l'email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                    variant="bordered"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Fonction"
                    placeholder="Sélectionnez une fonction"
                    selectedKeys={formData.position ? [formData.position] : []}
                    onSelectionChange={(keys) => handleInputChange('position', Array.from(keys)[0] as string)}
                    variant="bordered"
                  >
                    {postes.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position.toLowerCase()}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Département"
                    placeholder="Sélectionnez un département"
                    selectedKeys={formData.department ? [formData.department] : []}
                    onSelectionChange={(keys) => handleInputChange('department', Array.from(keys)[0] as string)}
                    variant="bordered"
                  >
                    {departments.map((dept) => (
                      <SelectItem key={dept.name} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Salaire mensuel"
                    type="number"
                    placeholder="Entrez le salaire"
                    value={formData.salary}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('salary', e.target.value)}
                    variant="bordered"
                    endContent="F"
                  />
                  <Input
                    label="Date d'entrée"
                    type="date"
                    value={formData.entryDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('entryDate', e.target.value)}
                    variant="bordered"
                  />
                </div>

                <Select
                  label="Statut"
                  placeholder="Sélectionnez le statut"
                  selectedKeys={[formData.statut]}
                  onSelectionChange={(keys) => handleInputChange('statut', Array.from(keys)[0] as string)}
                  variant="bordered"
                >
                  <SelectItem key="Actif" value="Actif">Actif</SelectItem>
                  <SelectItem key="Inactif" value="Inactif">Inactif</SelectItem>
                  <SelectItem key="Congé" value="Congé">Congé</SelectItem>
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Annuler
              </Button>
              <Button color="primary" onPress={handleSubmit}>
                Modifier l'employé
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
