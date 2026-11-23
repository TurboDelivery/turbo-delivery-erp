'use client';

import { Badge, Button, ComboBox, Input, Label, ListBox, Modal, NumberField } from '@heroui-v3/react';
import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import EtatErreur from '@/components/commons/EtatErreur';
import { ChampListe, ChampListeMultiple } from '@/components/commons/champs-formulaire';
import { DeliveryMan } from '@/types/models';
import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import {
  useCreerProgrammeMutation,
  useModifierProgrammeMutation,
} from '@/features/turboys/queries/programme.query';
import {
  COMPLEMENT_VIDE,
  IJourProgramme,
  IProgramme,
} from '@/features/turboys/types/programme.types';
import { carburantPrevisionnel } from '@/features/turboys/utils/carburant.utils';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import { formatMontant } from '@/utils/format.utils';

import {
  anomaliesJours,
  defaultJours,
  dureeMinutes,
  joursAvecDates,
  normaliserJours,
  WeeklyJoursEditor,
} from './weekly-jours-editor';

const nomLivreur = (l: {
  matricule?: string;
  nom: string | null;
  prenoms: string | null;
  telephone?: string;
}) => `${l.prenoms ?? ''} ${l.nom ?? ''}`.trim() || l.telephone || l.matricule || 'Livreur';

const ENVOYE = ['ACCEPTE', 'NOTIFIE', 'REFUSE'];

/**
 * Créer ou modifier le programme hebdomadaire d'un livreur (SPEC §6.5).
 *
 * <h3>Ce qui change</h3>
 *
 * <p>Il n'y avait AUCUN total : ni jours travaillés, ni heures, ni carburant de la
 * semaine. On saisissait sept jours sans jamais voir ce qu'ils faisaient ensemble. Une
 * barre de résumé, sous l'en-tête, les donne et se met à jour en direct.</p>
 *
 * <p>Le bandeau d'avertissement était affiché EN PERMANENCE sur un programme envoyé, même
 * quand on ne changeait que le carburant, qui précisément ne renvoie rien. Il n'apparaît
 * plus que quand une modification le mérite, en pied, et il dit laquelle des deux
 * situations on est en train de créer.</p>
 *
 * <p>Le bouton d'enregistrement disait « Enregistrer » sans dire ce qui allait se passer.
 * Il dit maintenant « Enregistrer et renvoyer au livreur » quand c'est le cas.</p>
 *
 * <h3>Le site de base</h3>
 *
 * <p>RG-S01 le voulait en lecture seule, modifiable depuis la seule fiche du livreur. Le
 * propriétaire a tranché autrement le 23/11 : la base reste la base toute la semaine,
 * mais si elle change réellement en cours de semaine, on doit pouvoir la changer ici, en
 * brouillon comme en publié. Le changer renvoie le programme au livreur, comme un
 * changement de sites desservis (RG-S07) : il doit savoir où il se présente.</p>
 */
