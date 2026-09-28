'use client';

import React from 'react';
import { Button, Input, Label, TextField } from '@heroui-v3/react';
import { Undo2 } from 'lucide-react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  formatNombre,
  useAnnulerFusionMutation,
  useJournalFusionsQuery,
  type ILigneJournalFusion,
} from '@/features/bdd-clients';

/**
 * Le journal des fusions, et l'annulation qui n'existe que par lui.
 *
 * <h3>Pourquoi cette section n'est pas facultative</h3>
 * <p>Une fusion est réversible, et c'est ce qui la rend acceptable. Si le seul moyen de
 * la défaire était le message affiché juste après, elle serait réversible pendant cinq
 * secondes et irréversible ensuite. Le journal est la contrepartie du geste.</p>
 *
 * <p>Les fusions annulées RESTENT, barrées, avec leur motif : savoir qu'une fusion a eu
 * lieu puis a été défaite explique un historique qu'on retrouverait autrement sans
 * raison.</p>
 */

function formatInstant(valeur: string | null): string {
  if (!valeur) return '—';
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function JournalFusions() {
  const { data, isLoading } = useJournalFusionsQuery();
  const annuler = useAnnulerFusionMutation();
  const [aAnnuler, setAAnnuler] = React.useState<ILigneJournalFusion | null>(null);
  const [motif, setMotif] = React.useState('');

  const fermer = () => {
    setAAnnuler(null);
    setMotif('');
  };

  const confirmer = () => {
    if (!aAnnuler || motif.trim() === '') return;
    annuler.mutate({ fusionId: aAnnuler.id, motif: motif.trim() }, { onSuccess: fermer });
  };

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Fusions récentes
      </h2>

      {isLoading ? (
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div className="h-12 animate-pulse rounded-md bg-surface-2" key={i} />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="rounded-large border border-separator bg-surface p-4 text-sm text-muted">
          Aucune fusion enregistrée.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-separator rounded-large border border-separator bg-surface">
          {data.map((ligne) => (
            <li className="flex items-center justify-between gap-4 p-3" key={ligne.id}>
              <div className="flex min-w-0 flex-col">
                <span
                  className={
                    ligne.annulee
                      ? 'truncate text-sm text-muted line-through'
                      : 'truncate text-sm text-foreground'
                  }
                >
                  <span className="tabular-nums">{ligne.sourceTelephone ?? '—'}</span>
                  {ligne.sourceNom ? ` ${ligne.sourceNom}` : ''}
                  {' vers '}
                  <span className="tabular-nums">{ligne.cibleTelephone ?? '—'}</span>
                  {ligne.cibleNom ? ` ${ligne.cibleNom}` : ''}
                </span>
                <span className="text-xs text-muted">
                  {formatInstant(ligne.fusionneAt)}
                  {' · '}
                  <span className="tabular-nums">{formatNombre(ligne.capturesDeplacees)}</span>{' '}
                  commande{ligne.capturesDeplacees > 1 ? 's' : ''}
                  {ligne.appelsDeplaces > 0 ? (
                    <>
                      {' · '}
                      <span className="tabular-nums">{formatNombre(ligne.appelsDeplaces)}</span>{' '}
                      appel{ligne.appelsDeplaces > 1 ? 's' : ''}
                    </>
                  ) : null}
                  {ligne.annulee
                    ? ` · annulée le ${formatInstant(ligne.annuleAt)}${ligne.annuleMotif ? ` : ${ligne.annuleMotif}` : ''}`
                    : ''}
                </span>
              </div>

              {ligne.annulee ? null : (
                <Button
                  onPress={() => setAAnnuler(ligne)}
                  size="sm"
                  variant="ghost"
                >
                  <Undo2 aria-hidden="true" className="size-4" />
                  Annuler
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <FenetreAction
        actionInactive={motif.trim() === ''}
        enAttente={annuler.isPending}
        libelleAction="Annuler la fusion"
        onAction={confirmer}
        onFermer={fermer}
        ouvert={aAnnuler !== null}
        titre="Annuler une fusion"
      >
        <p className="text-sm text-foreground">
          Les{' '}
          <strong className="tabular-nums">
            {formatNombre(aAnnuler?.capturesDeplacees ?? 0)}
          </strong>{' '}
          commande{(aAnnuler?.capturesDeplacees ?? 0) > 1 ? 's' : ''} déplacées reviendront
          sur <strong className="tabular-nums">{aAnnuler?.sourceTelephone ?? '—'}</strong>.
          Celles que la fiche conservée a reçues depuis y restent.
        </p>

        {/*
          Le motif est exigé par le serveur, et l'écran le dit avant l'envoi plutôt que
          de laisser découvrir le refus. Une annulation de fusion sans raison écrite est
          une trace qui ne sert à rien six mois plus tard.
        */}
        <TextField isRequired onChange={setMotif} value={motif}>
          <Label>Motif</Label>
          <Input placeholder="Pourquoi cette fusion était une erreur" />
        </TextField>

        <p className="text-xs text-muted">
          Si le numéro libéré a été repris par une autre fiche depuis la fusion, le serveur
          refusera l’annulation et dira laquelle.
        </p>
      </FenetreAction>
    </section>
  );
}
