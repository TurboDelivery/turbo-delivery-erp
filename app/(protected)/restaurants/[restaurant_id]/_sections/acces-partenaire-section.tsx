'use client';

import { Button, Card, Chip } from '@heroui-v3/react';
import { ChevronDown, ChevronUp, KeyRound, Link2, Users } from 'lucide-react';
import React, { useState } from 'react';

import { ChampCopiable } from '@/components/commons/ChampCopiable';
import EtatErreur from '@/components/commons/EtatErreur';
import {
  ChampListe,
  ChampMotDePasse,
  ChampTexte,
} from '@/components/commons/champs-formulaire';
import {
  useAccesPartenaireQuery,
  useCreerAccesPartenaireMutation,
} from '@/features/acces-partenaire';

const ROLE_OPTIONS = [
  { label: 'Propriétaire', value: 'OWNER' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Caisse', value: 'CAISSE' },
] as const;

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propriétaire',
  MANAGER: 'Manager',
  CAISSE: 'Caisse',
};

/*
 * Le role ne porte plus de couleur : proprietaire en `primary` — la couleur de MARQUE —
 * et manager en `secondary` peignaient une CATEGORIE. Le libelle la dit deja.
 */

// ─── Bloc titre de sous-section ────────────────────────────────────────────────
function SubTitle({ icon, children, action }: { icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-muted">{icon}</span>
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
    <Card>
      <Card.Content className="gap-6 p-6">
        <div>
          <h2 className="mb-1 text-base font-semibold text-foreground">Accès Espace partenaire</h2>
          <p className="text-sm text-muted">
            Comptes permettant au partenaire de se connecter à l&apos;Espace partenaire (demande
            de coursier). Créer un accès avec un email existant réinitialise son mot de passe.
          </p>
        </div>

        {/* ── Comptes existants ── */}
        <div>
          <SubTitle
            action={
              <span className="text-xs text-muted">
                {liste.length} compte{liste.length > 1 ? 's' : ''}
              </span>
            }
            icon={<Users aria-hidden="true" className="size-4" />}
          >
            Comptes existants
          </SubTitle>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div className="h-14 animate-pulse rounded-lg bg-surface-secondary" key={i} />
              ))}
            </div>
          ) : isError ? (
            // A la place de la liste : "Aucun acces cree" pousserait a en creer
            // un deuxieme alors que le compte existe et n'a pas pu etre lu.
            <EtatErreur
              enCours={isFetching}
              onReessayer={() => refetch()}
              quoi="les accès de ce partenaire"
            />
          ) : liste.length === 0 ? (
            <div className="rounded-lg border border-dashed border-separator p-4 text-center text-xs text-muted">
              Aucun accès créé pour ce partenaire.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {liste.map((compte) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg border border-separator bg-surface-secondary/50 px-4 py-2.5"
                  key={compte.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{compte.email}</p>
                    {compte.nom && <p className="truncate text-xs text-muted">{compte.nom}</p>}
                  </div>
                  <Chip className="shrink-0" size="sm" variant="soft">
                    <Chip.Label>{ROLE_LABELS[compte.role] ?? compte.role}</Chip.Label>
                  </Chip>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Créer / réinitialiser un accès ── */}
        <div>
          <SubTitle
            action={
              <Button onPress={() => setFormOpen((v) => !v)} size="sm" variant="outline">
                {formOpen ? (
                  <ChevronUp aria-hidden="true" className="size-4" />
                ) : (
                  <ChevronDown aria-hidden="true" className="size-4" />
                )}
                {formOpen ? 'Masquer' : 'Créer / réinitialiser un accès'}
              </Button>
            }
            icon={<KeyRound aria-hidden="true" className="size-4" />}
          >
            Créer / réinitialiser un accès
          </SubTitle>

          {formOpen && (
            <div className="rounded-lg border border-separator bg-surface-secondary/50 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ChampTexte
                  erreur={email.length > 0 && !emailValid ? 'Email invalide' : undefined}
                  label="Email"
                  onChange={setEmail}
                  placeholder="partenaire@example.com"
                  type="email"
                  valeur={email}
                />
                <ChampMotDePasse
                  erreur={
                    password.length > 0 && !passwordValid ? '8 caractères minimum' : undefined
                  }
                  label="Mot de passe"
                  onChange={setPassword}
                  valeur={password}
                />
                <ChampTexte
                  label="Nom (facultatif)"
                  onChange={setNom}
                  placeholder="Nom du contact"
                  valeur={nom}
                />
                <ChampListe
                  label="Rôle"
                  onChange={(v) => v && setRole(v)}
                  options={ROLE_OPTIONS}
                  placeholder="Choisir un rôle"
                  valeur={role}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  isDisabled={!canSubmit}
                  isPending={creer.isPending}
                  onPress={submit}
                  variant="primary"
                >
                  Créer l&apos;accès
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── URL de connexion ── */}
        <div>
          <SubTitle icon={<Link2 aria-hidden="true" className="size-4" />}>
            URL de connexion
          </SubTitle>
          <p className="mb-2 text-xs text-muted">
            Communiquez cette adresse au partenaire avec ses identifiants pour accéder à son
            espace.
          </p>
          {loginUrl ? (
            <ChampCopiable valeur={loginUrl} />
          ) : (
            <p className="rounded-lg border border-dashed border-separator px-3 py-2 text-xs text-muted">
              Le portail partenaire est une application distincte de l&apos;ERP. Son adresse
              n&apos;est pas encore configurée&nbsp;: demandez-la à l&apos;équipe technique avant
              de communiquer les identifiants.
            </p>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
