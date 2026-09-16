'use client';

import { Table } from '@heroui-v3/react';
import { Check, Minus, X } from 'lucide-react';
import React from 'react';

import { getTranslation } from '@/i18n';

import {
  aplatirMenu,
  cleDerogation,
  etatEffectif,
  regleDuCode,
  ROLES_TRIES,
  type EtatDerogations,
} from '@/features/privileges/utils/privileges.utils';

// Colonnes : "Menu / Page" + un rôle par colonne. Un seul tableau mappé
// (pattern React-Aria du codebase).
const COLONNES = [
  { key: '__item', label: 'Menu / Page' },
  ...ROLES_TRIES.map((r) => ({ key: r, label: r })),
];

/**
 * La marque d'une case : autorisé, refusé, ou sans règle.
 *
 * <h3>Ce qui change</h3>
 * <p>« Refusé » était un point médian `·` et « aucune règle » un tiret `—`, tous deux en
 * `text-default-200` — un gris presque blanc. Sur une matrice qui sert à AUDITER qui peut
 * faire quoi, les deux cas se ressemblaient à s'y méprendre et se distinguaient à peine du
 * fond. « Cette page n'a pas de règle » et « ce rôle n'y a pas droit » ne disent pourtant
 * pas la même chose : la première est une lacune de configuration.</p>
 *
 * <p>Aucune des trois marques n'avait de texte : au lecteur d'écran, la matrice entière
 * était une grille de cellules vides. Chacune porte maintenant son sens.</p>
 *
 * <h3>Ce qui a été réglé à la main</h3>
 * <p>La case montre l'état RÉEL — la dérogation quand il y en a une, la règle du code
 * sinon. Sans marque, rien ne distinguerait un droit hérité du code d'un droit posé à la
 * main sur cet écran, et la vue d'ensemble ne dirait plus d'où vient ce qu'elle affiche.
 * La pastille ambrée porte donc ce seul sens : cette case s'écarte du code, et un humain
 * l'a voulu.</p>
 */
function Marque({
  defaut,
  etat,
  reglee,
  role,
  titre,
}: {
  defaut: boolean | null;
  etat: boolean | null;
  reglee: boolean;
  role: string;
  titre: string;
}) {
  const sens = etat === null ? 'aucune règle définie' : etat ? 'autorisé' : 'refusé';
  const origine = reglee
    ? ` (réglé à la main, ${defaut === null ? 'aucune règle dans le code' : `par défaut ${defaut ? 'autorisé' : 'refusé'}`})`
    : '';

  const Icone = etat === null ? Minus : etat ? Check : X;
  /*
   * La coche etait BLANCHE en theme sombre, et pas par choix : `--success` y portait encore
   * un triplet HSL brut herite de shadcn, pose sur le `<body>` lui-meme, ce qui rendait
   * `color: var(--success)` invalide. Le correctif est dans `styles/tailwind.css`, ou il
   * profite a tout l'ERP ; la mesure apres correction donne oklch(0.7329 0.1935 150.81),
   * un vert franc dans les deux themes.
   */
  const teinte = etat === null ? 'text-muted/50' : etat ? 'text-success' : 'text-muted';

  return (
    <span
      className={
        reglee
          ? 'inline-flex rounded-md bg-warning-soft p-0.5 ring-1 ring-warning'
          : 'inline-flex p-0.5'
      }
      title={`${titre} : ${sens}${origine}`}
    >
      {/* Un refus est la regle NORMALE d'une matrice de droits, pas une anomalie :
          il se lit, il ne s'alarme pas. */}
      <Icone aria-hidden="true" className={`size-4 ${teinte}`} />
      <span className="sr-only">{`${titre} — ${role} : ${sens}${origine}`}</span>
    </span>
  );
}

/**
 * La matrice role x ecran, en LECTURE.
 *
 * <p>Elle montre l'etat effectif, derogations en attente d'enregistrement comprises : les
 * deux onglets de l'ecran lisent le meme etat, et ne peuvent donc pas se contredire.</p>
 */
export function PrivilegesMatrix({ derogations = {} }: { derogations?: EtatDerogations }) {
  const { t } = getTranslation();
  const rows = React.useMemo(() => aplatirMenu(), []);

  return (
    <Table>
      <Table.ScrollContainer className="rounded-xl border border-separator">
        <Table.Content aria-label="Matrice des privilèges par rôle">
          <Table.Header>
            {COLONNES.map((c, i) => (
              <Table.Column
                className={
                  c.key === '__item'
                    ? 'sticky left-0 z-10 bg-surface-secondary text-[10px] font-semibold tracking-wide uppercase'
                    : 'text-center text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase'
                }
                id={c.key}
                isRowHeader={i === 0}
                key={c.key}
              >
                {c.label}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row
                className={row.estGroupe ? 'bg-surface-secondary' : undefined}
                id={row.cle}
                key={row.cle}
              >
                {COLONNES.map((c) => {
                  if (c.key === '__item') {
                    return (
                      <Table.Cell className="sticky left-0 z-10 bg-inherit" key={c.key}>
                        {row.estGroupe ? (
                          <span className="font-semibold text-foreground">{t(row.titre)}</span>
                        ) : (
                          <span className="pl-4 text-muted">{t(row.titre)}</span>
                        )}
                      </Table.Cell>
                    );
                  }
                  /*
                   * UN GROUPE N'EST PAS UN SUJET DE DROIT.
                   *
                   * <p>La ligne d'un groupe portait la meme marque « aucune regle definie »
                   * qu'une page reellement non configuree, et le sens de cette marque est
                   * ecrit plus haut : une LACUNE de configuration. Le regroupement des
                   * menus a fait passer les groupes de six a huit et leur a retire leur
                   * regle, puisqu'ils n'en ont pas besoin : leurs enfants portent les
                   * leurs. La matrice annoncait donc huit lacunes inventees, sur l'ecran
                   * meme qui sert a auditer qui peut faire quoi.</p>
                   *
                   * <p>Une ligne de groupe sans regle est un INTITULE. Ses cases restent
                   * vides, et le lecteur d'ecran l'entend comme tel.</p>
                   */
                  if (row.estGroupe && !row.can) {
                    return (
                      <Table.Cell className="text-center" key={c.key}>
                        <span className="sr-only">{`${t(row.titre)} : intitulé de groupe`}</span>
                      </Table.Cell>
                    );
                  }

                  const reglee =
                    Boolean(row.chemin) &&
                    derogations[cleDerogation(c.key, row.chemin!)] !== undefined;

                  return (
                    <Table.Cell className="text-center" key={c.key}>
                      <Marque
                        defaut={regleDuCode(c.key, row)}
                        etat={etatEffectif(c.key, row, derogations)}
                        reglee={reglee}
                        role={c.label}
                        titre={t(row.titre)}
                      />
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
