'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
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
      <div className="flex justify-center py-24">
        <Spinner color="primary" label="Chargement du groupe…" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button isIconOnly size="sm" variant="light" aria-label="Retour à la liste" onPress={onRetour}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-primary">{groupe.nom}</h2>
            <p className="text-sm text-default-500">
              {groupe.etablissements.length} établissement{groupe.etablissements.length > 1 ? 's' : ''} ·{' '}
              {membres.length} membre{membres.length > 1 ? 's' : ''} · créé le {formatDateFr(groupe.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Compte principal — la première chose à savoir sur un groupe. */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="flex items-center gap-2 pb-1 text-sm font-semibold text-default-700">
          <Crown className="h-4 w-4 text-primary" />
          Compte principal
        </CardHeader>
        <CardBody className="flex flex-row flex-wrap items-center justify-between gap-3 pt-0">
          {groupe.proprietaire ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{nomCompte(groupe.proprietaire)}</p>
              <p className="truncate text-[12px] text-default-400">{groupe.proprietaire.email ?? '—'}</p>
              <p className="mt-1 max-w-2xl text-[12px] leading-snug text-default-500">
                Ce compte administre les {groupe.etablissements.length} établissement
                {groupe.etablissements.length > 1 ? 's' : ''} du groupe depuis un seul accès. Les autres comptes
                conservent l&apos;accès à leur propre établissement.
              </p>
            </div>
          ) : (
            <p className="text-sm text-warning">
              Ce groupe n&apos;a pas de compte principal — désignez-en un pour qu&apos;il soit administrable.
            </p>
          )}
          {peutAdministrer && (
            <Button size="sm" variant="flat" color="primary" onPress={() => setChangerPrincipal(true)}>
              Changer le compte principal
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Établissements */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="flex items-center gap-2 pb-1 text-sm font-semibold text-default-700">
          <Building2 className="h-4 w-4 text-primary" />
          Établissements du groupe
        </CardHeader>
        <CardBody className="pt-0">
          <Table aria-label="Établissements du groupe" isStriped removeWrapper>
            <TableHeader>
              <TableColumn className="text-primary">ÉTABLISSEMENT</TableColumn>
              <TableColumn className="text-primary">COMMUNE</TableColumn>
              <TableColumn className="text-primary">COMPTES RATTACHÉS</TableColumn>
              <TableColumn className="text-primary">ACTION</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Aucun établissement rattaché.">
              {groupe.etablissements.map((etablissement) => (
                <TableRow key={etablissement.restaurantId}>
                  <TableCell className="text-sm font-medium">
                    {etablissement.nom ?? 'Établissement sans nom'}
                  </TableCell>
                  <TableCell className="text-default-500">{etablissement.commune ?? '—'}</TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {etablissement.nbComptes}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {peutAdministrer ? (
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => setADetacher(etablissement)}
                      >
                        Détacher
                      </Button>
                    ) : (
                      <span className="text-default-300">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Membres */}
      <Card shadow="none" className="border border-default-200">
        <CardHeader className="flex items-center gap-2 pb-1 text-sm font-semibold text-default-700">
          <Users className="h-4 w-4 text-primary" />
          Membres et accès
        </CardHeader>
        <CardBody className="pt-0">
          <p className="pb-2 text-[12px] leading-snug text-default-500">
            Un accès porte soit sur <strong>tout le groupe</strong>, soit sur{' '}
            <strong>un seul établissement</strong>. Le rôle indiqué est le rôle effectif sur ce périmètre : il peut
            différer du rôle historique du compte.
          </p>
          <Table aria-label="Membres du groupe" isStriped removeWrapper>
            <TableHeader>
              <TableColumn className="text-primary">COMPTE</TableColumn>
              <TableColumn className="text-primary">RÔLE</TableColumn>
              <TableColumn className="text-primary">PORTÉE</TableColumn>
              <TableColumn className="text-primary">PÉRIMÈTRE</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Aucun membre.">
              {membres.map((membre) => (
                <TableRow key={membre.accesId ?? `${membre.userId}-${membre.restaurantId ?? 'groupe'}`}>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{nomCompte(membre)}</span>
                        {groupe.proprietaire?.userId === membre.userId && (
                          <Chip size="sm" variant="flat" color="primary">
                            Compte principal
                          </Chip>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-default-400">{membre.email ?? '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleChip role={membre.role} />
                  </TableCell>
                  <TableCell>
                    <PorteeChip portee={membre.portee} />
                  </TableCell>
                  <TableCell className="text-default-600">
                    {membre.portee === 'GROUPE'
                      ? `Les ${groupe.etablissements.length} établissement${
                          groupe.etablissements.length > 1 ? 's' : ''
                        } du groupe`
                      : (membre.restaurantNom ?? '—')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {changerPrincipal && (
        <ChangerPrincipalModal
          isOpen
          onClose={() => setChangerPrincipal(false)}
          groupe={groupe}
          userId={userId}
        />
      )}
      {aDetacher && (
        <DetacherEtablissementModal
          isOpen
          onClose={() => setADetacher(null)}
          groupe={groupe}
          etablissement={aDetacher}
          userId={userId}
        />
      )}
    </div>
  );
}
