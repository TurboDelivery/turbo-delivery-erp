import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { BoutonExportClassement } from '@/features/performance/components/bouton-export-classement';
import { ClassementLivreursTable } from '@/features/performance/components/classement-livreurs-table';
import { SelecteurSemaine } from '@/features/performance/components/selecteur-semaine';
import { lundiDeLaSemaineEnCours, semaineIsoDepuisLundi } from '@/features/performance/utils/semaine-iso.utils';
import { BandeauFlotte } from '@/features/performance/components/bandeau-flotte';
import { getCreneauDuLundi, getStatsCreneau } from '@/src/performance/creneau-paie.action';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { getClassementLivreurs } from '@/src/performance/classement-livreurs.action';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';
import {
    AnnonceFiltre,
    ContenuFiltre,
    ZoneFiltre,
} from '@/features/performance/components/zone-filtre';
import { SignalLien } from '@/features/performance/components/zone-filtre';

export const metadata: Metadata = {
    title: 'CLASSEMENT DES LIVREURS',
    description: 'Classement de la flotte sur une semaine',
};

/** Les libellés des critères, dans l'ordre où l'écran les propose. */
const LIBELLE_TRI: Record<string, string> = {
    LIVRAISONS: 'nombre de livraisons',
    GAIN: 'gain de la semaine',
    COMMISSION: 'commission',
    PRIME: 'prime',
    JOURS_TRAVAILLES: 'jours travaillés',
};

/**
 * Le classement de la flotte, exigences 3.3 et 3.4.
 *
 * <h3>C'est le SERVEUR qui nomme l'écran</h3>
 * <p>Le tri affiché est celui que le serveur a appliqué, pas celui que l'URL demandait. Les
 * deux diffèrent quand un paramètre est illisible : le serveur retombe alors sur son défaut
 * et le dit. Un en-tête qui annoncerait un tri non appliqué serait un mensonge silencieux,
 * et c'est exactement ce que ce bloc empêche.</p>
 */
