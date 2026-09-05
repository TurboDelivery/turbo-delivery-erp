'use client';

import { Button, Card, Chip, Table } from '@heroui-v3/react';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { ChampListe } from '@/components/commons/champs-formulaire';

import {
  EtatDeclaration,
  IEmployeContrat,
  IEffectifLigne,
} from '@/features/personnel/types/personnel-historisation.types';
import {
  useContratsEcheanceQuery,
  useEffectifQuery,
} from '@/features/personnel/queries/personnel-historisation.query';
import {
  LIBELLE_DECLARATION,
  etatDeclarationDepuisContrat,
  formaterDate,
  libelleTypeCollaborateur,
  telechargerCsv,
} from '@/features/personnel/utils/personnel-historisation.utils';

import { AgentCell } from './shared/agent-cell';
import { DeclarationContratAction, usePeutDeclarer } from './shared/declaration-contrat-action';
import { DeclarationChip, TypeContratChip } from './shared/personnel-chips';

const FILTRES = [
  { label: 'Tous les contrats', value: 'TOUS' },
  { label: 'Non déclarés', value: 'NON_DECLARES' },
  { label: 'Échéance sous 30 jours', value: 'ECHEANCE' },
] as const;

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { id: 'agent', libelle: 'Agent' },
  { id: 'type', libelle: 'Type' },
  { id: 'debut', libelle: 'Début' },
  { id: 'fin', libelle: 'Fin (CDD)' },
  { id: 'declare', libelle: 'Déclaré' },
  { id: 'alerte', libelle: 'Alerte' },
  { id: 'suivi', libelle: 'Suivi' },
] as const;

interface LigneContrat {
  cle: string;
  employeId: string;
  /** `null` quand l'agent n'a aucun contrat enregistré : il n'y a alors rien à déclarer. */
  contratId: string | null;
  dateDeclaration: string | null;
  referenceDeclaration: string | null;
  declarationUrl: string | null;
  nom: string;
  matricule: string | null;
  poste: string | null;
  agence: string | null;
  type: string | null;
  debut: string | null;
  fin: string | null;
  declaration: EtatDeclaration;
  joursAvantEcheance: number | null;
  echeanceDepassee: boolean;
}

/**
 * Onglet « Contrats & déclarations » (F5).
 *
 * Deux sources complémentaires : l'effectif donne l'agent et sa typologie, la liste des
 * échéances donne les dates exactes des CDD et leur suivi de déclaration. Un agent sans
 * contrat daté apparaît quand même — c'est précisément le dossier qu'il faut compléter.
 */
