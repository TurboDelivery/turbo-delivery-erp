'use client';

import { Button, Input, Label, NumberField, Separator, TextField } from '@heroui-v3/react';
import { Check, Eye, ExternalLink, RotateCcw } from 'lucide-react';
import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  useRejeterPreuveMutation,
  useValiderPreuveMutation,
} from '@/features/turboys/queries/programme.query';
import {
  COMPLEMENT_VIDE,
  type IPreuveCarburant,
  type IProgramme,
} from '@/features/turboys/types/programme.types';
import { preuvesDuJour, type EtatPreuves } from '@/features/turboys/utils/preuves.utils';
import { cn } from '@/lib/utils';
import { formatMontant } from '@/utils/format.utils';

/**
 * LES PREUVES WAVE D'UN JOUR (SPEC §9, RG-W03).
 *
 * <h3>Ce que cette fenêtre doit permettre, et qu'aucun écran ne permettait</h3>
 *
 * <p>Rapprocher une capture d'un versement attendu. Pour cela il faut voir les deux côte
 * à côte : le montant qu'on devait verser, et le montant qui figure sur le reçu. La
 * comptabilité relève ensuite les trois valeurs du reçu — montant, date et heure, ID de
 * transaction — et c'est cette saisie, pas l'image, qui vaut contrôle.</p>
 *
 * <p><b>L'ID de transaction est obligatoire</b> (RG-W06). C'est le seul verrou mécanique
 * de toute la chaîne : sans lui, la même capture Wave validerait deux jours. Le serveur
 * refuse un doublon, et la fenêtre le dit.</p>
 *
 * <p>Les captures REJETÉES restent affichées, barrées, avec leur motif : c'est celle
 * qu'on voudra relire si le livreur proteste.</p>
 */

const LIBELLE_JOUR: Record<string, string> = {
  DIMANCHE: 'Dimanche',
  JEUDI: 'Jeudi',
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  SAMEDI: 'Samedi',
  VENDREDI: 'Vendredi',
};

/**
 * LE BOUTON ŒIL (RG-W02).
 *
 * <p>Vert quand tout est prouvé, orange quand une partie seulement, gris quand rien.
 * Rien du tout quand rien n'est attendu : un œil gris sur un jour sans versement se
 * lirait comme une preuve manquante.</p>
 */
export function BoutonOeilPreuves({
  jour,
  onOuvrir,
  p,
}: {
  jour: string;
  onOuvrir: () => void;
  p: IProgramme;
}) {
  const etat = preuvesDuJour(p, jour);
  if (etat.etat === 'SANS_OBJET') return null;

  const couleur: Record<Exclude<EtatPreuves, 'SANS_OBJET'>, string> = {
    AUCUNE: 'text-muted',
    COMPLETE: 'text-success-soft-foreground',
    PARTIELLE: 'text-warning-soft-foreground',
  };

  return (
    <button
      aria-label={`Preuves Wave ${LIBELLE_JOUR[jour] ?? jour} : ${etat.recues} sur ${etat.attendues}`}
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1 text-[11px] font-medium tabular-nums',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
        couleur[etat.etat],
      )}
      onClick={(e) => {
        // La case du jour est elle-même cliquable : l'œil ne doit pas déclencher les deux.
        e.stopPropagation();
        onOuvrir();
      }}
      type="button"
    >
      <Eye aria-hidden="true" className="size-3" />
      {/* Le « 1/2 » n'apparaît QUE s'il y a plus d'un versement : sur un jour ordinaire
          il n'apprendrait rien et alourdirait les sept cases. */}
      {etat.attendues > 1 ? `${etat.recues}/${etat.attendues}` : null}
    </button>
  );
}

