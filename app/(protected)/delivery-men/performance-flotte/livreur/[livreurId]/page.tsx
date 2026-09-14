import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { BoutonExportFiche } from '@/features/performance/components/bouton-export-fiche';
import { DetailJournalier } from '@/features/performance/components/detail-journalier';
import { SelecteurSemaine } from '@/features/performance/components/selecteur-semaine';
import { lundiDeLaSemaineEnCours } from '@/features/performance/utils/semaine-iso.utils';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { getCreneauDuLundi } from '@/src/performance/creneau-paie.action';
import { getLignePaieLivreur } from '@/src/performance/fiche-livreur.action';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';

export const metadata: Metadata = {
    title: 'FICHE DE PERFORMANCE',
    description: 'Performance d\'un livreur sur une semaine',
};

/**
 * Masque un numéro de paiement : `07 ** ** ** 42`.
 *
 * <p>Le cahier des charges le note lui-même au tableau 5 : le numéro Wave est une « donnée
 * de paiement, non destinée à un affichage public/large ». Il doit être reconnaissable par
 * celui qui le connaît, sans être lisible par-dessus une épaule.</p>
 */
function masquer(numero: string | null): string {
    if (!numero) return '—';
    const chiffres = numero.replace(/\s/g, '');
    if (chiffres.length < 5) return '••••';
    return `${chiffres.slice(0, 2)} •• •• •• ${chiffres.slice(-2)}`;
}

/**
 * La fiche de performance d'un livreur, exigence 2.4.
 *
 * <h3>Une seule source pour l'argent</h3>
 * <p>Tous les montants viennent de la LIGNE DE PAIE du créneau : tickets, brut, taux, bonus,
 * déductions, net à payer, et le détail course par course. C'est l'arbitrage de l'owner du
 * 14/09 — la grille de paie fait référence — et c'est ce qui garantit que le cumul d'un jour
 * est la somme des lignes qu'on déplie sous lui.</p>
 *
 * <p>Un second calcul, même juste, aurait fini par diverger de ce qui est réellement payé.</p>
 */
export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ livreurId: string }>;
    searchParams: Promise<{ semaine?: string; retour?: string }>;
}) {
    const { livreurId } = await params;
    const { semaine: lundi, retour } = await searchParams;

    const creneau = await getCreneauDuLundi(lundi ?? lundiDeLaSemaineEnCours());
    const ligne = creneau ? await getLignePaieLivreur(creneau.id, livreurId) : null;

    const requete = lundi ? `?semaine=${lundi}` : '';
    const cheminRetour = retour
        ? `/delivery-men/performance-flotte/${retour}${requete}`
        : `/delivery-men/performance-flotte${requete}`;

    const display = getTurboyTypeDisplay(ligne?.typeLivreur);

    return (
        <div className="space-y-4">
            <div>
                <Link
                    className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
                    href={cheminRetour}
                >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Retour à la liste
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="text-2xl font-bold text-foreground">
                        {ligne?.turboy?.nom ?? 'Livreur'}
                    </h1>
                    {ligne && creneau && <BoutonExportFiche ligne={ligne} periode={creneau.label} />}
                </div>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                    {ligne?.turboy?.code && <span>Code {ligne.turboy.code}</span>}
                    {ligne?.typeLivreur && <span>· {display.label}</span>}
                    {ligne?.turboy?.telephone && <span>· {ligne.turboy.telephone}</span>}
                    <span>· Paiement {masquer(ligne?.numeroWave ?? null)}</span>
                </p>
            </div>

            <SelecteurSemaine semaine={lundi} />

            {!creneau ? (
                <p className="rounded-lg bg-surface-secondary px-4 py-3 text-sm text-muted">
                    Aucun créneau de paie ne couvre cette semaine.
                </p>
            ) : !ligne ? (
                /*
                 * Pas de ligne de paie : le livreur n'a pas ete paye cette semaine-la. C'est
                 * un FAIT, pas une panne, et la fiche doit le dire au lieu d'afficher des
                 * zeros qui se liraient comme une mesure.
                 */
                <p className="rounded-lg bg-surface-secondary px-4 py-3 text-sm text-muted">
                    Ce livreur n&apos;a aucune ligne de paie sur le créneau «&nbsp;{creneau.label}&nbsp;» :
                    il n&apos;a pas été payé cette semaine-là.
                </p>
            ) : (
                <>
                    <GrilleStats className="xl:grid-cols-4" colonnes={2}>
                        <CarteStat
                            libelle="Livraisons"
                            note={`Frais générés ${formatMontant(ligne.totalFraisLivraison ?? 0)}`}
                            ton="danger"
                            valeur={formatNumber(ligne.tickets)}
                        />
                        <CarteStat
                            libelle="Montant brut"
                            note={ligne.taux != null ? `Taux appliqué ${ligne.taux} %${ligne.tauxManuel ? ' (manuel)' : ''}` : undefined}
                            ton="neutre"
                            valeur={formatMontant(ligne.brut)}
                        />
                        <CarteStat
                            libelle="Prime et bonus"
                            note={ligne.bonusEligibilite ?? undefined}
                            ton="neutre"
                            valeur={formatMontant((ligne.prime ?? 0) + (ligne.bonus ?? 0))}
                        />
                        {/* Le net est ce qui sort en argent : c'est lui qui appelle un geste. */}
                        <CarteStat
                            libelle="Net à payer"
                            note={
                                ligne.deductions
                                    ? `Après ${formatMontant(ligne.deductions)} de déductions`
                                    : 'Aucune déduction'
                            }
                            ton="attention"
                            valeur={formatMontant(ligne.netAPayer)}
                        />
                    </GrilleStats>

                    {/*
                     * Une ligne exclue de la paie ne se devine pas : elle porte le meme net
                     * qu'une autre. Le motif de l'exclusion est la seule chose qui distingue
                     * les deux, il doit donc etre lisible sur la fiche.
                     */}
                    {ligne.inclusDansPaie === false && (
                        <p className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-soft-foreground">
                            Cette ligne est <strong>exclue de la paie</strong> du créneau
                            {ligne.inclusPaieMotif ? ` : ${ligne.inclusPaieMotif}` : '.'}
                        </p>
                    )}

                    <section className="space-y-2">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Détail par jour</h2>
                            <p className="text-sm text-muted">
                                Chaque journée se déplie sur ses courses : heure, référence,
                                partenaire et montant.
                            </p>
                        </div>

                        <DetailJournalier tickets={ligne.ticketDetails ?? []} />
                    </section>

                    <p className="text-xs text-muted">
                        Chiffres de la grille de paie du créneau «&nbsp;{creneau.label}&nbsp;». Le
                        cumul d&apos;une journée est la somme des courses dépliées sous elle.
                    </p>
                </>
            )}
        </div>
    );
}
