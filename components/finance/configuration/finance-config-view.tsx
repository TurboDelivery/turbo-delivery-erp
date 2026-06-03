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
} from '@heroui/react';
import { Banknote, Plus, Save, Settings2, ShieldCheck, Trash2, TrendingUp } from 'lucide-react';
import {
  IModuleConfig,
  useModuleConfigQuery,
  useUpdateModuleConfigMutation,
} from '@/features/finances-config';
import { CategorieDepenseList } from '@/features/depenses/components/depense-list/categorie-depense';

const DEVISES = ['FCFA', 'EUR', 'USD'];

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Settings2;
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

export function FinanceConfigView() {
  const { data, isLoading } = useModuleConfigQuery();
  const update = useUpdateModuleConfigMutation();
  const [form, setForm] = useState<IModuleConfig | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return (
      <div className="flex justify-center py-24">
        <Spinner color="primary" label="Chargement de la configuration…" />
      </div>
    );
  }

  const set = <K extends keyof IModuleConfig>(k: K, v: IModuleConfig[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const comptes = form.comptesTresorerie ?? [];
  const setCompte = (i: number, patch: Partial<IModuleConfig['comptesTresorerie'][number]>) =>
    set('comptesTresorerie', comptes.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const addCompte = () => set('comptesTresorerie', [...comptes, { libelle: '', type: 'BANQUE' }]);
  const removeCompte = (i: number) =>
    set('comptesTresorerie', comptes.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Configuration — Finances</h1>
          <p className="text-sm text-default-500">
            Paramètres globaux du module (devise, seuil d&apos;autonomie DGA, génération, comptes)
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Save className="h-4 w-4" />}
          isLoading={update.isLoading}
          onPress={() => update.mutate(form)}
        >
          Enregistrer
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Général" icon={Settings2}>
          <Select
            label="Devise"
            size="sm"
            selectedKeys={[form.devise]}
            onSelectionChange={(k) => set('devise', String(Array.from(k)[0] ?? 'FCFA'))}
          >
            {DEVISES.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </Select>
          <Input
            label="Nombre de jours du mois"
            size="sm"
            type="number"
            value={String(form.nbJoursMois)}
            onValueChange={(v) => set('nbJoursMois', Number(v) || 0)}
            description="Sert au coût journalier (prorata)"
          />
          <Input
            label="Jour de génération auto"
            size="sm"
            type="number"
            min={1}
            max={28}
            value={String(form.jourGenerationAuto)}
            onValueChange={(v) => set('jourGenerationAuto', Number(v) || 1)}
            description="Date de création des charges fixes (1–28)"
          />
        </Section>

        <Section title="Validation & seuil DGA" icon={ShieldCheck}>
          <Input
            label={`Seuil d'autonomie DGA (${form.devise})`}
            size="sm"
            type="number"
            value={String(form.seuilDga)}
            onValueChange={(v) => set('seuilDga', Number(v) || 0)}
            description="≤ seuil : visa DGA suffit · > seuil : accord DG requis"
          />
          <Select
            label="Validation charges fixes"
            size="sm"
            selectedKeys={[form.validationChargesFixes]}
            onSelectionChange={(k) =>
              set('validationChargesFixes', (Array.from(k)[0] as IModuleConfig['validationChargesFixes']) ?? 'MANUELLE')
            }
          >
            <SelectItem key="MANUELLE" value="MANUELLE">
              Manuelle (mensuelle)
            </SelectItem>
            <SelectItem key="AUTO" value="AUTO">
              Auto (après visa DGA)
            </SelectItem>
          </Select>
          <Select
            label="Mode de traitement"
            size="sm"
            selectedKeys={[form.modeTraitement]}
            onSelectionChange={(k) =>
              set('modeTraitement', (Array.from(k)[0] as IModuleConfig['modeTraitement']) ?? 'UNITE')
            }
          >
            <SelectItem key="UNITE" value="UNITE">
              À l&apos;unité (notif à chaque dépense)
            </SelectItem>
            <SelectItem key="PANIER" value="PANIER">
              Panier groupé (1×/jour)
            </SelectItem>
          </Select>
          <div className="flex items-center justify-between rounded-medium border border-default-200 px-3 py-2 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Clause de passage force</p>
              <p className="text-xs text-default-500">
                Le DGA peut forcer un décaissement urgent si le DG est indisponible (tracé)
              </p>
            </div>
            <Switch
              isSelected={form.clausePassageForce}
              onValueChange={(v) => set('clausePassageForce', v)}
            />
          </div>
        </Section>

        <Section title="CA de référence" icon={TrendingUp}>
          <Select
            label="Source du CA"
            size="sm"
            selectedKeys={[form.caSource]}
            onSelectionChange={(k) =>
              set('caSource', (Array.from(k)[0] as IModuleConfig['caSource']) ?? 'AUTO')
            }
          >
            <SelectItem key="AUTO" value="AUTO">
              Auto (module CA)
            </SelectItem>
            <SelectItem key="MANUEL" value="MANUEL">
              Manuel (saisi)
            </SelectItem>
          </Select>
          {form.caSource === 'MANUEL' && (
            <Input
              label={`CA journalier moyen (${form.devise})`}
              size="sm"
              type="number"
              value={form.caReference != null ? String(form.caReference) : ''}
              onValueChange={(v) => set('caReference', v === '' ? null : Number(v) || 0)}
            />
          )}
        </Section>

        <Card shadow="none" className="border border-default-200">
          <CardHeader className="flex items-center justify-between pb-1">
            <span className="flex items-center gap-2 text-sm font-semibold text-default-700">
              <Banknote className="h-4 w-4 text-primary" /> Comptes de trésorerie
            </span>
            <Button size="sm" variant="flat" startContent={<Plus className="h-4 w-4" />} onPress={addCompte}>
              Ajouter
            </Button>
          </CardHeader>
          <CardBody className="gap-2">
            {comptes.length === 0 && (
              <p className="py-2 text-sm text-default-400">Aucun compte. Ajoutez la caisse et vos banques.</p>
            )}
            {comptes.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  aria-label="Libellé"
                  size="sm"
                  placeholder="Ex. Banque Atlantique"
                  value={c.libelle}
                  onValueChange={(v) => setCompte(i, { libelle: v })}
                  className="flex-1"
                />
                <Select
                  aria-label="Type"
                  size="sm"
                  className="w-36"
                  selectedKeys={[c.type]}
                  onSelectionChange={(k) =>
                    setCompte(i, { type: (Array.from(k)[0] as 'CAISSE' | 'BANQUE') ?? 'BANQUE' })
                  }
                >
                  <SelectItem key="CAISSE" value="CAISSE">
                    Caisse
                  </SelectItem>
                  <SelectItem key="BANQUE" value="BANQUE">
                    Banque
                  </SelectItem>
                </Select>
                <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeCompte(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Catégories de dépenses — création/édition (déplacé depuis la page Charges) */}
      <CategorieDepenseList />
    </div>
  );
}
