'use client';

import { Card, CardBody } from '@heroui/react';

import { useEffectifQuery } from '@/features/personnel/queries/personnel-historisation.query';
import { formaterMontant } from '@/features/personnel/utils/personnel-historisation.utils';

interface KpiProps {
  libelle: string;
  valeur: string;
  note: string;
  ton?: 'ok' | 'info' | 'alerte' | 'critique';
}

const TON: Record<NonNullable<KpiProps['ton']>, string> = {
  ok: 'text-success',
  info: 'text-primary',
  alerte: 'text-warning',
  critique: 'text-danger',
};

function Kpi({ libelle, valeur, note, ton = 'info' }: KpiProps) {
  return (
    <Card shadow="none" className="border border-default-200">
      <CardBody className="gap-1 py-3">
        <span className="text-[11px] uppercase tracking-wide text-default-500">{libelle}</span>
        <span className={`text-2xl font-semibold tabular-nums ${TON[ton]}`}>{valeur}</span>
        <span className="text-[11px] text-default-400">{note}</span>
      </CardBody>
    </Card>
  );
}

/**
 * Bandeau de tête de la page Personnel : effectif, masse salariale figée, conformité,
 * anomalies. Il partage les requêtes des onglets (même clé react-query, donc aucun appel
 * supplémentaire) et reste muet en cas d'échec — il ne doit jamais empêcher la page
 * existante de s'afficher.
 */
export function PersonnelKpis() {
  const { data, isError } = useEffectifQuery();
  if (isError) return null;

  const tiret = '—';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        libelle="Effectif actif"
        valeur={data ? String(data.totalActifs) : tiret}
        note={`${data?.totalSortis ?? 0} sorti(s) conservé(s) en historique`}
        ton="ok"
      />
      <Kpi
        libelle={`Masse salariale — ${data?.dernierMoisClotureLibelle ?? 'dernier mois clôturé'}`}
        valeur={data?.masseDernierMoisCloture != null ? formaterMontant(data.masseDernierMoisCloture) : tiret}
        note="instantané figé à la clôture"
        ton="info"
      />
      {/*
        Deux chiffres, pas un : « non déclaré » est une infraction constatée, « à confirmer »
        un état jamais renseigné. Les confondre reviendrait soit à crier au loup, soit — bien
        pire — à afficher une conformité que personne n'a vérifiée.
      */}
      <Kpi
        libelle="Contrats non déclarés"
        valeur={data ? String(data.nonDeclares) : tiret}
        note={
          data
            ? `${data.aConfirmer} à confirmer (jamais renseigné) · risque de conformité sociale`
            : 'risque de conformité sociale'
        }
        ton="critique"
      />
      <Kpi
        libelle="Anomalies détectées"
        valeur={data ? String(data.totalAnomalies) : tiret}
        note="contrôle permanent des dossiers"
        ton="alerte"
      />
    </div>
  );
}
