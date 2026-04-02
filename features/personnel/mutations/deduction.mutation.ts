'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deductionAPI } from '@/features/personnel/apis/deduction.api';
import {
  CreateAbsenceDeductionDTO,
  CreateAvanceDTO,
  CreatePretDTO,
  UpdateAbsenceDeductionDTO,
  UpdateAvanceDTO,
  UpdatePretDTO,
} from '@/features/personnel/schemas/deduction.schema';
import { deductionKeys } from '@/features/personnel/queries/deduction-list.query';

export const useCreateAvanceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateAvanceDTO) => deductionAPI.createAvance(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deductionKeys.all });
    },
  });
};

export const useUpdateAvanceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deductionId, dto }: { deductionId: string; dto: UpdateAvanceDTO }) => deductionAPI.updateAvance(deductionId, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deductionKeys.all });
    },
  });
};

export const useCreateAbsenceDeductionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateAbsenceDeductionDTO) => deductionAPI.createAbsenceDeduction(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deductionKeys.all });
    },
  });
};

export const useUpdateAbsenceDeductionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deductionId, dto }: { deductionId: string; dto: UpdateAbsenceDeductionDTO }) => deductionAPI.updateAbsenceDeduction(deductionId, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deductionKeys.all });
    },
  });
};

export const useCreatePretMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePretDTO) => deductionAPI.createPret(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deductionKeys.all });
    },
  });
};

export const useUpdatePretMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ referenceId, dto }: { referenceId: string; dto: UpdatePretDTO }) => deductionAPI.updatePret(referenceId, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deductionKeys.all });
    },
  });
};

