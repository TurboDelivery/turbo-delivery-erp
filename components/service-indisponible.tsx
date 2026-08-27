import Link from 'next/link';
import React from 'react';
import { ServerCrash, RotateCcw } from 'lucide-react';

/**
 * Ecran affiche quand un service dont depend TOUTE l'application est injoignable.
 *
 * <p>Sert la garde de `app/(protected)/layout.tsx`. Le profil utilisateur y est lu a
 * la racine : sans lui, ni les droits ni aucune donnee ne peuvent etre rendus. Avant,
 * une panne de lecture y etait convertie en `null`, donc en redirection vers `/auth` —
 * l'utilisateur croyait sa session expiree et se reconnectait en boucle sur un backend
 * a terre. Le lot 2 a corrige cet aveuglement en relancant l'erreur, mais a la racine
 * cela faisait tomber l'ERP entier sur un code d'erreur opaque.</p>
 *
 * <p>Ici on nomme la panne. Volontairement un composant SERVEUR sans animation ni
 * dependance UI : cet ecran doit pouvoir s'afficher precisement quand quelque chose
 * est casse, donc il ne doit dependre de presque rien. Le lien de reessai est un
 * `<a>` natif, pas un routeur client : il force une vraie nouvelle requete serveur.</p>
 */
export default function ServiceIndisponible({ service }: { service: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="max-w-md space-y-6 px-4 text-center">
        <ServerCrash className="mx-auto h-16 w-16 text-muted-foreground" aria-hidden />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Service momentanément injoignable</h1>
          <p className="text-muted-foreground">
            Impossible de joindre {service}. Votre session n&apos;est pas en cause : rien
            ne s&apos;affiche tant que ce service ne répond pas.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </a>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Se reconnecter
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Si cela dure, prévenez l&apos;équipe technique : le problème est côté serveur.
        </p>
      </div>
    </div>
  );
}
