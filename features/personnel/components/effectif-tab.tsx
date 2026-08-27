'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Input,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/heroui';
import { AlertTriangle, ArrowRight, Download, Search } from 'lucide-react';

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
  { cle: TOUS, libelle: 'Tous' },
  { cle: 'actif', libelle: 'Actif' },
  { cle: 'sorti', libelle: "Sorti de l'effectif" },
];

/** Sélection HeroUI → valeur de filtre ('' quand l'utilisateur choisit « tous »). */
function lireCle(keys: unknown): string {
  const cle = Array.from(keys as Set<string>)[0];
  return !cle || cle === TOUS ? '' : cle;
}

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
      { cle: TOUS, libelle: 'Tous' },
      ...(data?.types ?? []).map((t) => ({ cle: t, libelle: libelleTypeCollaborateur(t) })),
    ],
    [data?.types],
  );

  const optionsAgence = useMemo(
    () => [{ cle: TOUS, libelle: 'Toutes' }, ...(data?.agences ?? []).map((a) => ({ cle: a, libelle: a }))],
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
    <div className="space-y-3 rounded-xl border border-default-200 bg-white p-4">
      {/* Barre de filtres */}
      <div className="flex flex-wrap items-end gap-2">
        <Select
          label="Type"
          size="sm"
          className="w-44"
          selectedKeys={new Set([type || TOUS])}
          onSelectionChange={(keys) => remettreAZero(() => setType(lireCle(keys)))}
        >
          {optionsType.map((o) => (
            <SelectItem key={o.cle} value={o.cle}>
              {o.libelle}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Statut"
          size="sm"
          className="w-44"
          selectedKeys={new Set([statut || TOUS])}
          onSelectionChange={(keys) => remettreAZero(() => setStatut(lireCle(keys)))}
        >
          {OPTIONS_STATUT.map((o) => (
            <SelectItem key={o.cle} value={o.cle}>
              {o.libelle}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Agence"
          size="sm"
          className="w-48"
          selectedKeys={new Set([agence || TOUS])}
          onSelectionChange={(keys) => remettreAZero(() => setAgence(lireCle(keys)))}
        >
          {optionsAgence.map((o) => (
            <SelectItem key={o.cle} value={o.cle}>
              {o.libelle}
            </SelectItem>
          ))}
        </Select>

        <Input
          label="Recherche"
          size="sm"
          className="min-w-[14rem] flex-1"
          placeholder="Nom, matricule, poste…"
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={recherche}
          onValueChange={(v) => remettreAZero(() => setRecherche(v))}
        />

        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Download className="h-4 w-4" />}
          onPress={exporter}
          isDisabled={lignes.length === 0}
        >
          Exporter CSV
        </Button>
      </div>

      {isError ? (
        <EtatErreur quoi="l&apos;effectif" onReessayer={() => refetch()} enCours={isFetching} />
      ) : (
      <Table aria-label="Effectif du personnel" removeWrapper isStriped>
        <TableHeader>
          <TableColumn className="text-primary">AGENT</TableColumn>
          <TableColumn className="text-primary">TYPE</TableColumn>
          <TableColumn className="text-primary">ENRÔLÉ LE</TableColumn>
          <TableColumn className="text-primary">STATUT</TableColumn>
          <TableColumn className="text-primary">DÉCLARÉ</TableColumn>
          <TableColumn className="text-right text-primary">
            NET — {data?.dernierMoisClotureLibelle ?? 'DERNIER MOIS CLÔTURÉ'}
          </TableColumn>
          <TableColumn className="text-right text-primary"> </TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading || isFetching ? ' ' : 'Aucun agent ne correspond aux filtres.'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Chargement de l’effectif…" />}
        >
          {visibles.map((l) => (
            <TableRow key={l.employeId}>
              <TableCell>
                <AgentCell
                  nom={l.nom}
                  matricule={l.matricule}
                  employeId={l.employeId}
                  sousTitre={[l.poste, l.agence].filter(Boolean).join(' · ')}
                />
              </TableCell>
              <TableCell>
                <TypeContratChip type={l.typeCollaborateur} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-default-500">{formaterDate(l.enroleLe)}</TableCell>
              <TableCell>
                <StatutEffectifChip actif={l.actif} sortieLe={l.sortieLe} />
              </TableCell>
              <TableCell>
                <DeclarationChip etat={l.declaration} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formaterMontant(l.netDernierMoisCloture)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {l.nbAnomalies > 0 ? (
                    <span
                      className="flex items-center gap-1 text-xs text-warning"
                      title={`${l.nbAnomalies} anomalie(s) sur ce dossier`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {l.nbAnomalies}
                    </span>
                  ) : null}
                  <Link
                    href={`/personnel/${l.employeId}`}
                    className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-primary hover:underline"
                  >
                    Voir la fiche
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default-100 pt-3 text-xs text-default-400">
        <span>
          {lignes.length} agent(s) affiché(s) sur {data?.lignes.length ?? 0} enregistrés (actifs et sortis)
        </span>
        {totalPages > 1 ? (
          <Pagination
            size="sm"
            total={totalPages}
            page={pageCourante}
            onChange={setPage}
            color="primary"
            showControls
          />
        ) : null}
        <span>Les agents sortis restent consultables avec tout leur historique</span>
      </div>
    </div>
  );
}
