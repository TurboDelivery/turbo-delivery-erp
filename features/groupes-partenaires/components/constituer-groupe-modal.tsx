'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Spinner,
} from '@/components/heroui';
import { Building2, Search, UserCog } from 'lucide-react';

import {
  useCreerGroupeMutation,
  useEtablissementsCandidatsQuery,
} from '../queries/groupes-partenaires.query';
import { IComptePartenaire, IEtablissementCandidat } from '../types/groupes-partenaires.types';
import { nomCompte, simulerConstitution } from '../utils/simulation-groupe.utils';
import { RoleChip } from './acces-chips';
import { RecapitulatifAcces } from './recapitulatif-acces';

type Etape = 'etablissements' | 'principal' | 'recapitulatif';

const ETAPES: { cle: Etape; titre: string }[] = [
  { cle: 'etablissements', titre: 'Établissements' },
  { cle: 'principal', titre: 'Compte principal' },
  { cle: 'recapitulatif', titre: 'Vérification' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  /** Appelé après création, avec l'identifiant du groupe, pour ouvrir sa fiche. */
  onCree: (groupeId: string) => void;
}

/**
 * Assistant de constitution d'un groupe, en trois temps.
 *
 * L'ordre n'est pas cosmétique : on ne peut désigner un compte principal qu'après
 * avoir choisi les établissements, puisque le compte se choisit PARMI ceux qui y sont
 * déjà rattachés — jamais dans un annuaire global. Un groupe se forme autour de
 * personnes qui exploitent déjà les établissements, pas l'inverse.
 *
 * La troisième étape n'est pas une confirmation : c'est le récapitulatif compte par
 * compte, et c'est la seule porte vers le bouton de validation.
 */
export function ConstituerGroupeModal({ isOpen, onClose, userId, onCree }: Props) {
  const [etape, setEtape] = useState<Etape>('etablissements');
  const [nom, setNom] = useState('');
  const [recherche, setRecherche] = useState('');
  const [selection, setSelection] = useState<string[]>([]);
  const [principal, setPrincipal] = useState<string | null>(null);

  const { data, isLoading } = useEtablissementsCandidatsQuery(userId, recherche, isOpen);
  const creer = useCreerGroupeMutation(userId);

  // Remise à zéro à la fermeture : un assistant rouvert doit repartir vierge, sinon
  // l'administrateur valide une sélection qu'il croit avoir abandonnée.
  useEffect(() => {
    if (isOpen) return;
    setEtape('etablissements');
    setNom('');
    setRecherche('');
    setSelection([]);
    setPrincipal(null);
  }, [isOpen]);

  const etablissements = useMemo(() => data ?? [], [data]);

  const selectionnes = useMemo(
    () => etablissements.filter((e) => selection.includes(e.restaurantId)),
    [etablissements, selection],
  );

  /**
   * Les comptes éligibles au titre de compte principal : ceux des établissements
   * cochés, dédoublonnés. Un compte présent sur plusieurs établissements n'apparaît
   * qu'une fois, mais on garde la liste de ses établissements pour l'afficher.
   */
  const comptesEligibles = useMemo(() => {
    const parCompte = new Map<string, { compte: IComptePartenaire; etablissements: string[] }>();
    selectionnes.forEach((etablissement) => {
      etablissement.comptes.forEach((compte) => {
        const existant = parCompte.get(compte.userId);
        const libelle = etablissement.nom ?? 'Établissement sans nom';
        if (existant) {
          existant.etablissements.push(libelle);
          return;
        }
        parCompte.set(compte.userId, { compte, etablissements: [libelle] });
      });
    });
    return Array.from(parCompte.values()).sort(
      (a, b) =>
        b.etablissements.length - a.etablissements.length ||
        nomCompte(a.compte).localeCompare(nomCompte(b.compte), 'fr'),
    );
  }, [selectionnes]);

  // Le compte principal choisi doit rester dans le périmètre : décocher son
  // établissement l'invalide silencieusement sinon.
  useEffect(() => {
    if (principal && !comptesEligibles.some((c) => c.compte.userId === principal)) {
      setPrincipal(null);
    }
  }, [comptesEligibles, principal]);

  const recapitulatif = useMemo(
    () => simulerConstitution(selectionnes, principal),
    [selectionnes, principal],
  );

  const nomValide = nom.trim().length >= 2;
  const peutPasserAuPrincipal = nomValide && selection.length >= 1;
  const peutValider =
    peutPasserAuPrincipal && !!principal && recapitulatif.blocages.length === 0 && !creer.isPending;

  const basculer = (restaurantId: string, coche: boolean) =>
    setSelection((precedente) =>
      coche ? [...precedente, restaurantId] : precedente.filter((id) => id !== restaurantId),
    );

  const valider = () => {
    if (!peutValider || !principal) return;
    creer.mutate(
      { nom: nom.trim(), restaurantIds: selection, proprietaireUserId: principal },
      {
        onSuccess: (groupe) => {
          onCree(groupe.id);
          onClose();
        },
      },
    );
  };

  const indexEtape = ETAPES.findIndex((e) => e.cle === etape);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span>Constituer un groupe de partenaires</span>
          <div className="flex items-center gap-2">
            {ETAPES.map((e, index) => (
              <Chip
                key={e.cle}
                size="sm"
                variant={index === indexEtape ? 'solid' : 'flat'}
                color={index <= indexEtape ? 'primary' : 'default'}
              >
                {index + 1}. {e.titre}
              </Chip>
            ))}
          </div>
        </ModalHeader>

        <ModalBody>
          {etape === 'etablissements' && (
            <div className="space-y-3">
              <Input
                label="Nom du groupe"
                size="sm"
                placeholder="Ex. Groupe Chicken Nation"
                value={nom}
                onValueChange={setNom}
                description="Ce nom apparaîtra dans l'ERP et dans l'espace partenaire."
                isRequired
              />
              <Input
                aria-label="Rechercher un établissement"
                label="Rechercher"
                size="sm"
                placeholder="Nom d'établissement, commune…"
                startContent={<Search className="h-4 w-4 text-default-400" />}
                value={recherche}
                onValueChange={setRecherche}
                isClearable
                onClear={() => setRecherche('')}
              />

              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner color="primary" label="Chargement des établissements…" />
                </div>
              ) : (
                <div className="max-h-88 space-y-1.5 overflow-y-auto pr-1">
                  {etablissements.length === 0 && (
                    <p className="py-8 text-center text-sm text-default-400">
                      Aucun établissement ne correspond à cette recherche.
                    </p>
                  )}
                  {etablissements.map((etablissement) => (
                    <LigneEtablissement
                      key={etablissement.restaurantId}
                      etablissement={etablissement}
                      coche={selection.includes(etablissement.restaurantId)}
                      onChange={(coche) => basculer(etablissement.restaurantId, coche)}
                    />
                  ))}
                </div>
              )}

              <p className="text-[12px] text-default-500">
                {selection.length} établissement{selection.length > 1 ? 's' : ''} sélectionné
                {selection.length > 1 ? 's' : ''}. Un établissement déjà rattaché à un autre groupe ne peut pas
                être repris ici : il doit d&apos;abord en être détaché.
              </p>
            </div>
          )}

          {etape === 'principal' && (
            <div className="space-y-3">
              <p className="text-sm text-default-600">
                Le compte principal devient <strong>propriétaire du groupe</strong> : il administrera les{' '}
                {selection.length} établissement{selection.length > 1 ? 's' : ''} depuis un seul accès. Choisissez-le
                parmi les comptes déjà rattachés à ces établissements.
              </p>

              {comptesEligibles.length === 0 ? (
                <p className="rounded-medium border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-default-600">
                  Aucun compte n&apos;est rattaché aux établissements sélectionnés. Créez d&apos;abord un accès
                  partenaire sur l&apos;un d&apos;eux depuis sa fiche, puis revenez ici.
                </p>
              ) : (
                <RadioGroup
                  aria-label="Compte principal du groupe"
                  value={principal ?? ''}
                  onValueChange={setPrincipal}
                  classNames={{ wrapper: 'gap-1.5' }}
                >
                  {comptesEligibles.map(({ compte, etablissements: rattachements }) => (
                    <Radio
                      key={compte.userId}
                      value={compte.userId}
                      classNames={{
                        base: 'm-0 max-w-full items-start gap-2 rounded-medium border border-default-200 px-3 py-2 data-[selected=true]:border-primary',
                        label: 'w-full',
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{nomCompte(compte)}</p>
                          <p className="truncate text-[11px] text-default-400">{compte.email ?? '—'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RoleChip role={compte.role} />
                          <Chip size="sm" variant="flat">
                            {rattachements.length} établissement{rattachements.length > 1 ? 's' : ''}
                          </Chip>
                        </div>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-default-500">{rattachements.join(' · ')}</p>
                    </Radio>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}

          {etape === 'recapitulatif' && (
            <RecapitulatifAcces
              recapitulatif={recapitulatif}
              intention={`Si vous constituez le groupe « ${nom.trim() || 'sans nom'} », voici ce qui change pour chacun des comptes rattachés aux ${selection.length} établissement${selection.length > 1 ? 's' : ''} sélectionné${selection.length > 1 ? 's' : ''}.`}
              note="Les comptes non principaux gardent leur accès sur leur propre établissement, avec leur rôle actuel : le groupe ajoute une vue d'ensemble au compte principal, il ne retire l'accès de personne. Le rôle de chacun reste modifiable ensuite depuis l'espace partenaire."
            />
          )}
        </ModalBody>

        <ModalFooter className="justify-between">
          <Button variant="light" onPress={onClose}>
            Annuler
          </Button>
          <div className="flex items-center gap-2">
            {etape !== 'etablissements' && (
              <Button
                variant="flat"
                onPress={() => setEtape(etape === 'recapitulatif' ? 'principal' : 'etablissements')}
              >
                Retour
              </Button>
            )}
            {etape === 'etablissements' && (
              <Button color="primary" isDisabled={!peutPasserAuPrincipal} onPress={() => setEtape('principal')}>
                Choisir le compte principal
              </Button>
            )}
            {etape === 'principal' && (
              <Button
                color="primary"
                isDisabled={!principal}
                startContent={<UserCog className="h-4 w-4" />}
                onPress={() => setEtape('recapitulatif')}
              >
                Voir ce qui va changer
              </Button>
            )}
            {etape === 'recapitulatif' && (
              <Button color="primary" isDisabled={!peutValider} isLoading={creer.isPending} onPress={valider}>
                Constituer le groupe
              </Button>
            )}
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function LigneEtablissement({
  etablissement,
  coche,
  onChange,
}: {
  etablissement: IEtablissementCandidat;
  coche: boolean;
  onChange: (coche: boolean) => void;
}) {
  const dejaGroupe = !!etablissement.groupeId;
  // Toute la ligne est le libellé de la case : le composant HeroUI rend déjà un
  // <label>, l'envelopper dans un second imbriquerait deux labels — HTML invalide,
  // et un clic qui bascule deux fois.
  return (
    <Checkbox
      isSelected={coche}
      onValueChange={onChange}
      classNames={{
        base: `m-0 max-w-full w-full items-center gap-3 rounded-medium border px-3 py-2 transition-colors ${
          coche ? 'border-primary bg-primary/5' : 'border-default-200 hover:bg-default-50'
        }`,
        label: 'w-full',
      }}
    >
      <div className="flex w-full items-center gap-3">
        <Building2 className="h-4 w-4 shrink-0 text-default-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{etablissement.nom ?? 'Établissement sans nom'}</p>
          <p className="truncate text-[11px] text-default-400">
            {[
              etablissement.commune,
              `${etablissement.comptes.length} compte${etablissement.comptes.length > 1 ? 's' : ''}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {dejaGroupe && (
          <Chip size="sm" variant="flat" color="warning">
            Déjà dans « {etablissement.groupeNom ?? 'un groupe'} »
          </Chip>
        )}
      </div>
    </Checkbox>
  );
}
