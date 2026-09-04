'use client';

import { ComboBox, EmptyState, Input, ListBox } from '@heroui-v3/react';
import { CalendarDays } from 'lucide-react';

import { ICreneauActifVm } from '@/features/creneaux/types/creneau.types';

interface Props {
  creneaux: ICreneauActifVm[];
  selectedCreneauId: string | null | undefined;
  onSelectCreneau: (id: string | undefined) => void;
  disabled?: boolean;
}

/**
 * Le choix du creneau, partage par les cinq ecrans de validation des tickets.
 *
 * <h3>Ce qui n'allait pas</h3>
 * <ul>
 *   <li>La liste etait un menu deroulant simple : elle s'allonge d'une entree par
 *       semaine et l'operateur devait la parcourir a l'oeil pour retrouver la sienne.
 *       Le champ se saisit maintenant au clavier et filtre sur le libelle.</li>
 *   <li>Le controle n'avait aucun nom accessible : le seul intitule etait le texte
 *       d'invite, qui disparait des qu'un creneau est choisi. Il est pose dans des
 *       barres de titre, a cote d'un h1 ou d'un badge, donc le nom passe par
 *       `aria-label` plutot que par un intitule visible qui casserait ces alignements.</li>
 * </ul>
 */
export default function CreneauSelectPicker({
  creneaux,
  selectedCreneauId,
  onSelectCreneau,
  disabled,
}: Props) {
  return (
    <ComboBox
      /* Une recherche sans reponse refermait la liste sans un mot : on ne savait pas si
         le creneau n'existait pas ou si le champ ne repondait plus. */
      allowsEmptyCollection
      aria-label="Créneau"
      className="w-full sm:w-64"
      isDisabled={disabled}
      onSelectionChange={(cle) => onSelectCreneau(cle == null ? undefined : String(cle))}
      selectedKey={selectedCreneauId ?? null}
    >
      <ComboBox.InputGroup>
        {/* L'icone occupe le debut du champ comme le chevron de HeroUI en occupe la fin ;
            le retrait de gauche sur la saisie lui reserve cette place, faute de quoi le
            libelle du creneau passerait dessous. */}
        <CalendarDays
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted"
        />
        <Input className="ps-9" placeholder="Choisir un créneau…" />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox
          items={creneaux}
          renderEmptyState={() => (
            <EmptyState className="py-6 text-center">Aucun créneau ne correspond.</EmptyState>
          )}
        >
          {(creneau: ICreneauActifVm) => (
            <ListBox.Item id={creneau.id} textValue={creneau.label}>
              {creneau.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
