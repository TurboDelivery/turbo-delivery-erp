import { Api } from 'ak-api-http';
import { baseURL } from '@/config';

export const api = new Api({
  baseUrl: baseURL, // Base URL de l'API
  // 2026-06-05 : 2000ms etait trop court pour /finance/factures (renvoie ~645
  // factures sans pagination) -> "timeout of 2000ms exceeded" spammait les
  // toasts (usePretListQuery sur la page Recouvrement, declenche par chaque
  // mutation qui invalide les caches). Aligne sur 15000ms : confortable pour les
  // listings lourds, encore court par rapport au timeout 30000ms de lib/api-client-http.
  timeout: 15000, // Timeout de la requête
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
  maxRetries: 1,
  debug: process.env.NODE_ENV !== 'production', // Debug activé en mode développement
});
