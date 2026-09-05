'use client';

import { Button, Card, Table } from '@heroui-v3/react';
import { ArrowRight, Download } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import EtatErreur from '@/components/commons/EtatErreur';
import { ChampListe } from '@/components/commons/champs-formulaire';

import { obtenirAnomalies } from '@/features/personnel/apis/personnel-historisation.api';
import { useAnomaliesQuery } from '@/features/personnel/queries/personnel-historisation.query';
import {
  LIBELLE_GRAVITE,
  formaterDateHeure,
  telechargerCsv,
} from '@/features/personnel/utils/personnel-historisation.utils';

import { AgentCell } from './shared/agent-cell';
import { GraviteChip } from './shared/personnel-chips';

const TOUS = '__TOUS__';

/**
 * Onglet « Anomalies » (F6).
 *
 * Les anomalies ne sont jamais stockées : le backend les recalcule à chaque appel. Le filtre
 * accepte indifféremment un code d'anomalie ou une gravité — c'est le même paramètre côté
 * serveur, on lui passe donc directement la clé choisie.
 */
export function AnomaliesTab() {
  const { data: session } = useSession();
  const userId = session?.user?.id ? String(session.user.id) : null;
  const [type, setType] = useState<string>('');
  // Verrou d'export : un double-clic écrirait deux traces d'audit pour un seul geste.
  const [exportEnCours, setExportEnCours] = useState(false);
  const { data, isLoading, isFetching, isError, refetch } = useAnomaliesQuery(type || null);

  const options = useMemo(() => {
    const catalogue = data?.typesDisponibles ?? [];
    return [
      { label: 'Toutes', value: TOUS },
      ...catalogue.map((t) => ({
        label: `${t.libelle} (${LIBELLE_GRAVITE[t.gravite] ?? t.gravite})`,
        value: t.code,
      })),
    ];
  }, [data?.typesDisponibles]);

  const anomalies = data?.anomalies ?? [];
  // « Aucune anomalie — profils conformes » sur une API tombee est un contresens : elle
  // certifie une conformite qui n'a jamais ete calculee. L'echec prend donc sa place.
  const enEchec = isError && anomalies.length === 0;

  /**
   * Export CSV.
   *
   * Règle de gestion 5 : un export est un événement d'audit à part entière — « qui a
   * exporté quoi, avec quels filtres ». L'appel porte donc `export: true`, qui déclenche
   * `AuditService.tracerExport` côté backend, et l'identité du demandeur. Le fichier reste
   * celui de l'écran : si la trace échoue, l'utilisateur est averti mais garde son export.
   */
  const exporter = async () => {
    if (exportEnCours) return;
    setExportEnCours(true);
    try {
      await obtenirAnomalies(type || null, { export: true, userId });
    } catch {
      toast.warning("Export non journalisé : la trace d'audit n'a pas pu être écrite.");
    } finally {
      telechargerCsv(
        'anomalies_personnel',
        ['gravite', 'anomalie', 'agent', 'matricule', 'detail'],
        anomalies.map((a) => [
          LIBELLE_GRAVITE[a.gravite] ?? a.gravite,
          a.libelle,
          a.employeNom ?? '',
          a.matricule ?? '',
          a.detail ?? '',
        ]),
      );
      setExportEnCours(false);
    }
  };

  const colonnes = ['Gravité', 'Anomalie', 'Agent concerné', 'Détail', ''] as const;

  return (
    <Card>
      <Card.Content className="gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-80">
            <ChampListe
              label="Type d'anomalie"
              onChange={(cle) => setType(!cle || cle === TOUS ? '' : cle)}
              options={options}
              placeholder="Toutes"
              valeur={type || TOUS}
            />
          </div>

          <div className="flex-1" />

          <Button
            isDisabled={anomalies.length === 0}
            isPending={exportEnCours}
            onPress={exporter}
            size="sm"
            variant="outline"
          >
            <Download aria-hidden="true" className="size-4" />
            Exporter CSV
          </Button>
        </div>

        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Anomalies du personnel" className="min-w-[56rem]">
              <Table.Header>
                {colonnes.map((c, i) => (
                  <Table.Column
                    className={i === colonnes.length - 1 ? 'text-right' : undefined}
                    id={c || 'actions'}
                    isRowHeader={c === 'Gravité'}
                    key={c || 'actions'}
                  >
                    {c}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  isLoading ? null : enEchec ? (
                    <div className="py-6">
                      <EtatErreur
                        enCours={isFetching}
                        onReessayer={() => refetch()}
                        quoi="les anomalies"
                      />
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted">
                      Aucune anomalie — profils conformes.
                    </p>
                  )
                }
              >
                {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {colonnes.map((c, j) => (
                          <Table.Cell key={`sq-${i}-${j}`}>
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : null}

                {(isLoading || enEchec ? [] : anomalies).map((a, index) => (
                  <Table.Row
                    id={`${a.type}-${a.employeId ?? 'na'}-${index}`}
                    key={`${a.type}-${a.employeId ?? 'na'}-${index}`}
                  >
                    <Table.Cell>
                      <GraviteChip gravite={a.gravite} />
                    </Table.Cell>
                    <Table.Cell className="font-medium text-foreground">{a.libelle}</Table.Cell>
                    <Table.Cell>
                      <AgentCell
                        employeId={a.employeId}
                        matricule={a.matricule}
                        nom={a.employeNom}
                        sousTitre={a.typeLibelle}
                      />
                    </Table.Cell>
                    <Table.Cell className="max-w-md text-muted">{a.detail ?? '—'}</Table.Cell>
                    <Table.Cell className="text-right">
                      {a.employeId ? (
                        <Link
                          className="inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-accent hover:underline"
                          href={`/personnel/${a.employeId}`}
                        >
                          Corriger
                          <ArrowRight aria-hidden="true" className="size-3.5" />
                        </Link>
                      ) : null}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator pt-3 text-xs text-muted">
          <span>
            {anomalies.length} anomalie(s) affichée(s) sur {data?.total ?? 0} ·{' '}
            {data?.employesAnalyses ?? 0} dossier(s) analysé(s)
          </span>
          <span>
            {data?.calculeLe
              ? `Recalculé le ${formaterDateHeure(data.calculeLe)}`
              : 'Recalcul automatique'}{' '}
            — objectif zéro anomalie avant chaque clôture
          </span>
        </div>
      </Card.Content>
    </Card>
  );
}
