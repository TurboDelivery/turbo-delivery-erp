import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AvertissementListeTronquee } from '@/components/commons/AvertissementListeTronquee';
import UserListPerformanceBird from '@/components/dashboard/delivery-men/performance/user-list-performance-bird';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { SelecteurPeriode } from '@/features/performance/components/selecteur-periode';
import { BandeauPeriode } from '@/features/performance/components/bandeau-periode';
import { lirePeriode, requetePeriode, type ParametresPeriode } from '@/features/performance/utils/periode.utils';
import { semaineIsoDepuisLundi } from '@/features/performance/utils/semaine-iso.utils';
import type { TurboyType } from '@/features/turboys/types/turboys.types';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { BoutonExportListe } from '@/features/performance/components/bouton-export-liste';
import { getPerformanceParContrat } from '@/src/performance/performance-flotte.action';
import { BandeauFlotte } from '@/features/performance/components/bandeau-flotte';
import { getCreneauDuLundi, getStatsCreneau } from '@/src/performance/creneau-paie.action';

export const metadata: Metadata = {
    title: 'PERFORMANCE PAR CATÉGORIE',
    description: 'Performance des livreurs d\'une catégorie de contrat',
};

/**
 * Les trois seules valeurs acceptées.
 *
 * <p>Un contrat inconnu dans l'URL rend un 404 plutôt qu'une liste vide : une liste vide se
 * lirait « aucun livreur dans cette catégorie », ce qui serait faux — la catégorie n'existe
 * pas. Le serveur, lui, refuserait la valeur avec une erreur technique illisible.</p>
 */
const CONTRATS: TurboyType[] = ['JOURNALIER', 'INDEPENDANT', 'SUPERVISEUR_LIVREUR'];

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ contrat: string }>;
    searchParams: Promise<ParametresPeriode>;
}) {
    const { contrat } = await params;
    const parametres = await searchParams;

    if (!CONTRATS.includes(contrat as TurboyType)) notFound();

    /*
     * Les quatre granularites de l'exigence 2.3 se ramenent a deux choses : un couple
     * (annee, semaine) quand la periode EST une semaine, une paire de bornes sinon. La
     * resolution est la meme que celle du serveur, et dans le meme ordre de priorite.
     */
    const periode = lirePeriode(parametres);
    const iso = periode.estUneSemaine ? semaineIsoDepuisLundi(periode.lundi) : null;

    const reponse = await getPerformanceParContrat(
        contrat,
        iso?.annee,
        iso?.semaine,
        200,
        periode.debut,
        periode.fin,
    );

    /*
     * La synthese de la flotte vient de la GRILLE DE PAIE du creneau, pas d'un recalcul :
     * c'est ce que le cahier des charges demande au §4.1, et l'arbitrage de l'owner du
     * 14/09 fait de la paie la reference. Le rapprochement se fait sur la date de debut,
     * seule donnee commune entre un creneau de paie et une semaine ISO - deux objets
     * differents qui portent tous deux le mot « semaine ».
     *
     * Les deux lectures s'ENCHAINENT par necessite : les totaux se lisent par identifiant
     * de creneau, qu'il faut donc avoir trouve d'abord.
     *
     * ⚠ La grille de paie n'est lue QUE sur une semaine. Un creneau de paie couvre sept
     * jours ; sur un mois il y en a quatre ou cinq, et montrer les totaux de l'un d'eux
     * serait faux. Sur une periode plus large, c'est `BandeauPeriode` qui prend le relais
     * en additionnant les lignes affichees - une autre grandeur, et il le dit.
     */
    const creneau = periode.estUneSemaine ? await getCreneauDuLundi(periode.lundi) : null;
    const stats = creneau ? await getStatsCreneau(creneau.id) : null;

    const lignes = reponse?.content ?? [];
    const display = getTurboyTypeDisplay(contrat);
    /*
     * Le lien de retour garde la periode ENTIERE, pas seulement la semaine. Ne reporter que
     * `?semaine` ramenait sur l'ecran d'entree en semaine courante apres avoir consulte un
     * mois : on perdait son filtre en remontant d'un niveau.
     */
    const requeteRetour = new URLSearchParams(
        Object.entries(parametres).filter(([, v]) => Boolean(v)) as [string, string][],
    ).toString();
    const requete = requeteRetour ? `?${requeteRetour}` : '';

    return (
        <div className="space-y-4">
            <div>
                <Link
                    className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
                    href={`/delivery-men/performance-flotte${requete}`}
                >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Performance de la flotte
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{display.labelPlural}</h1>
                        <p className="mt-1 text-sm text-muted">
                            {lignes.length} livreur{lignes.length > 1 ? 's' : ''} dans cette catégorie,
                            programmé{lignes.length > 1 ? 's' : ''} ou non.
                        </p>
                    </div>

                    <BoutonExportListe
                        categorie={display.labelPlural}
                        lignes={lignes.map((l) => ({
                            nomComplet: l.nomComplet,
                            nbTickets: l.nbTickets ?? 0,
                            commission: l.commission ?? 0,
                            prime: l.prime ?? 0,
                            // NULLE et non zero : la note se calcule sur les jours
                            // travailles d'un emploi du temps. Le `?? 0` imprimait
                            // « 0,0 % » dans le fichier pour les independants, alors que
                            // l'ecran, lui, rend un tiret.
                            performance: l.performance ?? null,
                            // NUL et non zero : un livreur sans emploi du temps n'a pas
                            // « zero jour programme », il n'a pas ete programme du tout.
                            joursProgrammes: l.creneau ? (l.etats?.length ?? 0) : null,
                        }))}
                        periode={creneau?.label ?? periode.libelle}
                    />
                </div>
            </div>

            <SelecteurPeriode parametres={parametres} />

            {periode.estUneSemaine ? (
                <BandeauFlotte creneau={creneau} stats={stats} />
            ) : (
                <BandeauPeriode libelle={periode.libelle} lignes={lignes} />
            )}

            <AvertissementListeTronquee rendus={lignes.length} total={reponse?.totalElements} />

            {lignes.length === 0 ? (
                <EmptyDataTable title="Aucun livreur dans cette catégorie" />
            ) : (
                <UserListPerformanceBird
                    data={lignes}
                    lienFicheBase="/delivery-men/performance-flotte/livreur"
                    lienFicheRequete={requetePeriode(parametres, { retour: contrat } as ParametresPeriode)}
                />
            )}
        </div>
    );
}
