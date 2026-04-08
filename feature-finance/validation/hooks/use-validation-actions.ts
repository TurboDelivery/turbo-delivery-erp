import { useSession } from 'next-auth/react';
import { useActionChargeVariableMutation } from '@/feature-finance/charges/queries/charge-variable.mutation';
import { useActionChargeFixeMutation } from '@/feature-finance/charges/queries/charge-fixe.mutation';
import { ChargeType, Role, ROLE_ACCEPT_ACTION, ROLE_REJECT_ACTION } from '../components/validation.constants';

export function useValidationActions(userRole: Role, chargeType: ChargeType) {
  const { data: session } = useSession();
  const actionVariableMutation = useActionChargeVariableMutation();
  const actionFixeMutation = useActionChargeFixeMutation();

  const buildDto = () => ({
    par: session?.user?.name ?? 'Inconnu',
    commentaire: '',
  });

  const mutate = chargeType === 'fixe' ? actionFixeMutation.mutate : actionVariableMutation.mutate;

  const handleAccept = (id: string) => {
    mutate({ id, action: ROLE_ACCEPT_ACTION[userRole], dto: buildDto() });
  };

  const handleReject = (id: string) => {
    mutate({ id, action: ROLE_REJECT_ACTION[userRole], dto: buildDto() });
  };

  return {
    handleAccept,
    handleReject,
    isPending: actionVariableMutation.isPending || actionFixeMutation.isPending,
  };
}
