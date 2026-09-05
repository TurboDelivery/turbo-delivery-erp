'use client';

import { Button, Modal } from '@heroui-v3/react';
import { processAndValidateFormData } from 'ak-zod-form-kit';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  ChampListe,
  ChampMontant,
  ChampTexte,
} from '@/components/personnel/common/champs-personnel';
import { DEPARTMENTS, POSTES } from '@/features/personnel/constants/employee.constants';
import { EmployeeCreateDTO, EmployeeCreateSchema } from '@/features/personnel/schemas/employee.schema';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onAddEmployee: (employee: EmployeeCreateDTO) => void;
  onClose: () => void;
}

/**
 * Les vingt-neuf postes ne tiennent pas dans une liste déroulante : ils se cherchent.
 * Les libellés étaient rendus en `.toLowerCase()`, ce qui donnait « chef aux operations »
 * dans la liste et « CHEF AUX OPERATIONS » partout ailleurs.
 */
const POSTES_OPTIONS = POSTES.map((p) => ({ label: p, value: p }));
const DEPARTEMENTS_OPTIONS = DEPARTMENTS.map((d) => ({ label: d.name, value: d.name }));
const STATUTS_OPTIONS = [
  { label: 'Actif', value: 'Actif' },
  { label: 'Inactif', value: 'Inactif' },
  { label: 'Congé', value: 'Congé' },
] as const;

const VALEURS_INITIALES = {
  department: '',
  email: '',
  entryDate: new Date().toISOString().split('T')[0], // Date du jour par défaut
  name: '',
  position: '',
  salary: 0,
  statut: 'Actif',
};

export function AddEmployeeModal({ isOpen, onAddEmployee, onClose }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState(VALEURS_INITIALES);

  const handleSubmit = () => {
    // Validation des données avec Zod
    const validation = processAndValidateFormData(EmployeeCreateSchema, formData, {
      outputFormat: 'object',
    });

    if (!validation.success) {
      toast.error(validation.errorsInString || 'Veuillez remplir tous les champs correctement');
      return;
    }

    onAddEmployee(validation.data as EmployeeCreateDTO);
    setFormData({ ...VALEURS_INITIALES, entryDate: new Date().toISOString().split('T')[0] });
    onClose();
  };

  const modifier = (champ: string, valeur: number | string) =>
    setFormData((prev) => ({ ...prev, [champ]: valeur }));

  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading>Ajouter un nouvel employé</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ChampTexte
                  label="Nom complet"
                  onChange={(v) => modifier('name', v)}
                  placeholder="Entrez le nom complet"
                  valeur={formData.name}
                />
                <ChampTexte
                  label="Email"
                  onChange={(v) => modifier('email', v)}
                  placeholder="Entrez l'email"
                  type="email"
                  valeur={formData.email}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ChampListe
                  label="Fonction"
                  onChange={(v) => modifier('position', v)}
                  options={POSTES_OPTIONS}
                  placeholder="Rechercher une fonction"
                  valeur={formData.position}
                />
                <ChampListe
                  label="Département"
                  onChange={(v) => modifier('department', v)}
                  options={DEPARTEMENTS_OPTIONS}
                  placeholder="Rechercher un département"
                  valeur={formData.department}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ChampMontant
                  aide="En francs CFA"
                  label="Salaire"
                  onChange={(v) => modifier('salary', v)}
                  valeur={formData.salary}
                />
                <ChampTexte
                  label="Date d'entrée"
                  onChange={(v) => modifier('entryDate', v)}
                  type="date"
                  valeur={formData.entryDate}
                />
              </div>

              <ChampListe
                label="Statut initial"
                onChange={(v) => modifier('statut', v)}
                options={STATUTS_OPTIONS}
                placeholder="Sélectionnez le statut"
                valeur={formData.statut}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button onPress={onClose} variant="ghost">
                Annuler
              </Button>
              <Button onPress={handleSubmit} variant="primary">
                Ajouter l&#39;employé
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
