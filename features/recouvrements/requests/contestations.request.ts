import { apiClientHttp } from '@/lib/api-client-http';
import { PaginatedResponse } from '@/types';
import { IContestation, IContestationSearchParams } from '@/features/recouvrements/types';
import { createContestationDTO, updateContestationDTO } from '@/features/recouvrements/schemas/contestation.schema';

const BASE_URL = '/api/erp';

export async function obtenirContestationsListRequest(params?: IContestationSearchParams): Promise<PaginatedResponse<IContestation>> {
    return await apiClientHttp.request<PaginatedResponse<IContestation>>({
        endpoint: `/api/contestations`,
        method: 'GET',
        params,
    });
}

export async function creerContestationRequest(data: createContestationDTO) {
    return await apiClientHttp.request<IContestation>({
        endpoint: `/api/contestations`,
        method: 'POST',
        data,
    });
}

export async function modifierContestationRequest(id: string, data: updateContestationDTO) {
    return await apiClientHttp.request<IContestation>({
        endpoint: `${BASE_URL}/contestations/${id}`,
        method: 'PUT',
        data,
    });
}

export async function resolveContestationRequest(id: string) {
    return await apiClientHttp.request<IContestation>({
        endpoint: `/api/contestations/${id}/resolve`,
        method: 'PATCH',
    });
}
