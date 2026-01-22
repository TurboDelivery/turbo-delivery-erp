import { Api } from "ak-api-http";
import { baseURL } from "@/config";

export const api = new Api({
  baseUrl: baseURL, // Base URL de l'API
  timeout: 10000, // Timeout de la requête
//   headers: {
//     "Content-Type": "application/json", // En-têtes par défaut
//   },
//   maxRetries: 3, // Nombre de tentatives de re tentative
//   retryDelay: 1000, // Delais entre les tentatives
//   enableAuth: true, // Authentification activée
//   getSession: async () => {
//     const session = await auth();
//     const user = session?.user as User;
//     if (user) {
//       return {
//         accessToken: user.accessToken ?? "",
//       }
//     }
//     return {
//       accessToken: "",
//     }
//   },// Récupération du token
 
  debug: true, // Debug activé en mode développement
});