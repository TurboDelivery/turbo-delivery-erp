'use client';

import React, { useState } from 'react';
import { Button, Input } from '@heroui/react';
import { IconLock, IconShieldCheck } from '@tabler/icons-react';
import { toast } from 'sonner';

import { definirCodeSecurite } from '@/src/actions/users.actions';

/**
 * Carte « Code de sécurité » (page profil) — réservée aux rôles DG / DGA.
 *
 * Le code : 4 chiffres, DISTINCT du mot de passe, stocké hashé côté
 * erp-backend. C'est lui (et non le mot de passe) que main-backend exige pour
 * les actions finance sensibles — aujourd'hui la suppression d'une déduction.
 */
export function CodeSecuriteCard({ username }: { username: string }) {
  const [motDePasse, setMotDePasse] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [enCours, setEnCours] = useState(false);

  const chiffresSeuls = (v: string) => v.replace(/\D/g, '').slice(0, 4);

  const enregistrer = async () => {
    if (!/^\d{4}$/.test(code)) {
      toast.error('Le code doit faire exactement 4 chiffres.');
      return;
    }
    if (code !== confirmation) {
      toast.error('Le code et sa confirmation ne sont pas identiques.');
      return;
    }
    setEnCours(true);
    const res = await definirCodeSecurite({ username, password: motDePasse, code });
    setEnCours(false);
    if (res.status === 'success') {
      toast.success('Code de sécurité enregistré', {
        description: 'Ce code sera exigé pour les actions finance sensibles.',
      });
      setMotDePasse('');
      setCode('');
      setConfirmation('');
    } else {
      toast.error('Enregistrement refusé', { description: res.message });
    }
  };

  return (
    <div className="panel">
      <div className="mb-4 flex items-center gap-2">
        <IconShieldCheck size={20} className="text-primary" />
        <h5 className="text-lg font-semibold dark:text-white-light">Code de sécurité</h5>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Code à 4 chiffres, <span className="font-medium">différent de votre mot de passe</span>,
        demandé pour les actions sensibles (ex. suppression d&apos;une déduction). Votre mot de
        passe est requis pour le définir ou le changer.
      </p>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          enregistrer();
        }}
      >
        <Input
          label="Votre mot de passe"
          type="password"
          size="sm"
          variant="bordered"
          value={motDePasse}
          onValueChange={setMotDePasse}
          startContent={<IconLock size={16} className="text-gray-400" />}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nouveau code (4 chiffres)"
            type="password"
            inputMode="numeric"
            size="sm"
            variant="bordered"
            maxLength={4}
            value={code}
            onValueChange={(v) => setCode(chiffresSeuls(v))}
          />
          <Input
            label="Confirmation"
            type="password"
            inputMode="numeric"
            size="sm"
            variant="bordered"
            maxLength={4}
            value={confirmation}
            onValueChange={(v) => setConfirmation(chiffresSeuls(v))}
          />
        </div>
        <Button
          type="submit"
          color="primary"
          isLoading={enCours}
          isDisabled={!motDePasse || code.length !== 4 || confirmation.length !== 4}
        >
          Enregistrer le code
        </Button>
      </form>
    </div>
  );
}
