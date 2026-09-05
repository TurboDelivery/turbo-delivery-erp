'use client';

import { LienBouton } from '@/components/commons/LienBouton';
import { ArrowRight, ShieldAlert } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { usePointagesEnAttenteQuery } from '@/features/trafic/queries/pointages-attente.query';

const LIEN_ARBITRAGE = '/delivery-men/pointages-a-valider';

/**
 * Bandeau d'action : les pointages hors-zone qui attendent un arbitrage.
 *
 * C'est le chaînon manquant entre le pointage et le trafic. Ces livreurs ont
 * pointé loin de leur poste : tant que la décision n'est pas prise, ils
 * n'entrent pas en file — donc ils ne reçoivent aucune course, sans que rien à
 * l'écran ne le signale. Le bandeau ne s'affiche que s'il y a réellement
 * quelque chose à arbitrer.
 */
export function TraficPointagesBanner() {
  const { data, isError, isFetching, refetch } = usePointagesEnAttenteQuery();
  const enAttente = data?.length ?? 0;

  /*
   * Un echec de lecture ne doit PAS se lire comme « rien a arbitrer ».
   *
   * `data?.length ?? 0` rendait 0 quand la requete echouait, et le bandeau
   * disparaissait : l'ecran affirmait implicitement qu'aucun pointage n'attendait,
   * alors que des livreurs pouvaient etre bloques hors de la file sans recevoir la
   * moindre course. C'est la faute que ce projet a deja payee ailleurs — un repli
   * silencieux vers l'etat rassurant.
   */
  if (isError) {
    return (
      <div className="rounded-2xl border border-danger/25 bg-danger-soft">
        <EtatErreur
          compact
          enCours={isFetching}
          onReessayer={() => void refetch()}
          quoi="les pointages en attente"
        />
      </div>
    );
  }

  if (enAttente === 0) return null;

  return (
    /*
     * Le bandeau etait peint en six teintes de palette avec leurs contreparties `dark:`
     * ecrites a la main. Les jetons du theme font les deux.
     */
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/15">
        <ShieldAlert aria-hidden="true" className="size-5 text-warning-soft-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {enAttente} pointage{enAttente > 1 ? 's' : ''} en attente de validation
        </p>
        <p className="text-xs leading-snug text-muted">
          Ces livreurs ne reçoivent aucune course tant que la décision n&apos;est pas prise.
        </p>
      </div>
      {/*
       * Le bouton portait `bg-surface-secondary text-white` : du BLANC sur une surface
       * CLAIRE — son libelle etait invisible en mode clair. Et `as={Link}` etait une prop
       * de la v2, ignoree en silence par le Button v3 : il ne naviguait plus.
       */}
      <LienBouton href={LIEN_ARBITRAGE} taille="sm" variante="primary">
        Arbitrer les pointages
        <ArrowRight aria-hidden="true" className="size-4" />
      </LienBouton>
    </div>
  );
}
