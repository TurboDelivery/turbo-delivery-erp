'use client';

import { Button, InputGroup, Label, TextField } from '@heroui-v3/react';
import { IconLock, IconShieldCheck } from '@tabler/icons-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { ChampMotDePasse } from '@/components/commons/champs-formulaire';
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
        <IconShieldCheck className="text-muted" size={20} />
        <h5 className="text-lg font-semibold dark:text-white-light">Code de sécurité</h5>
      </div>
      <p className="mb-4 text-sm text-muted">
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
        <ChampMotDePasse
          label="Votre mot de passe"
          onChange={setMotDePasse}
          valeur={motDePasse}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/*
           * `inputMode="numeric"` ouvre le pave numerique sur un telephone, et
           * `maxLength` s'applique au champ lui-meme : les deux sont portes par
           * `InputGroup.Input`, pas par le `TextField` qui l'englobe.
           */}
          <TextField
            onChange={(v) => setCode(chiffresSeuls(v))}
            type="password"
            value={code}
          >
            <Label>Nouveau code (4 chiffres)</Label>
            <InputGroup>
              <InputGroup.Prefix>
                <IconLock size={16} />
              </InputGroup.Prefix>
              <InputGroup.Input inputMode="numeric" maxLength={4} />
            </InputGroup>
          </TextField>
          <TextField
            onChange={(v) => setConfirmation(chiffresSeuls(v))}
            type="password"
            value={confirmation}
          >
            <Label>Confirmation</Label>
            <InputGroup>
              <InputGroup.Prefix>
                <IconLock size={16} />
              </InputGroup.Prefix>
              <InputGroup.Input inputMode="numeric" maxLength={4} />
            </InputGroup>
          </TextField>
        </div>
        <Button
          isDisabled={!motDePasse || code.length !== 4 || confirmation.length !== 4}
          isPending={enCours}
          type="submit"
          variant="primary"
        >
          Enregistrer le code
        </Button>
      </form>
    </div>
  );
}
