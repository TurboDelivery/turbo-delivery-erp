'use client';

import { Button, Card, Spinner, Switch } from '@heroui-v3/react';
import { Coins, Percent, Save, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { ChampListe, ChampNombre } from '@/components/finance/common/champs-finance';
import {
  IPrimeConfig,
  usePrimeConfigQuery,
  useUpdatePrimeConfigMutation,
} from '@/features/primes-config';

function Section({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof Coins;
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
 * La configuration de la commission et de la prime (CDC RG-18/19).
 *
 * <p>Les sept champs étaient des `<input type="number">` de la v2 : chaque valeur
 * remontait en CHAÎNE, avec un `Number(v) || 0` recopié sept fois au point d'appel. Ce
 * sont des `NumberField`, qui rendent un nombre. L'assiette de la prime était un
 * `Select`, elle devient un `ComboBox` comme toutes les listes du projet.</p>
 */
export function PrimeConfigView() {
  const { data, isError, isFetching, isLoading, refetch } = usePrimeConfigQuery();
  const update = useUpdatePrimeConfigMutation();
  const [form, setForm] = useState<IPrimeConfig | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  // Cette garde passe avant celle du chargement : sur echec `form` reste null et
  // l'ecran restait fige sur le spinner, comme si la donnee arrivait encore.
  if (isError) {
    return (
      <div className="p-4">
        <EtatErreur
          enCours={isFetching}
          onReessayer={() => refetch()}
          quoi="la configuration prime"
        />
      </div>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24">
        <Spinner />
        <p className="text-sm text-muted">Chargement de la configuration prime…</p>
      </div>
    );
  }

  const set = <K extends keyof IPrimeConfig>(k: K, v: IPrimeConfig[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commission &amp; prime — Turboys</h1>
          <p className="text-sm text-muted">
            CDC RG-18/19 : commission de base + prime hebdomadaire calculée{' '}
            <strong>séparément</strong> (et non un taux majoré).
          </p>
        </div>
        <Button isPending={update.isPending} onPress={() => update.mutate(form)} variant="primary">
          {update.isPending ? <Spinner size="sm" /> : <Save aria-hidden="true" className="size-4" />}
          Enregistrer
        </Button>
      </div>

      {/* Rappel de la règle (anti-confusion avec l'ancien « taux 70 % »). */}
      <Card className="bg-surface-secondary">
        <Card.Content>
          <p className="text-sm text-foreground">
            Le net payé au livreur = <strong>commission ({form.tauxCommission} % du brut)</strong>{' '}
            {form.primeActive ? (
              <>
                + <strong>prime ({form.tauxPrime} %)</strong> si éligible.
              </>
            ) : (
              <>(prime désactivée).</>
            )}{' '}
            La prime n&apos;est plus fusionnée dans le taux de commission.
          </p>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section icon={Percent} title="Taux">
          <ChampNombre
            aide="Part du brut versée au livreur (CDC = 60)"
            label="Taux de commission (%)"
            max={100}
            onChange={(v) => set('tauxCommission', v)}
            valeur={form.tauxCommission}
          />
          <ChampNombre
            aide="Prime hebdomadaire si éligible (CDC = 10)"
            label="Taux de prime (%)"
            max={100}
            onChange={(v) => set('tauxPrime', v)}
            valeur={form.tauxPrime}
          />
          <ChampListe
            aide="Base de calcul des 10 %"
            label="Assiette de la prime"
            onChange={(v) =>
              set('assiettePrime', (v || 'LIVRAISONS_BRUT') as IPrimeConfig['assiettePrime'])
            }
            options={[
              { label: 'Total des livraisons (brut) — CDC', value: 'LIVRAISONS_BRUT' },
              { label: 'Commission (60 %) — ancien mode', value: 'COMMISSION_60' },
            ]}
            valeur={form.assiettePrime}
          />
          <div className="flex items-center justify-between gap-3 rounded-lg border border-separator px-3 py-2">
            <Switch isSelected={form.primeActive} onChange={(v) => set('primeActive', v)}>
              <Switch.Content className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium text-foreground">Prime active</span>
                <span className="text-xs text-muted">Désactivée = aucune prime versée</span>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>
        </Section>

        <Section icon={Trophy} title="Éligibilité à la prime">
          <ChampNombre
            aide="0–7 jours travaillés requis"
            label="Présence min (jours/semaine)"
            max={7}
            onChange={(v) => set('seuilPresenceJours', v)}
            valeur={form.seuilPresenceJours}
          />
          <ChampNombre
            aide="Seuil de frais de livraison réalisés"
            label="Montant brut min (FCFA/semaine)"
            onChange={(v) => set('seuilMontantHebdo', v)}
            valeur={form.seuilMontantHebdo}
          />
          <ChampNombre
            aide="0 = critère désactivé"
            label="Livraisons min (/semaine)"
            onChange={(v) => set('seuilLivraisonsHebdo', v)}
            valeur={form.seuilLivraisonsHebdo}
          />
          <ChampNombre
            aide="Ex-paramètre nombre.course.jour"
            label="Courses/jour pour « jour validé »"
            onChange={(v) => set('seuilCoursesJour', v)}
            valeur={form.seuilCoursesJour}
          />
        </Section>
      </div>
    </div>
  );
}
