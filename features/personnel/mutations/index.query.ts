import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache pour les employés
export const employeeKeyQuery = (...params: any[]) => {
  if (params.length === 0) {
    return ['employees'];
  }
  return ['employees', ...params];
};

// 2- Clé de cache pour les demandes de congé
export const leaveRequestKeyQuery = (...params: any[]) => {
  if (params.length === 0) {
    return ['leave-request'];
  }
  return ['leave-request', ...params];
};

// 3- Clé de cache pour les déductions
export const deductionKeyQuery = (...params: any[]) => {
  if (params.length === 0) {
    return ['deduction'];
  }
  return ['deduction', ...params];
};

// 4. Créez un hook personnalisé pour l'invalidation des employés
export const useInvalidateEmployeeQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: any[]) => {
    // Invalider les queries des employés
    await queryClient.invalidateQueries({
      queryKey: employeeKeyQuery(...params),
      exact: false
    });

    await queryClient.refetchQueries({
      queryKey: employeeKeyQuery(),
      type: 'active'
    });

    // Invalider les statistiques de salaire
    await queryClient.invalidateQueries({
      queryKey: ['employee-salary-stats'],
      exact: false
    });

    // Invalider les statistiques filtrées
    await queryClient.invalidateQueries({
      queryKey: ['employee-stats'],
      exact: false
    });
  };
};

// 5. Créez un hook personnalisé pour l'invalidation des demandes de congé
// export const useInvalidateLeaveRequestQuery = () => {
//   const queryClient = useQueryClient();

//   return async (...params: any[]) => {
//     await queryClient.invalidateQueries({
//       queryKey: leaveRequestKeyQuery(...params),
//       exact: false
//     });

//     await queryClient.refetchQueries({
//       queryKey: leaveRequestKeyQuery(),
//       type: 'active'
//     });
//   };
// };

// 6. Créez un hook personnalisé pour l'invalidation des déductions
// export const useInvalidateDeductionQuery = () => {
//   const queryClient = useQueryClient();

//   return async (...params: any[]) => {
//     await queryClient.invalidateQueries({
//       queryKey: deductionKeyQuery(...params),
//       exact: false
//     });

//     await queryClient.refetchQueries({
//       queryKey: deductionKeyQuery(),
//       type: 'active'
//     });
//   };
// };
