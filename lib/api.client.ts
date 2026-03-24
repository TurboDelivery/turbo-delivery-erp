"use client";


import { baseURL } from "@/config/api";
import { Api } from "ak-api-http";
import {
  getSession,
  signOut
} from "next-auth/react";

export const apiClient = new Api({
  baseUrl: baseURL,
  timeout: 10000,
  enableAuth: true,
  maxRetries:2,
  onResponse: async (response) => {
    if (response.status === 401) {
      await signOut({ redirect: false });
    }
    return response;
  },
  getSession: async () => {
    const session = await getSession();
    console.log("Session API Client:", session);
    return { accessToken: (session as any)?.user?.accessToken ?? "" };
  },
  signOut: async () => {
    try {
      await signOut({ 
        redirectTo: "/",
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  },
  debug: process.env.NODE_ENV === "development",
});
