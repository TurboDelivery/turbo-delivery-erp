'use client';

import React from 'react';
import { Label, ListBox, Select } from '@heroui-v3/react';

import type { ITableImport } from '@/lib/tableur/atelier-colonnes';
import {
  CHAMPS_TICKET,
  CHAMPS_TICKET_OBLIGATOIRES,
  LIBELLES_CHAMP_TICKET,
  type ChampTicket,
  type IRattachementTicket,
} from '@/features/tickets/import/import-tickets.utils';

/**
 * Dire quelle colonne devient quel champ du ticket.
 *
 * <h3>Ce qui n'est PAS demandé</h3>
 * <p>La commission. Elle ne se saisit nulle part dans l'ERP, et une colonne
 * « Commission » du fichier est ignorée : le serveur la résout depuis la version active
 * à la date de la course, en fonction du partenaire et de la zone. Lui en proposer le
 * rattachement laisserait croire que la valeur du fichier sera enregistrée, alors
 * qu'elle serait jetée.</p>
 *
 * <p>La zone non plus : aucune feuille ne l'écrit. Elle se déduit du coût de livraison,
 * à l'étape suivante.</p>
 */

const AUCUNE = '__aucune';

export function EtapeRattachement({
  onChanger,
  rattachement,
  table,
}: {
  onChanger: (r: IRattachementTicket) => void;
  rattachement: IRattachementTicket;
  table: ITableImport;
}) {
  /*
   * Une colonne déjà prise par un autre champ n'est pas reproposée : deux champs sur la
   * même colonne, c'est une erreur de manipulation, jamais une intention.
   */
  const prises = React.useMemo(
    () => new Set(Object.values(rattachement).filter(Boolean) as string[]),
    [rattachement],
  );

  const choisir = (champ: ChampTicket, valeur: string) => {
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
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
          3. Ce que chaque colonne devient
        </h2>
        <span className="text-xs text-muted">
          La commission n’est pas demandée : le serveur la recalcule à la date de la course.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {CHAMPS_TICKET.map((champ) => {
          const valeur = rattachement[champ] ?? '';
          const obligatoire = CHAMPS_TICKET_OBLIGATOIRES.includes(champ);
          return (
            <Select
              className="w-full"
              isInvalid={obligatoire && valeur === ''}
              key={champ}
              onSelectionChange={(k) => choisir(champ, String(k ?? ''))}
              placeholder="Aucune"
              selectedKey={valeur || AUCUNE}
            >
              <Label>
                {LIBELLES_CHAMP_TICKET[champ]}
                {obligatoire ? ' *' : ''}
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

      <p className="text-xs text-muted">
        Sans heure, les tickets sont enregistrés à minuit. Cela ne change ni la paie, ni
        la facture, ni la semaine de rattachement.
      </p>
    </div>
  );
}
