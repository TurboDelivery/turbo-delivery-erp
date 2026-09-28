'use client';

import React from 'react';
import { Button, Checkbox, CheckboxGroup, ToggleButton } from '@heroui-v3/react';

import {
  LIBELLES_STATUT,
  formatJour,
  formatNombre,
  nomComplet,
  type IDoublon,
} from '@/features/bdd-clients';

/**
 * Un groupe de fiches portant le même nom, et l'arbitrage qui s'y joue.
 *
 * <h3>Ce que l'opérateur regarde, dans l'ordre</h3>
 * <p>Il répond à une seule question : est-ce la même personne, et si oui laquelle des
 * fiches garder. Les colonnes sont donc celles qui tranchent — combien de commandes,
 * depuis quand, jusqu'à quand — alignées en chasse tabulaire pour se comparer d'un coup
 * d'œil vertical. Le reste serait du bruit à cet instant.</p>
 *
 * <h3>Rien n'est pré-coché</h3>
 * <p>La fiche la plus fournie ferait un défaut commode, et c'est exactement pour cela
 * qu'on ne le pose pas : une fusion déplace l'historique commercial de quelqu'un, et un
 * choix déjà fait invite à valider sans regarder. On signale laquelle porte le plus
 * d'historique, on ne choisit pas à sa place.</p>
 *
 * <h3>⚠ Pourquoi « Garder » est un bouton et non un bouton radio</h3>
 * <p>Parce que la ligne porte AUSSI une case « absorber ». Un {@code RadioGroup} rend un
 * {@code role="radiogroup"}, dont les enfants doivent être des radios : y glisser des
 * cases fait un groupe qui ment sur ce qu'il contient. Le groupe est donc un
 * {@code CheckboxGroup} — un {@code role="group"}, qui accepte n'importe quel contenu —
 * et le choix de la fiche conservée est un bouton à deux états, dont l'unicité est tenue
 * ici. Un seul des deux contrôles pouvait rester natif ; c'est celui qui coche plusieurs
 * lignes qui l'a gardé.</p>
 */
export function GroupeDoublon({
  doublon,
  enAttente,
  onFusionner,
}: {
  doublon: IDoublon;
  enAttente: boolean;
  onFusionner: (cibleId: string, sourcesIds: string[]) => void;
}) {
  const [cibleId, setCibleId] = React.useState('');
  const [sourcesIds, setSourcesIds] = React.useState<string[]>([]);

  /* La plus fournie : on la signale, on ne la coche pas. */
  const laPlusFournie = React.useMemo(
    () =>
      doublon.fiches.reduce(
        (garde, f) => (f.nbCaptures > garde.nbCaptures ? f : garde),
        doublon.fiches[0],
      ),
    [doublon.fiches],
  );

  const choisirLaCible = (id: string) => {
    // Recliquer sur la fiche conservée la libère : sans quoi un choix posé par erreur
    // ne se reprendrait qu'en rechargeant l'écran.
    const suivante = cibleId === id ? '' : id;
    setCibleId(suivante);
    // Une fiche conservée ne peut pas être absorbée en même temps.
    if (suivante !== '') {
      setSourcesIds((liste) => liste.filter((x) => x !== suivante));
    }
  };

  const pret = cibleId !== '' && sourcesIds.length > 0;
  const aDeplacer = doublon.fiches
    .filter((f) => sourcesIds.includes(f.id))
    .reduce((somme, f) => somme + f.nbCaptures, 0);

  return (
    <section className="flex flex-col gap-3 rounded-large border border-separator bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{doublon.nom}</h3>
        <span className="text-xs text-muted">
          <span className="tabular-nums">{doublon.nb}</span> fiches portent ce nom
        </span>
      </div>

      <CheckboxGroup
        aria-label={`Fiches à absorber dans le groupe ${doublon.nom}`}
        className="gap-0"
        onChange={setSourcesIds}
        value={sourcesIds}
      >
        {/*
          L'en-tête d'une comparaison, et non d'un tableau de données : ces lignes ne se
          trient pas, ne se paginent pas, et chacune porte deux contrôles. Un Table v3
          rendrait une grille où les flèches naviguent de cellule en cellule, ce qui
          entrerait en conflit avec le bouton et la case posés dedans.
        */}
        <div className="grid grid-cols-[5.5rem_1fr_5rem_6rem_6rem_4.5rem] items-center gap-x-3 border-b border-separator pb-1.5 text-[11px] uppercase tracking-wide text-muted">
          <span>Garder</span>
          <span>Contact</span>
          <span className="text-right">Commandes</span>
          <span className="text-right">Première</span>
          <span className="text-right">Dernière</span>
          <span className="text-right">Absorber</span>
        </div>

        {doublon.fiches.map((fiche) => {
          const conservee = cibleId === fiche.id;
          return (
            <div
              className="grid grid-cols-[5.5rem_1fr_5rem_6rem_6rem_4.5rem] items-center gap-x-3 border-b border-separator py-2 last:border-b-0"
              key={fiche.id}
            >
              <ToggleButton
                id={fiche.id}
                isSelected={conservee}
                onChange={() => choisirLaCible(fiche.id)}
                size="sm"
              >
                {conservee ? 'Conservée' : 'Garder'}
              </ToggleButton>

              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm tabular-nums text-foreground">
                  {fiche.telephone}
                </span>
                <span className="truncate text-xs text-muted">
                  {/*
                    Le nom complet, et pas seulement le patronyme du groupe : c'est le
                    prénom qui distingue deux fiches rapprochées sur le même nom, et
                    c'est souvent lui qui dit s'il s'agit de la même personne.
                  */}
                  {nomComplet(fiche.nom, fiche.prenom) ?? 'Sans nom'}
                  {' · '}
                  {LIBELLES_STATUT[fiche.statut] ?? fiche.statut}
                  {fiche.id === laPlusFournie?.id && doublon.fiches.length > 1
                    ? ' · la plus fournie'
                    : ''}
                </span>
              </div>

              <span className="text-right text-sm tabular-nums text-foreground">
                {formatNombre(fiche.nbCaptures)}
              </span>
              <span className="text-right text-xs tabular-nums text-muted">
                {formatJour(fiche.premiere)}
              </span>
              <span className="text-right text-xs tabular-nums text-muted">
                {formatJour(fiche.derniere)}
              </span>

              <span className="flex justify-end">
                <Checkbox
                  aria-label={`Absorber la fiche ${fiche.telephone}`}
                  isDisabled={conservee}
                  value={fiche.id}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
              </span>
            </div>
          );
        })}
      </CheckboxGroup>

      {/*
        La conséquence est écrite avant le clic, avec les vrais chiffres. Un libellé
        générique laisserait découvrir après coup combien de commandes ont bougé.
      */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          {cibleId === ''
            ? 'Choisis d’abord la fiche à conserver.'
            : sourcesIds.length === 0
              ? 'Coche ensuite la ou les fiches à absorber.'
              : `${formatNombre(aDeplacer)} commande${aDeplacer > 1 ? 's' : ''} passeront sur la fiche conservée. Réversible.`}
        </span>
        <Button
          isDisabled={!pret || enAttente}
          onPress={() => onFusionner(cibleId, sourcesIds)}
          size="sm"
          variant="primary"
        >
          Fusionner
        </Button>
      </div>
    </section>
  );
}
