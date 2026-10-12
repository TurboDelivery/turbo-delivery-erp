'use client';

import React from 'react';
import { Button, ComboBox, Input, Label, ListBox, TextField } from '@heroui-v3/react';
import { CalendarClock, Check, Plus } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import {
  formatFcfa,
  formatJourCourt,
  useCloreEngagementMutation,
  useCreerEngagementMutation,
  useEngagementsQuery,
  type IEncoursReleve,
} from '@/features/encours';

/**
 * Ce qu'un partenaire a PROMIS, et pour quand.
 *
 * <h3>Pourquoi cet écran existe</h3>
 * <p>La Direction, devant une ligne annotée « règlement en cours » : « ça veut dire
 * quoi ? Qu'ils ont déjà payé, ou qu'ils paient lundi ? ». L'ERP ne pouvait pas
 * répondre. L'annotation avait été écrite à la main, hors du système, et l'information
 * vivait dans une conversation que personne d'autre n'avait.</p>
 *
 * <h3>⚠ Une promesse n'est pas un encaissement</h3>
 * <p>Rien de ce qui se note ici ne bouge un solde. Tant que l'argent n'est pas rentré,
 * la créance est due et le relevé continue de la réclamer. L'écran le dit en toutes
 * lettres, parce que c'est exactement la confusion qu'il existe pour dissiper.</p>
 */
export function EncoursEngagementsManager({ releve }: { releve?: IEncoursReleve | null }) {
  const { data: engagements, isError, isFetching, refetch } = useEngagementsQuery();
  const creer = useCreerEngagementMutation();
  const clore = useCloreEngagementMutation();

  const [groupe, setGroupe] = React.useState('');
  const [datePromise, setDatePromise] = React.useState('');
  const [montant, setMontant] = React.useState('');
  const [commentaire, setCommentaire] = React.useState('');

  const partenaires = React.useMemo(
    () => (releve?.partenaires ?? []).map((p) => ({ id: p.groupe, nom: p.groupe })),
    [releve],
  );

  /*
   * ⚠ Le plancher est AUJOURD'HUI, et il est posé sur le champ lui-même.
   *
   * Le serveur refuse déjà une date passée — noter « il paiera le 3 » le 12 ne dit rien
   * de ce qui va se passer — mais laisser l'écran l'accepter ferait découvrir le refus
   * après coup, sur un formulaire rempli.
   */
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const montantNombre = montant.trim() === '' ? null : Number(montant.replace(/\s/g, ''));
  const montantInvalide = montantNombre !== null && (!Number.isFinite(montantNombre) || montantNombre <= 0);
  const pret = groupe !== '' && datePromise !== '' && datePromise >= aujourdhui && !montantInvalide;

  const enregistrer = () => {
    if (!pret) return;
    creer.mutate(
      {
        commentaire: commentaire.trim() || null,
        datePromise,
        groupePartenaire: groupe,
        montantAnnonce: montantNombre,
      },
      {
        onSuccess: () => {
          setGroupe('');
          setDatePromise('');
          setMontant('');
          setCommentaire('');
        },
      },
    );
  };

  if (isError) {
    return <EtatErreur enCours={isFetching} onReessayer={() => void refetch()} quoi="les engagements" />;
  }

  const lignes = engagements ?? [];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Ce qu&apos;un partenaire s&apos;est engagé à payer, et pour quand. Rien ici ne
        modifie un solde : tant que l&apos;argent n&apos;est pas rentré, la créance reste
        due et le relevé la réclame. L&apos;engagement s&apos;affiche sur la ligne du
        partenaire, avec sa date.
      </p>

      <div className="flex flex-wrap items-end gap-3 rounded-large border border-separator bg-surface p-4">
        <ComboBox
          allowsEmptyCollection
          className="min-w-[14rem]"
          onSelectionChange={(c) => setGroupe(String(c ?? ''))}
          selectedKey={groupe || null}
        >
          <Label>Partenaire</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Qui s'est engagé ?" />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox
              items={partenaires}
              renderEmptyState={() => (
                <p className="px-3 py-2 text-sm text-muted">Aucun partenaire au relevé</p>
              )}
            >
              {(p: { id: string; nom: string }) => (
                <ListBox.Item id={p.id} textValue={p.nom}>
                  {p.nom}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              )}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>

        <TextField className="w-44" onChange={setDatePromise} value={datePromise}>
          <Label>Paiement promis le</Label>
          <Input min={aujourdhui} type="date" />
        </TextField>

        <TextField className="w-40" onChange={setMontant} value={montant}>
          <Label>Montant annoncé</Label>
          <Input inputMode="numeric" placeholder="Facultatif" />
        </TextField>

        <TextField className="min-w-[16rem] flex-1" onChange={setCommentaire} value={commentaire}>
          <Label>Commentaire</Label>
          <Input placeholder="Qui l'a dit, comment, ce qu'il a précisé" />
        </TextField>

        <Button isDisabled={!pret || creer.isPending} onPress={enregistrer} variant="primary">
          <Plus aria-hidden="true" className="size-4" />
          Noter l&apos;engagement
        </Button>
      </div>

      {montantInvalide ? (
        <p className="text-xs text-danger-soft-foreground">
          Le montant annoncé doit être un nombre positif. Laisse-le vide si le partenaire
          n&apos;a pas chiffré.
        </p>
      ) : null}

      {lignes.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-large border border-separator bg-surface py-10 text-center">
          <CalendarClock aria-hidden="true" className="size-6 text-muted" />
          <p className="text-sm text-foreground">Aucun engagement en cours.</p>
          <p className="text-xs text-muted">
            Quand un partenaire annonce une date, notez-la ici : elle s&apos;affichera sur
            sa ligne, et personne n&apos;aura à redemander.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {lignes.map((e) => {
            const depasse = e.datePromise < aujourdhui;
            return (
              <li
                className="flex flex-wrap items-center gap-3 rounded-large border border-separator bg-surface p-3"
                key={e.id}
              >
                <span className="font-semibold text-foreground">{e.groupePartenaire}</span>
                <span
                  className={
                    depasse ? 'text-sm text-danger-soft-foreground' : 'text-sm text-foreground'
                  }
                >
                  {depasse ? 'promis le ' : 'paie le '}
                  {formatJourCourt(e.datePromise)}
                  {depasse ? ', non tenu' : ''}
                </span>
                {e.montantAnnonce ? (
                  <span className="text-sm tabular-nums text-muted">
                    {formatFcfa(e.montantAnnonce)} annoncés
                  </span>
                ) : null}
                {e.commentaire ? (
                  <span className="min-w-0 flex-1 truncate text-xs text-muted">
                    {e.commentaire}
                  </span>
                ) : (
                  <span className="flex-1" />
                )}
                {/*
                  Clore, jamais supprimer : tenu ou non, l'engagement dit quelque chose du
                  partenaire, et l'effacer retirerait la seule mémoire de ce qu'il avait
                  promis.
                */}
                <Button
                  isDisabled={clore.isPending}
                  onPress={() =>
                    clore.mutate({ id: e.id, motif: depasse ? 'Échéance dépassée.' : 'Réglé.' })
                  }
                  size="sm"
                  variant="ghost"
                >
                  <Check aria-hidden="true" className="size-4" />
                  Clore
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
