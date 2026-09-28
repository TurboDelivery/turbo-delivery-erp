'use client';

import React from 'react';
import { Label, ListBox, Select } from '@heroui-v3/react';

import {
  CHAMPS_IMPORT,
  LIBELLES_CHAMP_IMPORT,
  type ChampImport,
  type IRattachement,
  type ITableImport,
} from '@/features/bdd-clients';

/**
 * Dire quelle colonne va dans quel champ.
 *
 * <h3>Le rattachement est PROPOSÉ, jamais imposé</h3>
 * <p>Le nom d'une colonne suffit souvent à deviner : « Total TTC » ressemble à un
 * montant. Mais « Montant remise » aussi, et une colonne mal rattachée entre en base
 * sans laisser de trace. La proposition est donc pré-remplie et VISIBLE, pour être
 * corrigée d'un geste.</p>
 *
 * <h3>Seul le numéro est obligatoire</h3>
 * <p>C'est lui qui identifie le client ; tout le reste enrichit la fiche. Un fichier
 * sans nom ni montant reste un fichier utile — il dit que ces gens ont commandé.</p>
 */

const AUCUNE = '__aucune';

/** Les champs que le serveur exige, et ceux qu'il accepte. */
const OBLIGATOIRES: ChampImport[] = ['contact'];

export function ImportRattachement({
  onChanger,
  rattachement,
  table,
}: {
  onChanger: (r: IRattachement) => void;
  rattachement: IRattachement;
  table: ITableImport;
}) {
  /*
   * Une colonne déjà rattachée ailleurs n'est pas reproposée : deux champs sur la même
   * colonne écriraient deux fois la même valeur, et c'est toujours une erreur de
   * manipulation plutôt qu'une intention.
   */
  const prises = React.useMemo(
    () => new Set(Object.values(rattachement).filter(Boolean) as string[]),
    [rattachement],
  );

  const choisir = (champ: ChampImport, valeur: string) => {
    const suivant = { ...rattachement };
    if (valeur === AUCUNE || valeur === '') {
      delete suivant[champ];
    } else {
      suivant[champ] = valeur;
    }
    onChanger(suivant);
  };

  return (
    <div className="flex flex-col gap-3 rounded-large border border-separator bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
          3. Ce que chaque colonne devient
        </h2>
        <span className="text-xs text-muted">
          Seul le numéro est obligatoire. Le reste enrichit la fiche.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {CHAMPS_IMPORT.map((champ) => {
          const valeur = rattachement[champ] ?? '';
          const manquant = OBLIGATOIRES.includes(champ) && valeur === '';
          return (
            <Select
              className="w-full"
              isInvalid={manquant}
              key={champ}
              onSelectionChange={(k) => choisir(champ, String(k ?? ''))}
              placeholder="Aucune"
              selectedKey={valeur || AUCUNE}
            >
              <Label>
                {LIBELLES_CHAMP_IMPORT[champ]}
                {OBLIGATOIRES.includes(champ) ? ' *' : ''}
              </Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id={AUCUNE} textValue="Aucune">
                    Aucune
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {table.colonnes
                    .filter((c) => c.id === valeur || !prises.has(c.id))
                    .map((c) => (
                      <ListBox.Item id={c.id} key={c.id} textValue={c.nom}>
                        {c.nom}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                </ListBox>
              </Select.Popover>
            </Select>
          );
        })}
      </div>
    </div>
  );
}
