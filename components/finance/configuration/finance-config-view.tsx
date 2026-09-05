'use client';

import { Button, Card, Spinner, Switch } from '@heroui-v3/react';
import { Banknote, Plus, Save, Settings2, ShieldCheck, Trash2, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { ChampListe, ChampNombre, ChampTexte } from '@/components/finance/common/champs-finance';
import { CategorieDepenseList } from '@/features/depenses/components/depense-list/categorie-depense';
import {
  IModuleConfig,
  useModuleConfigQuery,
  useUpdateModuleConfigMutation,
} from '@/features/finances-config';

const DEVISES = ['FCFA', 'EUR', 'USD'].map((d) => ({ label: d, value: d }));

function Section({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof Settings2;
  title: string;
}) {
  return (
    <Card>
      <Card.Content className="gap-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon aria-hidden="true" className="size-4 text-muted" />
          {title}
        </span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      </Card.Content>
    </Card>
  );
}

/**
 * Les paramètres globaux du module Finances.
 *
 * <p>Les cinq listes étaient des `Select` et les six nombres des `<input type="number">`
 * qui remontaient des CHAÎNES, avec un `Number(v) || 0` recopié à chaque point d'appel.
 * Ce sont des `ComboBox` et des `NumberField` montés une fois.</p>
 */
export function FinanceConfigView() {
  const { data, isError, isFetching, isLoading, refetch } = useModuleConfigQuery();
  const update = useUpdateModuleConfigMutation();
  const [form, setForm] = useState<IModuleConfig | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  // Cette garde passe avant celle du chargement : sur echec `form` reste null et
  // l'ecran restait fige sur le spinner, comme si la donnee arrivait encore.
  if (isError) {
    return (
      <div className="p-4">
        <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="la configuration" />
      </div>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24">
        <Spinner />
        <p className="text-sm text-muted">Chargement de la configuration…</p>
      </div>
    );
  }

  const set = <K extends keyof IModuleConfig>(k: K, v: IModuleConfig[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const comptes = form.comptesTresorerie ?? [];
  const setCompte = (i: number, patch: Partial<IModuleConfig['comptesTresorerie'][number]>) =>
    set(
      'comptesTresorerie',
      comptes.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    );
  const addCompte = () => set('comptesTresorerie', [...comptes, { libelle: '', type: 'BANQUE' }]);
  const removeCompte = (i: number) =>
    set(
      'comptesTresorerie',
      comptes.filter((_, idx) => idx !== i),
    );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuration — Finances</h1>
          <p className="text-sm text-muted">
            Paramètres globaux du module (devise, seuil d&apos;autonomie DGA, génération, comptes)
          </p>
        </div>
        <Button isPending={update.isPending} onPress={() => update.mutate(form)} variant="primary">
          {update.isPending ? <Spinner size="sm" /> : <Save aria-hidden="true" className="size-4" />}
          Enregistrer
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section icon={Settings2} title="Général">
          <ChampListe
            label="Devise"
            onChange={(v) => set('devise', v || 'FCFA')}
            options={DEVISES}
            valeur={form.devise}
          />
          <ChampNombre
            aide="Sert au coût journalier (prorata)"
            label="Nombre de jours du mois"
            onChange={(v) => set('nbJoursMois', v)}
            valeur={form.nbJoursMois}
          />
          <ChampNombre
            aide="Date de création des charges fixes (1–28)"
            label="Jour de génération auto"
            max={28}
            min={1}
            onChange={(v) => set('jourGenerationAuto', v || 1)}
            valeur={form.jourGenerationAuto}
          />
        </Section>

        <Section icon={ShieldCheck} title="Validation & seuil DGA">
          <ChampNombre
            aide="≤ seuil : visa DGA suffit · > seuil : accord DG requis"
            label={`Seuil d'autonomie DGA (${form.devise})`}
            onChange={(v) => set('seuilDga', v)}
            valeur={form.seuilDga}
          />
          <ChampListe
            label="Validation charges fixes"
            onChange={(v) =>
              set(
                'validationChargesFixes',
                (v || 'MANUELLE') as IModuleConfig['validationChargesFixes'],
              )
            }
            options={[
              { label: 'Manuelle (mensuelle)', value: 'MANUELLE' },
              { label: 'Auto (après visa DGA)', value: 'AUTO' },
            ]}
            valeur={form.validationChargesFixes}
          />
          <ChampListe
            label="Mode de traitement"
            onChange={(v) => set('modeTraitement', (v || 'UNITE') as IModuleConfig['modeTraitement'])}
            options={[
              { label: "À l'unité (notif à chaque dépense)", value: 'UNITE' },
              { label: 'Panier groupé (1×/jour)', value: 'PANIER' },
            ]}
            valeur={form.modeTraitement}
          />
          <div className="flex items-center justify-between gap-3 rounded-lg border border-separator px-3 py-2 sm:col-span-2">
            <Switch
              isSelected={form.clausePassageForce}
              onChange={(v) => set('clausePassageForce', v)}
            >
              <Switch.Content className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium text-foreground">Clause de passage forcé</span>
                <span className="text-xs text-muted">
                  Le DGA peut forcer un décaissement urgent si le DG est indisponible (tracé)
                </span>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>
        </Section>

        <Section icon={TrendingUp} title="CA de référence">
          <ChampListe
            label="Source du CA"
            onChange={(v) => set('caSource', (v || 'AUTO') as IModuleConfig['caSource'])}
            options={[
              { label: 'Auto (module CA)', value: 'AUTO' },
              { label: 'Manuel (saisi)', value: 'MANUEL' },
            ]}
            valeur={form.caSource}
          />
          {form.caSource === 'MANUEL' && (
            <ChampNombre
              label={`CA journalier moyen (${form.devise})`}
              onChange={(v) => set('caReference', v)}
              valeur={form.caReference ?? 0}
            />
          )}
        </Section>

        <Card>
          <Card.Content className="gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Banknote aria-hidden="true" className="size-4 text-muted" /> Comptes de trésorerie
              </span>
              <Button onPress={addCompte} size="sm" variant="outline">
                <Plus aria-hidden="true" className="size-4" />
                Ajouter
              </Button>
            </div>

            {comptes.length === 0 && (
              <p className="py-2 text-sm text-muted">
                Aucun compte. Ajoutez la caisse et vos banques.
              </p>
            )}

            {comptes.map((c, i) => (
              <div className="flex items-end gap-2" key={`compte-${i}`}>
                <div className="flex-1">
                  <ChampTexte
                    label="Libellé"
                    onChange={(v) => setCompte(i, { libelle: v })}
                    placeholder="Ex. Banque Atlantique"
                    valeur={c.libelle}
                  />
                </div>
                <div className="w-36">
                  <ChampListe
                    label="Type"
                    onChange={(v) => setCompte(i, { type: (v || 'BANQUE') as 'BANQUE' | 'CAISSE' })}
                    options={[
                      { label: 'Caisse', value: 'CAISSE' },
                      { label: 'Banque', value: 'BANQUE' },
                    ]}
                    valeur={c.type}
                  />
                </div>
                <Button
                  aria-label={`Retirer le compte ${c.libelle || i + 1}`}
                  isIconOnly
                  onPress={() => removeCompte(i)}
                  variant="danger-soft"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            ))}
          </Card.Content>
        </Card>
      </div>

      {/* Catégories de dépenses — création/édition (déplacé depuis la page Charges) */}
      <CategorieDepenseList />
    </div>
  );
}
