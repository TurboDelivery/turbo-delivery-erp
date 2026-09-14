import { ListOrdered } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { CartesContrat, type SyntheseContrat } from '@/features/performance/components/cartes-contrat';
import { SelecteurPeriode } from '@/features/performance/components/selecteur-periode';
import { BandeauPeriode } from '@/features/performance/components/bandeau-periode';
import { lirePeriode, type ParametresPeriode } from '@/features/performance/utils/periode.utils';
import { semaineIsoDepuisLundi } from '@/features/performance/utils/semaine-iso.utils';
import type { TurboyType } from '@/features/turboys/types/turboys.types';
import { getPerformanceParContrat } from '@/src/performance/performance-flotte.action';
import { AvertissementListeTronquee } from '@/components/commons/AvertissementListeTronquee';
import { BandeauFlotte } from '@/features/performance/components/bandeau-flotte';
import { getCreneauDuLundi, getStatsCreneau } from '@/src/performance/creneau-paie.action';

export const metadata: Metadata = {
    title: 'PERFORMANCE DE LA FLOTTE',
    description: 'Performance des livreurs par catégorie de contrat',
};

/** L'ordre métier, celui de la note de cadrage. */
const CONTRATS: TurboyType[] = ['JOURNALIER', 'INDEPENDANT', 'SUPERVISEUR_LIVREUR'];

/**
 * L'écran d'entrée du module « Performance de la Flotte », exigence 2.1.
 *
 * <h3>Pourquoi les trois cartes comptent depuis la même source que la liste</h3>
 * <p>Chaque carte agrège exactement les lignes que sa liste affichera. Le total d'une carte
 * est donc, par construction, la somme des lignes derrière elle : on peut le vérifier à
 * l'œil en cliquant. C'est le principe qui a rendu le classement des partenaires fiable —
 * il ne recalcule rien, il rejoue la requête de l'écran voisin. Deux sources donneraient
 * deux vérités, et personne ne saurait laquelle est la bonne.</p>
 *
 * <p>Les trois lectures partent EN PARALLÈLE : elles ne dépendent pas l'une de l'autre, et
 * les enchaîner tripleraient l'attente.</p>
 */
