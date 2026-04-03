'use client';

import React, { useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, Info, Plus } from 'lucide-react';
import AddChargeFixeModal from './add-charge-fixe-modal';
import AddDepenseVariableModal from './add-depense-variable-modal';
import ChargesFixesTable from './charges-fixes-table';
import ChargesStatsCards from './statistiques/charges-stats-cards';
import { useChargesVariablesQuery } from '../queries/charges-variables.query';
import { useSupprimerChargeFixeMutation } from '../queries/charge-fixe.mutation';
import { useSupprimerChargeVariableMutation } from '../queries/charge-variable.mutation';
import { IChargeFixe } from '../types/charge-fixe.type';
import { IChargeVariable } from '../types/charge-variable.type';
import DepensesVariablesTable from './depenses-variables-table';
import { Button, Card, CardBody, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

export default function ChargesPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepenseVariableModalOpen, setIsDepenseVariableModalOpen] = useState(false);
  const [chargeToEdit, setChargeToEdit] = useState<IChargeFixe | null>(null);
  const [chargeToDelete, setChargeToDelete] = useState<IChargeFixe | null>(null);
  const [chargeVariableToEdit, setChargeVariableToEdit] = useState<IChargeVariable | null>(null);
  const [chargeVariableToDelete, setChargeVariableToDelete] = useState<IChargeVariable | null>(null);

  const { mutate: supprimerChargeFixe, isPending: isDeleting } = useSupprimerChargeFixeMutation();
  const { mutate: supprimerChargeVariable, isPending: isDeletingVariable } = useSupprimerChargeVariableMutation();

  const handleEditCharge = (charge: IChargeFixe) => {
    setChargeToEdit(charge);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (charge: IChargeFixe) => {
    setChargeToDelete(charge);
  };

  const { data: chargesVariablesData, isLoading: isLoadingChargesVariables } = useChargesVariablesQuery({
    page: 0,
    size: 50,
  });

  const handleOpenModal = () => {
    setChargeToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setChargeToEdit(null);
  };

  const handleConfirmDelete = () => {
    if (!chargeToDelete) return;
    supprimerChargeFixe(chargeToDelete.id, {
      onSuccess: () => setChargeToDelete(null),
    });
  };

  const handleOpenDepenseVariableModal = () => {
    setChargeVariableToEdit(null);
    setIsDepenseVariableModalOpen(true);
  };

  const handleCloseDepenseVariableModal = () => {
    setIsDepenseVariableModalOpen(false);
    setChargeVariableToEdit(null);
  };

  const handleEditChargeVariable = (charge: IChargeVariable) => {
    setChargeVariableToEdit(charge);
    setIsDepenseVariableModalOpen(true);
  };

  const handleDeleteChargeVariable = (charge: IChargeVariable) => {
    setChargeVariableToDelete(charge);
  };

  const handleConfirmDeleteVariable = () => {
    if (!chargeVariableToDelete) return;
    supprimerChargeVariable(chargeVariableToDelete.id, {
      onSuccess: () => setChargeVariableToDelete(null),
    });
  };

  const handleAddDepenseVariable = (newDepense: IChargeVariable) => {
    console.log('Nouvelle dépense variable ajoutée:', newDepense);
  };

  return (
    <div className="min-h-screen bg-white p-3 max-w-8xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Button variant="light" size="sm" startContent={<ArrowLeft size={16} />} className="mb-4">
              Retour à Finance
            </Button>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Configuration des Charges Fixes</h1>
            <p className="text-gray-600 text-sm">Gérez toutes vos dépenses récurrentes pour automatiser le calcul de rentabilité</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <Calendar size={16} className="text-gray-600" />
            <span className="text-sm text-gray-700">Mars 2026</span>
            <ChevronDown size={16} className="text-gray-600" />
          </div>
        </div>
      </div>

      <ChargesStatsCards />

      {/* Fixed Charges Table */}
      <Card className="border border-gray-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-gray-700 font-semibold text-sm">Charges fixes</h2>
          <Button color="primary" size="sm" startContent={<Plus size={16} />} onPress={handleOpenModal}>
            Ajouter une charge fixe
          </Button>
        </div>

        <div className="overflow-x-auto">
          <ChargesFixesTable onEdit={handleEditCharge} onDelete={handleDeleteRequest} />
        </div>
      </Card>

      {/* Variable Expenses Table */}
      <Card className="border border-gray-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-purple-600 font-semibold text-sm">Dépenses Variables</h2>
          <Button color="secondary" size="sm" startContent={<Plus size={16} />} onPress={handleOpenDepenseVariableModal}>
            Ajouter une dépense variable
          </Button>
        </div>

        <div className="overflow-x-auto">
          <DepensesVariablesTable data={chargesVariablesData?.content ?? []} isLoading={isLoadingChargesVariables} onEdit={handleEditChargeVariable} onDelete={handleDeleteChargeVariable} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50 text-center">
          <Button variant="light" size="sm" className="text-blue-600 hover:text-blue-700">
            Voir plus (dépenses supplémentaires)
          </Button>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border border-blue-200">
        <CardBody className="p-4 flex gap-3">
          <div className="flex-shrink-0">
            <Info className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="text-blue-900 text-sm">
              <span className="font-semibold">Astuce :</span> La masse salariale est calculée automatiquement depuis le module &quot;Personnel TURBO&quot;. Seuls les employés actifs sont
              comptabilisés.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Modal add/edit charge fixe */}
      <AddChargeFixeModal isOpen={isModalOpen} onClose={handleCloseModal} chargeToEdit={chargeToEdit} />

      {/* Modal confirmation suppression */}
      <Modal isOpen={!!chargeToDelete} onClose={() => setChargeToDelete(null)} size="sm">
        <ModalContent>
          <ModalHeader className="text-red-600">Supprimer la charge fixe</ModalHeader>
          <ModalBody>
            <p className="text-gray-700 text-sm">
              Voulez-vous vraiment supprimer <span className="font-semibold">{chargeToDelete?.designation}</span> ? Cette action est irréversible.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setChargeToDelete(null)}>
              Annuler
            </Button>
            <Button color="danger" onPress={handleConfirmDelete} isLoading={isDeleting}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'ajout/édition de dépense variable */}
      <AddDepenseVariableModal isOpen={isDepenseVariableModalOpen} onClose={handleCloseDepenseVariableModal} onAdd={handleAddDepenseVariable} chargeToEdit={chargeVariableToEdit} />

      {/* Modal confirmation suppression dépense variable */}
      <Modal isOpen={!!chargeVariableToDelete} onClose={() => setChargeVariableToDelete(null)} size="sm">
        <ModalContent>
          <ModalHeader className="text-red-600">Supprimer la dépense variable</ModalHeader>
          <ModalBody>
            <p className="text-gray-700 text-sm">
              Voulez-vous vraiment supprimer <span className="font-semibold">{chargeVariableToDelete?.designation}</span> ? Cette action est irréversible.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setChargeVariableToDelete(null)}>
              Annuler
            </Button>
            <Button color="danger" onPress={handleConfirmDeleteVariable} isLoading={isDeletingVariable}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
