'use client';

import { useMemo, useState } from 'react';
import { Button, Card, Chip, Table } from '@heroui-v3/react';
import { ArrowLeft, Building2, Crown, Users } from 'lucide-react';

import { formatDateFr } from '@/lib/date-utils';

import { useGroupeDetailQuery } from '../queries/groupes-partenaires.query';
import { IEtablissementDuGroupe } from '../types/groupes-partenaires.types';
import { nomCompte } from '../utils/simulation-groupe.utils';
import { PorteeChip, RoleChip } from './acces-chips';
import { ChangerPrincipalModal } from './changer-principal-modal';
import { DetacherEtablissementModal } from './detacher-etablissement-modal';

interface Props {
  groupeId: string;
  userId: string;
  /** Vrai si l'utilisateur peut `manage` le sujet CASL GroupePartenaire. */
  peutAdministrer: boolean;
  onRetour: () => void;
}

/**
 * La fiche d'un groupe : ses établissements, ses membres et leur rôle.
 *
 * Deux écritures seulement, et chacune passe par son récapitulatif : détacher un
 * établissement, changer le compte principal. Tout le reste (créer un accès, changer
 * un rôle) appartient à l'espace partenaire — l'ERP administre la STRUCTURE du groupe,
 * pas le détail des habilitations, et mélanger les deux ferait de cet écran une
 * seconde console d'autorisation à tenir à jour.
 */
