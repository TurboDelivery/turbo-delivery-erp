'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { Building2, Crown, Search } from 'lucide-react';

import { formatDateFr } from '@/lib/date-utils';

import { IGroupeResume } from '../types/groupes-partenaires.types';

interface Props {
  groupes: IGroupeResume[];
  isLoading: boolean;
  onOuvrir: (groupeId: string) => void;
}

/**
 * La liste d'accueil du module : nom du groupe, nombre d'établissements, compte
 * principal. Trois colonnes, parce que ce sont les trois questions qu'on se pose en
 * arrivant — « quels groupes existent, quelle taille, qui les tient ».
 *
 * Le filtrage est local : le parc de groupes se compte en dizaines, et un filtre
 * serveur ferait clignoter la liste à chaque frappe pour aucun gain.
 */
export function GroupesListePanel({ groupes, isLoading, onOuvrir }: Props) {
  const [recherche, setRecherche] = useState('');

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return groupes;
    return groupes.filter((groupe) =>
      [groupe.nom, groupe.proprietaireNom, groupe.proprietaireEmail]
        .filter(Boolean)
        .some((valeur) => String(valeur).toLowerCase().includes(q)),
    );
  }, [groupes, recherche]);

  return (
    <div className="space-y-3">
      <Input
        aria-label="Rechercher un groupe"
        size="sm"
        className="max-w-sm"
        placeholder="Nom du groupe, compte principal…"
        startContent={<Search className="h-4 w-4 text-default-400" />}
        value={recherche}
        onValueChange={setRecherche}
        isClearable
        onClear={() => setRecherche('')}
      />

      <Table aria-label="Groupes de partenaires" isStriped removeWrapper>
        <TableHeader>
          <TableColumn className="text-primary">GROUPE</TableColumn>
          <TableColumn className="text-primary">ÉTABLISSEMENTS</TableColumn>
          <TableColumn className="text-primary">COMPTE PRINCIPAL</TableColumn>
          <TableColumn className="text-primary">CRÉÉ LE</TableColumn>
          <TableColumn className="text-primary">ACTION</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={isLoading ? ' ' : 'Aucun groupe constitué pour l’instant.'}
          isLoading={isLoading}
          loadingContent={<Spinner color="primary" label="Chargement des groupes…" />}
        >
          {lignes.map((groupe) => (
            <TableRow key={groupe.id}>
              <TableCell>
                <p className="text-sm font-medium">{groupe.nom}</p>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" startContent={<Building2 className="ml-1 h-3.5 w-3.5" />}>
                  {groupe.nbEtablissements}
                </Chip>
              </TableCell>
              <TableCell>
                {groupe.proprietaireUserId ? (
                  <div className="flex items-center gap-2">
                    <Crown className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm">{groupe.proprietaireNom ?? 'Compte sans nom'}</p>
                      <p className="truncate text-[11px] text-default-400">{groupe.proprietaireEmail ?? '—'}</p>
                    </div>
                  </div>
                ) : (
                  <Chip size="sm" variant="flat" color="warning">
                    Aucun
                  </Chip>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-default-500">
                {formatDateFr(groupe.createdAt)}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="flat" color="primary" onPress={() => onOuvrir(groupe.id)}>
                  Ouvrir la fiche
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
