import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { BoutonExportClassement } from '@/features/performance/components/bouton-export-classement';
import { ClassementLivreursTable } from '@/features/performance/components/classement-livreurs-table';
import { SelecteurSemaine } from '@/features/performance/components/selecteur-semaine';
import { semaineIsoDepuisLundi } from '@/features/performance/utils/semaine-iso.utils';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { getClassementLivreurs } from '@/src/performance/classement-livreurs.action';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';

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

    const classement = await getClassementLivreurs({
        annee: iso?.annee,
        semaine: iso?.semaine,
        tri,
        sens,
        contrat,
    });

    const requete = lundi ? `?semaine=${lundi}` : '';
    const lignes = classement?.lignes ?? [];
    const totaux = classement?.totaux;
    const periode = classement ? `Semaine ${classement.semaine} — ${classement.debut} au ${classement.fin}` : '';

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
                        <h1 className="text-2xl font-bold text-foreground">Classement des livreurs</h1>
                        <p className="mt-1 text-sm text-muted">
                            {classement
                                ? `${periode} · classé par ${LIBELLE_TRI[classement.tri] ?? classement.tri.toLowerCase()}${classement.contrat ? ` · ${getTurboyTypeDisplay(classement.contrat).labelPlural.toLowerCase()}` : ''}`
                                : 'Classement indisponible'}
                        </p>
                    </div>

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
                </div>
            </div>

            <SelecteurSemaine semaine={lundi} />

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

            {totaux && (
                <GrilleStats className="xl:grid-cols-4" colonnes={2}>
                    <CarteStat
                        libelle="Livreurs classés"
                        note={`${formatNumber(totaux.nbAyantRoule)} ont roulé cette semaine`}
                        ton="neutre"
                        valeur={formatNumber(totaux.nbLivreurs)}
                    />
                    <CarteStat libelle="Livraisons" ton="danger" valeur={formatNumber(totaux.nbTickets)} />
                    <CarteStat libelle="Commission" ton="neutre" valeur={formatMontant(totaux.commission)} />
                    <CarteStat
                        libelle="Gain total"
                        note="Commission et prime cumulées"
                        ton="attention"
                        valeur={formatMontant(totaux.gain)}
                    />
                </GrilleStats>
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
        </div>
    );
}
