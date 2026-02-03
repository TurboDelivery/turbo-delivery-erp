import { ActionResponse } from "@/types";
import { handleServerActionError } from "@/utils/handleServerActionError";
import { dashboardAPI } from "../apis/dashboard.api";
import { YearlyStats, DashboardStatsParams } from "../types/dashboard.types";

export const getDashboardStatsAction = async (params: DashboardStatsParams): Promise<ActionResponse<YearlyStats>> => {
    try {
        const response = await dashboardAPI.getDashboardStats(params);
        return {
            success: true,
            data: response,
            message: "Statistiques dashboard obtenues avec succès",
        }
    } catch (error) {
        return handleServerActionError(error, "Erreur lors de la récupération des statistiques dashboard");
    }
}
