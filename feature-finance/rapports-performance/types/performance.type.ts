export interface IMainKPIs {
  totalDeliveries: number;
  totalOrderValue: number;
  successRate: number;
  chiffreAffaires: number;
}

export interface IGeographicLocation {
  name: string;
  deliveries: number;
  value: number;
  color: string;
}

export interface IWeeklyActivity {
  day: string; // French day name returned by API: "Lundi", "Mardi", etc.
  deliveries: number;
  revenue: number;
}

export interface IPerformanceParams {
  debut: Date;
  fin: Date;
  restaurantId?: string;
}

export interface ISecondaryKPIs {
  averageDeliveryTime: number;
  monthlyGrowth: number;
  averageItemsPerOrder: number;
}

export interface IFinancialDetails {
  totalOrderAmount: number;
  deliveryFeesCollected: number;
  turboDeliveryServiceFees: number;
  partnerNetRevenue: number;
}

/**
 * Interface principale regroupant l'ensemble des données du tableau de bord
 */
export interface IDashboardData {
  mainKPIs: IMainKPIs;
  geographicData: IGeographicLocation[];
  weeklyActivity: IWeeklyActivity[];
  secondaryKPIs: ISecondaryKPIs;
  financialDetails: IFinancialDetails;
}