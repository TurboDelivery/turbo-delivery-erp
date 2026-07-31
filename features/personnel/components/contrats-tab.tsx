'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Download } from 'lucide-react';

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
import { DeclarationChip, TypeContratChip } from './shared/personnel-chips';

const FILTRES = [
  { cle: 'TOUS', libelle: 'Tous les contrats' },
  { cle: 'NON_DECLARES', libelle: 'Non déclarés' },
  { cle: 'ECHEANCE', libelle: 'Échéance sous 30 jours' },
];

interface LigneContrat {
  cle: string;
  employeId: string;
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
  const { data: effectif, isLoading: chargementEffectif } = useEffectifQuery();
  const { data: contrats, isLoading: chargementContrats } = useContratsEcheanceQuery();
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

  return (
    <div className="space-y-3 rounded-xl border border-default-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-2">
        <Select
          label="Filtre"
          size="sm"
          className="w-64"
          selectedKeys={new Set([filtre])}
          onSelectionChange={(keys) => setFiltre((Array.from(keys)[0] as string) ?? 'TOUS')}
        >
          {FILTRES.map((f) => (
            <SelectItem key={f.cle} value={f.cle}>
              {f.libelle}
            </SelectItem>
          ))}
        </Select>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="flat"
          color="primary"
          startContent={<Download className="h-4 w-4" />}
          onPress={exporter}
          isDisabled={filtrees.length === 0}
        >
          Exporter CSV
        </Button>
      </div>

      <Table aria-label="Contrats et déclarations" removeWrapper isStriped>
        <TableHeader>
          <TableColumn className="text-primary">AGENT</TableColumn>
          <TableColumn className="text-primary">TYPE</TableColumn>
          <TableColumn className="text-primary">DÉBUT</TableColumn>
          <TableColumn className="text-primary">FIN (CDD)</TableColumn>
          <TableColumn className="text-primary">DÉCLARÉ</TableColumn>
          <TableColumn className="text-primary">ALERTE</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={chargement ? ' ' : 'Aucun contrat pour ce filtre.'}
          isLoading={chargement}
          loadingContent={<Spinner color="primary" label="Chargement des contrats…" />}
        >
          {filtrees.map((l) => (
            <TableRow key={l.cle}>
              <TableCell>
                <AgentCell
                  nom={l.nom}
                  matricule={l.matricule}
                  employeId={l.employeId}
                  sousTitre={[l.poste, l.agence].filter(Boolean).join(' · ')}
                />
              </TableCell>
              <TableCell>
                <TypeContratChip type={l.type} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-default-500">{formaterDate(l.debut)}</TableCell>
              <TableCell className="whitespace-nowrap text-default-500">
                {l.fin ? formaterDate(l.fin) : '—'}
              </TableCell>
              <TableCell>
                <DeclarationChip etat={l.declaration} />
              </TableCell>
              <TableCell>
                <AlerteContrat ligne={l} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default-100 pt-3 text-xs text-default-400">
        <span>{filtrees.length} contrat(s) affiché(s)</span>
        <span>Le suivi de déclaration est réservé aux profils habilités — chaque modification est tracée</span>
      </div>
    </div>
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
  if (texte === '—') return <span className="text-default-300">—</span>;

  const critique =
    (ligne.joursAvantEcheance !== null && ligne.joursAvantEcheance < 0) || ligne.declaration === 'NON_DECLARE';

  return (
    <Chip size="sm" variant="flat" color={critique ? 'danger' : 'warning'}>
      {texte}
    </Chip>
  );
}
