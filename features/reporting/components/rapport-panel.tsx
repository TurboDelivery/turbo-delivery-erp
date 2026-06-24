'use client';

import { useState } from 'react';
import {
  Chip,
  Input,
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

import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import { IRapportJour, IRapportSignal, useRapportPresenceQuery } from '@/features/reporting';

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-medium border border-default-200 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-default-400">{label}</p>
      <p className={`text-lg font-semibold ${color ?? 'text-default-800'}`}>{value}</p>
    </div>
  );
}

function SignalCell({ signal }: { signal: IRapportSignal | null }) {
  if (!signal || !signal.heure) return <span className="text-default-300">—</span>;
  const heure = (() => {
    try {
      return new Date(signal.heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return signal.heure;
    }
  })();
  // RG-29 : hors-zone explicite (jaune = justifié par ticket, rouge = non justifié) ;
  // repli sur `conforme === false` (distance) pour les anciennes données sans le flag.
  const horsZone = signal.horsZone || signal.conforme === false;
  const justifie = signal.horsZoneJustifiee === true;
  return (
    <div className="flex items-center gap-1">
      <span>{heure}</span>
      {horsZone && (
        <Chip
          size="sm"
          variant="flat"
          color={justifie ? 'warning' : 'danger'}
          className="h-4 text-[10px] px-1"
        >
          hors zone
        </Chip>
      )}
    </div>
  );
}

/** Synthèse hors-zone d'une journée : justifié (ticket) / non justifié (pénalité) / — (RG-29). */
function HorsZoneCell({ jour }: { jour: IRapportJour }) {
  const signaux = [jour.montee, jour.intermediaire, jour.intermediaire2, jour.fin].filter(
    (s): s is IRapportSignal => s != null,
  );
  const horsZone = signaux.filter((s) => s.horsZone || s.conforme === false);
  if (horsZone.length === 0) return <span className="text-default-300">—</span>;
  const tousJustifies = horsZone.every((s) => s.horsZoneJustifiee === true);
  return (
    <Chip size="sm" variant="flat" color={tousJustifies ? 'success' : 'danger'}>
      {tousJustifies ? 'Ticket joint — justifié' : 'Non justifié'}
    </Chip>
  );
}

export function RapportPanel() {
  const livreursQuery = useLivreursListQuery();
  const [livreurId, setLivreurId] = useState<string | null>(null);
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');

  const { data: rapport, isFetching } = useRapportPresenceQuery(livreurId, debut || undefined, fin || undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Select
          aria-label="Livreur"
          label="Livreur"
          size="sm"
          className="w-64"
          selectedKeys={livreurId ? [livreurId] : []}
          onSelectionChange={(keys) => setLivreurId((Array.from(keys)[0] as string) ?? null)}
        >
          {(livreursQuery.data ?? []).map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {`${l.prenoms ?? ''} ${l.nom ?? ''}`.trim() || l.telephone || l.matricule || 'Livreur'}
            </SelectItem>
          ))}
        </Select>
        <Input type="date" label="Du" size="sm" className="w-40" value={debut} onValueChange={setDebut} />
        <Input type="date" label="Au" size="sm" className="w-40" value={fin} onValueChange={setFin} />
      </div>

      {!livreurId ? (
        <p className="py-10 text-center text-sm text-default-400">Sélectionnez un livreur pour afficher son rapport.</p>
      ) : isFetching && !rapport ? (
        <div className="flex justify-center py-10">
          <Spinner color="primary" label="Chargement du rapport…" />
        </div>
      ) : rapport ? (
        <>
          {/* Synthèse */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Jours actifs" value={rapport.synthese.joursActifs} />
            <Stat label="Présents" value={rapport.synthese.presents} color="text-success" />
            <Stat label="Retards" value={rapport.synthese.retards} color="text-warning" />
            <Stat label="Absents" value={rapport.synthese.absents} color="text-danger" />
            <Stat label="Assiduité" value={`${rapport.synthese.tauxAssiduite}%`} color="text-primary" />
            <Stat label="Cote" value={rapport.cote != null ? `${rapport.cote}/100` : '—'} />
          </div>

          {/* Détail par jour */}
          <Table aria-label="Détail par jour" isStriped>
            <TableHeader>
              <TableColumn className="text-primary">JOUR</TableColumn>
              <TableColumn className="text-primary">STATUT</TableColumn>
              <TableColumn className="text-primary">MONTÉE</TableColumn>
              <TableColumn className="text-primary">RELANCE 1</TableColumn>
              <TableColumn className="text-primary">RELANCE 2</TableColumn>
              <TableColumn className="text-primary">FIN</TableColumn>
              <TableColumn className="text-primary">HORS ZONE</TableColumn>
              <TableColumn className="text-primary">PÉNALITÉ</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Aucun jour sur la période">
              {rapport.jours.map((j) => (
                <TableRow key={j.date}>
                  <TableCell className="whitespace-nowrap">
                    {(() => {
                      try {
                        return new Date(j.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                      } catch {
                        return j.date;
                      }
                    })()}
                  </TableCell>
                  <TableCell>{j.statutJour ?? '—'}</TableCell>
                  <TableCell><SignalCell signal={j.montee} /></TableCell>
                  <TableCell><SignalCell signal={j.intermediaire} /></TableCell>
                  <TableCell><SignalCell signal={j.intermediaire2} /></TableCell>
                  <TableCell><SignalCell signal={j.fin} /></TableCell>
                  <TableCell><HorsZoneCell jour={j} /></TableCell>
                  <TableCell className="text-default-500">
                    {j.penaliteFcfa ? `${j.penaliteFcfa} F` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <p className="py-10 text-center text-sm text-default-400">Aucune donnée.</p>
      )}
    </div>
  );
}
