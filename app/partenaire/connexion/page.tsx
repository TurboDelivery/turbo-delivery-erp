'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@heroui/react';
import { Bike, Eye, EyeOff } from 'lucide-react';

/**
 * Connexion de l'espace partenaire — la porte d'entrée des restaurateurs et commerçants.
 * Volontairement minimale : deux champs, un bouton, un message d'erreur unique (aucun
 * indice sur lequel des deux champs est faux).
 */
export default function ConnexionPartenairePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function seConnecter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const reponse = await fetch('/api/partenaire/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!reponse.ok) {
        const corps = await reponse.json().catch(() => null);
        setErreur(corps?.message ?? 'Identifiants incorrects');
        return;
      }
      router.replace('/partenaire');
    } catch {
      setErreur('Connexion impossible — vérifiez le réseau puis réessayez');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <Bike className="h-7 w-7" aria-hidden />
          </span>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">TURBO — Espace partenaire</p>
            <p className="mt-1 text-sm text-gray-500">Demandez un Turboys, suivez vos courses.</p>
          </div>
        </div>

        <form
          onSubmit={seConnecter}
          className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <Input
            label="E-mail / identifiant"
            variant="bordered"
            value={email}
            onValueChange={setEmail}
            autoComplete="username"
            isRequired
          />
          <Input
            label="Mot de passe"
            variant="bordered"
            type={visible ? 'text' : 'password'}
            value={password}
            onValueChange={setPassword}
            autoComplete="current-password"
            isRequired
            endContent={
              <button type="button" onClick={() => setVisible((v) => !v)} aria-label="Afficher le mot de passe">
                {visible ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            }
          />
          {erreur && <p className="text-sm text-danger">{erreur}</p>}
          <Button type="submit" color="primary" isLoading={enCours} isDisabled={!email || !password}>
            Se connecter
          </Button>
          <p className="text-center text-xs text-gray-400">
            Accès fourni par Turbo Delivery — en cas d'oubli, contactez le standard.
          </p>
        </form>
      </div>
    </div>
  );
}
