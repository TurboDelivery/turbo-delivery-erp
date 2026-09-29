'use client';

import React from 'react';
import { Button, Drawer, Spinner } from '@heroui-v3/react';
import { Eye, EyeOff, Pencil, PhoneCall, Store, Tag } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';

import { FormulaireCorrection } from './formulaire-correction';
import { FormulaireQualification } from './formulaire-qualification';
import {
  LIBELLES_CANAL,
  LIBELLES_CONSENTEMENT,
  LIBELLES_SEGMENT,
  LIBELLES_STATUT,
  formatFcfa,
  formatJour,
  formatNombre,
  useFicheClientQuery,
  useMesDroitsQuery,
  type IFicheClient,
} from '@/features/bdd-clients';

/**
 * La fiche d'un client, en panneau latéral.
 *
 * <h3>Pourquoi un panneau et pas une page</h3>
 * <p>On ouvre une fiche pour DÉCIDER quelque chose sur la liste : appeler, taguer, écarter.
 * Une page ferait perdre la liste, et donc la place dans le parcours de qualification —
 * quarante fiches d'affilée, quarante allers-retours. Le panneau garde la liste derrière.</p>
 *
 * <h3>L'ordre du contenu suit la question posée</h3>
 * <p>D'abord qui c'est et comment le joindre. Puis ce qu'il vaut, en quatre nombres. Puis
 * chez qui il commande, qui est l'information commerciale. L'historique détaillé et le
 * journal des appels viennent après : on y descend, on n'y commence pas.</p>
 */

function Nombre({ detail, libelle, valeur }: { detail?: string; libelle: string; valeur: string }) {
  return (
    <div className="rounded-medium border border-separator bg-surface-2 px-2.5 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{libelle}</p>
      <p className="text-base font-bold tabular-nums text-foreground">{valeur}</p>
      {detail ? <p className="text-[11px] text-muted">{detail}</p> : null}
    </div>
  );
}

