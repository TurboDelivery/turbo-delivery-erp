'use client';

import React from 'react';
import { Button, Input, Label, Spinner, TextField } from '@heroui-v3/react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useProgrammesSemaineQuery } from '@/features/turboys/queries/programme.query';
import { semaineDecalee } from '@/features/turboys/utils/semaine.utils';

/**
 * Dupliquer une semaine entière vers une autre.
 *
 * <p>La direction l'a demandé en recette : la majorité des livreurs gardent le même site
 * et le même carburant d'une semaine à l'autre, et resaisir quarante programmes chaque
 * lundi n'a pas de sens. La copie porte le planning des Opérations, jours de repos
 * compris ; chaque ligne se retouche ensuite séparément.</p>
 *
 * <h3>Les deux semaines se choisissent, désormais</h3>
 * <p>Cet écran ne savait faire qu'un seul geste : recopier la semaine PRÉCÉDENTE vers
 * celle qu'on regardait. C'est l'inverse du geste naturel — on finit une semaine, puis on
 * la pousse vers la suivante — et cela interdisait de préparer une semaine deux crans plus
 * loin, ou de repartir d'une semaine de référence plus ancienne. Le serveur, lui,
 * acceptait déjà n'importe quel couple depuis V140 : il n'y avait qu'un écran à ouvrir.</p>
 *
 * <p>Par défaut, on part de la semaine affichée vers la suivante : c'est le geste des neuf
 * fois sur dix, et les deux champs restent là pour la dixième.</p>
 *
 * <p>La règle validée n'a pas changé : la duplication N'ÉCRASE RIEN. Une semaine qui porte
 * déjà un programme la refuse, et l'écran le dit AVANT le clic — il compte les programmes
 * de la cible choisie plutôt que de laisser le serveur répondre par une erreur.</p>
 */

interface Semaine {
  annee: number;
  semaine: number;
}

/** Une semaine ISO va de 1 à 53. Zéro et 54 n'existent pas, et le serveur les refuse. */
function borner(valeur: number): number {
  if (!Number.isFinite(valeur)) return 1;
  return Math.min(53, Math.max(1, Math.trunc(valeur)));
}

/**
 * Un couple semaine + annee, sur une ligne.
 *
 * <p>Le mot « Depuis » ou « Vers » est une LEGENDE au-dessus, pas l'etiquette d'un champ :
 * mesure a l'ecran, « Depuis la semaine » sur un champ de 6 rem passait a la ligne, et les
 * deux blocs se chevauchaient dans la fenetre. La legende porte le sens, les etiquettes
 * portent l'unite.</p>
 */
function ChoixSemaine({
  enfants,
  etiquette,
  onChange,
  valeur,
}: {
  enfants?: React.ReactNode;
  etiquette: string;
  onChange: (s: Semaine) => void;
  valeur: Semaine;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {etiquette}
      </span>
      <div className="flex items-end gap-2">
        <TextField
          className="w-24"
          onChange={(v) => onChange({ ...valeur, semaine: borner(Number(v)) })}
          value={String(valeur.semaine)}
        >
          <Label>Semaine</Label>
          <Input className="text-right tabular-nums" inputMode="numeric" />
        </TextField>
        <TextField
          className="w-28"
          onChange={(v) => onChange({ ...valeur, annee: Number(v) || valeur.annee })}
          value={String(valeur.annee)}
        >
          <Label>Année</Label>
          <Input className="text-right tabular-nums" inputMode="numeric" />
        </TextField>
        {enfants}
      </div>
    </div>
  );
}

