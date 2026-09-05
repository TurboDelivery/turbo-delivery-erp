'use client';

import { Button, Card, InputGroup, Label, Table, TextField } from '@heroui-v3/react';
import { AlertTriangle, ArrowRight, Download, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { ChampListe } from '@/components/commons/champs-formulaire';

import { useEffectifQuery } from '@/features/personnel/queries/personnel-historisation.query';
import {
  LIBELLE_DECLARATION,
  formaterDate,
  formaterMontant,
  libelleTypeCollaborateur,
  telechargerCsv,
} from '@/features/personnel/utils/personnel-historisation.utils';

import { AgentCell } from './shared/agent-cell';
import { DeclarationChip, StatutEffectifChip, TypeContratChip } from './shared/personnel-chips';
import EtatErreur from '@/components/commons/EtatErreur';

const TAILLE_PAGE = 25;
/** Clé « aucun filtre » : React Aria n'accepte pas une clé vide dans une collection. */
const TOUS = '__TOUS__';

const OPTIONS_STATUT = [
  { label: 'Tous', value: TOUS },
  { label: 'Actif', value: 'actif' },
  { label: "Sorti de l'effectif", value: 'sorti' },
] as const;

/** Sélection → valeur de filtre ('' quand l'utilisateur choisit « tous »). */
function lireCle(cle: string): string {
  return !cle || cle === TOUS ? '' : cle;
}

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { alignDroite: false, id: 'agent', libelle: 'Agent' },
  { alignDroite: false, id: 'type', libelle: 'Type' },
  { alignDroite: false, id: 'enrole', libelle: 'Enrôlé le' },
  { alignDroite: false, id: 'statut', libelle: 'Statut' },
  { alignDroite: false, id: 'declare', libelle: 'Déclaré' },
  { alignDroite: true, id: 'net', libelle: 'Net' },
  { alignDroite: true, id: 'actions', libelle: '' },
] as const;

/**
 * Onglet « Effectif » (F1) : tout le personnel enregistré, actifs et sortis.
 *
 * Règle 1 de la spec — un agent n'est jamais supprimé : les sortis restent listés, avec tout
 * leur historique accessible depuis leur fiche. C'est pourquoi le filtre par défaut affiche
 * les deux populations et que le pied de tableau le rappelle explicitement.
 */
