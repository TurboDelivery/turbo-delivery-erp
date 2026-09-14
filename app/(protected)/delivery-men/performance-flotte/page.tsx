import { Metadata } from 'next';

import { CartesContrat, type SyntheseContrat } from '@/features/performance/components/cartes-contrat';
import { SelecteurSemaine } from '@/features/performance/components/selecteur-semaine';
import { lundiDeLaSemaineEnCours, semaineIsoDepuisLundi } from '@/features/performance/utils/semaine-iso.utils';
import type { TurboyType } from '@/features/turboys/types/turboys.types';
import { getPerformanceParContrat } from '@/src/performance/performance-flotte.action';
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
    searchParams: Promise<{ semaine?: string }>;
}) {
    const { semaine: lundi } = await searchParams;
    const iso = lundi ? semaineIsoDepuisLundi(lundi) : undefined;

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
    const creneau = await getCreneauDuLundi(lundi ?? lundiDeLaSemaineEnCours());
    const stats = creneau ? await getStatsCreneau(creneau.id) : null;

    const reponses = await Promise.all(
        CONTRATS.map((c) => getPerformanceParContrat(c, iso?.annee, iso?.semaine)),
    );

    const syntheses: SyntheseContrat[] = CONTRATS.map((contrat, i) => {
        const lignes = reponses[i]?.content ?? [];

        return {
            contrat,
            livreurs: lignes.length,
            // `creneau` est NUL quand aucun emploi du temps n'existe pour la semaine lue :
            // c'est la marque d'un livreur non programmé, pas d'une absence de donnée.
            programmes: lignes.filter((l) => l.creneau != null).length,
            nbTickets: lignes.reduce((n, l) => n + (l.nbTickets ?? 0), 0),
            commission: lignes.reduce((n, l) => n + (l.commission ?? 0), 0),
            prime: lignes.reduce((n, l) => n + (l.prime ?? 0), 0),
        };
    });

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Performance de la flotte</h1>
                <p className="mt-1 text-sm text-muted">
                    Trois catégories de contrat. Cliquez sur une carte pour ouvrir sa liste.
                </p>
            </div>

            <SelecteurSemaine semaine={lundi} />

            <BandeauFlotte creneau={creneau} stats={stats} />

            <CartesContrat semaine={lundi} syntheses={syntheses} />

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
