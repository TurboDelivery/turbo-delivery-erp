'use client';

import { Drawer, Spinner } from '@heroui-v3/react';
import { PhoneCall, Store } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import {
  LIBELLES_CONSENTEMENT,
  LIBELLES_SEGMENT,
  LIBELLES_STATUT,
  formatFcfa,
  formatJour,
  formatNombre,
  useFicheClientQuery,
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

function Corps({ fiche }: { fiche: IFicheClient }) {
  const nom = [fiche.nom, fiche.prenom].filter(Boolean).join(' ').trim();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className={nom ? 'text-lg font-semibold text-foreground' : 'text-lg italic text-muted'}>
          {nom || 'Sans nom'}
        </p>
        <p className="tabular-nums text-foreground">{fiche.telephone}</p>
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
        </p>
      </div>

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
  const { data, isError, isFetching, refetch } = useFicheClientQuery(clientId);

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
              <Corps fiche={data} />
            )}
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
