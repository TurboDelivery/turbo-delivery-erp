'use client';

import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@heroui-v3/react';

import { LienBouton } from '@/components/commons/LienBouton';

/**
 * Ecran de refus d'acces.
 *
 * <p>Extrait de `ProtectedPage` pour etre rendu depuis DEUX endroits : la garde
 * SERVEUR de `app/(protected)/layout.tsx`, qui est celle qui protege reellement la
 * donnee, et `ProtectedPage` cote client, qui reste un filet.</p>
 *
 * <p>Reste un composant CLIENT a cause de framer-motion et du `router.back()`,
 * mais un composant client rendu depuis un composant serveur ne fait executer
 * AUCUNE requete de page : c'est tout l'interet.</p>
 */
export default function AccesRefuse() {
  const router = useRouter();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-linear-to-b from-background to-muted">
      <div className="space-y-8 px-4 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="bg-linear-to-r from-primary to-yellow-600 bg-clip-text text-9xl font-bold tracking-tighter text-transparent">
            403
          </h1>
          {/* Etait « Not Authorized », en anglais, sur un ERP entierement francais. */}
          <h2 className="text-4xl font-semibold text-foreground">Accès refusé</h2>
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-auto max-w-sm text-muted-foreground"
        >
          Votre rôle ne donne pas accès à cette page.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col justify-center gap-4 sm:flex-row"
        >
          {/* `as={Link}` etait une prop de la v2, ignoree en silence par le Button v3. */}
          <LienBouton href="/" variante="primary">
            <Home aria-hidden="true" className="size-4" />
            Accueil
          </LienBouton>
          <Button onPress={() => router.back()} variant="ghost">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
