'use client';

import { ComboBox, Input, Label, ListBox, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';

/**
 * Le filtre par statut de la chaîne de recouvrement.
 *
 * <h3>Un contrôle segmenté ne passe pas à la ligne</h3>
 * <p>Le groupe de la bibliothèque est un contrôle SEGMENTÉ : un bloc unique, arrondi à
 * ses deux extrémités seulement. Dès qu'il déborde, il s'empile en rectangles gris aux
 * bords déchiquetés — sept rangées sur un téléphone pour les quatorze statuts du
 * Responsable financier, et deux sur un poste de travail dont la seconde flottait au
 * milieu. Ça ne se lit pas comme un filtre, ça se lit comme une casse.</p>
 *
 * <h3>Ce qui décide du contrôle</h3>
 * <p>Une facture DESCEND cette liste, de l'émission à la clôture : l'ordre est une
 * information, il dit où en est le dossier et ce qui vient après. Une rangée le montre
 * d'un coup d'œil — quand elle tient sur une ligne.</p>
 *
 * <ul>
 *   <li>Au-delà de {@link SEUIL_RANGEE} options, elle ne tient nulle part : liste
 *       cherchable à toutes les largeurs.</li>
 *   <li>En deçà, rangée sur un poste de travail, liste cherchable sur un téléphone —
 *       cinq statuts font déjà 500 px, et l'écran en a 375.</li>
 * </ul>
 *
 * <p>L'ordre de la chaîne est conservé DANS la liste, là où on le lit au moment de
 * choisir. Aucun statut ne disparaît. Les deux contrôles partagent le même état : celui
 * que la largeur écarte est en `display:none`, donc absent aussi de l'arbre
 * d'accessibilité — un seul est annoncé.</p>
 *
 * <p>Les deux écrans en portaient chacun leur copie, peinte à la main en
 * `bg-green-600 text-white` — un vert de palette qui n'est ni la couleur de marque ni un
 * jeton du thème, et qui n'a pas de variante sombre.</p>
 */

/** Au-delà, la rangée ne tient sur une ligne à aucune largeur. */
const SEUIL_RANGEE = 6;

type OptionStatut = { label: string; value: string };

function ListeStatuts({ className, onChange, options, valeur }: { className?: string; onChange: (statut: string) => void; options: readonly OptionStatut[]; valeur: string }) {
  return (
    <ComboBox
      className={className}
      onSelectionChange={(k) => {
        const v = String(k ?? 'Tous');
        onChange(v === 'Tous' ? '' : v);
      }}
      selectedKey={valeur}
    >
      <Label>Statut</Label>
      <ComboBox.InputGroup>
        <Input placeholder="Tous les statuts" />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        {/* La liste garde l'ordre de la chaine, de l'emission a la cloture. */}
        <ListBox items={options.map((o) => ({ id: o.value, label: o.label }))}>
          {(o: { id: string; label: string }) => (
            <ListBox.Item id={o.id} textValue={o.label}>
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

export function FiltreStatut({
  onChange,
  options,
  valeur,
}: {
  /** Reçoit la valeur backend, ou la chaîne vide pour « Tous ». */
  onChange: (statut: string) => void;
  /** Dans l'ordre de la chaîne. La valeur `Tous` est réservée à l'option « tous ». */
  options: readonly OptionStatut[];
  /** La valeur backend courante ; vide = tous. */
  valeur: string;
}) {
  const courant = valeur || 'Tous';

  if (options.length > SEUIL_RANGEE) {
    return <ListeStatuts className="w-full sm:w-[280px]" onChange={onChange} options={options} valeur={courant} />;
  }

  return (
    <>
      <div className="hidden flex-col gap-1.5 sm:flex">
        <span className="text-xs font-medium text-muted">Statut</span>
        <ToggleButtonGroup
          onSelectionChange={(sel) => {
            const v = String(Array.from(sel)[0] ?? 'Tous');
            onChange(v === 'Tous' ? '' : v);
          }}
          selectedKeys={new Set([courant])}
          selectionMode="single"
          size="sm"
        >
          {options.map((s) => (
            <ToggleButton id={s.value} key={s.value}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <ListeStatuts className="w-full sm:hidden" onChange={onChange} options={options} valeur={courant} />
    </>
  );
}
