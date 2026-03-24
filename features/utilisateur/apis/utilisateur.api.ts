import {
	IUtilisateur,
	IUtilisateurAddUpdateResponse,
	IUtilisateurDeleteResponse,
	IUtilisateursParams
} from "../types/utilisateur.type";
import {PaginatedResponse} from "@/types/api.type";
import {SearchParams} from "ak-api-http";
import {UtilisateurAddDTO, UtilisateurUpdateDTO} from "../schema/utilisateur.schema";
import {UtilisateurInterneAddDTO, UtilisateurInterneUpdateDTO} from "@/features/utilisateur/schema";
import {apiClient} from "@/lib/api.client";

export interface IUtilisateurAPI {
	obtenirTousUtilisateurs(params: IUtilisateursParams): Promise<PaginatedResponse<IUtilisateur>>;

	obtenirUtilisateur(id: string): Promise<IUtilisateur>;

	ajouterUtilisateur(data: UtilisateurAddDTO): Promise<IUtilisateurAddUpdateResponse>;

	ajouterUtilisateurInterne(data: UtilisateurInterneAddDTO): Promise<IUtilisateurAddUpdateResponse>;

	modifierProfil(id: string, data: UtilisateurUpdateDTO | UtilisateurInterneUpdateDTO): Promise<IUtilisateurAddUpdateResponse>;

	supprimerUtilisateur(id: string): Promise<IUtilisateurDeleteResponse>;
}

export const utilisateurAPI: IUtilisateurAPI = {
	obtenirTousUtilisateurs(params: IUtilisateursParams): Promise<PaginatedResponse<IUtilisateur>> {
		return apiClient.request<PaginatedResponse<IUtilisateur>>({
			endpoint: `/users`,
			method: "GET",
			searchParams: params as SearchParams,
			service: "private",
		});
	},

	obtenirUtilisateur(id: string): Promise<IUtilisateur> {
		return apiClient.request<IUtilisateur>({
			endpoint: `/users/${id}/profile`,
			method: "GET",
			service: "private",
		});
	},

	ajouterUtilisateurInterne(data: UtilisateurInterneAddDTO): Promise<IUtilisateurAddUpdateResponse> {
		return apiClient.request<IUtilisateurAddUpdateResponse>({
			endpoint: `/users/internal`,
			method: "POST",
			data,
		});
	},

	ajouterUtilisateur(data: UtilisateurAddDTO): Promise<IUtilisateurAddUpdateResponse> {
		return apiClient.request<IUtilisateurAddUpdateResponse>({
			endpoint: `/users`,
			method: "POST",
			data,
			service: "private",
		});
	},
	modifierProfil(id: string, data: UtilisateurUpdateDTO | UtilisateurInterneUpdateDTO): Promise<IUtilisateurAddUpdateResponse> {
		return apiClient.request<IUtilisateurAddUpdateResponse>({
			endpoint: `/users/${id}`,
			method: "PATCH",
			data,
			service: "private",
		});
	},
	supprimerUtilisateur(id: string): Promise<IUtilisateurDeleteResponse> {
		return apiClient.request<IUtilisateurDeleteResponse>({
			endpoint: `/users/${id}`,
			method: "DELETE",
			service: "private",
		});
	},
};