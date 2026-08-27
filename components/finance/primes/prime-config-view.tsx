'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Spinner,
  Switch,
} from '@/components/heroui';
import { Coins, Percent, Save, Trophy } from 'lucide-react';
import {
  IPrimeConfig,
  usePrimeConfigQuery,
  useUpdatePrimeConfigMutation,
} from '@/features/primes-config';

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Coins;
  children: React.ReactNode;
}) {
  return (
    <Card shadow="none" className="border border-default-200">
      <CardHeader className="flex items-center gap-2 pb-1 text-sm font-semibold text-default-700">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </CardHeader>
      <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</CardBody>
    </Card>
  );
}

export function PrimeConfigView() {
  const { data, isLoading } = usePrimeConfigQuery();
  const update = useUpdatePrimeConfigMutation();
  const [form, setForm] = useState<IPrimeConfig | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return (
      <div className="flex justify-center py-24">
        <Spinner color="primary" label="Chargement de la configuration prime…" />
      </div>
    );
  }

  const set = <K extends keyof IPrimeConfig>(k: K, v: IPrimeConfig[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Commission &amp; prime — Turboys</h1>
          <p className="text-sm text-default-500">
            CDC RG-18/19 : commission de base + prime hebdomadaire calculée <strong>séparément</strong> (et non un taux majoré).
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Save className="h-4 w-4" />}
          isLoading={update.isPending}
          onPress={() => update.mutate(form)}
        >
          Enregistrer
        </Button>
      </div>

      {/* Rappel de la règle (anti-confusion avec l'ancien « taux 70 % »). */}
      <div className="rounded-medium border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-default-600">
        Le net payé au livreur = <strong>commission ({form.tauxCommission}% du brut)</strong>{' '}
        {form.primeActive ? (
          <>+ <strong>prime ({form.tauxPrime}%)</strong> si éligible.</>
        ) : (
          <>(prime désactivée).</>
        )}{' '}
        La prime n&apos;est plus fusionnée dans le taux de commission.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Taux" icon={Percent}>
          <Input
            label="Taux de commission (%)"
            size="sm"
            type="number"
            min={0}
            max={100}
            value={String(form.tauxCommission)}
            onValueChange={(v) => set('tauxCommission', Number(v) || 0)}
            description="Part du brut versée au livreur (CDC = 60)"
          />
          <Input
            label="Taux de prime (%)"
            size="sm"
            type="number"
            min={0}
            max={100}
            value={String(form.tauxPrime)}
            onValueChange={(v) => set('tauxPrime', Number(v) || 0)}
            description="Prime hebdomadaire si éligible (CDC = 10)"
          />
          <Select
            label="Assiette de la prime"
            size="sm"
            selectedKeys={[form.assiettePrime]}
            onSelectionChange={(k) =>
              set('assiettePrime', (Array.from(k)[0] as IPrimeConfig['assiettePrime']) ?? 'LIVRAISONS_BRUT')
            }
            description="Base de calcul des 10 %"
          >
            <SelectItem key="LIVRAISONS_BRUT" value="LIVRAISONS_BRUT">
              Total des livraisons (brut) — CDC
            </SelectItem>
            <SelectItem key="COMMISSION_60" value="COMMISSION_60">
              Commission (60 %) — ancien mode
            </SelectItem>
          </Select>
          <div className="flex items-center justify-between rounded-medium border border-default-200 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Prime active</p>
              <p className="text-xs text-default-500">Désactivée = aucune prime versée</p>
            </div>
            <Switch isSelected={form.primeActive} onValueChange={(v) => set('primeActive', v)} />
          </div>
        </Section>

        <Section title="Éligibilité à la prime" icon={Trophy}>
          <Input
            label="Présence min (jours/semaine)"
            size="sm"
            type="number"
            min={0}
            max={7}
            value={String(form.seuilPresenceJours)}
            onValueChange={(v) => set('seuilPresenceJours', Number(v) || 0)}
            description="0–7 jours travaillés requis"
          />
          <Input
            label="Montant brut min (FCFA/semaine)"
            size="sm"
            type="number"
            min={0}
            value={String(form.seuilMontantHebdo)}
            onValueChange={(v) => set('seuilMontantHebdo', Number(v) || 0)}
            description="Seuil de frais de livraison réalisés"
          />
          <Input
            label="Livraisons min (/semaine)"
            size="sm"
            type="number"
            min={0}
            value={String(form.seuilLivraisonsHebdo)}
            onValueChange={(v) => set('seuilLivraisonsHebdo', Number(v) || 0)}
            description="0 = critère désactivé"
          />
          <Input
            label="Courses/jour pour « jour validé »"
            size="sm"
            type="number"
            min={0}
            value={String(form.seuilCoursesJour)}
            onValueChange={(v) => set('seuilCoursesJour', Number(v) || 0)}
            description="Ex-paramètre nombre.course.jour"
          />
        </Section>
      </div>
    </div>
  );
}
