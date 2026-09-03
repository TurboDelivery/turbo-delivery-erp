'use client';

import { Card, Separator, Skeleton } from '@heroui-v3/react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import EtatErreur from '@/components/commons/EtatErreur';
import BandeauAttention, { type Signalement } from '@/components/dashboard/apercu/bandeau-attention';
import { TurboysButton } from '@/components/dashboard/apercu/TurboysButton';
import { useComptesEnAttenteQuery } from '@/features/dashboard/queries/comptes-attente.query';
import { usePersonnelStatsQuery } from '@/features/dashboard/queries/personnel-stats.query';

/**
 * Bande de compteurs du haut de tableau de bord.
 *
 * <p>C'étaient CINQ CARTES dans une grille. Comme la carte « Turboys » porte trois lignes
 * de ventilation, la grille alignait toutes les autres sur SA hauteur : « Partenaire
 * Actif » occupait 250 px pour afficher un nombre à deux chiffres. Un tiers de l'écran
 * pour cinq compteurs, dont les quatre cinquièmes étaient du vide.</p>
 *
 * <p>Cinq compteurs de même nature ne sont pas cinq objets : c'est UNE bande. Une seule
 * carte, des colonnes séparées par des traits, chacune à la hauteur de son contenu. La
 * ventilation des Turboys passe sous son chiffre, en petit, au lieu de dicter la hauteur
 * de la rangée entière.</p>
 */
export default function DatabaseCards() {
  const { data, isLoading, isError } = usePersonnelStatsQuery({});
  const {
    data: comptesEnAttente,
    isError: comptesEnAttenteEnErreur,
    isFetching: comptesEnAttenteEnCours,
    refetch: rechargerComptesEnAttente,
  } = useComptesEnAttenteQuery();

  /**
   * Ce qui appelle une ACTION, remonté en tête.
   *
   * <p>Un ÉCHEC de lecture est lui-même un signalement : la version précédente vidait la
   * liste quand la requête échouait, et le bandeau annonçait alors « Rien ne demande
   * d'action immédiate » pendant qu'une carte en erreur s'affichait juste en dessous. Le
   * bandeau se contredisait avec l'écran.</p>
   */
  const signalements: Signalement[] = [
    {
      libelle: 'compte(s) livreur en attente de validation',
      nombre: comptesEnAttente ?? 0,
      ton: 'attention',
      href: '/delivery-men/not-valide',
    },
  ];

  const compteurs = [
    { label: 'Partenaires actifs', value: data?.partenaireActif, href: '/restaurants' },
    { label: 'Turboys', value: data?.turboys, href: '/delivery-men/men' },
    { label: 'Personnel Turbo', value: data?.personnel, href: '/personnel' },
    { label: 'Utilisateurs actifs', value: data?.utilisateurs, href: '/users' },
    // « Comptes en attente » ne figure dans la bande que s'il y en a : a zero, c'est un
    // compteur qui n'appelle rien, et le bandeau du haut le dit deja quand il y en a.
    ...(comptesEnAttenteEnErreur || !comptesEnAttente
      ? []
      : [{ label: 'Comptes en attente', value: comptesEnAttente, href: '/delivery-men/not-valide' }]),
  ];

  return (
    <>
      {/* `etatInconnu` : la lecture a echoue, donc on ne SAIT pas s'il y a des comptes a
          valider. Le bandeau se tait au lieu d'annoncer « rien a signaler », et l'echec est
          dit UNE SEULE FOIS, en ligne compacte sous la bande — avec sa relance. */}
      <BandeauAttention etatInconnu={comptesEnAttenteEnErreur} signalements={signalements} />

      <Card>
        <Card.Content className="flex flex-col divide-y divide-separator p-0 sm:flex-row sm:divide-x sm:divide-y-0">
          {isError && !data ? (
            <div className="flex-1">
              <EtatErreur quoi="les statistiques du personnel" />
            </div>
          ) : (
            compteurs.map((c) => (
              <Link
                key={c.label}
                className="group flex flex-1 basis-0 flex-col gap-0.5 px-5 py-3 transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                href={c.href}
              >
                <span className="flex items-center gap-1 text-xs font-medium text-muted">
                  {c.label}
                  <ChevronRight aria-hidden="true" className="size-3 opacity-0 transition-opacity group-hover:opacity-70" />
                </span>

                {isLoading ? (
                  <Skeleton className="h-8 w-16 rounded-lg" />
                ) : (
                  <span className="text-2xl font-semibold tabular-nums leading-none">{c.value ?? 0}</span>
                )}

                {/* Ventilation sur UNE SEULE ligne.
                    En trois lignes empilees, elle dictait la hauteur de la rangee entiere :
                    « Partenaires actifs » occupait 200 px pour afficher un nombre a deux
                    chiffres, et les quatre cinquiemes de la bande etaient du vide. */}
                {c.label === 'Turboys' && !isLoading && (
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted">
                    <TurboysButton name="ind." param="INDEPENDANT" value={data?.turboysIndependant} />
                    <span aria-hidden="true">·</span>
                    <TurboysButton name="jrn." param="JOURNALIER" value={data?.turboysJournalier} />
                    {data?.turboysSuperviseurLivreur !== undefined && (
                      <>
                        <span aria-hidden="true">·</span>
                        <TurboysButton name="sup." param="SUPERVISEUR_LIVREUR" value={data.turboysSuperviseurLivreur} />
                      </>
                    )}
                  </span>
                )}
              </Link>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Une seule annonce. La version precedente affichait l'echec DEUX FOIS : en
          pastille dans le bandeau, puis en bloc pleine largeur juste dessous. */}
      {comptesEnAttenteEnErreur && (
        <div className="mt-3">
          <EtatErreur
            compact
            enCours={comptesEnAttenteEnCours}
            onReessayer={() => {
              void rechargerComptesEnAttente();
            }}
            quoi="les comptes en attente"
          />
        </div>
      )}
    </>
  );
}
