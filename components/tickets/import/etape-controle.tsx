'use client';

import React from 'react';
import { Button, Chip } from '@heroui-v3/react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Save } from 'lucide-react';

import { formatDateFr } from '@/lib/date-utils';
import { formatNombre } from '@/utils/format.utils';
import type { IVerdictImport } from '@/features/tickets/import/import-tickets.request';
import type { ILigneIncomplete } from '@/features/tickets/import/import-tickets.utils';

/**
 * Contrôler à blanc, puis enregistrer.
 *
 * <h3>Rien ne s'enregistre sans contrôle</h3>
 * <p>Le bouton d'enregistrement reste fermé tant que le contrôle n'a pas tourné. Ce
 * n'est pas une précaution de forme : un import de tickets crée de la paie livreur et
 * de la facturation partenaire, et c'est le contrôle qui dit, AVANT, combien de lignes
 * partiront en TARDIF dans la semaine courante.</p>
 *
 * <h3>Ce que le compte doit toujours vérifier</h3>
 * <p>{@code prêtes + refusées + écartées} fait le nombre de lignes du fichier. Un total
 * qui ne tombe pas juste est le signe qu'une ligne s'est évaporée quelque part, et c'est
 * exactement ce qu'un import ne doit jamais faire en silence.</p>
 */

function Compteur({
  couleur,
  libelle,
  valeur,
}: {
  couleur: 'success' | 'warning' | 'danger' | 'default';
  libelle: string;
  valeur: number;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xl font-semibold tabular-nums text-foreground">
        {formatNombre(valeur)}
      </span>
      <Chip color={couleur} size="sm" variant="soft">
        <Chip.Label>{libelle}</Chip.Label>
      </Chip>
    </div>
  );
}

