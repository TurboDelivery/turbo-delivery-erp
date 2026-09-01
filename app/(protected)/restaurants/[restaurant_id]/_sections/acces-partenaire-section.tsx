'use client';

import React, { useEffect, useState } from 'react';
import { Button, Chip, Input, Select, SelectItem, Snippet, Spinner } from '@/components/heroui';
import { ChevronDown, ChevronUp, Eye, EyeOff, KeyRound, Link2, Users } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import {
  useAccesPartenaireQuery,
  useCreerAccesPartenaireMutation,
} from '@/features/acces-partenaire';

const ROLE_OPTIONS = [
  { value: 'OWNER', label: 'Propriétaire' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'CAISSE', label: 'Caisse' },
];

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propriétaire',
  MANAGER: 'Manager',
  CAISSE: 'Caisse',
};

const ROLE_COLORS: Record<string, 'primary' | 'secondary' | 'default'> = {
  OWNER: 'primary',
  MANAGER: 'secondary',
  CAISSE: 'default',
};

// ─── Bloc titre de sous-section ────────────────────────────────────────────────
function SubTitle({ icon, children, action }: { icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-primary">{icon}</span>
        {children}
      </div>
      {action}
    </div>
  );
}

// ─── Section principale ────────────────────────────────────────────────────────
export default function AccesPartenaireSection({ restaurantId }: { restaurantId: string }) {
  const { data: comptes, isLoading, isError, isFetching, refetch } = useAccesPartenaireQuery(restaurantId);
  const creer = useCreerAccesPartenaireMutation(restaurantId);

  const [formOpen, setFormOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nom, setNom] = useState('');
  const [role, setRole] = useState('OWNER');

  // Adresse du PORTAIL PARTENAIRE — une application distincte de l'ERP. Ne jamais la
  // dériver de window.location : l'ERP est l'outil interne, le portail est ailleurs.
  // Tant que la variable n'est pas posée, on l'annonce plutôt que d'afficher une URL fausse.
  const loginUrl = process.env.NEXT_PUBLIC_PORTAIL_PARTENAIRE_URL ?? '';

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const canSubmit = emailValid && passwordValid && !creer.isPending;

  async function submit() {
    if (!canSubmit) return;
    try {
      await creer.mutateAsync({
        email: email.trim(),
        password,
        nom: nom.trim() || undefined,
        role,
      });
      setEmail('');
      setPassword('');
      setNom('');
      setRole('OWNER');
      setFormOpen(false);
    } catch {
      /* toast géré dans la mutation */
    }
  }

  const liste = comptes ?? [];

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-xs p-6">
      <h2 className="text-base font-semibold text-primary mb-1">Accès Espace partenaire</h2>
      <p className="text-sm text-gray-500 mb-6">
        Comptes permettant au partenaire de se connecter à l&apos;Espace partenaire (demande de coursier).
        Créer un accès avec un email existant réinitialise son mot de passe.
      </p>

      {/* ── Comptes existants ── */}
      <div className="mb-8">
        <SubTitle
          icon={<Users className="w-4 h-4" />}
          action={
            <span className="text-xs text-gray-400">
              {liste.length} compte{liste.length > 1 ? 's' : ''}
            </span>
          }
        >
          Comptes existants
        </SubTitle>

        {isLoading ? (
          <Spinner size="sm" />
        ) : isError ? (
          // A la place de la liste : "Aucun acces cree" pousserait a en creer
          // un deuxieme alors que le compte existe et n'a pas pu etre lu.
          <EtatErreur
            quoi="les accès de ce partenaire"
            onReessayer={() => refetch()}
            enCours={isFetching}
          />
        ) : liste.length === 0 ? (
          <div className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-4 text-center">
            Aucun accès créé pour ce partenaire.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {liste.map((compte) => (
              <div
                key={compte.id}
                className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-4 py-2.5 bg-gray-50/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{compte.email}</p>
                  {compte.nom && <p className="text-xs text-gray-400 truncate">{compte.nom}</p>}
                </div>
                <Chip size="sm" variant="flat" color={ROLE_COLORS[compte.role] ?? 'default'} className="shrink-0">
                  {ROLE_LABELS[compte.role] ?? compte.role}
                </Chip>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Créer / réinitialiser un accès ── */}
      <div className="mb-8">
        <SubTitle
          icon={<KeyRound className="w-4 h-4" />}
          action={
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={formOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              onPress={() => setFormOpen((v) => !v)}
            >
              {formOpen ? 'Masquer' : 'Créer / réinitialiser un accès'}
            </Button>
          }
        >
          Créer / réinitialiser un accès
        </SubTitle>

        {formOpen && (
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                variant="bordered"
                value={email}
                onValueChange={setEmail}
                placeholder="partenaire@example.com"
                isRequired
                isInvalid={email.length > 0 && !emailValid}
                errorMessage={email.length > 0 && !emailValid ? 'Email invalide' : undefined}
                classNames={{ inputWrapper: 'bg-white' }}
              />
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                variant="bordered"
                value={password}
                onValueChange={setPassword}
                placeholder="••••••••"
                isRequired
                description="8 caractères minimum"
                isInvalid={password.length > 0 && !passwordValid}
                errorMessage={password.length > 0 && !passwordValid ? '8 caractères minimum' : undefined}
                classNames={{ inputWrapper: 'bg-white' }}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <Input
                label="Nom (facultatif)"
                variant="bordered"
                value={nom}
                onValueChange={setNom}
                placeholder="Nom du contact"
                classNames={{ inputWrapper: 'bg-white' }}
              />
              <Select
                label="Rôle"
                variant="bordered"
                selectedKeys={[role]}
                onSelectionChange={(keys) => {
                  const next = Array.from(keys as Set<string>)[0];
                  if (next) setRole(next);
                }}
                disallowEmptySelection
                classNames={{ trigger: 'bg-white' }}
              >
                {ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value}>{o.label}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="flex justify-end mt-4">
              <Button color="primary" onPress={submit} isLoading={creer.isPending} isDisabled={!canSubmit}>
                Créer l&apos;accès
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── URL de connexion ── */}
      <div>
        <SubTitle icon={<Link2 className="w-4 h-4" />}>URL de connexion</SubTitle>
        <p className="text-xs text-gray-500 mb-2">
          Communiquez cette adresse au partenaire avec ses identifiants pour accéder à son espace.
        </p>
        {loginUrl ? (
          <Snippet symbol="" variant="bordered" className="w-full" codeString={loginUrl}>
            <span className="font-mono text-xs break-all">{loginUrl}</span>
          </Snippet>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500">
            Le portail partenaire est une application distincte de l&apos;ERP. Son adresse
            n&apos;est pas encore configurée&nbsp;: demandez-la à l&apos;équipe technique avant
            de communiquer les identifiants.
          </p>
        )}
      </div>
    </section>
  );
}
