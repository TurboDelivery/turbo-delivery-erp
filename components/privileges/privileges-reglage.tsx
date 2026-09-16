'use client';

import { Button, Chip, Switch } from '@heroui-v3/react';
import { Lock, RotateCcw } from 'lucide-react';
import React from 'react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { getTranslation } from '@/i18n';
import {
  aplatirMenu,
  cleDerogation,
  etatEffectif,
  regleDuCode,
  ROLES_TRIES,
  verrou,
  type EntreeMenu,
  type EtatDerogations,
} from '@/features/privileges/utils/privileges.utils';

/**
 * Le reglage des acces d'UN role.
 *
 * <h3>Pourquoi un role a la fois, et pas la matrice</h3>
 * <p>La matrice repond a « qui peut ouvrir cet ecran ». Le geste demande ici est l'autre :
 * « cette personne ne doit plus voir les depenses ». Il part d'un role et descend sa liste
 * d'ecrans. Le faire dans une grille de quinze colonnes qui defile de cote obligerait a
 * suivre une colonne des yeux sur soixante lignes, en la perdant a chaque defilement.</p>
 *
 * <p>La matrice reste, en vue d'ensemble : elle montre desormais l'etat REEL, derogations
 * comprises, et marque les cases reglees a la main.</p>
 */
export function PrivilegesReglage({
  derogations,
  onChange,
  onRetablirRole,
  onRoleChange,
  role,
}: {
  derogations: EtatDerogations;
  onChange: (role: string, chemin: string, autorise: boolean) => void;
  onRetablirRole: (role: string) => void;
  onRoleChange: (role: string) => void;
  role: string;
}) {
  // Le meme dictionnaire que la barre laterale : sans lui on lisait « dashboard » ici et
  // « Tableau de bord » a trois centimetres de la, pour la meme entree.
  const { t } = getTranslation();

  const lignes = React.useMemo(() => aplatirMenu(), []);

  // Un groupe n'est qu'un intitule : seules les entrees qui portent un CHEMIN se reglent.
  const ecrans = React.useMemo(() => lignes.filter((l) => l.chemin), [lignes]);

  const visibles = ecrans.filter((e) => etatEffectif(role, e, derogations) === true).length;
  const regles = ecrans.filter(
    (e) => derogations[cleDerogation(role, e.chemin!)] !== undefined,
  ).length;

  /*
   * Les ecrans ranges sous leur groupe, dans l'ordre du menu. Le groupe est le seul
   * reperage dont dispose l'operateur : « Depenses » ne lui dit rien hors de « Finance ».
   */
  const parGroupe = React.useMemo(() => {
    const paquets: { groupe: string; ecrans: EntreeMenu[] }[] = [];
    for (const e of ecrans) {
      // Une entree de premier niveau n'a pas de groupe, et la barre laterale ne lui en
      // invente pas. Un intitule pose ici paraissait DEUX fois — en haut pour le tableau
      // de bord, en bas pour les notifications et les parametres — et laissait croire a
      // deux sections distinctes portant le meme nom.
      const nom = e.groupe ? t(e.groupe) : '';
      const dernier = paquets[paquets.length - 1];
      if (dernier && dernier.groupe === nom) dernier.ecrans.push(e);
      else paquets.push({ groupe: nom, ecrans: [e] });
    }
    return paquets;
  }, [ecrans, t]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-xs">
          <ChampListe
            label="Rôle à régler"
            onChange={(v) => v && onRoleChange(v)}
            options={ROLES_TRIES.map((r) => ({ label: r, value: r }))}
            valeur={role}
          />
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-muted">
            <span className="font-semibold tabular-nums text-foreground">{visibles}</span> écran
            {visibles > 1 ? 's' : ''} visible{visibles > 1 ? 's' : ''} sur{' '}
            <span className="tabular-nums">{ecrans.length}</span>
            {regles > 0 && (
              <>
                {' · '}
                <span className="tabular-nums">{regles}</span> réglé{regles > 1 ? 's' : ''} à la main
              </>
            )}
          </p>
          {regles > 0 && (
            <Button onPress={() => onRetablirRole(role)} size="sm" variant="ghost">
              <RotateCcw aria-hidden="true" className="size-4" />
              Rétablir le code
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {parGroupe.map(({ groupe, ecrans: lignesDuGroupe }) => (
          <section key={groupe || lignesDuGroupe[0].cle}>
            {groupe && (
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {groupe}
              </h3>
            )}
            <ul className="divide-y divide-separator rounded-xl border border-separator">
              {lignesDuGroupe.map((e) => {
                const chemin = e.chemin!;
                const defaut = regleDuCode(role, e);
                const effectif = etatEffectif(role, e, derogations);
                const derogue = derogations[cleDerogation(role, chemin)] !== undefined;
                const raisonVerrou = verrou(role, chemin, effectif);

                return (
                  <li className="flex items-center gap-3 px-3 py-2.5" key={e.cle}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{t(e.titre)}</p>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        <span className="truncate">{chemin}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {defaut === null
                            ? 'aucune règle dans le code'
                            : `par défaut ${defaut ? 'autorisé' : 'refusé'}`}
                        </span>
                        {derogue && (
                          <Chip color="warning" size="sm" variant="soft">
                            <Chip.Label>réglé à la main</Chip.Label>
                          </Chip>
                        )}
                      </p>
                      {raisonVerrou && (
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted">
                          <Lock aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
                          {raisonVerrou}
                        </p>
                      )}
                    </div>

                    <Switch
                      aria-label={`${t(e.titre)} — ${role}`}
                      isDisabled={Boolean(raisonVerrou)}
                      isSelected={effectif === true}
                      onChange={(v: boolean) => onChange(role, chemin, v)}
                      size="sm"
                    >
                      {/*
                       * `Switch.Content` n'est pas decoratif : c'est LUI qui rend le
                       * `<label>` et la case a cocher masquee de React Aria. Sans lui, le
                       * composant rend un simple `<div>` — sans role, sans champ, sans
                       * clavier — qui ne reagit a aucun clic. Le build passe au vert et
                       * l'interrupteur est mort.
                       */}
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
