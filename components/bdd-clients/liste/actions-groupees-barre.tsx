'use client';

import React from 'react';
import { Button, Input, Label, TextField, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { Tag, X } from 'lucide-react';

import {
  ActionsGroupeesMaximum,
  LIBELLES_SEGMENT,
  formatNombre,
  useActionsGroupeesMutation,
} from '@/features/bdd-clients';

/**
 * Ce qu'on fait à plusieurs fiches d'un coup.
 *
 * <h3>Elle n'existe que quand il y a une sélection</h3>
 * <p>Une barre d'actions permanente prend une rangée sur une fenêtre de 563 pixels pour
 * ne rien proposer la plupart du temps. Celle-ci apparaît quand des fiches sont cochées
 * et disparaît quand la sélection se vide.</p>
 *
 * <h3>Étiqueter et segmenter, pas corriger</h3>
 * <p>Ce sont des gestes de CIBLAGE : on vient de filtrer un groupe et on le marque pour
 * la campagne suivante. Corriger un nom en lot n'aurait aucun sens, c'est un fait propre
 * à une personne.</p>
 *
 * <p>⚠ Le compte est affiché et la borne du serveur est répétée ici : découvrir après
 * coup que cinq cents fiches était le maximum, après avoir coché six cents, ferait
 * recommencer la sélection.</p>
 */

const SEGMENTS = ['NOUVEAU', 'OCCASIONNEL', 'REGULIER', 'VIP', 'DORMANT'];

export function ActionsGroupeesBarre({
  onFini,
  selectionnes,
}: {
  onFini: () => void;
  selectionnes: string[];
}) {
  const appliquer = useActionsGroupeesMutation();
  const [etiquette, setEtiquette] = React.useState('');
  const [segment, setSegment] = React.useState('');
  const [retirer, setRetirer] = React.useState(false);

  if (selectionnes.length === 0) {
    return null;
  }

  const tropNombreuses = selectionnes.length > ActionsGroupeesMaximum;
  const rien = etiquette.trim() === '' && segment === '';

  const envoyer = () => {
    if (rien || tropNombreuses) return;
    const mots = etiquette
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m !== '');
    appliquer.mutate(
      {
        ajouterTags: retirer ? null : mots,
        clientIds: selectionnes,
        retirerTags: retirer ? mots : null,
        segmentCode: segment === '' ? null : segment,
      },
      {
        onSuccess: () => {
          setEtiquette('');
          setSegment('');
          onFini();
        },
      },
    );
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-separator bg-surface-2 px-3 py-2.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Sélection
        </span>
        <span className="text-sm tabular-nums text-foreground">
          {formatNombre(selectionnes.length)} fiche{selectionnes.length > 1 ? 's' : ''}
        </span>
      </div>

      <TextField className="w-56" onChange={setEtiquette} value={etiquette}>
        <Label>Étiquettes</Label>
        <Input placeholder="campagne-octobre, fidèle" />
      </TextField>

      <ToggleButtonGroup
        aria-label="Poser ou retirer les étiquettes"
        className="mb-1"
        disallowEmptySelection
        onSelectionChange={(k) => setRetirer([...k][0] === 'retirer')}
        selectedKeys={[retirer ? 'retirer' : 'poser']}
        selectionMode="single"
        size="sm"
      >
        <ToggleButton id="poser">Poser</ToggleButton>
        <ToggleButton id="retirer">
          <ToggleButtonGroup.Separator />
          Retirer
        </ToggleButton>
      </ToggleButtonGroup>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground">Segment</span>
        <ToggleButtonGroup
          aria-label="Segment à poser sur la sélection"
          className="flex-wrap justify-start"
          isDetached
          onSelectionChange={(k) => {
            const choix = [...k][0];
            setSegment(choix === undefined ? '' : String(choix));
          }}
          selectedKeys={segment ? [segment] : []}
          selectionMode="single"
          size="sm"
        >
          {SEGMENTS.map((s) => (
            <ToggleButton id={s} key={s}>
              {LIBELLES_SEGMENT[s] ?? s}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <div className="mb-1 ms-auto flex items-center gap-2">
        <span className="max-w-[16rem] text-xs text-muted">
          {tropNombreuses
            ? `${formatNombre(ActionsGroupeesMaximum)} fiches au plus d’un coup. Affine le filtre.`
            : rien
              ? 'Écris une étiquette ou choisis un segment.'
              : 'Un segment posé à la main sort ces fiches du recalcul de nuit.'}
        </span>
        <Button isDisabled={appliquer.isPending} onPress={onFini} size="sm" variant="ghost">
          <X aria-hidden="true" className="size-4" />
          Annuler
        </Button>
        <Button
          isDisabled={rien || tropNombreuses || appliquer.isPending}
          onPress={envoyer}
          size="sm"
          variant="primary"
        >
          <Tag aria-hidden="true" className="size-4" />
          Appliquer
        </Button>
      </div>
    </div>
  );
}
