'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Chip,
  InputGroup,
  Modal,
  Radio,
  RadioGroup,
  TextField,
} from '@heroui-v3/react';

import { ChampTexte } from '@/components/commons/champs-formulaire';
import { cn } from '@/lib/utils';
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
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-5xl">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span>Constituer un groupe de partenaires</span>
                {/*
                 * Les etapes FRANCHIES et l'etape COURANTE se distinguaient par la seule
                 * intensite d'un meme bleu : `solid` contre `flat`. L'etape courante est
                 * maintenant la seule a porter une couleur.
                 */}
                <div className="flex flex-wrap items-center gap-2">
                  {ETAPES.map((e, index) => (
                    <Chip
                      color={index === indexEtape ? 'accent' : 'default'}
                      key={e.cle}
                      size="sm"
                      variant="soft"
                    >
                      <Chip.Label>
                        {index + 1}. {e.titre}
                      </Chip.Label>
                    </Chip>
                  ))}
                </div>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body>
          {etape === 'etablissements' && (
            <div className="space-y-3">
              <ChampTexte
                aide="Ce nom apparaîtra dans l'ERP et dans l'espace partenaire."
                label="Nom du groupe"
                onChange={setNom}
                placeholder="Ex. Groupe Chicken Nation"
                valeur={nom}
              />
              <TextField
                aria-label="Rechercher un établissement"
                onChange={setRecherche}
                value={recherche}
              >
                <InputGroup>
                  <InputGroup.Prefix>
                    <Search aria-hidden="true" className="size-4" />
                  </InputGroup.Prefix>
                  <InputGroup.Input placeholder="Nom d'établissement, commune…" />
                </InputGroup>
              </TextField>

              {isLoading ? (
                <div className="flex flex-col gap-2 py-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div className="h-14 animate-pulse rounded-lg bg-surface-secondary" key={i} />
                  ))}
                </div>
              ) : (
                <div className="max-h-88 space-y-1.5 overflow-y-auto pr-1">
                  {etablissements.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted">
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

              <p className="text-xs text-muted">
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
                  onChange={setPrincipal}
                  value={principal ?? ''}
                >
                  <div className="flex flex-col gap-1.5">
                    {comptesEligibles.map(({ compte, etablissements: rattachements }) => (
                      <div
                        className={cn(
                          'rounded-lg border px-3 py-2 transition-colors',
                          principal === compte.userId
                            ? 'border-accent bg-accent-soft/30'
                            : 'border-separator',
                        )}
                        key={compte.userId}
                      >
                        <Radio className="w-full items-start" value={compte.userId}>
                          <Radio.Content className="flex w-full items-start gap-3">
                            <Radio.Control className="mt-1">
                              <Radio.Indicator />
                            </Radio.Control>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="flex flex-wrap items-center justify-between gap-2">
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-medium text-foreground">
                                    {nomCompte(compte)}
                                  </span>
                                  <span className="block truncate text-xs text-muted">
                                    {compte.email ?? '—'}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <RoleChip role={compte.role} />
                                  <Chip size="sm" variant="soft">
                                    <Chip.Label>
                                      {rattachements.length} établissement
                                      {rattachements.length > 1 ? 's' : ''}
                                    </Chip.Label>
                                  </Chip>
                                </span>
                              </span>
                              <span className="mt-0.5 truncate text-xs text-muted">
                                {rattachements.join(' · ')}
                              </span>
                            </span>
                          </Radio.Content>
                        </Radio>
                      </div>
                    ))}
                  </div>
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
            </Modal.Body>

            <Modal.Footer className="justify-between">
              <Button onPress={onClose} variant="ghost">
                Annuler
              </Button>
              <div className="flex items-center gap-2">
                {etape !== 'etablissements' && (
                  <Button
                    onPress={() =>
                      setEtape(etape === 'recapitulatif' ? 'principal' : 'etablissements')
                    }
                    variant="outline"
                  >
                    Retour
                  </Button>
                )}
                {etape === 'etablissements' && (
                  <Button
                    isDisabled={!peutPasserAuPrincipal}
                    onPress={() => setEtape('principal')}
                    variant="primary"
                  >
                    Choisir le compte principal
                  </Button>
                )}
                {etape === 'principal' && (
                  <Button
                    isDisabled={!principal}
                    onPress={() => setEtape('recapitulatif')}
                    variant="primary"
                  >
                    <UserCog aria-hidden="true" className="size-4" />
                    Voir ce qui va changer
                  </Button>
                )}
                {etape === 'recapitulatif' && (
                  <Button
                    isDisabled={!peutValider}
                    isPending={creer.isPending}
                    onPress={valider}
                    variant="primary"
                  >
                    Constituer le groupe
                  </Button>
                )}
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
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
    <div
      className={cn(
        'w-full rounded-lg border px-3 py-2 transition-colors',
        coche ? 'border-accent bg-accent-soft/30' : 'border-separator hover:bg-surface-secondary',
      )}
    >
      <Checkbox className="w-full" isSelected={coche} onChange={onChange}>
        <Checkbox.Content className="w-full items-center gap-3">
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <span className="flex w-full items-center gap-3">
            <Building2 aria-hidden="true" className="size-4 shrink-0 text-muted" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {etablissement.nom ?? 'Établissement sans nom'}
              </span>
              <span className="block truncate text-xs text-muted">
                {[
                  etablissement.commune,
                  `${etablissement.comptes.length} compte${etablissement.comptes.length > 1 ? 's' : ''}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            {dejaGroupe && (
              /* Un etablissement deja groupe ne peut pas etre repris : l'ambre le dit. */
              <Chip color="warning" size="sm" variant="soft">
                <Chip.Label>Déjà dans « {etablissement.groupeNom ?? 'un groupe'} »</Chip.Label>
              </Chip>
            )}
          </span>
        </Checkbox.Content>
      </Checkbox>
    </div>
  );
}
