import { SearchParams } from "ak-api-http";
import { api } from "@/lib/api";
import { YearlyStats, DashboardStatsParams } from "../types/dashboard.types";

export interface IDashboardAPI {
    getDashboardStats(params: DashboardStatsParams): Promise<YearlyStats>;
}

export const dashboardAPI: IDashboardAPI = {
    async getDashboardStats(params: DashboardStatsParams): Promise<YearlyStats> {
        return await api.request<YearlyStats>({
            endpoint: `/finance/dashboard/graphe`,
            method: "GET",
            searchParams: params as SearchParams,
        });
    },
};
export const rapportFinancierAPI = {
   
};