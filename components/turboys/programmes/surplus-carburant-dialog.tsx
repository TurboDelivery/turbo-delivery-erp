'use client';

import { Button, ComboBox, Input, Label, ListBox, NumberField, Separator, TextField } from '@heroui-v3/react';
import { Plus } from 'lucide-react';
import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  useAccorderSurplusMutation,
  useAnnulerSurplusMutation,
  useModifierSurplusMutation,
  useSurplusQuery,
} from '@/features/turboys/queries/programme.query';
import {
  COMPLEMENT_VIDE,
  MOTIFS_SURPLUS,
  type IProgramme,
  type ISurplus,
  type MotifSurplus,
} from '@/features/turboys/types/programme.types';
import { cn } from '@/lib/utils';
import { formatMontant } from '@/utils/format.utils';

/**
 * LE SURPLUS DE CARBURANT d'un programme (SPEC §7.2).
 *
 * <h3>Une fenêtre qui montre d'abord, et saisit ensuite</h3>
 *
 * <p>Elle s'ouvre sur ce qui a DÉJÀ été accordé cette semaine, annulés compris et barrés
 * (RG-C07), puis sur le formulaire. L'ordre compte : accorder un surplus sans voir ceux
 * du même jour, c'est en donner deux fois. Et un surplus annulé qu'on ne verrait pas
 * serait réaccordé pour la même raison.</p>
 *
 * <p><b>La dotation prévue n'apparaît pas comme modifiable</b>, et c'est le point de
 * toute la mécanique : elle ne bouge pas (RG-C01). La fenêtre la rappelle en gris, pour
 * que le montant saisi se lise comme un ajout et non comme un remplacement.</p>
 */

const JOURS: { cle: string; libelle: string }[] = [
  { cle: 'LUNDI', libelle: 'Lundi' },
  { cle: 'MARDI', libelle: 'Mardi' },
  { cle: 'MERCREDI', libelle: 'Mercredi' },
  { cle: 'JEUDI', libelle: 'Jeudi' },
  { cle: 'VENDREDI', libelle: 'Vendredi' },
  { cle: 'SAMEDI', libelle: 'Samedi' },
  { cle: 'DIMANCHE', libelle: 'Dimanche' },
];

const libelleJour = (cle: string) => JOURS.find((j) => j.cle === cle)?.libelle ?? cle;
const libelleMotif = (m: string) => MOTIFS_SURPLUS.find((x) => x.value === m)?.label ?? m;

/** Le jour d'aujourd'hui, proposé par défaut (§7.2 : « jour d'aujourd'hui par défaut »). */
function jourCourant(): string {
  // getDay() : 0 = dimanche. JOURS commence au lundi.
  const n = new Date().getDay();
  return JOURS[(n + 6) % 7].cle;
}

/** Une ligne de l'historique : accordé, ou annulé et barré. */
function LigneSurplus({
  nomSite,
  onAnnuler,
  onModifier,
  s,
}: {
  nomSite: Map<string, string>;
  onAnnuler: () => void;
  onModifier: () => void;
  s: ISurplus;
}) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1.5">
      <span className={cn('text-sm font-medium tabular-nums', s.annule ? 'text-muted line-through' : 'text-warning-soft-foreground')}>
        {formatMontant(s.montant)}
      </span>
      <span className={cn('text-sm', s.annule && 'text-muted line-through')}>{libelleJour(s.jour)}</span>
      <span className="text-xs text-muted">
        {libelleMotif(s.motif)}
        {s.siteId ? ` · ${nomSite.get(s.siteId) ?? 'site inconnu'}` : ''}
        {s.commentaire ? ` · ${s.commentaire}` : ''}
      </span>

      {s.annule ? (
        // La raison de l'annulation se LIT. Cachée dans une infobulle, elle n'explique
        // plus rien à celui qui relit la semaine un mois après.
        <span className="w-full text-xs text-muted">Annulé{s.motifAnnulation ? ` : ${s.motifAnnulation}` : ''}</span>
      ) : (
        <span className="ms-auto flex gap-1">
          <Button onPress={onModifier} size="sm" variant="ghost">
            Modifier
          </Button>
          <Button onPress={onAnnuler} size="sm" variant="ghost">
            Annuler
          </Button>
        </span>
      )}
    </li>
  );
}

export interface SurplusCarburantDialogProps {
  programme: IProgramme | null;
  /** Tous les partenaires : le surplus peut viser un site hors des sites du jour. */
  sites: { id: string; nom: string }[];
  /** Jour pré-rempli quand le geste vient d'une ligne de jour. */
  jourInitial?: string | null;
  onFermer: () => void;
}