/** Une capture, avec ce qu'on en a relevé. */
function Capture({
  attendu,
  enCours,
  onRejeter,
  onValider,
  peutValider,
  preuve,
  titre,
}: {
  attendu: number;
  enCours: boolean;
  onRejeter: () => void;
  onValider: (montant: number, reference: string, recuLe: string) => void;
  peutValider: boolean;
  preuve: IPreuveCarburant | null;
  titre: string;
}) {
  const [montant, setMontant] = React.useState<number | null>(null);
  const [reference, setReference] = React.useState('');
  const [recuLe, setRecuLe] = React.useState('');

  React.useEffect(() => {
    // Le montant attendu est PRÉ-REMPLI : neuf fois sur dix c'est le bon, et le
    // comptable n'a qu'à le corriger quand il diffère. Le relever à la main à chaque
    // fois produit des fautes de frappe là où ça compte.
    setMontant(preuve?.montantRecu ?? attendu);
    setReference(preuve?.referenceTransaction ?? '');
    setRecuLe(preuve?.recuLe ? preuve.recuLe.slice(0, 16) : '');
  }, [attendu, preuve]);

  const rejetee = preuve?.statut === 'REJETEE';
  const validee = preuve?.statut === 'VALIDEE';

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-separator p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{titre}</span>
        <span className="text-sm tabular-nums text-muted">Attendu {formatMontant(attendu)}</span>
      </div>

      {!preuve ? (
        <p className="text-sm text-muted">Aucune capture envoyée.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {/* La capture s'ouvre dans un onglet : l'afficher en vignette dans la
                fenêtre la rendrait illisible, et c'est un reçu qu'on doit LIRE. */}
            <a
              className="inline-flex items-center gap-1 text-sm text-primary underline"
              href={preuve.fichierUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              Voir la capture
            </a>
            <span className={cn('text-xs', rejetee ? 'text-danger-soft-foreground' : 'text-muted')}>
              {validee ? 'Validée' : rejetee ? 'Refusée' : 'Reçue, à valider'}
              {preuve.envoyeLe ? ` · envoyée le ${new Date(preuve.envoyeLe).toLocaleString('fr-FR')}` : ''}
            </span>
          </div>

          {rejetee && preuve.motifRejet ? (
            <p className="text-xs text-danger-soft-foreground">Motif du refus : {preuve.motifRejet}</p>
          ) : null}

          {peutValider && !rejetee && (
            <>
              <Separator />
              <div className="grid gap-2 sm:grid-cols-3">
                <NumberField
                  minValue={0}
                  onChange={(v) => setMontant(Number.isFinite(v) ? v : null)}
                  value={montant ?? Number.NaN}
                >
                  <Label>Montant reçu</Label>
                  <Input />
                </NumberField>
                <TextField onChange={setRecuLe} value={recuLe}>
                  <Label>Date et heure</Label>
                  <Input placeholder="2026-11-23T10:04" type="datetime-local" />
                </TextField>
                <TextField onChange={setReference} value={reference}>
                  <Label>ID de transaction</Label>
                  <Input placeholder="T_IA6OREV2MUG-QV6ZQ" />
                </TextField>
              </div>
              {/* ⚠ L'écart est SIGNALÉ, pas bloqué : un versement partiel arrive, et
                  c'est justement ce que le contrôle doit faire remonter. */}
              {montant !== null && montant !== attendu ? (
                <p className="text-xs text-warning-soft-foreground">
                  Écart de {formatMontant(Math.abs(montant - attendu))} avec le montant attendu.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  isDisabled={!reference.trim() || montant === null}
                  isPending={enCours}
                  onPress={() => onValider(montant!, reference.trim(), recuLe)}
                  size="sm"
                  variant="primary"
                >
                  <Check aria-hidden="true" className="size-4" />
                  {validee ? 'Revalider' : 'Valider'}
                </Button>
                <Button isPending={enCours} onPress={onRejeter} size="sm" variant="outline">
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Demander une nouvelle capture
                </Button>
              </div>
              {!reference.trim() ? (
                <p className="text-xs text-muted">
                  L&apos;ID de transaction est obligatoire : c&apos;est lui qui empêche une capture de servir
                  deux fois.
                </p>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}

export interface PreuvesCarburantDialogProps {
  /** Le programme et le jour regardés. `null` = fenêtre fermée. */
  cible: { jour: string; programme: IProgramme } | null;
  /** RG-W04 / CA-55 : le coordinateur VOIT les preuves, il ne les valide pas. */
  peutValider: boolean;
  /** Nom d'un site par identifiant, pour situer un surplus. */
  nomSite?: Map<string, string>;
  onFermer: () => void;
}

export function PreuvesCarburantDialog({ cible, peutValider, nomSite, onFermer }: PreuvesCarburantDialogProps) {
  const valider = useValiderPreuveMutation();
  const rejeter = useRejeterPreuveMutation();

  const p = cible?.programme ?? null;
  const jour = cible?.jour ?? '';
  const complement = p?.complement ?? COMPLEMENT_VIDE;

  const jourProgramme = (p?.jours ?? []).find((j) => j.jour === jour);
  const surplus = (complement.surplusParJour?.[jour] ?? []).filter((s) => !s.annule);
  const preuves = complement.preuvesParJour?.[jour] ?? [];

  /** La capture VIVANTE d'un versement, ou la rejetée s'il n'y a que ça à montrer. */
  const preuvePour = (surplusId: string | null): IPreuveCarburant | null => {
    const pour = preuves.filter((x) => (x.surplusId ?? null) === surplusId);
    return pour.find((x) => x.statut !== 'REJETEE') ?? pour[0] ?? null;
  };

  const demanderRejet = (preuveId: string) => {
    if (!p) return;
    const motif = window.prompt(
      'Demander une nouvelle capture.\n\n'
        + 'Le livreur reçoit une notification avec ce motif ; sans lui, il renverra la même.\n\n'
        + 'Qu’est-ce qui ne va pas ?',
    );
    if (!motif || !motif.trim()) return;
    rejeter.mutate({ id: p.id, motif: motif.trim(), preuveId });
  };

  return (
    <FenetreAction
      libelleFermer="Fermer"
      onFermer={onFermer}
      ouvert={!!cible}
      titre={`Preuves carburant — ${p?.livreurNom ?? 'livreur'} · ${LIBELLE_JOUR[jour] ?? jour}`}
    >
      <div className="flex flex-col gap-3">
        {(jourProgramme?.montantCarburant ?? 0) > 0 && (
          <Capture
            attendu={jourProgramme?.montantCarburant ?? 0}
            enCours={valider.isPending || rejeter.isPending}
            onRejeter={() => {
              const pr = preuvePour(null);
              if (pr) demanderRejet(pr.id);
            }}
            onValider={(montant, reference, recuLe) => {
              const pr = preuvePour(null);
              if (!p || !pr) return;
              valider.mutate({
                id: p.id,
                payload: {
                  montantRecu: montant,
                  recuLe: recuLe ? new Date(recuLe).toISOString() : null,
                  referenceTransaction: reference,
                },
                preuveId: pr.id,
              });
            }}
            peutValider={peutValider}
            preuve={preuvePour(null)}
            titre="Dotation du jour"
          />
        )}

        {surplus.map((s) => (
          <Capture
            attendu={s.montant}
            enCours={valider.isPending || rejeter.isPending}
            key={s.id}
            onRejeter={() => {
              const pr = preuvePour(s.id);
              if (pr) demanderRejet(pr.id);
            }}
            onValider={(montant, reference, recuLe) => {
              const pr = preuvePour(s.id);
              if (!p || !pr) return;
              valider.mutate({
                id: p.id,
                payload: {
                  montantRecu: montant,
                  recuLe: recuLe ? new Date(recuLe).toISOString() : null,
                  referenceTransaction: reference,
                },
                preuveId: pr.id,
              });
            }}
            peutValider={peutValider}
            preuve={preuvePour(s.id)}
            titre={`Surplus${s.siteId && nomSite?.get(s.siteId) ? ` · ${nomSite.get(s.siteId)}` : ''}`}
          />
        ))}

        {(jourProgramme?.montantCarburant ?? 0) === 0 && surplus.length === 0 && (
          <p className="text-sm text-muted">Aucun versement n’était dû ce jour-là.</p>
        )}

        {!peutValider && (
          <p className="text-xs text-muted">
            Votre profil consulte les preuves ; la validation revient à la comptabilité et à la direction.
          </p>
        )}
      </div>
    </FenetreAction>
  );
}
