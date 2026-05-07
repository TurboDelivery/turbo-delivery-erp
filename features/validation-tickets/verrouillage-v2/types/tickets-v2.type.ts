import { BonLivraisonTerminee } from '@/types/bon-livraison.model';

export interface IVerrouillageParams {
  page?: number;
  size?: number;
}

export interface CreneauTicketStatsVm {
  nbV2Valide: number;
  totalMontantCommandesV2Valide: number;
  totalCommissionsV2Valide: number;
  nbTotalTickets: number;
}

export interface AgentInfo {
  id: string;
  nom: string;
  prenoms: string;
  email: string;
  username: string;
}

export interface TicketControleV2 extends BonLivraisonTerminee {
  v1Agent: AgentInfo | null;
  v1ValideAt: string | null;
  v2Agent: AgentInfo | null;
  v2ValideAt: string | null;
  vauthAgent: AgentInfo | null;
  vauthAt: string | null;
}
