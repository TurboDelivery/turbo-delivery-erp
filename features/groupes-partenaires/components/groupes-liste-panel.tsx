'use client';

import { useMemo, useState } from 'react';
import { Button, Chip, InputGroup, Table, TextField } from '@heroui-v3/react';
import { Building2, Crown, Search } from 'lucide-react';

import { formatDateFr } from '@/lib/date-utils';

import { IGroupeResume } from '../types/groupes-partenaires.types';

/** Les colonnes, déclarées une fois : le squelette y compte ses cellules. */
const COLONNES = [
  { id: 'groupe', libelle: 'Groupe' },
  { id: 'etablissements', libelle: 'Établissements' },
  { id: 'principal', libelle: 'Compte principal' },
  { id: 'cree', libelle: 'Créé le' },
  { id: 'action', libelle: 'Action' },
] as const;

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
      <TextField
        aria-label="Rechercher un groupe"
        className="max-w-sm"
        onChange={setRecherche}
        value={recherche}
      >
        <InputGroup>
          <InputGroup.Prefix>
            <Search aria-hidden="true" className="size-4" />
          </InputGroup.Prefix>
          <InputGroup.Input placeholder="Nom du groupe, compte principal…" />
        </InputGroup>
      </TextField>

      <Table>
        <Table.ScrollContainer>
        <Table.Content aria-label="Groupes de partenaires" className="min-w-[52rem]">
        <Table.Header>
          {COLONNES.map((c) => (
            <Table.Column id={c.id} isRowHeader={c.id === 'groupe'} key={c.id}>
              {c.libelle}
            </Table.Column>
          ))}
        </Table.Header>
        <Table.Body
          renderEmptyState={() =>
            isLoading ? null : (
              <p className="py-8 text-center text-sm text-muted">
                Aucun groupe constitué pour l’instant.
              </p>
            )
          }
        >
          {/* Le squelette compte ses cellules sur les MEMES colonnes que les lignes. */}
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                  {COLONNES.map((c) => (
                    <Table.Cell key={`sq-${i}-${c.id}`}>
                      <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            : null}

          {(isLoading ? [] : lignes).map((groupe) => (
            <Table.Row id={groupe.id} key={groupe.id}>
              <Table.Cell>
                <p className="text-sm font-medium">{groupe.nom}</p>
              </Table.Cell>
              <Table.Cell>
                <Chip size="sm" variant="soft">
                  <Building2 aria-hidden="true" className="size-3.5" />
                  <Chip.Label>{groupe.nbEtablissements}</Chip.Label>
                </Chip>
              </Table.Cell>
              <Table.Cell>
                {groupe.proprietaireUserId ? (
                  <div className="flex items-center gap-2">
                    <Crown aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
                    <div className="min-w-0">
                      <p className="truncate text-sm">{groupe.proprietaireNom ?? 'Compte sans nom'}</p>
                      <p className="truncate text-xs text-muted">{groupe.proprietaireEmail ?? '—'}</p>
                    </div>
                  </div>
                ) : (
                  /* Un groupe sans compte principal EST un probleme : il n'est administre
                     par personne. Ici l'ambre dit quelque chose. */
                  <Chip color="warning" size="sm" variant="soft">
                    <Chip.Label>Aucun</Chip.Label>
                  </Chip>
                )}
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap text-muted">
                {formatDateFr(groupe.createdAt)}
              </Table.Cell>
              <Table.Cell>
                <Button onPress={() => onOuvrir(groupe.id)} size="sm" variant="outline">
                  Ouvrir la fiche
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
