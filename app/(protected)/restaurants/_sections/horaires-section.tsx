'use client';

import { Checkbox, InputGroup, Label, TextField } from '@heroui-v3/react';
import React from 'react';

export type Horaire = {
  ferme: boolean;
  fermeture: string;
  jour: string;
  ouverture: string;
};

const JOURS_LABELS: Record<string, string> = {
  DIMANCHE: 'Dimanche',
  JEUDI: 'Jeudi',
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  SAMEDI: 'Samedi',
  VENDREDI: 'Vendredi',
};

/**
 * Les horaires d'ouverture d'un partenaire.
 *
 * <h3>Deux exemplaires, deux comportements</h3>
 * <p>Le formulaire de création affichait une grille étiquetée avec les heures TOUJOURS
 * visibles, désactivées les jours fermés. Celui d'édition les FAISAIT DISPARAÎTRE dès
 * qu'on cochait « Fermé » : rouvrir un dimanche demandait de retaper les heures qu'on ne
 * pouvait plus lire, alors qu'elles étaient toujours en base.</p>
 *
 * <p>C'est la version qui MONTRE qui est retenue. Et les champs d'heure de la version
 * d'édition étaient des `<input type="time">` nus portant leur bordure à la main : ni
 * étiquette, ni état de focus, ni thème sombre.</p>
 */
interface HorairesSectionProps {
  horaires: Horaire[];
  onUpdate: (index: number, key: keyof Horaire, value: boolean | string) => void;
}

export function HorairesSection({ horaires, onUpdate }: HorairesSectionProps) {
  return (
    <section>
      <p className="mb-4 text-sm font-medium text-foreground">Horaires d&apos;ouverture</p>
      <div className="flex flex-col divide-y divide-separator overflow-hidden rounded-xl border border-separator">
        {horaires.map((h, i) => (
          <div
            className="flex flex-wrap items-end gap-3 px-4 py-2.5 sm:grid sm:grid-cols-[110px_1fr_1fr_100px]"
            key={h.jour}
          >
            <span className="text-sm font-medium text-foreground sm:self-center">
              {JOURS_LABELS[h.jour] ?? h.jour}
            </span>
            <TextField
              isDisabled={h.ferme}
              onChange={(v) => onUpdate(i, 'ouverture', v)}
              type="time"
              value={h.ouverture}
            >
              <Label className="text-xs">Ouverture</Label>
              <InputGroup>
                <InputGroup.Input />
              </InputGroup>
            </TextField>
            <TextField
              isDisabled={h.ferme}
              onChange={(v) => onUpdate(i, 'fermeture', v)}
              type="time"
              value={h.fermeture}
            >
              <Label className="text-xs">Fermeture</Label>
              <InputGroup>
                <InputGroup.Input />
              </InputGroup>
            </TextField>
            {/*
             * C'etait un `<input type="checkbox" className="accent-primary">` nu : la
             * couleur de marque appliquee par la propriete CSS `accent-color`, sans etat
             * de focus ni taille de cible tactile.
             */}
            <Checkbox
              className="sm:self-center"
              isSelected={h.ferme}
              onChange={(coche) => onUpdate(i, 'ferme', coche)}
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="text-xs text-muted">Fermé</span>
              </Checkbox.Content>
            </Checkbox>
          </div>
        ))}
      </div>
    </section>
  );
}