export function EffectifTab() {
  const { data, isLoading, isFetching, isError, refetch } = useEffectifQuery();

  const [recherche, setRecherche] = useState('');
  const [type, setType] = useState<string>('');
  const [statut, setStatut] = useState<string>('');
  const [agence, setAgence] = useState<string>('');
  const [page, setPage] = useState(1);

  const lignes = useMemo(() => {
    const toutes = data?.lignes ?? [];
    const q = recherche.trim().toLowerCase();
    return toutes.filter((l) => {
      if (q && !`${l.nom} ${l.matricule ?? ''} ${l.poste ?? ''}`.toLowerCase().includes(q)) return false;
      if (type && (l.typeCollaborateur ?? '').toUpperCase() !== type.toUpperCase()) return false;
      if (statut === 'actif' && !l.actif) return false;
      if (statut === 'sorti' && l.actif) return false;
      if (agence && (l.agence ?? '') !== agence) return false;
      return true;
    });
  }, [data?.lignes, recherche, type, statut, agence]);

  const optionsType = useMemo(
    () => [
      { label: 'Tous', value: TOUS },
      ...(data?.types ?? []).map((t) => ({ label: libelleTypeCollaborateur(t), value: t })),
    ],
    [data?.types],
  );

  const optionsAgence = useMemo(
    () => [
      { label: 'Toutes', value: TOUS },
      ...(data?.agences ?? []).map((a) => ({ label: a, value: a })),
    ],
    [data?.agences],
  );

  const totalPages = Math.max(1, Math.ceil(lignes.length / TAILLE_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const visibles = lignes.slice((pageCourante - 1) * TAILLE_PAGE, pageCourante * TAILLE_PAGE);

  const remettreAZero = (action: () => void) => {
    action();
    setPage(1);
  };

  const exporter = () => {
    telechargerCsv(
      'effectif_complet',
      ['matricule', 'agent', 'poste', 'agence', 'type', 'enrole_le', 'statut', 'declare', 'net_dernier_mois_cloture'],
      lignes.map((l) => [
        l.matricule ?? '',
        l.nom,
        l.poste ?? '',
        l.agence ?? '',
        libelleTypeCollaborateur(l.typeCollaborateur),
        l.enroleLe ?? '',
        l.actif ? 'Actif' : 'Sorti',
        LIBELLE_DECLARATION[l.declaration],
        l.netDernierMoisCloture ?? '',
      ]),
    );
  };

  return (
    <Card>
      <Card.Content className="gap-3">
        {/* Barre de filtres */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-44">
            <ChampListe
              label="Type"
              onChange={(c) => remettreAZero(() => setType(lireCle(c)))}
              options={optionsType}
              placeholder="Tous"
              valeur={type || TOUS}
            />
          </div>
          <div className="w-full sm:w-44">
            <ChampListe
              label="Statut"
              onChange={(c) => remettreAZero(() => setStatut(lireCle(c)))}
              options={OPTIONS_STATUT}
              placeholder="Tous"
              valeur={statut || TOUS}
            />
          </div>
          <div className="w-full sm:w-48">
            <ChampListe
              label="Agence"
              onChange={(c) => remettreAZero(() => setAgence(lireCle(c)))}
              options={optionsAgence}
              placeholder="Toutes"
              valeur={agence || TOUS}
            />
          </div>

          <TextField
            className="min-w-56 flex-1"
            onChange={(v) => remettreAZero(() => setRecherche(v))}
            value={recherche}
          >
            <Label>Recherche</Label>
            <InputGroup>
              <InputGroup.Prefix>
                <Search aria-hidden="true" className="size-4" />
              </InputGroup.Prefix>
              <InputGroup.Input placeholder="Nom, matricule, poste…" />
            </InputGroup>
          </TextField>

          <Button
            isDisabled={lignes.length === 0}
            onPress={exporter}
            size="sm"
            variant="outline"
          >
            <Download aria-hidden="true" className="size-4" />
            Exporter CSV
          </Button>
        </div>

        {isError ? (
          <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="l'effectif" />
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Effectif du personnel" className="min-w-[68rem]">
                <Table.Header>
                  {COLONNES.map((c) => (
                    <Table.Column
                      className={c.alignDroite ? 'text-right' : undefined}
                      id={c.id}
                      isRowHeader={c.id === 'agent'}
                      key={c.id}
                    >
                      {c.id === 'net'
                        ? `Net — ${data?.dernierMoisClotureLibelle ?? 'dernier mois clôturé'}`
                        : c.libelle}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : (
                      <p className="py-8 text-center text-sm text-muted">
                        Aucun agent ne correspond aux filtres.
                      </p>
                    )
                  }
                >
                  {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
                  {isLoading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {COLONNES.map((c) => (
                            <Table.Cell key={`sq-${i}-${c.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading ? [] : visibles).map((l) => (
                    <Table.Row id={l.employeId} key={l.employeId}>
                      <Table.Cell>
                        <AgentCell
                          employeId={l.employeId}
                          matricule={l.matricule}
                          nom={l.nom}
                          sousTitre={[l.poste, l.agence].filter(Boolean).join(' · ')}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <TypeContratChip type={l.typeCollaborateur} />
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-muted">
                        {formaterDate(l.enroleLe)}
                      </Table.Cell>
                      <Table.Cell>
                        <StatutEffectifChip actif={l.actif} sortieLe={l.sortieLe} />
                      </Table.Cell>
                      <Table.Cell>
                        <DeclarationChip etat={l.declaration} />
                      </Table.Cell>
                      <Table.Cell className="text-right font-medium tabular-nums">
                        {formaterMontant(l.netDernierMoisCloture)}
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {l.nbAnomalies > 0 ? (
                            <span
                              className="flex items-center gap-1 text-xs text-warning-soft-foreground"
                              title={`${l.nbAnomalies} anomalie(s) sur ce dossier`}
                            >
                              <AlertTriangle aria-hidden="true" className="size-3.5" />
                              {l.nbAnomalies}
                            </span>
                          ) : null}
                          <Link
                            className="inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-accent hover:underline"
                            href={`/personnel/${l.employeId}`}
                          >
                            Voir la fiche
                            <ArrowRight aria-hidden="true" className="size-3.5" />
                          </Link>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator pt-3 text-xs text-muted">
          <span>
            {lignes.length} agent(s) affiché(s) sur {data?.lignes.length ?? 0} enregistrés (actifs
            et sortis)
          </span>
          <PaginationTableau onPage={setPage} page={pageCourante} total={totalPages} />
          <span>Les agents sortis restent consultables avec tout leur historique</span>
        </div>
      </Card.Content>
    </Card>
  );
}