export default async function Page({
    searchParams,
}: {
    searchParams: Promise<ParametresPeriode>;
}) {
    const parametres = await searchParams;

    /*
     * Les quatre granularites de l'exigence 2.3, resolues exactement comme cote serveur :
     * une plage l'emporte sur un mois, qui l'emporte sur une annee, qui l'emporte sur une
     * semaine. Deux ordres differents afficheraient un libelle et des chiffres qui ne s'y
     * rapporteraient pas.
     */
    const periode = lirePeriode(parametres);
    const iso = periode.estUneSemaine ? semaineIsoDepuisLundi(periode.lundi) : null;
    const lundi = parametres.semaine;

    /*
     * La synthese de la flotte vient de la GRILLE DE PAIE du creneau, pas d'un recalcul :
     * c'est ce que le cahier des charges demande au §4.1, et l'arbitrage de l'owner du
     * 14/09 fait de la paie la reference. Le rapprochement se fait sur la date de debut,
     * seule donnee commune entre un creneau de paie et une semaine ISO - deux objets
     * differents qui portent tous deux le mot « semaine ».
     *
     * Les deux lectures s'ENCHAINENT par necessite : les totaux se lisent par identifiant
     * de creneau, qu'il faut donc avoir trouve d'abord.
     */
    const creneau = periode.estUneSemaine ? await getCreneauDuLundi(periode.lundi) : null;
    const stats = creneau ? await getStatsCreneau(creneau.id) : null;

    const reponses = await Promise.all(
        CONTRATS.map((c) =>
            getPerformanceParContrat(c, iso?.annee, iso?.semaine, 200, periode.debut, periode.fin),
        ),
    );

    const syntheses: SyntheseContrat[] = CONTRATS.map((contrat, i) => {
        const lignes = reponses[i]?.content ?? [];

        return {
            contrat,
            livreurs: lignes.length,
            /*
             * `creneau` est NUL quand aucun emploi du temps n'existe pour la semaine lue :
             * c'est la marque d'un livreur non programmé, pas d'une absence de donnée.
             *
             * ⚠ Sur une période de PLUSIEURS semaines, le serveur ne rend plus de créneau du
             * tout - un créneau est une semaine. Compter les lignes qui en portent un
             * donnerait zéro, et la carte annoncerait « Programmés : 0 » sur un mois entier.
             */
            programmes: periode.estUneSemaine ? lignes.filter((l) => l.creneau != null).length : null,
            nbTickets: lignes.reduce((n, l) => n + (l.nbTickets ?? 0), 0),
            commission: lignes.reduce((n, l) => n + (l.commission ?? 0), 0),
            prime: lignes.reduce((n, l) => n + (l.prime ?? 0), 0),
        };
    });

    return (
        <div className="space-y-4">
            <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Performance de la flotte</h1>
                        <p className="mt-1 text-sm text-muted">
                            Trois catégories de contrat. Cliquez sur une carte pour ouvrir sa liste.
                        </p>
                    </div>

                    {/*
                     * Un LIEN, pas un bouton : la semaine est deja dans l'URL, il suffit de la
                     * recopier pour que le classement arrive filtre comme cet ecran.
                     */}
                    <Link
                        className="inline-flex items-center gap-1.5 rounded-medium border border-default-200 px-3 py-2 text-sm font-medium text-foreground hover:border-default-400"
                        /*
                         * ⚠ Seule la SEMAINE se reporte sur le classement, pas le mois ni la
                         * plage : le classement compare a la semaine PRECEDENTE pour donner sa
                         * colonne d'evolution, il est hebdomadaire par construction. Lui
                         * passer un mois donnerait un classement muet sur son propre critere.
                         */
                        href={`/delivery-men/performance-flotte/classement${lundi ? `?semaine=${lundi}` : ''}`}
                    >
                        <ListOrdered aria-hidden="true" className="size-4" />
                        Classement des livreurs
                    </Link>
                </div>
            </div>

            <SelecteurPeriode parametres={parametres} />

            {periode.estUneSemaine ? (
                <BandeauFlotte creneau={creneau} stats={stats} />
            ) : (
                <BandeauPeriode
                    libelle={periode.libelle}
                    lignes={reponses.flatMap((r) => r?.content ?? [])}
                />
            )}

            {/*
              * Les cartes somment les lignes RECUES, une page de 200. La page de categorie
              * voisine porte deja ce garde-fou ; sans lui ici, une categorie qui depasserait
              * 200 livreurs afficherait un total ampute SANS un mot, alors que l'ecran d'a
              * cote, lui, le dirait. Deux ecrans du meme module ne peuvent pas traiter le
              * meme risque de deux facons opposees.
              */}
            <AvertissementListeTronquee
                rendus={syntheses.reduce((n, s) => n + s.livreurs, 0)}
                total={reponses.reduce((n, r) => n + (r?.totalElements ?? 0), 0)}
            />

            <CartesContrat parametres={parametres} syntheses={syntheses} />

            {/*
             * CE QUE LE MODULE NE MONTRE PAS, ET POURQUOI.
             *
             * Le cahier des charges demande une repartition ASSIGNE / BIRD (§2.4, §3.6 et
             * tableau 4). Cette donnee n'est enregistree ni sur la course ni sur le ticket :
             * c'est un attribut du livreur, ecrase sans historique. L'owner a tranche le
             * 14/09 de ne pas l'ecrire pour l'instant.
             *
             * Le dire ici coute une phrase. Se taire laisserait chercher un bloc absent, ou
             * pire, laisserait croire que la repartition est de zero a zero.
             */}
            <p className="rounded-lg bg-surface-secondary px-4 py-3 text-xs text-muted">
                La répartition entre courses assignées et courses bird n&apos;est pas affichée :
                cette information n&apos;est enregistrée ni sur la course ni sur le ticket. Elle
                attend une décision sur son enregistrement.
            </p>
        </div>
    );
}
