import { ListOrdered } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { CartesContrat, type SyntheseContrat } from '@/features/performance/components/cartes-contrat';
import { formatMontant } from '@/utils/format.utils';
import { SelecteurPeriode } from '@/features/performance/components/selecteur-periode';
import { BandeauPeriode } from '@/features/performance/components/bandeau-periode';
import { lirePeriode, type ParametresPeriode } from '@/features/performance/utils/periode.utils';
import { semaineIsoDepuisLundi } from '@/features/performance/utils/semaine-iso.utils';
import type { TurboyType } from '@/features/turboys/types/turboys.types';
import { getPerformanceParContrat } from '@/src/performance/performance-flotte.action';
import { AvertissementListeTronquee } from '@/components/commons/AvertissementListeTronquee';
import { BandeauFlotte } from '@/features/performance/components/bandeau-flotte';
import { getCreneauDuLundi, getStatsCreneau } from '@/src/performance/creneau-paie.action';
import {
    AnnonceFiltre,
    ContenuFiltre,
    ZoneFiltre,
} from '@/features/performance/components/zone-filtre';
import { SignalLien } from '@/features/performance/components/zone-filtre';

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
    /*
     * LES DEUX FAMILLES DE LECTURE PARTENT ENSEMBLE.
     *
     * <p>La grille de paie et la performance des livreurs ne dependent pas l'une de l'autre :
     * rien dans la seconde n'a besoin de l'identifiant du creneau. Les enchainer ajoutait
     * pourtant leurs attentes bout a bout. Mesure du 15/09 en production : `/api/creneaux`
     * coute 2,2 a 2,5 s a lui seul - 18 lignes, mais chacune porte ses agregats - et les
     * lectures de performance 0,5 a 1,0 s chacune. En serie, l'ecran attendait la somme.</p>
     *
     * <p>Seul le couple creneau puis grille reste enchaine, par necessite : les totaux se
     * lisent par identifiant de creneau, qu'il faut donc avoir trouve d'abord.</p>
     */
    const lecturePaie = (async () => {
        const c = periode.estUneSemaine ? await getCreneauDuLundi(periode.lundi) : null;
        return { creneau: c, stats: c ? await getStatsCreneau(c.id) : null };
    })();

    const lecturePerformance = Promise.all(
        CONTRATS.map((c) =>
            getPerformanceParContrat(c, iso?.annee, iso?.semaine, 200, periode.debut, periode.fin),
        ),
    );

    const [{ creneau, stats }, reponses] = await Promise.all([lecturePaie, lecturePerformance]);

    /*
     * LES CARTES LISENT LA GRILLE DE PAIE, PAS UN RECALCUL.
     *
     * C'est le meme principe que le bandeau juste au-dessus, et il a manque ici. Les cartes
     * sommaient les lignes de `/api/erp/performance/contrat/{X}`, qui compte les courses PAR
     * DATE, en direct : supprimer ou modifier un ticket d'une semaine deja cloturee faisait
     * bouger les cartes pendant que le bandeau, lui, tenait. Le meme ecran affichait deux
     * verites sur la meme semaine, et c'etaient les cartes qui avaient tort - une paie
     * verrouillee ne se recalcule pas.
     *
     * Le repli sur le calcul vivant reste, et il sert deux cas qui ne sont pas des pannes :
     * une periode de PLUSIEURS semaines, ou un creneau de paie n'a pas de sens, et une
     * semaine sans creneau. Il couvre aussi un backend qui ne rendrait pas encore
     * `parContrat`, pour que l'ecran survive a l'ordre de deploiement.
     */
    const parContrat = stats?.parContrat ?? null;

    const syntheses: SyntheseContrat[] = CONTRATS.map((contrat, i) => {
        const figee = parContrat?.find((p) => p.contrat === contrat);
        if (figee) {
            return {
                contrat,
                livreurs: figee.livreurs,
                programmes: figee.programmes,
                nbTickets: figee.tickets,
                commission: figee.commission,
                prime: figee.prime,
            };
        }

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

    /*
     * Les livreurs SANS type de contrat en base. Ils ne rentrent dans aucune des trois
     * cartes : sans cette ligne, les trois cartes ne sommeraient pas au bandeau et rien ne
     * dirait pourquoi. Muette tant qu'il n'y en a aucun, ce qui est le cas courant.
     */
    const aCategoriser = parContrat?.find((p) => p.contrat === 'A_CATEGORISER') ?? null;

    return (
        <ZoneFiltre className="space-y-4">
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
                        <SignalLien><ListOrdered aria-hidden="true" className="size-4" /></SignalLien>
                        Classement des livreurs
                    </Link>
                </div>
            </div>

            <AnnonceFiltre />

            <SelecteurPeriode parametres={parametres} />

            <ContenuFiltre className="space-y-4">
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
            {/*
              * ⚠ Ce garde-fou ne vaut QUE pour le calcul vivant, qui lit une page de 200
              * livreurs. Les chiffres figes de la grille de paie, eux, ne sont pas pagines :
              * comparer leur total a celui de l'autre requete rapprocherait deux grandeurs
              * differentes et declencherait une alerte de troncature sur une liste complete.
              */}
            {parContrat ? null : (
                <AvertissementListeTronquee
                    rendus={syntheses.reduce((n, s) => n + s.livreurs, 0)}
                    total={reponses.reduce((n, r) => n + (r?.totalElements ?? 0), 0)}
                />
            )}

            <CartesContrat parametres={parametres} syntheses={syntheses} />

            {/*
              * Sans cette ligne, les trois cartes ne sommeraient pas au bandeau et l'ecart
              * serait muet. Un livreur « a categoriser » n'est pas une quatrieme categorie :
              * c'est un type manquant en base, et c'est a la RH de le poser.
              */}
            {aCategoriser && aCategoriser.livreurs > 0 ? (
                <p className="rounded-lg bg-warning-50 px-4 py-3 text-xs text-warning-700 dark:bg-warning-100/10">
                    {aCategoriser.livreurs} livreur{aCategoriser.livreurs > 1 ? 's' : ''} de ce créneau
                    {aCategoriser.livreurs > 1 ? ' ne portent' : ' ne porte'} aucun type de contrat en base
                    et {aCategoriser.livreurs > 1 ? 'ne figurent' : 'ne figure'} donc dans aucune des trois
                    cartes, pour {formatMontant(aCategoriser.commission + aCategoriser.prime)} et{' '}
                    {aCategoriser.tickets} livraison{aCategoriser.tickets > 1 ? 's' : ''}. Le type se pose
                    sur la fiche du livreur.
                </p>
            ) : null}

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
            </ContenuFiltre>
        </ZoneFiltre>
    );
}