export function ProgrammeFormModal({
  anneeInitiale,
  isOpen,
  onOpenChange,
  onSurplusJour,
  programme,
  semaineInitiale,
}: {
  anneeInitiale: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Ouvrir la saisie d'un surplus sur ce jour (§7.2).
   *
   * <p>Absent = le lien n'apparaît pas. C'est le cas d'un profil non habilité (RG-C03)
   * et celui d'une création : un surplus se donne sur une semaine qui existe.</p>
   */
  onSurplusJour?: (jour: string) => void;
  programme?: IProgramme | null;
  semaineInitiale: number;
}) {
  const isEdit = !!programme;
  const livreursQuery = useLivreursListQuery();
  const restaurantsQuery = useQuery({
    queryFn: getAllRestaurants,
    queryKey: ['restaurants', 'all', 'programmes'],
    staleTime: 5 * 60 * 1000,
  });
  const restaurants = React.useMemo(
    () => (restaurantsQuery.data ?? []).map((r) => ({ id: r.id, nom: r.nomEtablissement })),
    [restaurantsQuery.data],
  );
  const nomSite = React.useCallback(
    (id: string) => restaurants.find((r) => r.id === id)?.nom ?? id,
    [restaurants],
  );

  const [livreurId, setLivreurId] = React.useState('');
  const [annee, setAnnee] = React.useState(anneeInitiale);
  const [semaine, setSemaine] = React.useState(semaineInitiale);
  const [jours, setJours] = React.useState<IJourProgramme[]>(defaultJours());
  const [siteId, setSiteId] = React.useState('');
  const [sitesDesservis, setSitesDesservis] = React.useState<string[]>([]);
  const [basesGerees, setBasesGerees] = React.useState<string[]>([]);
  const [sitesParJour, setSitesParJour] = React.useState<Record<string, string[]>>({});

  // Le superviseur-livreur n'a ni site de base ni sites desservis : il a des bases gérées
  // (RG-V01). Le type vient de la fiche, pas du programme, et il est déjà porté par
  // livreurs.type_livreur depuis V56 — on ne crée pas un second marqueur.
  const livreurChoisi = (livreursQuery.data ?? []).find((l: DeliveryMan) => l.id === livreurId);
  const estSuperviseur =
    (isEdit ? programme?.typeLivreur : (livreurChoisi as { typeLivreur?: string } | undefined)?.typeLivreur) ===
    'SUPERVISEUR_LIVREUR';

  React.useEffect(() => {
    if (!isOpen) return;
    if (programme) {
      const c = programme.complement ?? COMPLEMENT_VIDE;
      setJours(normaliserJours(programme.jours));
      setSiteId(programme.siteId ?? '');
      setSitesDesservis(c.sitesDesservis ?? []);
      setBasesGerees(c.basesGerees ?? []);
      setSitesParJour(c.sitesParJour ?? {});
    } else {
      setLivreurId('');
      setAnnee(anneeInitiale);
      setSemaine(semaineInitiale);
      setJours(defaultJours());
      setSiteId('');
      setSitesDesservis([]);
      setBasesGerees([]);
      setSitesParJour({});
    }
  }, [isOpen, programme, anneeInitiale, semaineInitiale]);

  const creer = useCreerProgrammeMutation(() => onOpenChange(false));
  const modifier = useModifierProgrammeMutation(() => onOpenChange(false));
  const isLoading = creer.isPending || modifier.isPending;

  /** Les sites cochables d'un jour : la base d'abord, puis les desservis (ou les bases gérées). */
  const sitesDisponibles = React.useMemo(() => {
    if (estSuperviseur) {
      return basesGerees.map((id) => ({ id, nom: nomSite(id) }));
    }
    const liste = siteId ? [{ id: siteId, nom: nomSite(siteId) }] : [];
    return [...liste, ...sitesDesservis.filter((s) => s !== siteId).map((id) => ({ id, nom: nomSite(id) }))];
  }, [estSuperviseur, basesGerees, siteId, sitesDesservis, nomSite]);

  // §6.5 — la barre de résumé, en direct : « 6 jours · 78 h · 30 000 FCFA · Yopougon + Angré ».
  const actifs = jours.filter((j) => j.actif);
  const heures = Math.round(actifs.reduce((n, j) => n + dureeMinutes(j), 0) / 60);
  const totalCarburant = carburantPrevisionnel(jours);
  const resumeSites = sitesDisponibles.map((s) => s.nom).join(' + ');

  const anomalies = anomaliesJours(jours, sitesParJour, sitesDisponibles.length);
  const bloquantes = anomalies.filter((a) => a.bloquante);

  // Ce qui a changé décide du libellé du bouton et du message du pied : le carburant seul
  // ne renvoie rien au livreur, tout le reste si (RG-S07).
  const dejaEnvoye = isEdit && ENVOYE.includes(programme?.statut ?? '');
  const joursInitiaux = React.useMemo(() => normaliserJours(programme?.jours), [programme]);
  const planningChange = React.useMemo(() => {
    if (!isEdit) return false;
    const base = programme?.complement ?? COMPLEMENT_VIDE;
    if (siteId !== (programme?.siteId ?? '')) return true;
    if (!memeListe(sitesDesservis, base.sitesDesservis ?? [])) return true;
    if (!memeListe(basesGerees, base.basesGerees ?? [])) return true;
    if (!memeCarte(sitesParJour, base.sitesParJour ?? {})) return true;
    return jours.some((j, i) => {
      const a = joursInitiaux[i];
      if (!a) return j.actif;
      if (a.actif !== j.actif) return true;
      if (!j.actif) return false;
      if (a.debut !== j.debut || a.fin !== j.fin) return true;
      return !memeListe((a.postes ?? []).map((p) => p.restaurantId), (j.postes ?? []).map((p) => p.restaurantId));
    });
  }, [isEdit, programme, siteId, sitesDesservis, basesGerees, sitesParJour, jours, joursInitiaux]);

  const renvoie = dejaEnvoye && planningChange;

  const onSubmit = () => {
    if (bloquantes.length > 0) {
      toast.error('Corrigez les lignes en rouge avant d’enregistrer.');
      return;
    }
    if (isEdit) {
      const siteChange = siteId !== (programme!.siteId ?? '');
      modifier.mutate({
        basesGerees: estSuperviseur ? basesGerees : undefined,
        id: programme!.id,
        jours: joursAvecDates(jours, programme!.annee, programme!.semaine),
        siteModifie: siteChange,
        sitePartnerId: siteChange ? siteId || null : undefined,
        sitesDesservis: estSuperviseur ? undefined : sitesDesservis,
        sitesParJour,
      });
      return;
    }
    if (!livreurId) {
      toast.error('Sélectionnez un livreur.');
      return;
    }
    // La semaine 0 existe dans la convention du backend : les premiers jours de janvier
    // tombés avant la semaine qui contient le 4.
    if (annee < 2020 || semaine < 0 || semaine > 53) {
      toast.error('Année ou semaine invalide.');
      return;
    }
    creer.mutate({
      annee,
      basesGerees: estSuperviseur ? basesGerees : undefined,
      jours: joursAvecDates(jours, annee, semaine),
      livreurId,
      semaine,
      sitePartnerId: siteId || null,
      sitesDesservis: estSuperviseur ? undefined : sitesDesservis,
      sitesParJour,
    });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-5xl">
            <Modal.Header>
              <div className="flex flex-col gap-0.5">
                <Modal.Heading>
                  {isEdit ? 'Modifier le programme' : 'Nouveau programme hebdomadaire'}
                </Modal.Heading>
                {isEdit && (
                  <span className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    <span>
                      {programme!.livreurNom ?? 'Livreur'} — semaine {programme!.semaine} / {programme!.annee}
                    </span>
                    {programme!.statut && (
                      <Badge variant={dejaEnvoye ? 'primary' : 'secondary'}>
                        {libelleEtat(programme!)}
                      </Badge>
                    )}
                  </span>
                )}
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              {/* §6.5 — la barre de résumé, fixe sous l'en-tête. Elle répond à « combien
                  coûte cette semaine » sans faire défiler sept jours. */}
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-md bg-surface-secondary px-3 py-2 text-sm">
                <span className="font-semibold tabular-nums text-foreground">
                  {actifs.length} jour{actifs.length > 1 ? 's' : ''}
                </span>
                <span className="tabular-nums text-muted">{heures} h</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {totalCarburant === null ? 'Aucun carburant saisi' : formatMontant(totalCarburant)}
                </span>
                {resumeSites && <span className="text-muted">{resumeSites}</span>}
              </div>

              {!isEdit && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {livreursQuery.isError ? (
                    <div className="sm:col-span-3">
                      <EtatErreur
                        enCours={livreursQuery.isFetching}
                        onReessayer={() => void livreursQuery.refetch()}
                        quoi="la liste des livreurs"
                      />
                    </div>
                  ) : (
                    <ComboBox
                      className="sm:col-span-3"
                      isDisabled={isLoading}
                      onSelectionChange={(key) => setLivreurId(key == null ? '' : String(key))}
                      selectedKey={livreurId || null}
                    >
                      <Label>Livreur</Label>
                      <ComboBox.InputGroup>
                        <Input placeholder="Rechercher un livreur, un matricule, un numéro" />
                        <ComboBox.Trigger />
                      </ComboBox.InputGroup>
                      <ComboBox.Popover>
                        <ListBox items={livreursQuery.data ?? []}>
                          {(l: DeliveryMan) => (
                            <ListBox.Item
                              id={l.id}
                              textValue={`${nomLivreur(l)}${l.matricule ? ` ${l.matricule}` : ''}${l.telephone ? ` ${l.telephone}` : ''}`}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{nomLivreur(l)}</span>
                                {(l.matricule || l.telephone) && (
                                  <span className="text-xs text-muted">
                                    {[l.matricule, l.telephone].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                              </div>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          )}
                        </ListBox>
                      </ComboBox.Popover>
                    </ComboBox>
                  )}

                  <NumberField
                    formatOptions={{ useGrouping: false }}
                    isDisabled={isLoading}
                    minValue={2020}
                    onChange={setAnnee}
                    value={annee}
                  >
                    <Label>Année</Label>
                    <NumberField.Group>
                      <NumberField.DecrementButton />
                      <NumberField.Input />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                  </NumberField>

                  <NumberField
                    isDisabled={isLoading}
                    maxValue={53}
                    minValue={0}
                    onChange={setSemaine}
                    value={semaine}
                  >
                    <Label>Semaine</Label>
                    <NumberField.Group>
                      <NumberField.DecrementButton />
                      <NumberField.Input />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                  </NumberField>
                </div>
              )}

              {restaurantsQuery.isError && (
                <EtatErreur
                  enCours={restaurantsQuery.isFetching}
                  onReessayer={() => void restaurantsQuery.refetch()}
                  quoi="la liste des partenaires"
                />
              )}

              {/* §3.1 — site de base et sites desservis sur une même ligne ; empilés sur
                  téléphone. Chez un superviseur-livreur, les deux sont remplacés par un
                  seul champ « Bases gérées » (RG-V01). */}
              {estSuperviseur ? (
                <div className="flex flex-col gap-1">
                  <ChampListeMultiple
                    label="Bases gérées"
                    onChange={setBasesGerees}
                    options={restaurants.map((r) => ({ label: r.nom, value: r.id }))}
                    placeholder="Rechercher une base"
                    valeurs={basesGerees}
                  />
                  <p className="text-xs text-muted">
                    Un superviseur-livreur n’est pas rattaché à une base : il en gère plusieurs. Sans
                    base, son programme reste « à compléter » et ne peut pas être publié.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <ChampListe
                      estDesactive={isLoading || restaurantsQuery.isLoading}
                      label="Site de base"
                      messageListeVide={
                        restaurantsQuery.isError ? 'La liste des partenaires n’a pas pu être lue.' : undefined
                      }
                      onChange={setSiteId}
                      options={restaurants.map((r) => ({ label: r.nom, value: r.id }))}
                      placeholder={restaurantsQuery.isLoading ? 'Chargement…' : 'Celui de la fiche du livreur'}
                      valeur={siteId}
                    />
                    <p className="flex items-start gap-1 text-xs text-muted">
                      <Lock aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
                      <span>
                        La base reste la base toute la semaine. La changer ici ne touche pas la fiche
                        du livreur, et renvoie le programme pour acceptation.
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <ChampListeMultiple
                      label="Sites desservis"
                      onChange={(ids) => setSitesDesservis(ids.filter((id) => id !== siteId))}
                      options={restaurants
                        .filter((r) => r.id !== siteId)
                        .map((r) => ({ label: r.nom, value: r.id }))}
                      placeholder="Rechercher un site de renfort"
                      valeurs={sitesDesservis}
                    />
                    <p className="text-xs text-muted">
                      Ne valent que pour cette semaine. Aucun site desservi est permis : le livreur ne
                      travaille alors que sur sa base.
                    </p>
                  </div>
                </div>
              )}

              <WeeklyJoursEditor
                basesGerees={estSuperviseur ? basesGerees : undefined}
                disabled={isLoading}
                onChange={setJours}
                onSitesParJourChange={setSitesParJour}
                onSurplusJour={isEdit ? onSurplusJour : undefined}
                restaurants={restaurants}
                sitesDisponibles={sitesDisponibles}
                sitesParJour={sitesParJour}
                surplusParJour={programme?.complement?.surplusParJour}
                value={jours}
              />
            </Modal.Body>

            <Modal.Footer className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {/* §6.5 — l'avertissement est CONTEXTUEL et vit en pied, à côté du bouton
                  qu'il concerne. Le bandeau permanent d'avant s'affichait même quand on
                  ne changeait que le carburant, qui ne renvoie précisément rien. */}
              {dejaEnvoye && (
                <p className={`flex-1 text-xs ${renvoie ? 'text-warning' : 'text-muted'}`}>
                  {renvoie
                    ? 'Ces changements renverront le programme au livreur pour acceptation.'
                    : 'Carburant seul : pas de renvoi au livreur.'}
                </p>
              )}
              {bloquantes.length > 0 && (
                <p className="flex-1 text-xs text-danger">
                  {bloquantes.length} ligne{bloquantes.length > 1 ? 's' : ''} à corriger.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button isDisabled={isLoading} onPress={() => onOpenChange(false)} variant="ghost">
                  Annuler
                </Button>
                <Button
                  isDisabled={bloquantes.length > 0}
                  isPending={isLoading}
                  onPress={onSubmit}
                  variant="primary"
                >
                  {isEdit ? (renvoie ? 'Enregistrer et renvoyer au livreur' : 'Enregistrer') : 'Créer le brouillon'}
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function libelleEtat(p: IProgramme): string {
  if (p.statut === 'ACCEPTE') return 'Accepté';
  if (p.statut === 'REFUSE') return 'Refusé';
  if (p.statut === 'NOTIFIE') return 'Envoyé, en attente';
  if (p.statut === 'PLANIFIE') return 'À publier';
  return 'Brouillon';
}

const memeListe = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

const memeCarte = (a: Record<string, string[]>, b: Record<string, string[]>) => {
  const cles = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const c of cles) {
    if (!memeListe(a[c] ?? [], b[c] ?? [])) return false;
  }
  return true;
};