export function GroupeDetailPanel({ groupeId, userId, peutAdministrer, onRetour }: Props) {
  const { data: groupe, isLoading } = useGroupeDetailQuery(groupeId, userId);
  const [aDetacher, setADetacher] = useState<IEtablissementDuGroupe | null>(null);
  const [changerPrincipal, setChangerPrincipal] = useState(false);

  /**
   * Une ligne par ACCÈS, et non par personne : un même compte peut détenir un accès
   * de groupe ET un accès direct sur un établissement, et c'est précisément ce que
   * cette table doit rendre visible. Les accès de portée groupe remontent en tête.
   */
  const membres = useMemo(() => {
    if (!groupe) return [];
    return [...groupe.membres].sort((a, b) => {
      const rang = (portee: string) => (portee === 'GROUPE' ? 0 : 1);
      return rang(a.portee) - rang(b.portee) || nomCompte(a).localeCompare(nomCompte(b), 'fr');
    });
  }, [groupe]);

  if (isLoading || !groupe) {
    return (
      <div className="flex flex-col gap-3 py-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="h-24 animate-pulse rounded-xl bg-surface-secondary" key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button aria-label="Retour à la liste" isIconOnly onPress={onRetour} size="sm" variant="ghost">
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground">{groupe.nom}</h2>
            <p className="text-sm text-muted">
              {groupe.etablissements.length} établissement{groupe.etablissements.length > 1 ? 's' : ''} · {membres.length} membre{membres.length > 1 ? 's' : ''} · créé le{' '}
              {formatDateFr(groupe.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Compte principal — la première chose à savoir sur un groupe. */}
      <Card>
        <Card.Header className="flex-row items-center gap-2 text-sm font-semibold text-foreground">
          <Crown aria-hidden="true" className="size-4 text-muted" />
          Compte principal
        </Card.Header>
        <Card.Content className="flex-row flex-wrap items-center justify-between gap-3">
          {groupe.proprietaire ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{nomCompte(groupe.proprietaire)}</p>
              <p className="truncate text-xs text-muted">{groupe.proprietaire.email ?? '—'}</p>
              <p className="mt-1 max-w-2xl text-xs leading-snug text-muted">
                Ce compte administre les {groupe.etablissements.length} établissement
                {groupe.etablissements.length > 1 ? 's' : ''} du groupe depuis un seul accès. Les autres comptes conservent l&apos;accès à leur propre établissement.
              </p>
            </div>
          ) : (
            <p className="text-sm text-warning-soft-foreground">Ce groupe n&apos;a pas de compte principal — désignez-en un pour qu&apos;il soit administrable.</p>
          )}
          {peutAdministrer && (
            <Button onPress={() => setChangerPrincipal(true)} size="sm" variant="outline">
              Changer le compte principal
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Établissements */}
      <Card>
        <Card.Header className="flex-row items-center gap-2 text-sm font-semibold text-foreground">
          <Building2 aria-hidden="true" className="size-4 text-muted" />
          Établissements du groupe
        </Card.Header>
        <Card.Content>
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Établissements du groupe" className="min-w-[40rem]">
                <Table.Header>
                  <Table.Column id="etablissement" isRowHeader>
                    Établissement
                  </Table.Column>
                  <Table.Column id="commune">Commune</Table.Column>
                  <Table.Column id="comptes">Comptes rattachés</Table.Column>
                  <Table.Column id="action">Action</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => <p className="py-8 text-center text-sm text-muted">Aucun établissement rattaché.</p>}>
                  {groupe.etablissements.map((etablissement) => (
                    <Table.Row id={etablissement.restaurantId} key={etablissement.restaurantId}>
                      <Table.Cell className="text-sm font-medium">{etablissement.nom ?? 'Établissement sans nom'}</Table.Cell>
                      <Table.Cell className="text-muted">{etablissement.commune ?? '—'}</Table.Cell>
                      <Table.Cell>
                        <Chip size="sm" variant="soft">
                          <Chip.Label>{etablissement.nbComptes}</Chip.Label>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        {peutAdministrer ? (
                          <Button onPress={() => setADetacher(etablissement)} size="sm" variant="danger-soft">
                            Détacher
                          </Button>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      {/* Membres */}
      <Card>
        <Card.Header className="flex-row items-center gap-2 text-sm font-semibold text-foreground">
          <Users aria-hidden="true" className="size-4 text-muted" />
          Membres et accès
        </Card.Header>
        <Card.Content>
          <p className="pb-2 text-xs leading-snug text-muted">
            Un accès porte soit sur <strong>tout le groupe</strong>, soit sur <strong>un seul établissement</strong>. Le rôle indiqué est le rôle effectif sur ce périmètre : il peut différer du rôle
            historique du compte.
          </p>
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Membres du groupe" className="min-w-[44rem]">
                <Table.Header>
                  <Table.Column id="compte" isRowHeader>
                    Compte
                  </Table.Column>
                  <Table.Column id="role">Rôle</Table.Column>
                  <Table.Column id="portee">Portée</Table.Column>
                  <Table.Column id="perimetre">Périmètre</Table.Column>
                </Table.Header>
                <Table.Body renderEmptyState={() => <p className="py-8 text-center text-sm text-muted">Aucun membre.</p>}>
                  {membres.map((membre) => (
                    <Table.Row id={membre.accesId ?? `${membre.userId}-${membre.restaurantId ?? 'groupe'}`} key={membre.accesId ?? `${membre.userId}-${membre.restaurantId ?? 'groupe'}`}>
                      <Table.Cell>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{nomCompte(membre)}</span>
                            {groupe.proprietaire?.userId === membre.userId && (
                              <Chip size="sm" variant="soft">
                                <Chip.Label>Compte principal</Chip.Label>
                              </Chip>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted">{membre.email ?? '—'}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <RoleChip role={membre.role} />
                      </Table.Cell>
                      <Table.Cell>
                        <PorteeChip portee={membre.portee} />
                      </Table.Cell>
                      <Table.Cell className="text-foreground">
                        {membre.portee === 'GROUPE' ? `Les ${groupe.etablissements.length} établissement${groupe.etablissements.length > 1 ? 's' : ''} du groupe` : (membre.restaurantNom ?? '—')}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      {changerPrincipal && <ChangerPrincipalModal isOpen onClose={() => setChangerPrincipal(false)} groupe={groupe} userId={userId} />}
      {aDetacher && <DetacherEtablissementModal isOpen onClose={() => setADetacher(null)} groupe={groupe} etablissement={aDetacher} userId={userId} />}
    </div>
  );
}