function Corps({
  enClair,
  fiche,
  peutVoirEnClair,
  surBasculerNumero,
}: {
  enClair: boolean;
  fiche: IFicheClient;
  peutVoirEnClair: boolean;
  surBasculerNumero: () => void;
}) {
  const nom = [fiche.nom, fiche.prenom].filter(Boolean).join(' ').trim();
  const [correction, setCorrection] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <p
            className={nom ? 'text-lg font-semibold text-foreground' : 'text-lg italic text-muted'}
          >
            {nom || 'Sans nom'}
          </p>
          {/*
            La correction est un geste d'appoint : un bouton discret, pas une colonne
            d'actions. On vient sur cette fiche pour appeler et pour lire, on corrige
            quand on s'aperçoit que le ticket avait mal orthographié le nom.
          */}
          {correction ? null : (
            <Button
              aria-label="Corriger cette fiche"
              isIconOnly
              onPress={() => setCorrection(true)}
              size="sm"
              variant="ghost"
            >
              <Pencil aria-hidden="true" className="size-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="tabular-nums text-foreground">{fiche.telephone}</p>
          {peutVoirEnClair ? (
            <Button
              onPress={surBasculerNumero}
              size="sm"
              variant="ghost"
            >
              {enClair ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
              {enClair ? 'Masquer' : 'Voir le numéro'}
            </Button>
          ) : null}
        </div>
        {enClair ? (
          <p className="text-xs text-muted">
            Cet affichage est inscrit au journal, à votre nom.
          </p>
        ) : null}
        {fiche.alias.length > 0 ? (
          <p className="text-xs text-muted">aussi connu comme {fiche.alias.join(' · ')}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted">
          {LIBELLES_STATUT[fiche.statut] ?? fiche.statut}
          {fiche.segment ? ` · ${LIBELLES_SEGMENT[fiche.segment] ?? fiche.segment}` : ''}
          {fiche.segmentForce ? ' (posé à la main)' : ''}
          {' · consentement '}
          {fiche.consentement
            ? LIBELLES_CONSENTEMENT[fiche.consentement] ?? fiche.consentement
            : LIBELLES_CONSENTEMENT.NON_RENSEIGNE}
          {fiche.consentement === 'OUI' && fiche.canalPrefere
            ? ` par ${LIBELLES_CANAL[fiche.canalPrefere] ?? fiche.canalPrefere}`
            : ''}
        </p>

        {/*
          Les étiquettes se posaient nulle part et ne s'affichaient nulle part : la
          colonne existait depuis V145 sans que rien ne l'écrive ni ne la lise. Elles
          restent en gris, comme le reste de l'identité — ce sont des repères, pas des
          alertes.
        */}
        {fiche.tags.length > 0 ? (
          <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted">
            <Tag aria-hidden="true" className="size-3.5 shrink-0" />
            {fiche.tags.map((t) => (
              <span className="rounded-small bg-surface-2 px-1.5 py-0.5" key={t}>
                {t}
              </span>
            ))}
          </p>
        ) : null}
      </div>

      {/*
        L'appel vient AVANT l'historique et les chiffres détaillés : c'est le geste, le
        reste est le contexte qu'on lit pendant qu'on compose. Une fiche déjà tranchée —
        rejetée, fusionnée — ne se rappelle pas.
      */}
      {correction ? <FormulaireCorrection fiche={fiche} onFermer={() => setCorrection(false)} /> : null}

      {!correction && (fiche.statut === 'A_QUALIFIER' || fiche.statut === 'INJOIGNABLE') ? (
        <FormulaireQualification fiche={fiche} />
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <Nombre
          detail={`depuis le ${formatJour(fiche.premiereCaptureAt)}`}
          libelle="Captures"
          valeur={formatNombre(fiche.nbCaptures)}
        />
        <Nombre libelle="Restaurants" valeur={formatNombre(fiche.nbPartenaires)} />
        <Nombre
          libelle="Cumulé"
          valeur={fiche.montantCumule > 0 ? formatFcfa(fiche.montantCumule) : '—'}
        />
        {/*
          Le panier moyen est NUL quand aucun montant n'est connu, et c'est différent de
          zéro. Afficher « 0 FCFA » laisserait croire à des commandes gratuites, là où le
          montant n'a simplement pas été saisi — il est facultatif par défaut.
        */}
        <Nombre
          detail={fiche.panierMoyen === null ? 'aucun montant saisi' : undefined}
          libelle="Panier moyen"
          valeur={fiche.panierMoyen === null ? '—' : formatFcfa(fiche.panierMoyen)}
        />
      </div>

      <section>
        <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          Chez qui il commande
        </h3>
        {fiche.parPartenaire.length === 0 ? (
          <p className="text-sm text-muted">Aucune commande enregistrée.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {fiche.parPartenaire.map((p) => (
              <li
                className="flex items-baseline justify-between gap-3 rounded-medium border border-separator px-2.5 py-1.5 text-sm"
                key={p.partenaireId}
              >
                <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                  <Store aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
                  <span className="truncate">{p.partenaire}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  <span className="font-semibold text-foreground">{p.nbCaptures}</span> fois
                  {p.montant > 0 ? ` · ${formatFcfa(p.montant)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          Historique des commandes
        </h3>
        {fiche.captures.length === 0 ? (
          <p className="text-sm text-muted">Aucune commande enregistrée.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {fiche.captures.map((c) => (
              <li
                className="flex items-baseline justify-between gap-3 border-b border-separator pb-1 text-sm last:border-0"
                key={c.id}
              >
                <span className="tabular-nums text-muted">
                  {formatJour(c.dateCommande ?? c.saisiLe)}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted">
                  {c.numCheck ? `check ${c.numCheck}` : 'sans check'}
                  {c.zoneSaisie ? ` · ${c.zoneSaisie}` : ''}
                  {c.source === 'DEMANDE_TURBOYS' ? ' · automatique' : ''}
                </span>
                <span className="shrink-0 tabular-nums text-foreground">
                  {c.montant ? formatFcfa(c.montant) : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          Appels
        </h3>
        {fiche.appels.length === 0 ? (
          <p className="text-sm text-muted">
            Jamais appelé.
            {fiche.tentativesAppel > 0 ? ` ${fiche.tentativesAppel} tentative(s) comptée(s).` : ''}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {fiche.appels.map((a) => (
              <li className="flex flex-col gap-0.5 text-sm" key={a.id}>
                <span className="flex items-baseline gap-2">
                  <PhoneCall aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
                  <span className="tabular-nums text-muted">{formatJour(a.date)}</span>
                  <span className="text-foreground">{a.action}</span>
                  <span className="tabular-nums text-muted">tentative {a.tentative}</span>
                  {a.note !== null ? (
                    <span className="tabular-nums text-muted">note {a.note}/5</span>
                  ) : null}
                </span>
                {a.commentaire ? (
                  <span className="ps-5 text-xs text-muted">{a.commentaire}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {fiche.note ? (
        <section>
          <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">Note</h3>
          <p className="text-sm text-foreground">{fiche.note}</p>
        </section>
      ) : null}
    </div>
  );
}

export function FicheClientPanneau({
  clientId,
  onFermer,
}: {
  clientId: string | null;
  onFermer: () => void;
}) {
  /*
   * ⚠ Le numéro se dévoile ICI, client par client, et cela laisse une trace.
   *
   * L'écran de qualification sert à APPELER : on ne compose pas « 07 •• •• 44 01 ».
   * Le serveur ne rend le numéro complet qu'à la Direction, aux superviseurs et au
   * Marketing, et inscrit au journal qui l'a demandé et pour quelle fiche.
   *
   * Le dévoilement se referme en changeant de client, sans quoi une fiche ouverte le
   * matin dévoilerait toutes les suivantes sans qu'on l'ait redemandé une seule fois.
   */
  const [enClair, setEnClair] = React.useState(false);
  React.useEffect(() => setEnClair(false), [clientId]);
  const { data: droits } = useMesDroitsQuery();

  const { data, isError, isFetching, refetch } = useFicheClientQuery(clientId, enClair);

  return (
    <Drawer.Backdrop isOpen={Boolean(clientId)} onOpenChange={(o) => (o ? null : onFermer())}>
      <Drawer.Content placement="right">
        <Drawer.Dialog className="w-[26rem] max-w-full">
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>
              Fiche client
              {data ? (
                <span className="ms-2 text-sm font-normal tabular-nums text-muted">
                  n° {formatNombre(data.position)}
                </span>
              ) : null}
            </Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body>
            {isError ? (
              <EtatErreur enCours={isFetching} onReessayer={() => void refetch()} quoi="la fiche" />
            ) : !data ? (
              <div className="flex justify-center py-10">
                <Spinner size="sm" />
              </div>
            ) : (
              <Corps
                enClair={enClair}
                fiche={data}
                peutVoirEnClair={Boolean(droits?.peutVoirEnClair)}
                surBasculerNumero={() => setEnClair((p) => !p)}
              />
            )}
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
