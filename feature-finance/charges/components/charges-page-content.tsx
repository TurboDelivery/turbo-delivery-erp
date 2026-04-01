'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronDown, 
  Wallet, 
  TrendingUp, 
  Activity,
  Plus,
  Info,
} from 'lucide-react';
import AddChargeFixeModal from './add-charge-fixe-modal';
import AddDepenseVariableModal from './add-depense-variable-modal';
import ChargesFixesTable from './charges-fixes-table';
import { useChargesFixesQuery } from '../queries/charges-fixes.query';
import { useSupprimerChargeFixeMutation } from '../queries/charge-fixe.mutation';
import { IChargeFixe } from '../types/charge-fixe.type';
import DepensesVariablesTable from './depenses-variables-table';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { Card, CardBody } from '@heroui/react';

export default function ChargesPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepenseVariableModalOpen, setIsDepenseVariableModalOpen] = useState(false);
  const [chargeToEdit, setChargeToEdit] = useState<IChargeFixe | null>(null);
  const [chargeToDelete, setChargeToDelete] = useState<IChargeFixe | null>(null);

  const { mutate: supprimerChargeFixe, isPending: isDeleting } = useSupprimerChargeFixeMutation();

  const { data: chargesFixesData, isLoading: isLoadingChargesFixees } = useChargesFixesQuery({
    page: 0,
    size: 50,
  });

  // Données pour les dépenses variables
  const depensesVariablesData = [
    {
      id: '1',
      date: '20/03/2026',
      designation: 'Maintenance Véhicule',
      amount: '35 000 FCFA',
      justificatif: '---',
      enabled: true,
    },
    {
      id: '2',
      date: '15/03/2026',
      designation: 'Essence Livraison',
      amount: '15 000 FCFA',
      justificatif: '---',
      enabled: true,
    },
  ];
  
  const handleOpenModal = () => {
    setChargeToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setChargeToEdit(null);
  };

  const handleEditCharge = (charge: IChargeFixe) => {
    setChargeToEdit(charge);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (charge: IChargeFixe) => {
    setChargeToDelete(charge);
  };

  const handleConfirmDelete = () => {
    if (!chargeToDelete) return;
    supprimerChargeFixe(chargeToDelete.id, {
      onSuccess: () => setChargeToDelete(null),
    });
  };

  const handleAddCharge = (newCharge: any) => {
    console.log('Nouvelle charge ajoutée:', newCharge);
  };

  const handleOpenDepenseVariableModal = () => {
    setIsDepenseVariableModalOpen(true);
  };

  const handleCloseDepenseVariableModal = () => {
    setIsDepenseVariableModalOpen(false);
  };

  const handleAddDepenseVariable = (newDepense: any) => {
    // Logique pour ajouter la nouvelle dépense variable
    console.log('Nouvelle dépense variable ajoutée:', newDepense);
  };

  return (
    <div className="min-h-screen bg-white p-3 max-w-8xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Button 
              variant="light" 
              size="sm" 
              startContent={<ArrowLeft size={16} />}
              className="mb-4"
            >
              Retour à Finance
            </Button>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Configuration des Charges Fixes
            </h1>
            <p className="text-gray-600 text-sm">
              Gérez toutes vos dépenses récurrentes pour automatiser le calcul de rentabilité
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <Calendar size={16} className="text-gray-600" />
            <span className="text-sm text-gray-700">Mars 2026</span>
            <ChevronDown size={16} className="text-gray-600" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Blue Card */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Wallet size={24} />
              </div>
              <span className="text-blue-100 text-sm font-medium">Total Charges Mensuelles</span>
            </div>
            <p className="text-3xl font-bold mb-1">1 450 000 FCFA</p>
            <p className="text-blue-100 text-xs">Toutes charges confondues</p>
          </CardBody>
        </Card>

        {/* Orange Card */}
        <Card className="bg-gradient-to-br from-orange-500 to-orange-400 text-white shadow-lg">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp size={24} />
              </div>
              <span className="text-orange-100 text-sm font-medium">Point Mort Quotidien</span>
            </div>
            <p className="text-3xl font-bold mb-1">48 333 FCFA</p>
            <p className="text-orange-100 text-xs">Coût par jour (Total ÷ 30)</p>
          </CardBody>
        </Card>

        {/* Green Card */}
        <Card className="bg-gradient-to-br from-green-600 to-green-500 text-white shadow-lg">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Activity size={24} />
              </div>
              <span className="text-green-100 text-sm font-medium">Charges Actives</span>
            </div>
            <p className="text-3xl font-bold mb-1">7</p>
            <p className="text-green-100 text-xs">Lignes configurées</p>
          </CardBody>
        </Card>
      </div>

      {/* Fixed Charges Table */}
      <Card className="border border-gray-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-gray-700 font-semibold text-sm">Charges fixes</h2>
          <Button 
            color="primary"
            size="sm"
            startContent={<Plus size={16} />}
            onPress={handleOpenModal}
          >
            Ajouter une charge fixe
          </Button>
        </div>

        <div className="overflow-x-auto">
          <ChargesFixesTable
            data={chargesFixesData?.content ?? []}
            isLoading={isLoadingChargesFixees}
            onEdit={handleEditCharge}
            onDelete={handleDeleteRequest}
          />
        </div>
      </Card>

      {/* Variable Expenses Table */}
      <Card className="border border-gray-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-purple-600 font-semibold text-sm">Dépenses Variables</h2>
          <Button 
            color="secondary"
            size="sm"
            startContent={<Plus size={16} />}
            onPress={handleOpenDepenseVariableModal}
          >
            Ajouter une dépense variable
          </Button>
        </div>

        <div className="overflow-x-auto">
          <DepensesVariablesTable data={depensesVariablesData} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50 text-center">
          <Button 
            variant="light" 
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
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
              <span className="font-semibold">Astuce :</span> La masse salariale est calculée automatiquement depuis le module "Personnel TURBO". Seuls les employés actifs sont comptabilisés.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Modal add/edit charge fixe */}
      <AddChargeFixeModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddCharge}
        chargeToEdit={chargeToEdit}
      />

      {/* Modal confirmation suppression */}
      <Modal
        isOpen={!!chargeToDelete}
        onClose={() => setChargeToDelete(null)}
        size="sm"
      >
        <ModalContent>
          <ModalHeader className="text-red-600">Supprimer la charge fixe</ModalHeader>
          <ModalBody>
            <p className="text-gray-700 text-sm">
              Voulez-vous vraiment supprimer{' '}
              <span className="font-semibold">{chargeToDelete?.designation}</span> ? Cette action est irréversible.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={() => setChargeToDelete(null)}>
              Annuler
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'ajout de dépense variable */}
      <AddDepenseVariableModal 
        isOpen={isDepenseVariableModalOpen}
        onClose={handleCloseDepenseVariableModal}
        onAdd={handleAddDepenseVariable}
      />
    </div>
  );
}
