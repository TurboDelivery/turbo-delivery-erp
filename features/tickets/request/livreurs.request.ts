import { DeliveryMan } from '@/types/models';
import { apiClientHttp } from '@/lib/api-client-http';

const BASE_URL = '/api/erp';

const deliveryMenEndpoints = {
  getAllDeliveryMan: { endpoint: `${BASE_URL}/livreur/infos`, method: 'GET' },
};

export async function getAllDeliveryMenRequest(): Promise<DeliveryMan[]> {
  try {
    return await apiClientHttp.request<DeliveryMan[]>({
      endpoint: deliveryMenEndpoints.getAllDeliveryMan.endpoint,
      method: deliveryMenEndpoints.getAllDeliveryMan.method,
      service: 'backend',
    });
  } catch (error) {
    return [];
  }
}