export function SurplusCarburantDialog({ programme, sites, jourInitial, onFermer }: SurplusCarburantDialogProps) {
  const surplusQuery = useSurplusQuery(programme?.id);
  const accorder = useAccorderSurplusMutation();
  const modifier = useModifierSurplusMutation();
  const annuler = useAnnulerSurplusMutation();

  const [jour, setJour] = React.useState('');
  const [siteId, setSiteId] = React.useState('');
  const [montant, setMontant] = React.useState<number | null>(null);
  const [motif, setMotif] = React.useState<MotifSurplus>('RENFORT_AUTRE_SITE');
  const [commentaire, setCommentaire] = React.useState('');
  /** Le surplus en cours de modification, ou `null` pour une saisie neuve. */
  const [enEdition, setEnEdition] = React.useState<ISurplus | null>(null);

  const nomSite = React.useMemo(() => new Map(sites.map((s) => [s.id, s.nom])), [sites]);
  const complement = programme?.complement ?? COMPLEMENT_VIDE;

  /** Les jours travaillés : le serveur refuse les autres, autant ne pas les proposer. */
  const joursTravailles = React.useMemo(() => {
    const actifs = new Set((programme?.jours ?? []).filter((j) => j.actif).map((j) => j.jour));
    return JOURS.filter((j) => actifs.has(j.cle));
  }, [programme]);

  const reinitialiser = React.useCallback(() => {
    const defaut = jourInitial && joursTravailles.some((j) => j.cle === jourInitial) ? jourInitial : null;
    const aujourdhui = joursTravailles.some((j) => j.cle === jourCourant()) ? jourCourant() : null;
    setJour(defaut ?? aujourdhui ?? joursTravailles[0]?.cle ?? '');
    setSiteId('');
    setMontant(null);
    setMotif('RENFORT_AUTRE_SITE');
    setCommentaire('');
    setEnEdition(null);
  }, [jourInitial, joursTravailles]);

  React.useEffect(() => {
    if (programme) reinitialiser();
  }, [programme, reinitialiser]);

  /*
   * Le site proposé par défaut : les sites du jour choisi d'abord, la base ensuite
   * (RG-C02). Il reste modifiable — un renfort se paie sur le site où l'on renforce, qui
   * n'est pas toujours dans les sites déjà cochés.
   */
  const sitesSuggeres = React.useMemo(() => {
    const duJour = complement.sitesParJour?.[jour] ?? [];
    const base = programme?.siteId ? [programme.siteId] : [];
    return Array.from(new Set([...duJour, ...base, ...(complement.sitesDesservis ?? [])]));
  }, [complement, jour, programme]);

  React.useEffect(() => {
    if (!siteId && sitesSuggeres.length > 0) setSiteId(sitesSuggeres[0]);
  }, [siteId, sitesSuggeres]);

  /** La dotation prévue du jour choisi : elle ne bouge pas, elle se rappelle. */
  const dotationDuJour = React.useMemo(
    () => (programme?.jours ?? []).find((j) => j.jour === jour)?.montantCarburant ?? 0,
    [jour, programme],
  );

  const surplusDuJour = React.useMemo(
    () => (surplusQuery.data ?? []).filter((s) => s.jour === jour && !s.annule),
    [jour, surplusQuery.data],
  );
  const dejaCeJour = surplusDuJour.reduce((n, s) => n + (s.montant ?? 0), 0);

  const valide =
    Boolean(jour) &&
    Boolean(siteId) &&
    (montant ?? 0) > 0 &&
    (motif !== 'AUTRE' || commentaire.trim().length > 0);

  const enregistrer = () => {
    if (!programme || !valide) return;
    const payload = {
      commentaire: commentaire.trim() || null,
      jour,
      montant: montant!,
      motif,
      siteId,
    };
    if (enEdition) {
      modifier.mutate({ id: programme.id, payload, surplusId: enEdition.id }, { onSuccess: reinitialiser });
    } else {
      accorder.mutate({ id: programme.id, payload }, { onSuccess: reinitialiser });
    }
  };

  const demanderAnnulation = (s: ISurplus) => {
    if (!programme) return;
    const motifAnnulation = window.prompt(
      `Annuler le surplus de ${formatMontant(s.montant)} du ${libelleJour(s.jour).toLowerCase()} ?\n\n`
        + 'Le surplus ne sera pas effacé : il restera visible, barré, avec ce motif.\n\nMotif de l’annulation :',
    );
    // Motif vide = pas d'annulation. La base le refuserait de toute façon, mais autant
    // ne pas faire l'aller-retour pour l'apprendre.
    if (!motifAnnulation || !motifAnnulation.trim()) return;
    annuler.mutate({ id: programme.id, motif: motifAnnulation.trim(), surplusId: s.id });
  };

  const tous = surplusQuery.data ?? [];

  return (
    <FenetreAction
      actionInactive={!valide}
      enAttente={accorder.isPending || modifier.isPending}
      libelleAction={enEdition ? 'Enregistrer la modification' : 'Accorder le surplus'}
      libelleFermer="Fermer"
      onAction={enregistrer}
      onFermer={onFermer}
      ouvert={!!programme}
      titre={`Surplus carburant — ${programme?.livreurNom ?? 'ce livreur'}`}
    >
      <div className="flex flex-col gap-4">
        {/* CE QUI A DÉJÀ ÉTÉ ACCORDÉ, d'abord : en accorder un sans voir les autres,
            c'est en donner deux fois. */}
        {tous.length > 0 && (
          <>
            <div>
              <p className="mb-1 text-xs font-medium text-muted">Déjà accordé cette semaine</p>
              <ul className="divide-y divide-separator">
                {tous.map((s) => (
                  <LigneSurplus
                    key={s.id}
                    nomSite={nomSite}
                    onAnnuler={() => demanderAnnulation(s)}
                    onModifier={() => {
                      setEnEdition(s);
                      setJour(s.jour);
                      setSiteId(s.siteId);
                      setMontant(s.montant);
                      setMotif(s.motif as MotifSurplus);
                      setCommentaire(s.commentaire ?? '');
                    }}
                    s={s}
                  />
                ))}
              </ul>
            </div>
            <Separator />
          </>
        )}

        {joursTravailles.length === 0 ? (
          <p className="text-sm text-danger-soft-foreground">
            Ce livreur n’a aucun jour travaillé cette semaine. Un surplus ne se donne que sur un jour travaillé.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
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

              <NumberField minValue={1} onChange={(v) => setMontant(Number.isFinite(v) ? v : null)} value={montant ?? Number.NaN}>
                <Label>Montant du surplus (FCFA)</Label>
                <Input placeholder="2 000" />
              </NumberField>
            </div>

            {/* ⚠ La dotation est RAPPELÉE, jamais modifiable ici (RG-C01). Sans ce
                rappel, le montant saisi se lit comme un remplacement. */}
            <p className="-mt-1 text-xs text-muted">
              Dotation prévue {libelleJour(jour).toLowerCase()} : {formatMontant(dotationDuJour)} — elle ne change pas.
              {dejaCeJour > 0 ? ` Déjà ${formatMontant(dejaCeJour)} de surplus ce jour-là.` : ''}
              {(montant ?? 0) > 0 ? ` Total du jour : ${formatMontant(dotationDuJour + dejaCeJour + (montant ?? 0))}.` : ''}
            </p>

            <ComboBox onSelectionChange={(c) => setSiteId(String(c ?? ''))} selectedKey={siteId || null}>
              <Label>Site concerné</Label>
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

            <ComboBox onSelectionChange={(c) => setMotif(String(c ?? 'AUTRE') as MotifSurplus)} selectedKey={motif}>
              <Label>Motif</Label>
              <ComboBox.InputGroup>
                <Input placeholder="Choisir un motif" />
                <ComboBox.Trigger />
              </ComboBox.InputGroup>
              <ComboBox.Popover>
                <ListBox items={MOTIFS_SURPLUS}>
                  {(o: { label: string; value: string }) => (
                    <ListBox.Item id={o.value} textValue={o.label}>
                      {o.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  )}
                </ListBox>
              </ComboBox.Popover>
            </ComboBox>

            <TextField onChange={setCommentaire} value={commentaire}>
              <Label>{motif === 'AUTRE' ? 'Précision (obligatoire)' : 'Commentaire'}</Label>
              <Input placeholder={motif === 'AUTRE' ? 'Dire de quoi il s’agit' : 'Facultatif'} />
            </TextField>

            {enEdition ? (
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs text-muted">
                  Modification du surplus de {formatMontant(enEdition.montant)} du {libelleJour(enEdition.jour).toLowerCase()}.
                </p>
                <Button onPress={reinitialiser} size="sm" variant="ghost">
                  <Plus aria-hidden="true" className="size-4" />
                  Accorder un nouveau surplus
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted">
                Le programme reste publié : le livreur n’a pas à réaccepter sa semaine. Il reçoit une notification.
              </p>
            )}
          </>
        )}
      </div>
    </FenetreAction>
  );
}