export function DuplicationSemaineDialog({
  enAttente = false,
  onDupliquer,
  onFermer,
  ouvert,
  semaineAffichee,
}: {
  enAttente?: boolean;
  onDupliquer: (source: Semaine, cible: Semaine) => void;
  onFermer: () => void;
  ouvert: boolean;
  /** La semaine sous les yeux de l'opérateur : la source par défaut. */
  semaineAffichee: Semaine;
}) {
  const [source, setSource] = React.useState<Semaine>(semaineAffichee);
  const [cible, setCible] = React.useState<Semaine>(() =>
    semaineDecalee(semaineAffichee.annee, semaineAffichee.semaine, 1),
  );

  /*
   * Rouvrir la fenêtre repart de la semaine affichée.
   *
   * Sans cela, l'opérateur qui change de semaine puis rouvre la fenêtre retrouverait
   * l'ancien couple et dupliquerait la mauvaise semaine, sans que rien ne le signale.
   */
  React.useEffect(() => {
    if (!ouvert) return;
    setSource(semaineAffichee);
    setCible(semaineDecalee(semaineAffichee.annee, semaineAffichee.semaine, 1));
    // Les CHAMPS, jamais l'objet : `semaineAffichee` est reconstruit a chaque rendu du
    // parent, et le mettre en dependance relancerait l'effet en boucle. C'est le meme
    // piege qu'une `Date` neuve en dependance, deja paye sur cet ERP.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert, semaineAffichee.annee, semaineAffichee.semaine]);

  const sourceQuery = useProgrammesSemaineQuery(source.annee, source.semaine);
  const cibleQuery = useProgrammesSemaineQuery(cible.annee, cible.semaine);

  const nbSource = Array.isArray(sourceQuery.data) ? sourceQuery.data.length : null;
  const nbCible = Array.isArray(cibleQuery.data) ? cibleQuery.data.length : null;

  const memeSemaine = source.annee === cible.annee && source.semaine === cible.semaine;
  const cibleOccupee = nbCible !== null && nbCible > 0;
  const sourceVide = nbSource !== null && nbSource === 0;
  const enLecture = sourceQuery.isFetching || cibleQuery.isFetching;

  const empeche = memeSemaine || cibleOccupee || sourceVide || enLecture;

  return (
    <FenetreAction
      actionInactive={empeche}
      enAttente={enAttente}
      libelleAction={`Dupliquer vers la semaine ${cible.semaine}`}
      onAction={() => onDupliquer(source, cible)}
      onFermer={onFermer}
      ouvert={ouvert}
      titre="Dupliquer une semaine"
    >
      <div className="flex flex-col gap-3">
        <ChoixSemaine etiquette="Depuis" onChange={setSource} valeur={source} />
        <ChoixSemaine
          enfants={
            <div className="mb-1 flex items-center gap-2">
              {enLecture ? <Spinner size="sm" /> : null}
              <Button
                onPress={() => setCible(semaineDecalee(cible.annee, cible.semaine, 1))}
                size="sm"
                variant="ghost"
              >
                Suivante
              </Button>
            </div>
          }
          etiquette="Vers"
          onChange={setCible}
          valeur={cible}
        />
      </div>

      {/*
        Ce que chaque semaine porte DEJA, annoncé avant le clic. C'est la seule façon de
        savoir si l'on est sur le bon couple : deux numéros de semaine se ressemblent.
      */}
      <p className="text-sm text-muted">
        Semaine {source.semaine} / {source.annee} :{' '}
        <span className="font-medium tabular-nums text-foreground">
          {nbSource === null ? '…' : nbSource}
        </span>{' '}
        programme{(nbSource ?? 0) > 1 ? 's' : ''} · Semaine {cible.semaine} / {cible.annee} :{' '}
        <span className="font-medium tabular-nums text-foreground">
          {nbCible === null ? '…' : nbCible}
        </span>{' '}
        programme{(nbCible ?? 0) > 1 ? 's' : ''}
      </p>

      {memeSemaine ? (
        <p className="text-sm text-danger-soft-foreground">
          La source et la cible sont la même semaine.
        </p>
      ) : null}

      {sourceVide ? (
        <p className="text-sm text-danger-soft-foreground">
          La semaine {source.semaine} ne porte aucun programme : il n’y a rien à recopier.
        </p>
      ) : null}

      {cibleOccupee ? (
        <p className="text-sm text-danger-soft-foreground">
          La semaine {cible.semaine} porte déjà {nbCible} programme{(nbCible ?? 0) > 1 ? 's' : ''}. La
          duplication n’écrase rien : supprimez-les, choisissez une autre semaine, ou
          modifiez-les ligne par ligne.
        </p>
      ) : null}

      {!empeche ? (
        <>
          <p className="text-sm text-foreground">
            Les {nbSource} programmes de la semaine {source.semaine} sont recopiés sur la semaine{' '}
            {cible.semaine}, en brouillon : jours travaillés et de repos, horaires, postes,
            carburant par jour, site de la semaine.
          </p>
          <p className="text-sm text-muted">
            Rien n’est publié. Chaque ligne se modifie ensuite séparément, et l’on peut en
            ajouter d’autres avant de publier. Le jour de repos se déplace si le roulement
            change. Ce qui n’est pas copié : le statut, les acceptations, le pointage, le total
            figé. Un livreur qui a déjà déclaré cette semaine dans l’application garde sa
            déclaration.
          </p>
        </>
      ) : null}
    </FenetreAction>
  );
}
