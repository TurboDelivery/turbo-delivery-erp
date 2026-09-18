'use client';

import React from 'react';
import { Card } from '@heroui-v3/react';

import { ComptePartenaireSection } from '@/app/(protected)/restaurants/_sections/compte-partenaire-section';

/**
 * Banc de la section « Compte du partenaire », dans ses trois états.
 *
 * <p>Cette section ne se regarde pas autrement : elle vit au fond d'une fiche partenaire,
 * derrière l'authentification, et son état le plus important, celui du partenaire SANS
 * compte, ne concerne que quatre établissements sur soixante et onze.</p>
 *
 * <p>C'est pourtant celui qu'il fallait voir : pendant des mois l'écran a montré deux
 * champs vides sans dire qu'aucun compte n'existait derrière, et le navigateur les
 * remplissait avec les identifiants de l'opérateur.</p>
 */
export default function ApercuComptePartenaire() {
  const [u1, setU1] = React.useState('');
  const [p1, setP1] = React.useState('');
  const [u2, setU2] = React.useState('');
  const [p2, setP2] = React.useState('');
  const [u3, setU3] = React.useState('');
  const [p3, setP3] = React.useState('');

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Banc</p>
        <h1 className="text-xl font-semibold text-foreground">Compte du partenaire</h1>
      </div>

      <Card>
        <Card.Content className="p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
            Aucun compte de connexion (4 partenaires en production)
          </p>
          <ComptePartenaireSection
            compteExistant={false}
            onPasswordChange={setP1}
            onUsernameChange={setU1}
            password={p1}
            username={u1}
          />
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
            Compte existant
          </p>
          <ComptePartenaireSection
            compteExistant
            onPasswordChange={setP2}
            onUsernameChange={setU2}
            password={p2}
            username={u2}
          />
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
            Création : la question ne se pose pas encore
          </p>
          <ComptePartenaireSection
            onPasswordChange={setP3}
            onUsernameChange={setU3}
            password={p3}
            username={u3}
          />
        </Card.Content>
      </Card>
    </div>
  );
}
