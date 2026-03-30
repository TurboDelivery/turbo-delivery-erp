import { useQuery } from '@tanstack/react-query';
import { baseURL } from '@/config/api';

interface PaymentItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  montant: number;
  description: string;
  typeDepense: string;
  periodicite: string;
  statut: string;
  dateDepense: string;
  categorie: {
    id: string;
    nomCategorie: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    totalDepense: number;
  };
  investissement: null;
}

interface PaymentStatusResponse {
  pending: PaymentItem[];
  paid: PaymentItem[];
  totalPending: number;
  totalPaid: number;
  total: number;
}

interface PaymentStatusParams {
  debut?: Date;
  fin?: Date;
}

const fetchPaymentStatus = async (params?: PaymentStatusParams): Promise<PaymentStatusResponse> => {
  let url = `${baseURL}/api/finance/depenses/fixe/status`;
  
  if (params?.debut) {
    const searchParams = new URLSearchParams();
    searchParams.append('debut', params.debut.toISOString().split('T')[0]);
    if (params.fin) {
      searchParams.append('fin', params.fin.toISOString().split('T')[0]);
    }
    url = `${url}?${searchParams.toString()}`;
  }
  
  console.log('URL appelée:', url);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  return response.json();
};

export const usePaymentStatusQuery = (params?: PaymentStatusParams) => {
  return useQuery({
    queryKey: ['paymentStatus', params],
    queryFn: () => fetchPaymentStatus(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
