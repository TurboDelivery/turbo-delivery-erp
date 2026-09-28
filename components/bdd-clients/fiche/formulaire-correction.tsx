'use client';

import React from 'react';
import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@heroui-v3/react';
import { Check, X } from 'lucide-react';

import {
  LIBELLES_SEGMENT,
  useModifierFicheMutation,
  type IFicheClient,
  type IModificationFiche,
} from '@/features/bdd-clients';

/**
 * Corriger ce qu'un ticket a mal orthographié.
 *
 * <h3>Ce que ce formulaire répare</h3>
 * <p>Six colonnes n'avaient aucun chemin d'écriture, et la fiche en affichait trois :
 * l'alias en tête, la note en bas, « (posé à la main) » à côté du segment. Un alias entré
 * par une faute de frappe sur un ticket restait là pour toujours.</p>
 *
 * <h3>On n'envoie que ce qui a changé</h3>
 * <p>Côté serveur, `null` veut dire « ne touche pas à ce champ » et une chaîne vide veut
 * dire « efface-le ». L'écran compare donc avec la fiche reçue et n'envoie que les écarts.
 * Envoyer l'objet entier marcherait aujourd'hui et effacerait demain le champ qu'un autre
 * écran aura ajouté sans que celui-ci le connaisse.</p>
 *
 * <h3>Le segment est un verrou, et l'écran le dit</h3>
 * <p>Le poser met la fiche hors du recalcul de nuit. Ce n'est pas un détail d'implémentation :
 * c'est la différence entre « cette fiche est VIP aujourd'hui » et « cette fiche restera VIP
 * quoi qu'elle fasse ». La phrase sous le contrôle l'écrit.</p>
 */

const SEGMENTS = ['NOUVEAU', 'OCCASIONNEL', 'REGULIER', 'VIP', 'DORMANT'];

/** Une saisie « a, b , c » devient une liste propre. */
function enListe(texte: string): string[] {
  return texte
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m !== '');
}

function memeListe(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function FormulaireCorrection({
  fiche,
  onFermer,
}: {
  fiche: IFicheClient;
  onFermer: () => void;
}) {
  const modifier = useModifierFicheMutation();

  const [nom, setNom] = React.useState(fiche.nom ?? '');
  const [prenom, setPrenom] = React.useState(fiche.prenom ?? '');
  const [alias, setAlias] = React.useState((fiche.alias ?? []).join(', '));
  const [tags, setTags] = React.useState((fiche.tags ?? []).join(', '));
  const [note, setNote] = React.useState(fiche.note ?? '');
  const [segment, setSegment] = React.useState(fiche.segmentForce ? (fiche.segment ?? '') : '');

  /*
   * Ce qui a REELLEMENT changé, et rien d'autre. Un champ inchangé reste absent de la
   * demande : le serveur y lit « ne touche pas », et un écran plus ancien ne peut donc
   * pas effacer un champ qu'il ne connaît pas.
   */
  const ecarts = (): IModificationFiche => {
    const m: IModificationFiche = {};
    if (nom.trim() !== (fiche.nom ?? '')) m.nom = nom.trim();
    if (prenom.trim() !== (fiche.prenom ?? '')) m.prenom = prenom.trim();
    if (!memeListe(enListe(alias), fiche.alias ?? [])) m.alias = enListe(alias);
    if (!memeListe(enListe(tags), fiche.tags ?? [])) m.tags = enListe(tags);
    if (note.trim() !== (fiche.note ?? '')) m.note = note.trim();

    const segmentAvant = fiche.segmentForce ? (fiche.segment ?? '') : '';
    if (segment !== segmentAvant) m.segmentCode = segment;
    return m;
  };

  const rien = Object.keys(ecarts()).length === 0;

  const envoyer = () => {
    const modification = ecarts();
    if (Object.keys(modification).length === 0) return;
    modifier.mutate({ clientId: fiche.id, modification }, { onSuccess: onFermer });
  };

  return (
    <section className="flex flex-col gap-3 rounded-large border border-separator bg-surface-2 p-3">
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted">Corriger</h3>

      <div className="grid grid-cols-2 gap-2">
        <TextField onChange={setNom} value={nom}>
          <Label>Nom</Label>
          <Input placeholder="Vide pour effacer" />
        </TextField>
        <TextField onChange={setPrenom} value={prenom}>
          <Label>Prénoms</Label>
          <Input placeholder="Vide pour effacer" />
        </TextField>
      </div>

      <TextField onChange={setAlias} value={alias}>
        <Label>Aussi connu comme</Label>
        <Input placeholder="Séparés par des virgules" />
      </TextField>

      <TextField onChange={setTags} value={tags}>
        <Label>Étiquettes</Label>
        <Input placeholder="fidèle, entreprise, à rappeler" />
      </TextField>

      <TextField onChange={setNote} value={note}>
        <Label>Note</Label>
        <Input placeholder="Ce qu'il faut savoir avant de le rappeler" />
      </TextField>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-foreground">Segment posé à la main</span>
        <ToggleButtonGroup
          aria-label="Segment posé à la main"
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
        {/*
          La conséquence est écrite, pas sous-entendue : poser un segment n'est pas
          « choisir une valeur », c'est retirer la fiche du recalcul de nuit.
        */}
        <span className="text-xs text-muted">
          {segment
            ? 'Cette fiche ne sera plus reclassée la nuit. Reclique pour la rendre au recalcul.'
            : 'Aucun : le recalcul de nuit décide du segment.'}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-separator pt-3">
        <Button isDisabled={modifier.isPending} onPress={onFermer} size="sm" variant="ghost">
          <X aria-hidden="true" className="size-4" />
          Annuler
        </Button>
        <Button
          isDisabled={rien || modifier.isPending}
          onPress={envoyer}
          size="sm"
          variant="primary"
        >
          {modifier.isPending ? (
            <Spinner color="current" size="sm" />
          ) : (
            <Check aria-hidden="true" className="size-4" />
          )}
          Enregistrer
        </Button>
      </div>
    </section>
  );
}
