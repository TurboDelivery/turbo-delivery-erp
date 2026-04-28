'use client';

import { useMutation } from '@tanstack/react-query';
import { ajouterEmployeAction, modifierEmployeAction, supprimerEmployeAction, changeStatusAction } from '../actions/employee.action';
import { employeeAPI, ExportFormat, IEmployeeParams } from '../apis/employee.api';

import { toast } from 'sonner';
import { processAndValidateFormData } from 'ak-zod-form-kit';
import { EmployeeCreateDTO, EmployeeCreateSchema, EmployeeUpdateDTO, EmployeeUpdateSchema } from '@/features/personnel/schemas/employee.schema';
import { useInvalidateEmployeeQuery } from './index.query';
import { exportEmployesToCsv, exportEmployesToExcel, exportEmployesToPdf } from '@/features/personnel/utils/employee-export.utils';

export const useAjouterEmployeMutation = () => {
  const invalidateEmployeeQuery = useInvalidateEmployeeQuery();

  return useMutation({
    mutationFn: async (data: EmployeeCreateDTO) => {
      console.log('🔍 Mutation - Données reçues:', data);
      
      // Validation des données
      const validation = processAndValidateFormData(EmployeeCreateSchema, data, {
        outputFormat: 'object',
      });

      console.log('✅ Validation - Résultat:', validation);

      if (!validation.success) {
        console.error('❌ Validation - Erreurs:', validation.errorsInString);
        throw new Error(validation.errorsInString || 'Une erreur est survenue lors de la validation des données.');
      }

      console.log('📤 Appel API - Données validées:', validation.data);

      // Appel de l'API avec l'action
      const result = await ajouterEmployeAction(validation.data as EmployeeCreateDTO);

      console.log('📥 Réponse API brute:', result);
      console.log('📊 Données de retour:', result.data);

      if (!result.success) {
        console.error('❌ Erreur API:', result.error);
        throw new Error(result.error || "Erreur lors de l'ajout de l'employé");
      }

      console.log('✅ Succès - Données finales:', result.data);
      return result.data!;
    },
    onSuccess: async () => {
      await invalidateEmployeeQuery();
      toast.success('Employé ajouté avec succès');
    },

    onError: async (error) => {
      toast.error("Erreur lors de l'ajout de l'employé:", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useModifierEmployeMutation = () => {
  const invalidateEmployeeQuery = useInvalidateEmployeeQuery();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EmployeeUpdateDTO }) => {
      // Validation des données
      const validation = processAndValidateFormData(EmployeeUpdateSchema, data, {
        outputFormat: 'object',
      });
      if (!validation.success) {
        throw new Error(validation.errorsInString || 'Une erreur est survenue lors de la validation des données.');
      }

      const result = await modifierEmployeAction(id, validation.data as EmployeeUpdateDTO);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification de l\'employé');
      }
      return result.data!;
    },
    onSuccess: async () => {
      await invalidateEmployeeQuery();
      toast.success('Employé modifié avec succès');
    },
    onError: async () => {
      // toast.error('Erreur modification employé:', {
      //   description: error instanceof Error ? error.message : 'Erreur inconnue',
      // });
    },
  });
};

export const useSupprimerEmployeMutation = () => {
  const invalidateEmployeeQuery = useInvalidateEmployeeQuery();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) {
        throw new Error("L'identifiant de l'employé est requis.");
      }
      const result = await supprimerEmployeAction(id);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression de l\'employé');
      }
      return result.data!;
    },
    onSuccess: async () => {
      await invalidateEmployeeQuery();
      toast.success('Employé supprimé avec succès');
    },
    onError: async (error) => {
      toast.error('Erreur suppression employé:', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useSyncJournaliersMutation = () => {
  const invalidateEmployeeQuery = useInvalidateEmployeeQuery();
  return useMutation({
    mutationFn: () => employeeAPI.syncJournaliers(),
    onSuccess: async () => {
      await invalidateEmployeeQuery();
      toast.success('Synchronisation effectuée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la synchronisation', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useExporterEmployesMutation = () => {
  return useMutation({
    mutationFn: async ({ format, ...params }: IEmployeeParams & { format: ExportFormat }) => {
      const data = await employeeAPI.exporterEmployes({ ...params, format });
      const baseFilename = `employes_export_${new Date().toISOString().slice(0, 10)}`;

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Aucun employé à exporter pour ces filtres.');
      }

      if (format === 'EXCEL') {
        exportEmployesToExcel(data, baseFilename);
      }
      else if (format === 'CSV') {
        exportEmployesToCsv(data, baseFilename);
      } else {
        await exportEmployesToPdf(data, baseFilename);
      }
    },
    onSuccess: () => {
      toast.success('Export téléchargé avec succès');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'export", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};

export const useChangeStatusMutation = () => {
  const invalidateEmployeeQuery = useInvalidateEmployeeQuery();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!id) {
        throw new Error("L'identifiant de l'employé est requis.");
      }
      if (!status) {
        throw new Error("Le statut est requis.");
      }
      const result = await changeStatusAction(id, status);
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du changement de statut de l\'employé');
      }
      return result.data!;
    },
    onSuccess: async (_, variables) => {
      await invalidateEmployeeQuery();
      const statusText = variables.status === 'Actif' ? 'activé' : 'désactivé';
      toast.success(`Employé ${statusText} avec succès`);
    },
    onError: async (error) => {
      toast.error('Erreur changement de statut:', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
};
