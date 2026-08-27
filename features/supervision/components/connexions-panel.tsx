'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Chip,
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
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import { useConnexionsQuery } from '../queries/supervision.queries';
import { useRechercheDifferee } from '../hooks/use-recherche-differee';
import {
  ExporteurOnglet,
  IConnexionsFiltre,
  TYPE_EVENEMENT_COULEURS,
  TYPE_EVENEMENT_LABELS,
  TYPES_EVENEMENT,
} from '../types';
import { exporterConnexions, messageTroncature } from '../utils/supervision-export.utils';
import { formatDuree, formatInstant, utilisateurConnexion } from '../utils/supervision-format.utils';

const TAILLE_PAGE = 25;

/** Périodes proposées, exprimées en jours (null = toute la profondeur conservée). */
const PERIODES: { cle: string; libelle: string; jours: number | null }[] = [
  { cle: 'JOUR', libelle: "Aujourd'hui", jours: 0 },
  { cle: 'SEMAINE', libelle: '7 derniers jours', jours: 7 },
  { cle: 'MOIS', libelle: '30 derniers jours', jours: 30 },
  { cle: 'TOUT', libelle: 'Tout l’historique', jours: null },
];

/** Borne basse `YYYY-MM-DD` correspondant à une période. */
function borneDepuis(cle: string): string {
  const periode = PERIODES.find((p) => p.cle === cle);
  if (!periode || periode.jours === null) return '';
  const date = new Date();
  date.setDate(date.getDate() - periode.jours);
  return date.toISOString().slice(0, 10);
}

interface Props {
  userId: string;
  enregistrerExport: (exporteur: ExporteurOnglet | null) => void;
}

/**
 * Onglet « Connexions » (F4) : connexions, échecs, déconnexions et expirations.
 *
 * Un échec sur un identifiant inconnu n'a pas d'utilisateur rattaché — seule la
 * chaîne saisie est journalisée, et c'est précisément la ligne qu'un auditeur
 * cherche : elle est donc affichée telle quelle, signalée « compte inconnu ».
 */
export function ConnexionsPanel({ userId, enregistrerExport }: Props) {
  const [typeEvenement, setTypeEvenement] = useState('TOUS');
  const [periode, setPeriode] = useState('JOUR');
  const [page, setPage] = useState(0);
  const [saisie, setSaisie, recherche] = useRechercheDifferee();

  useEffect(() => {
    setPage(0);
  }, [typeEvenement, periode, recherche]);

  const filtre: IConnexionsFiltre = useMemo(
    () => ({
      typeEvenement: typeEvenement === 'TOUS' ? '' : typeEvenement,
      recherche,
      depuis: borneDepuis(periode),
      jusqua: '',
      page,
    }),
    [typeEvenement, recherche, periode, page],
  );

  const { data, isLoading, isFetching } = useConnexionsQuery(userId, filtre, TAILLE_PAGE);
  const lignes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.totalElements ?? 0;

  const exporter = useCallback(async () => {
    try {
      const bilan = await exporterConnexions(userId, filtre);
      const n = bilan.lignes;
      if (n === 0) toast.info('Aucun événement à exporter pour ces critères.');
      // Un export coupé n'est JAMAIS annoncé comme complet : l'avertissement est aussi
      // écrit en première ligne du fichier (cf. supervision-export.utils).
      else if (bilan.tronque) toast.warning(messageTroncature(bilan), { duration: 12000 });
      else toast.success(`${n} événement${n > 1 ? 's' : ''} exporté${n > 1 ? 's' : ''}.`);
    } catch {
      toast.error("Échec de l'export du journal des connexions.");
    }
  }, [userId, filtre]);

  useEffect(() => {
    enregistrerExport(exporter);
    return () => enregistrerExport(null);
  }, [enregistrerExport, exporter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Select
          aria-label="Filtrer par événement"
          label="Événement"
          size="sm"
          className="w-56"
          selectedKeys={[typeEvenement]}
          onSelectionChange={(cles) => setTypeEvenement((Array.from(cles)[0] as string) ?? 'TOUS')}
        >
          {[
            <SelectItem key="TOUS">Tous</SelectItem>,
            ...TYPES_EVENEMENT.map((type) => <SelectItem key={type}>{TYPE_EVENEMENT_LABELS[type]}</SelectItem>),
          ]}
        </Select>
        <Select
          aria-label="Filtrer par période"
          label="Période"
          size="sm"
          className="w-48"
          selectedKeys={[periode]}
          onSelectionChange={(cles) => setPeriode((Array.from(cles)[0] as string) ?? 'JOUR')}
        >
          {PERIODES.map((p) => (
            <SelectItem key={p.cle}>{p.libelle}</SelectItem>
          ))}
        </Select>
        <Input
          aria-label="Rechercher dans le journal des connexions"
          label="Recherche"
          size="sm"
          placeholder="Utilisateur, identifiant, IP…"
          className="min-w-[14rem] flex-1"
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={saisie}
          onValueChange={setSaisie}
          isClearable
          onClear={() => setSaisie('')}
        />
      </div>

      <Table
        aria-label="Journal des connexions"
        isStriped
        removeWrapper
        bottomContent={
          totalPages > 1 ? (
            <div className="flex justify-center pt-2">
              <Pagination
                total={totalPages}
                page={page + 1}
                onChange={(p) => setPage(p - 1)}
                color="primary"
                showControls
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn className="text-primary">HORODATAGE</TableColumn>
          <TableColumn className="text-primary">UTILISATEUR</TableColumn>
          <TableColumn className="text-primary">ÉVÉNEMENT</TableColumn>
          <TableColumn className="text-primary">ADRESSE IP</TableColumn>
          <TableColumn className="text-primary">APPAREIL</TableColumn>
          <TableColumn className="text-primary">SESSION</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading || isFetching ? ' ' : 'Aucun événement pour ces critères.'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Chargement des connexions…" />}
        >
          {lignes.map((connexion) => (
            <TableRow key={connexion.id}>
              <TableCell className="whitespace-nowrap font-mono text-[11px] tabular-nums text-default-500">
                {formatInstant(connexion.occurredAt)}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {utilisateurConnexion(connexion.utilisateur, connexion.identifiant)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <Chip
                    size="sm"
                    variant="dot"
                    color={TYPE_EVENEMENT_COULEURS[connexion.typeEvenement] ?? 'default'}
                  >
                    {TYPE_EVENEMENT_LABELS[connexion.typeEvenement] ?? connexion.typeEvenement}
                  </Chip>
                  {connexion.motif && <span className="text-[11px] text-default-400">{connexion.motif}</span>}
                </div>
              </TableCell>
              <TableCell className="font-mono text-[11px] text-default-500">{connexion.ip ?? '—'}</TableCell>
              <TableCell className="max-w-[14rem] truncate text-default-500" title={connexion.appareil ?? ''}>
                {connexion.appareil ?? '—'}
              </TableCell>
              <TableCell className="font-mono text-[11px] text-default-400">
                {connexion.sessionId ? (
                  <span title={connexion.sessionId}>{connexion.sessionId.slice(0, 8)}</span>
                ) : (
                  '—'
                )}
                {connexion.dureeSessionS != null && (
                  <span className="ml-1 text-default-400">· {formatDuree(connexion.dureeSessionS)}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-default-400">
        <span>
          {total} événement{total > 1 ? 's' : ''} pour ces critères
        </span>
        <span>Journal en lecture seule — conservation 24 mois</span>
      </div>
    </div>
  );
}
