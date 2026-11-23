'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import { FenetreDecaissement } from '@/components/finance/hub/fenetre-decaissement';
import type { IFinanceItem, ISortieTresorerie } from '@/features/finances-hub';

const ligne = (id: string, designation: string, montant: number): IFinanceItem => ({
  categorie: 'REPARATIONS MOTOS',
  categorieId: 'c-1',
  date: '2026-08-27',
  designation,
  dyn: false,
  echeance: '27/08',
  id,
  justif: true,
  montant,
  src: 'Manuel',
  statut: 'approuve',
  type: 'variable',
});

const UNE = [ligne('a', 'Réparation de moto', 19500)];
const TROIS = [...UNE, ligne('b', 'Réparation de moto', 19500), ligne('c', 'Réparation', 2000)];

/**
 * Banc de la fenêtre de décaissement.
 *
 * <p>Le tableau de bord qui la monte exige une session : on ne pouvait pas la voir sans se
 * connecter. Trois configurations se regardent ici : un seul compte (la production
 * d'aujourd'hui), plusieurs comptes, aucun compte. Ce que la fenêtre envoie au serveur
 * s'affiche sous les boutons.</p>
 */
export default function ApercuDecaissement() {
  const [cas, setCas] = React.useState<{ cibles: IFinanceItem[]; comptes: string[] } | null>(null);
  const [envoi, setEnvoi] = React.useState<ISortieTresorerie | null>(null);

  const ouvrir = (cibles: IFinanceItem[], comptes: string[]) => {
    setEnvoi(null);
    setCas({ cibles, comptes });
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold">Banc de la fenêtre de décaissement</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button onPress={() => ouvrir(UNE, ['Caisse physique'])} size="sm" variant="primary">
          Un compte, une dépense
        </Button>
        <Button onPress={() => ouvrir(TROIS, ['Caisse physique', 'Banque SGBCI', 'Wave'])} size="sm" variant="ghost">
          Trois comptes, trois dépenses
        </Button>
        <Button onPress={() => ouvrir(UNE, [])} size="sm" variant="ghost">
          Aucun compte configuré
        </Button>
      </div>

      <p className="text-sm" data-testid="envoi">
        {envoi ? `Envoyé : ${JSON.stringify(envoi)}` : 'Rien envoyé.'}
      </p>

      <FenetreDecaissement
        busy={false}
        cibles={cas?.cibles ?? []}
        comptes={cas?.comptes ?? []}
        isOpen={cas !== null}
        onConfirmer={(sortie) => {
          setEnvoi(sortie);
          setCas(null);
        }}
        onOpenChange={(ouvert) => {
          if (!ouvert) setCas(null);
        }}
      />
    </div>
  );
}