export function ContratsTab() {
  const {
    data: effectif,
    isLoading: chargementEffectif,
    isFetching: rechargeEffectif,
    isError: echecEffectif,
    refetch: relancerEffectif,
  } = useEffectifQuery();
  const {
    data: contrats,
    isLoading: chargementContrats,
    isFetching: rechargeContrats,
    isError: echecContrats,
    refetch: relancerContrats,
  } = useContratsEcheanceQuery();
  const peutDeclarer = usePeutDeclarer();
  const [filtre, setFiltre] = useState('TOUS');

  const lignes = useMemo<LigneContrat[]>(() => {
    const parEmploye = new Map<string, IEmployeContrat>();
    (contrats ?? []).forEach((c) => {
      if (!parEmploye.has(c.employeId)) parEmploye.set(c.employeId, c);
    });

    const actifs = (effectif?.lignes ?? []).filter((l: IEffectifLigne) => l.actif);

    return actifs.map((l) => {
      const contrat = parEmploye.get(l.employeId) ?? null;
      const type = contrat?.typeContrat ?? l.typeCollaborateur;
      return {
        cle: contrat?.id ?? l.employeId,
        employeId: l.employeId,
        contratId: contrat?.id ?? null,
        dateDeclaration: contrat?.dateDeclaration ?? null,
        referenceDeclaration: contrat?.referenceDeclaration ?? null,
        declarationUrl: contrat?.declarationUrl ?? null,
        nom: l.nom,
        matricule: l.matricule ?? contrat?.employeMatricule ?? null,
        poste: l.poste,
        agence: l.agence,
        type,
        debut: contrat?.dateDebut ?? l.enroleLe,
        fin: contrat?.dateFin ?? null,
        declaration: contrat
          ? etatDeclarationDepuisContrat(contrat.declare, type)
          : l.declaration,
        joursAvantEcheance: contrat?.joursAvantEcheance ?? null,
        echeanceDepassee: contrat?.echeanceDepassee ?? false,
      };
    });
  }, [effectif?.lignes, contrats]);

  const filtrees = useMemo(() => {
    if (filtre === 'NON_DECLARES') {
      return lignes.filter((l) => l.declaration === 'NON_DECLARE' || l.declaration === 'INCONNU');
    }
    if (filtre === 'ECHEANCE') {
      return lignes.filter(
        (l) => l.joursAvantEcheance !== null && l.joursAvantEcheance <= 30,
      );
    }
    return lignes;
  }, [lignes, filtre]);

  const exporter = () => {
    telechargerCsv(
      'contrats_declarations',
      ['agent', 'matricule', 'type', 'debut', 'fin_cdd', 'declare', 'alerte'],
      filtrees.map((l) => [
        l.nom,
        l.matricule ?? '',
        libelleTypeCollaborateur(l.type),
        l.debut ?? '',
        l.fin ?? '',
        LIBELLE_DECLARATION[l.declaration],
        libelleAlerte(l),
      ]),
    );
  };

  const chargement = chargementEffectif || chargementContrats;
  // Les deux sources alimentent la meme liste : si l'une tombe et qu'il ne reste rien a
  // afficher, « Aucun contrat pour ce filtre » ferait croire a un effectif sans contrat.
  const enEchec = (echecEffectif || echecContrats) && filtrees.length === 0;
  const relancer = () => {
    relancerEffectif();
    relancerContrats();
  };

  return (
    <Card>
      <Card.Content className="gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-64">
            <ChampListe
              label="Filtre"
              onChange={(v) => setFiltre(v || 'TOUS')}
              options={FILTRES}
              placeholder="Tous les contrats"
              valeur={filtre}
            />
          </div>

          <div className="flex-1" />

          <Button
            isDisabled={filtrees.length === 0}
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
            <Table.Content aria-label="Contrats et déclarations" className="min-w-[68rem]">
              <Table.Header>
                {COLONNES.map((c) => (
                  <Table.Column
                    className={c.id === 'suivi' ? 'text-right' : undefined}
                    id={c.id}
                    isRowHeader={c.id === 'agent'}
                    key={c.id}
                  >
                    {c.id === 'suivi' && !peutDeclarer ? '' : c.libelle}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  chargement ? null : enEchec ? (
                    <div className="py-6">
                      <EtatErreur
                        enCours={rechargeEffectif || rechargeContrats}
                        onReessayer={relancer}
                        quoi="les contrats"
                      />
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted">Aucun contrat pour ce filtre.</p>
                  )
                }
              >
                {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                {chargement
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {COLONNES.map((c) => (
                          <Table.Cell key={`sq-${i}-${c.id}`}>
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : null}

                {(chargement || enEchec ? [] : filtrees).map((l) => (
                  <Table.Row id={l.cle} key={l.cle}>
                    <Table.Cell>
                      <AgentCell
                        employeId={l.employeId}
                        matricule={l.matricule}
                        nom={l.nom}
                        sousTitre={[l.poste, l.agence].filter(Boolean).join(' · ')}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <TypeContratChip type={l.type} />
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-muted">
                      {formaterDate(l.debut)}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-muted">
                      {l.fin ? formaterDate(l.fin) : '—'}
                    </Table.Cell>
                    <Table.Cell>
                      <DeclarationChip etat={l.declaration} />
                    </Table.Cell>
                    <Table.Cell>
                      <AlerteContrat ligne={l} />
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      {l.contratId ? (
                        <DeclarationContratAction
                          contratId={l.contratId}
                          dateDeclaration={l.dateDeclaration}
                          declarationUrl={l.declarationUrl}
                          employeId={l.employeId}
                          etat={l.declaration}
                          referenceDeclaration={l.referenceDeclaration}
                        />
                      ) : peutDeclarer ? (
                        // Cette liste ne porte que les contrats datés (CDD) : l'absence de ligne
                        // ne prouve pas l'absence de contrat. On renvoie donc vers la fiche, où le
                        // contrat actif — CDI compris — est lu directement.
                        <Link
                          className="text-xs font-medium text-accent hover:underline"
                          href={`/personnel/${l.employeId}`}
                        >
                          Sur la fiche
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
          <span>{filtrees.length} contrat(s) affiché(s)</span>
          <span>
            Le suivi de déclaration est réservé aux profils habilités — chaque modification est
            tracée
          </span>
        </div>
      </Card.Content>
    </Card>
  );
}

function libelleAlerte(l: LigneContrat): string {
  if (l.joursAvantEcheance !== null && l.joursAvantEcheance < 0) {
    return `Contrat expiré (${Math.abs(l.joursAvantEcheance)} j)`;
  }
  if (l.joursAvantEcheance !== null && l.joursAvantEcheance <= 30) {
    return `Échéance dans ${l.joursAvantEcheance} j`;
  }
  if (l.declaration === 'NON_DECLARE') return 'Déclaration à effectuer';
  if (l.declaration === 'INCONNU') return 'Déclaration à confirmer';
  return '—';
}

function AlerteContrat({ ligne }: { ligne: LigneContrat }) {
  const texte = libelleAlerte(ligne);
  if (texte === '—') return <span className="text-muted">—</span>;

  const critique =
    (ligne.joursAvantEcheance !== null && ligne.joursAvantEcheance < 0) ||
    ligne.declaration === 'NON_DECLARE';

  return (
    <Chip color={critique ? 'danger' : 'warning'} size="sm" variant="soft">
      <Chip.Label className="whitespace-nowrap">{texte}</Chip.Label>
    </Chip>
  );
}
