'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/select';
import { Employee, Department, Function } from '../../features/personnel/types/types';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  departments: Department[];
  functions: Function[];
}

export function AddEmployeeModal({ 
  isOpen, 
  onClose, 
  onAddEmployee, 
  departments, 
  functions 
}: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    function: '',
    department: '',
    salary: '',
    entryDate: '',
    status: 'Actif' as Employee['status']
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.function || !formData.department || !formData.salary || !formData.entryDate) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    onAddEmployee({
      name: formData.name,
      email: formData.email,
      function: formData.function,
      department: formData.department,
      salary: parseInt(formData.salary),
      status: formData.status,
      entryDate: formData.entryDate
    });

    setFormData({
      name: '',
      email: '',
      function: '',
      department: '',
      salary: '',
      entryDate: '',
      status: 'Actif'
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
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Ajouter un nouvel employé
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
                    selectedKeys={formData.function ? [formData.function] : []}
                    onSelectionChange={(keys) => handleInputChange('function', Array.from(keys)[0] as string)}
                    variant="bordered"
                  >
                    {functions.map((func) => (
                      <SelectItem key={func.name} value={func.name}>
                        {func.name}
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
                  label="Statut initial"
                  placeholder="Sélectionnez le statut"
                  selectedKeys={[formData.status]}
                  onSelectionChange={(keys) => handleInputChange('status', Array.from(keys)[0] as string)}
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
                Ajouter l'employé
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
