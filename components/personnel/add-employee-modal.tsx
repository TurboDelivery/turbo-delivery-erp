'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { Button } from '@heroui/react';
import { Input } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { EmployeeCreateDTO, EmployeeCreateSchema } from '@/features/personnel/schemas/employee.schema';
import { processAndValidateFormData } from 'ak-zod-form-kit';
import { toast } from 'sonner';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: EmployeeCreateDTO) => void;
  departments: Array<{ name: string; id: string }>;
  postes: string[];
}

export function AddEmployeeModal({ 
  isOpen, 
  onClose, 
  onAddEmployee, 
  departments, 
  postes 
}: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    salary: 0,
    entryDate: new Date().toISOString().split('T')[0], // Date du jour par défaut
    statut: 'Actif'
  });

  const handleSubmit = () => {
    console.log('handleSubmit - formData:', formData);
    
    // Validation des données avec Zod
    const validation = processAndValidateFormData(EmployeeCreateSchema, formData, {
      outputFormat: 'object',
    });

    console.log('Validation - Résultat:', validation);

    if (!validation.success) {
      console.error('Validation - Erreurs:', validation.errorsInString);
      toast.error(validation.errorsInString || 'Veuillez remplir tous les champs correctement');
      return;
    }

    console.log('Appel onAddEmployee avec données validées:', validation.data);
    onAddEmployee(validation.data as EmployeeCreateDTO);

    // Reset du formulaire
    setFormData({
      name: '',
      email: '',
      position: '',
      department: '',
      salary: 0,
      entryDate: new Date().toISOString().split('T')[0],
      statut: 'Actif'
    });

    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    console.log('handleInputChange:', field, '=', value);
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
                    selectedKeys={formData.position ? [formData.position] : []}
                    onSelectionChange={(keys) => handleInputChange('position', Array.from(keys)[0] as string)}
                    variant="bordered"
                  >
                    {postes.map((poste) => (
                      <SelectItem key={poste} value={poste}>
                        {poste.toLowerCase()}
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
                    label="Salaire"
                    type="number"
                    placeholder="Entrez le salaire"
                    value={formData.salary.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('salary', parseInt(e.target.value))}
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
                Ajouter l&#39;employé
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
