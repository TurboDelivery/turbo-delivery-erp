'use client';

import { ComboBox, Input, Label, ListBox, TextField } from '@heroui-v3/react';
import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useAffecterSiteMutation } from '@/features/turboys/queries/programme.query';
import type { IProgramme } from '@/features/turboys/types/programme.types';

/**
 * AFFECTER UN LIVREUR À UN AUTRE SITE, EN COURS D'OPÉRATIONS (§3.3, RG-S08).
 *
 * <p>La semaine est publiée et commencée, un titulaire manque quelque part, et il faut y
 * envoyer quelqu'un tout de suite. Rouvrir « Modifier le programme » pour cela serait
 * disproportionné : on n'a pas à revoir sept jours d'horaires pour ajouter un site à un
 * mardi, et surtout cela ferait repasser le programme en « à publier », donc demanderait
 * une nouvelle validation pour une décision déjà prise sur le terrain.</p>
 *
 * <p><b>Le motif est obligatoire.</b> Ce n'est pas de la paperasse : c'est la seule chose
 * qui, trois semaines plus tard, dira si ce renfort était un dépannage ou le signe qu'un
 * site est durablement sous-doté. Le serveur le refuse vide, l'écran le dit avant.</p>
 */

const JOURS = [
  { cle: 'LUNDI', libelle: 'Lundi' },
  { cle: 'MARDI', libelle: 'Mardi' },
  { cle: 'MERCREDI', libelle: 'Mercredi' },
  { cle: 'JEUDI', libelle: 'Jeudi' },
  { cle: 'VENDREDI', libelle: 'Vendredi' },
  { cle: 'SAMEDI', libelle: 'Samedi' },
  { cle: 'DIMANCHE', libelle: 'Dimanche' },
];

export interface AffectationSiteDialogProps {
  programme: IProgramme | null;
  /** Tous les partenaires : le site d'affectation peut être n'importe lequel. */
  sites: { id: string; nom: string }[];
  /** Jour et site pré-remplis quand le geste vient d'une case de la vue Couverture. */
  prefill?: { jour?: string; siteId?: string } | null;
  onFermer: () => void;
}

export function AffectationSiteDialog({ programme, sites, prefill, onFermer }: AffectationSiteDialogProps) {
  const affecter = useAffecterSiteMutation(onFermer);

  const [siteId, setSiteId] = React.useState('');
  const [jour, setJour] = React.useState('');
  const [motif, setMotif] = React.useState('');

  /*
   * Les jours TRAVAILLÉS seulement. Le serveur refuse un jour de repos — « activez
   * d'abord le jour dans le programme » — et le proposer ici ne servirait qu'à faire
   * découvrir ce refus après le clic.
   */
  const joursTravailles = React.useMemo(() => {
    const actifs = new Set((programme?.jours ?? []).filter((j) => j.actif).map((j) => j.jour));
    return JOURS.filter((j) => actifs.has(j.cle));
  }, [programme]);

  // À l'ouverture : ce que la case cliquée disait, sinon le premier jour travaillé.
  React.useEffect(() => {
    if (!programme) return;
    setSiteId(prefill?.siteId ?? '');
    setJour(prefill?.jour && joursTravailles.some((j) => j.cle === prefill.jour) ? prefill.jour : (joursTravailles[0]?.cle ?? ''));
    setMotif('');
  }, [programme, prefill, joursTravailles]);

  const valide = Boolean(siteId) && Boolean(jour) && motif.trim().length > 0;

  return (
    <FenetreAction
      actionInactive={!valide}
      enAttente={affecter.isPending}
      libelleAction="Affecter"
      onAction={() => {
        if (!programme || !valide) return;
        affecter.mutate({ id: programme.id, payload: { jour, motif: motif.trim(), siteId } });
      }}
      onFermer={onFermer}
      ouvert={!!programme}
      titre={`Affecter ${programme?.livreurNom ?? 'ce livreur'} à un autre site`}
    >
      <div className="flex flex-col gap-4">
        {joursTravailles.length === 0 ? (
          <p className="text-sm text-danger-soft-foreground">
            Ce livreur n’a aucun jour travaillé cette semaine. Activez d’abord un jour dans son programme.
          </p>
        ) : (
          <>
            <ComboBox onSelectionChange={(c) => setJour(String(c ?? ''))} selectedKey={jour || null}>
              <Label>Jour</Label>
              <ComboBox.InputGroup>
                <Input placeholder="Choisir un jour" />
                <ComboBox.Trigger />
              </ComboBox.InputGroup>
              <ComboBox.Popover>
                <ListBox items={joursTravailles}>
                  {(o: { cle: string; libelle: string }) => (
                    <ListBox.Item id={o.cle} textValue={o.libelle}>
                      {o.libelle}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  )}
                </ListBox>
              </ComboBox.Popover>
            </ComboBox>

            <ComboBox onSelectionChange={(c) => setSiteId(String(c ?? ''))} selectedKey={siteId || null}>
              <Label>Site</Label>
              <ComboBox.InputGroup>
                <Input placeholder="Chercher un site" />
                <ComboBox.Trigger />
              </ComboBox.InputGroup>
              <ComboBox.Popover>
                <ListBox items={sites}>
                  {(o: { id: string; nom: string }) => (
                    <ListBox.Item id={o.id} textValue={o.nom}>
                      {o.nom}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  )}
                </ListBox>
              </ComboBox.Popover>
            </ComboBox>

            <TextField onChange={setMotif} value={motif}>
              <Label>Motif</Label>
              <Input placeholder="Renfort, absence d’un titulaire, pic d’activité…" />
            </TextField>
            <p className="-mt-2 text-xs text-muted">
              Motif obligatoire. C’est ce qui dira plus tard si ce renfort était un dépannage ou un manque
              durable.
            </p>

            <p className="text-xs text-muted">
              Le programme reste publié : le reste de la semaine ne bouge pas. Le livreur est prévenu dans
              l’application.
            </p>
          </>
        )}
      </div>
    </FenetreAction>
  );
}