export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ semaine?: string; tri?: string; sens?: string; contrat?: string }>;
}) {
    const { semaine: lundi, tri, sens, contrat } = await searchParams;
    const iso = lundi ? semaineIsoDepuisLundi(lundi) : undefined;

    /*
     * LA SYNTHESE VIENT DE LA GRILLE DE PAIE, comme sur les deux autres ecrans du module.
     *
     * <p>Le bandeau affichait jusqu'ici les totaux RECALCULES du classement. Ils sont justes,
     * mais ils bougent : un ticket enregistre ou retire apres la cloture du creneau les
     * change. La grille de paie, elle, fige ses chiffres a la cloture — c'est ce qui en fait
     * la reference, et c'est l'arbitrage de l'owner du 14/09.</p>
     *
     * <p>Sans semaine dans l'URL, l'ecran lit la semaine EN COURS : c'est deja ce que fait le
     * serveur pour le classement, et les deux blocs doivent regarder la meme semaine.</p>
     *
     * <p>Les deux lectures ne dependent pas l'une de l'autre et partent ensemble. Seul le
     * couple creneau puis grille s'enchaine : les totaux se lisent par identifiant de creneau.</p>
     */
    const lundiEffectif = lundi || lundiDeLaSemaineEnCours();

    const lecturePaie = (async () => {
        const c = await getCreneauDuLundi(lundiEffectif);
        return { creneau: c, stats: c ? await getStatsCreneau(c.id) : null };
    })();

    const [classement, { creneau, stats }] = await Promise.all([
        getClassementLivreurs({
            annee: iso?.annee,
            semaine: iso?.semaine,
            tri,
            sens,
            contrat,
        }),
        lecturePaie,
    ]);

    const requete = lundi ? `?semaine=${lundi}` : '';
    const lignes = classement?.lignes ?? [];
    const totaux = classement?.totaux;
    const periode = classement ? `Semaine ${classement.semaine} — ${classement.debut} au ${classement.fin}` : '';

    return (
        <ZoneFiltre className="space-y-4">
            <div>
                <Link
                    className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
                    href={`/delivery-men/performance-flotte${requete}`}
                >
                    <SignalLien><ArrowLeft aria-hidden="true" className="size-4" /></SignalLien>
                    Performance de la flotte
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Classement des livreurs</h1>
                    {/*
                      * Ces deux fragments sortent de la lecture, donc ils sont perimes eux
                      * aussi pendant qu'une autre arrive. Les estomper avec le reste les rend
                      * inertes : sans cela, on exporte en tableur la periode qu'on vient de
                      * quitter, et rien a l'ecran ne l'avait signale.
                      */}
                        <ContenuFiltre>
                        <p className="mt-1 text-sm text-muted">
                            {classement
                                ? `${periode} · classé par ${LIBELLE_TRI[classement.tri] ?? classement.tri.toLowerCase()}${classement.contrat ? ` · ${getTurboyTypeDisplay(classement.contrat).labelPlural.toLowerCase()}` : ''}`
                                : 'Classement indisponible'}
                        </p>
                        </ContenuFiltre>
                    </div>

                    <ContenuFiltre>
                    <BoutonExportClassement
                        lignes={lignes.map((l) => ({
                            rang: l.rang,
                            nom: l.nom ?? l.livreurId,
                            contrat: l.contrat ? getTurboyTypeDisplay(l.contrat).label : '',
                            nbTickets: l.nbTickets,
                            gain: l.gain,
                            joursTravailles: l.joursTravailles,
                            tendance: l.tendance?.libelle ?? null,
                        }))}
                        periode={periode}
                        tri={LIBELLE_TRI[classement?.tri ?? ''] ?? (classement?.tri ?? '')}
                    />
                    </ContenuFiltre>
                </div>
            </div>

            <AnnonceFiltre />

            <SelecteurSemaine semaine={lundi} />

            <ContenuFiltre className="space-y-4">
            {/*
             * Les parametres ECARTES par le serveur, dits a l'ecran. Un lien ancien peut
             * porter un critere qui n'existe plus : le serveur tranche au lieu de rendre 400,
             * et sans cette ligne l'ecran afficherait un classement different de celui que
             * l'URL semble demander.
             */}
            {classement && classement.parametresIgnores.length > 0 && (
                <p className="text-xs text-warning-soft-foreground">
                    Paramètres ignorés : {classement.parametresIgnores.join(', ')}. Le classement
                    ci-dessous applique les valeurs par défaut.
                </p>
            )}

            {/*
              * La grille de paie du creneau : les memes chiffres que les deux autres ecrans
              * du module, figes a la cloture.
              */}
            <BandeauFlotte creneau={creneau} stats={stats} />

            {/*
              * CE QUE COMPTE LE CLASSEMENT CI-DESSOUS, et qui n'est pas la meme chose.
              *
              * Ces totaux etaient presentes en cartes, a la place de la grille de paie : ils
              * paraissaient donc etre LA synthese de la semaine, alors qu'ils comptent une
              * autre population, par date de course et non par ticket valide du creneau, et
              * qu'ils bougent apres la cloture. Ils restent — aucun chiffre ne disparait —
              * mais a leur place, sous le bandeau qui fait reference, et nommes.
              */}
            {totaux && (
                <p className="text-xs text-muted">
                    Le classement ci-dessous porte sur{' '}
                    <strong className="font-semibold text-foreground">
                        {formatNumber(totaux.nbLivreurs)} livreurs
                    </strong>
                    , dont {formatNumber(totaux.nbAyantRoule)} ont roulé cette semaine :{' '}
                    {formatNumber(totaux.nbTickets)} livraisons, {formatMontant(totaux.commission)} de
                    commission et {formatMontant(totaux.prime)} de prime, soit{' '}
                    {formatMontant(totaux.gain)} de gain cumulé. Ces totaux sont comptés par date
                    de course et se recalculent à chaque lecture, contrairement à ceux du bandeau.
                </p>
            )}

            {/*
             * La colonne de tendance est VIDE quand la semaine precedente n'a rien a
             * comparer. Le dire evite qu'une colonne vide se lise comme un defaut.
             */}
            {classement?.tendanceIndisponible && (
                <p className="rounded-lg bg-surface-secondary px-4 py-3 text-xs text-muted">
                    Aucune activité la semaine précédente : la colonne d&apos;évolution reste vide,
                    il n&apos;y a rien à comparer.
                </p>
            )}

            <ClassementLivreursTable
                lienFicheBase="/delivery-men/performance-flotte/livreur"
                lienFicheRequete={lundi ? `?semaine=${lundi}` : ''}
                lignes={lignes}
            />

            <p className="text-xs text-muted">
                Le rang porte les ex æquo : deux livreurs à égalité partagent leur place, et le
                suivant saute d&apos;autant. Un tiret dans «&nbsp;Jours travaillés&nbsp;» signale un
                livreur sans emploi du temps : il n&apos;est pas classé sur ce critère.
            </p>
            </ContenuFiltre>
        </ZoneFiltre>
    );
}