export function EtapeControle({
  ecartees,
  enregistrement,
  erreur,
  nbLignesFichier,
  onControler,
  onEnregistrer,
  progression,
  referencePar,
  verdicts,
}: {
  ecartees: ILigneIncomplete[];
  enregistrement: boolean;
  erreur: string | null;
  nbLignesFichier: number;
  onControler: () => void;
  onEnregistrer: () => void;
  /** Le code check d'un rang : le seul repère qu'on retrouve dans le tableur d'origine. */
  referencePar: (index: number) => string;
  /** `null` tant qu'aucun enregistrement n'a démarré. */
  progression: { ecrites: number; total: number } | null;
  /** `null` tant que le contrôle n'a pas tourné. */
  verdicts: IVerdictImport[] | null;
}) {
  const controle = verdicts !== null;

  const pretes = React.useMemo(
    () => (verdicts ?? []).filter((v) => v.etat === 'PRET'),
    [verdicts],
  );
  const refusees = React.useMemo(
    () => (verdicts ?? []).filter((v) => v.etat === 'BLOQUE'),
    [verdicts],
  );
  const enregistrees = React.useMemo(
    () => (verdicts ?? []).filter((v) => v.etat === 'ENREGISTRE'),
    [verdicts],
  );
  const tardives = React.useMemo(
    () => pretes.filter((v) => v.statutPrevu === 'TARDIF'),
    [pretes],
  );

  /*
   * Les motifs sont regroupés : vingt lignes refusées pour la même raison, c'est UNE
   * information, pas vingt. La liste brute poussait l'opérateur à faire défiler sans
   * lire, et le motif qui n'apparaissait qu'une fois se perdait dans le tas.
   */
  const motifsGroupes = React.useMemo(() => {
    const parMotif = new Map<string, number[]>();
    for (const verdict of refusees) {
      const motif = verdict.motif ?? 'Refusée sans motif.';
      const vues = parMotif.get(motif);
      if (vues) vues.push(verdict.index);
      else parMotif.set(motif, [verdict.index]);
    }
    for (const incomplete of ecartees) {
      const vues = parMotif.get(incomplete.motif);
      if (vues) vues.push(incomplete.index);
      else parMotif.set(incomplete.motif, [incomplete.index]);
    }
    return [...parMotif.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [ecartees, refusees]);

  /*
   * LA COMMISSION QUE LE SERVEUR APPLIQUERA, montrée.
   *
   * <p>Le serveur la résout ligne par ligne, depuis la version active à la DATE de la
   * course et la zone, et la renvoie dans `commissionPrevue`. L'écran la recevait et la
   * jetait, tout en promettant trois lignes plus haut « la commission que le serveur
   * appliquera ». Un contrôle à blanc qui ne montre pas le montant qu'il a calculé ne
   * sert à rien : c'est précisément ce qu'on vient vérifier avant d'écrire de la paie
   * et de la facture.</p>
   *
   * <p>`null` n'est pas zéro : c'est « le serveur ne sait pas la prévoir », le cas du
   * partenaire dont la commission ne suit pas la règle générale. On le compte à part
   * plutôt que de l'additionner comme un zéro.</p>
   */
  const commission = React.useMemo(() => {
    let somme = 0;
    let imprevisibles = 0;
    for (const verdict of pretes) {
      if (typeof verdict.commissionPrevue === 'number') somme += verdict.commissionPrevue;
      else imprevisibles += 1;
    }
    return { somme, imprevisibles };
  }, [pretes]);

  /*
   * Les alertes sont regroupées comme les motifs, et pour la même raison. Elles
   * n'empêchent pas d'enregistrer, mais « Commission résolue à 0 pour ce partenaire à
   * cette date » sur quarante lignes est une information sur l'argent, pas un détail.
   */
  const alertesGroupees = React.useMemo(() => {
    const parAlerte = new Map<string, number[]>();
    for (const verdict of pretes) {
      for (const alerte of verdict.alertes ?? []) {
        const vues = parAlerte.get(alerte);
        if (vues) vues.push(verdict.index);
        else parAlerte.set(alerte, [verdict.index]);
      }
    }
    return [...parAlerte.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [pretes]);

  const total = pretes.length + enregistrees.length + refusees.length + ecartees.length;
  const compteJuste = !controle || total === nbLignesFichier;

  return (
    <div className="flex flex-col gap-4 rounded-large border border-separator bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
          5. Contrôler et enregistrer
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button isDisabled={enregistrement} onPress={onControler} variant="outline">
            <ClipboardCheck aria-hidden className="size-4" />
            Contrôler sans enregistrer
          </Button>
          <Button
            isDisabled={!controle || pretes.length === 0 || enregistrement}
            onPress={onEnregistrer}
            variant="primary"
          >
            <Save aria-hidden className="size-4" />
            {enregistrement
              ? `Enregistrement… ${formatNombre(progression?.ecrites ?? 0)} / ${formatNombre(progression?.total ?? 0)}`
              : `Enregistrer ${formatNombre(pretes.length)} ticket${pretes.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      {erreur ? <p className="text-sm text-danger">{erreur}</p> : null}

      {!controle ? (
        <p className="text-sm text-muted">
          Le contrôle n’écrit rien. Il dit, ligne par ligne, ce que l’enregistrement
          ferait : la semaine de rattachement, la commission que le serveur appliquera, et
          ce qui serait refusé.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-6">
            <Compteur couleur="success" libelle="prêtes" valeur={pretes.length} />
            {enregistrees.length > 0 ? (
              <Compteur
                couleur="success"
                libelle="enregistrées"
                valeur={enregistrees.length}
              />
            ) : null}
            <Compteur couleur="danger" libelle="refusées" valeur={refusees.length} />
            <Compteur couleur="warning" libelle="écartées avant envoi" valeur={ecartees.length} />
            <Compteur couleur="default" libelle="lignes du fichier" valeur={nbLignesFichier} />
          </div>

          {pretes.length > 0 ? (
            <p className="text-sm text-muted">
              Commission que le serveur appliquera :{' '}
              <span className="font-medium tabular-nums text-foreground">
                {formatNombre(commission.somme)} FCFA
              </span>{' '}
              sur {formatNombre(pretes.length - commission.imprevisibles)} ligne
              {pretes.length - commission.imprevisibles > 1 ? 's' : ''}.
              {commission.imprevisibles > 0
                ? ` ${formatNombre(commission.imprevisibles)} ligne${commission.imprevisibles > 1 ? 's' : ''} dont la commission ne peut pas être prévue : le serveur la posera à l’enregistrement.`
                : ''}
            </p>
          ) : null}

          {!compteJuste ? (
            <p className="inline-flex items-start gap-2 text-sm text-danger">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
              Le compte ne tombe pas juste : {formatNombre(total)} lignes traitées pour{' '}
              {formatNombre(nbLignesFichier)} dans le fichier. N’enregistre pas, et
              signale-le.
            </p>
          ) : null}

          {tardives.length > 0 ? (
            <div className="flex items-start gap-2 rounded-medium border border-warning/40 bg-warning/10 p-3">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-medium text-foreground">
                  {formatNombre(tardives.length)} ligne
                  {tardives.length > 1 ? 's partiront' : ' partira'} en TARDIF
                </p>
                <p className="text-muted">
                  Leur date est hors de la semaine ouverte. Elles seront rattachées au
                  créneau courant
                  {tardives[0].creneauDebut
                    ? ` (du ${formatDateFr(tardives[0].creneauDebut, 'dd/MM/yyyy')} au ${formatDateFr(tardives[0].creneauFin, 'dd/MM/yyyy')})`
                    : ''}
                  , compteront dans sa grille de paiement, et devront passer par la
                  régularisation. C’est le comportement normal d’une saisie en retard,
                  mais sur plusieurs centaines de lignes il se voit sur la paie.
                </p>
              </div>
            </div>
          ) : null}

          {alertesGroupees.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">
                Ce qui passera, mais mérite un regard
              </h3>
              <ul className="flex flex-col gap-1.5">
                {alertesGroupees.map(([alerte, indices]) => (
                  <li className="flex flex-wrap items-baseline gap-2 text-sm" key={alerte}>
                    <Chip color="warning" size="sm" variant="soft">
                      <Chip.Label className="tabular-nums">
                        {formatNombre(indices.length)}
                      </Chip.Label>
                    </Chip>
                    <span className="text-foreground">{alerte}</span>
                    <span className="text-xs text-muted">
                      {indices
                        .slice(0, 10)
                        .map((i) => referencePar(i) || `rang ${i}`)
                        .join(', ')}
                      {indices.length > 10
                        ? `… et ${formatNombre(indices.length - 10)} autres`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {motifsGroupes.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-foreground">
                Ce qui ne passera pas
              </h3>
              <ul className="flex flex-col gap-1.5">
                {motifsGroupes.map(([motif, indices]) => (
                  <li className="flex flex-wrap items-baseline gap-2 text-sm" key={motif}>
                    <Chip color="danger" size="sm" variant="soft">
                      <Chip.Label className="tabular-nums">
                        {formatNombre(indices.length)}
                      </Chip.Label>
                    </Chip>
                    <span className="text-foreground">{motif}</span>
                    <span className="text-xs text-muted">
                      {/* Le CODE CHECK d'abord : c'est ce qu'on cherche dans le tableur.
                          Le rang vient en second, et dix suffisent — au-delà, la liste
                          cesse d'aider et devient du bruit. */}
                      {indices
                        .slice(0, 10)
                        .map((i) => referencePar(i) || `rang ${i}`)
                        .join(', ')}
                      {indices.length > 10
                        ? `… et ${formatNombre(indices.length - 10)} autres`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="inline-flex items-center gap-2 text-sm text-success">
              <CheckCircle2 aria-hidden className="size-4" />
              Aucune ligne refusée.
            </p>
          )}
        </>
      )}
    </div>
  );
}
