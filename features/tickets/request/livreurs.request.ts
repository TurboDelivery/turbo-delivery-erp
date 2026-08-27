import { DeliveryMan } from '@/types/models';
import { apiClientHttp } from '@/lib/api-client-http';
import { IRecapPaiementLivreur, IRecapPaiementLivreurSearchParams } from '@/features/tickets/types/livreur.type';

const BASE_URL = '/api/erp';

const deliveryMenEndpoints = {
  getAllDeliveryMan: { endpoint: `${BASE_URL}/livreur/infos`, method: 'GET' },
  getDeliveryMenRecapPay: { endpoint: `${BASE_URL}/bon-livraison/export/paiements/livreurs`, method: 'GET' },
};

export async function getAllDeliveryMenRequest(): Promise<DeliveryMan[]> {
  try {
    return await apiClientHttp.request<DeliveryMan[]>({
      endpoint: deliveryMenEndpoints.getAllDeliveryMan.endpoint,
      method: deliveryMenEndpoints.getAllDeliveryMan.method,
      service: 'backend',
    });
  } catch (error) {
    // Sans relance, une panne de lecture se lisait comme une liste vide : les
    // selecteurs de livreurs (programmes, rapports, filtres de validation, appel
    // rapide) affichaient "aucun livreur" alors que les livreurs existaient.
    throw error;
  }
}

export async function getDeliveryMenRecapPayRequest(params: IRecapPaiementLivreurSearchParams): Promise<IRecapPaiementLivreur[]> {
  try {
    return await apiClientHttp.request<IRecapPaiementLivreur[]>({
      endpoint: deliveryMenEndpoints.getDeliveryMenRecapPay.endpoint,
      method: deliveryMenEndpoints.getDeliveryMenRecapPay.method,
      service: 'backend',
      params: {
        debut: params.debut?.toISOString()?.split('T')?.[0],
        fin: params.fin?.toISOString()?.split('T')?.[0],
      },
    });
  }catch (error) {
    // Sans relance, un echec de lecture du recap passait pour un recap vide :
    // l'ecran de paie affichait zero ligne de paiement livreur, donc rien a payer,
    // sur une periode ou les paiements existaient.
    throw error;
  }
}