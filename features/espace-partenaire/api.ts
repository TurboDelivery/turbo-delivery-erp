'use client';

/**
 * Client HTTP de l'espace partenaire : tout passe par le relais serveur
 * (/api/partenaire/relais/**) — le JWT vit dans un cookie httpOnly, jamais en JS.
 * Un 401 renvoie au login : la session est tombée.
 */
export class ErreurPartenaire extends Error {
  constructor(message: string, public readonly statut: number) {
    super(message);
  }
}

async function traiter<T>(reponse: Response): Promise<T> {
  if (reponse.status === 401) {
    window.location.href = '/partenaire/connexion';
    throw new ErreurPartenaire('Session expirée', 401);
  }
  const texte = await reponse.text();
  let corps: any = null;
  try {
    corps = texte ? JSON.parse(texte) : null;
  } catch {
    corps = null;
  }
  if (!reponse.ok) {
    const message = corps?.message || corps?.error || 'Une erreur est survenue — réessayez';
    throw new ErreurPartenaire(message, reponse.status);
  }
  return corps as T;
}

export async function lirePartenaire<T>(chemin: string, params?: Record<string, string>): Promise<T> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const reponse = await fetch(`/api/partenaire/relais/${chemin}${query}`, { cache: 'no-store' });
  return traiter<T>(reponse);
}

export async function ecrirePartenaire<T>(chemin: string, corps?: unknown): Promise<T> {
  const reponse = await fetch(`/api/partenaire/relais/${chemin}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: corps !== undefined ? JSON.stringify(corps) : undefined,
  });
  return traiter<T>(reponse);
}
