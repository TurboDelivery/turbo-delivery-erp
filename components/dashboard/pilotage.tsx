'use client';

import { Button, Card, Skeleton } from '@heroui-v3/react';
import {
    endOfMonth,
    endOfYear,
    format,
    startOfMonth,
    startOfYear,
    subMonths,
    subYears,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowDownRight, Clock, Download, Layers, TrendingUp, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';

import EtatErreur from '@/components/commons/EtatErreur';
import { Montant } from '@/components/commons/montant';
import { useComptesEnAttenteQuery } from '@/features/dashboard/queries/comptes-attente.query';
import { usePersonnelStatsQuery } from '@/features/dashboard/queries/personnel-stats.query';
import { useDepenseSummaryQuery } from '@/features/depenses/queries/depense-summary.query';
import { BandePerimetre } from '@/features/finance-dashboard/components/etat/bande-perimetre';
import { BandeauAction } from '@/features/finance-dashboard/components/etat/bandeau-action';
import { CarteIndicateur } from '@/features/finance-dashboard/components/etat/carte-indicateur';
import { construireEtat } from '@/features/finance-dashboard/components/etat/construire-etat';
import { EtatFinancier } from '@/features/finance-dashboard/components/etat/etat-financier';
import { GraphiqueMensuel } from '@/features/finance-dashboard/components/etat/graphique-mensuel';
import {
    DisponibiliteJour,
    RepartitionParc,
} from '@/features/finance-dashboard/components/etat/repartition-parc';
import { SelecteurPeriode, type Raccourci } from '@/features/finance-dashboard/components/etat/selecteur-periode';
import { TableauMensuel } from '@/features/finance-dashboard/components/etat/tableau-mensuel';
import { useCAExport } from '@/features/finance-dashboard/hooks/use-ca-export';
import { useDashboardStats } from '@/features/finance-dashboard/hooks/use-dashboard-stats';
import { useFinanceResumeQuery } from '@/features/finance-dashboard/queries/finance-resume.query';
import { useGlobalStats } from '@/features/finance-dashboard/queries/global-stats.query';
import { useTraficLivreursQuery } from '@/features/standard/queries/standard.query';
import { useAbility } from '@/hooks/use-ability';

/**
 * Tableau de bord de pilotage.
 *
 * <p>Ce fichier ne fait QUE brancher les requetes sur des composants de presentation.
 * C'est ce qui permet de rendre le meme ecran sur `/apercu` avec un jeu d'exemple, sans
 * session ni appel reseau, et donc de le VERIFIER A L'ECRAN — y compris dans les etats
 * qu'on oublie de regarder : le chargement, l'echec de lecture, la periode vide, le
 * deficit, et le theme sombre.</p>
 *
 * <h3>Le filtrage par role n'est pas un confort</h3>
 * <p>`/analystics` figure dans `ALWAYS_ALLOWED_PATHS`, qui court-circuite la regle
 * d'habilitation : les quinze roles y accedent. Cinq seulement ont le droit de lire
 * `Finance`. L'ecran precedent ne verifiait AUCUNE habilitation — aucun `useAbility`,
 * aucun `<Can>` — et servait donc le chiffre d'affaires, les depenses et la marge a des
 * roles que les 24 pages `/finance/*` bloquent. Ce n'est pas une preference de mise en
 * page, c'est une regle d'autorisation que l'ecran ignorait.</p>
 */
/**
 * Convertit une date JS en date CALENDAIRE, sans heure ni fuseau.
 *
 * <p>`fromDate` produisait un `ZonedDateTime` : les champs de saisie affichaient alors
 * « 01/09/2026 00:00 UTC+0 – 30/09/2026 00:00 UTC+0 », ce qui debordait la largeur d'un
 * telephone. Une periode financiere n'a ni heure ni fuseau : elle porte un jour.</p>
 */
const versDateCalendaire = (d: Date) => new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());

export default function Pilotage() {
    /*
     * Filtrage par role SUSPENDU, sur demande — tout le monde voit tout pour l'instant.
     *
     * <p>Le constat reste entier et il faudra y revenir : `/analystics` figure dans
     * `ALWAYS_ALLOWED_PATHS`, qui court-circuite la regle d'habilitation, si bien que les
     * quinze roles atteignent cet ecran alors que cinq seulement ont le droit de lire
     * `Finance`. Les 24 pages `/finance/*` les bloquent, ce tableau de bord non.</p>
     *
     * <p>Le branchement est conserve, commente d'une ligne : retablir le filtrage revient
     * a rendre leur valeur aux deux constantes ci-dessous.</p>
     */
    const ability = useAbility();
    void ability;
    const voitFinance = true; // ability.can('read', 'Finance')
    const voitLivreurs = true; // ability.can('read', 'Livreur')

    const [raccourci, setRaccourci] = useState<Raccourci>('mois');
    /**
     * Plage choisie au calendrier. Elle etait ignoree : le composant recevait
     * `plage={null}` et un `onPlage` qui ne stockait rien, si bien que la date
     * disparaissait au clic et qu'aucun filtrage ne s'appliquait.
     */
    const [plage, setPlage] = useState<{ start: DateValue; end: DateValue } | null>(null);
    const [annee, setAnnee] = useState(() => new Date().getFullYear());

    // ── La periode, et la periode PRECEDENTE de meme nature. La comparaison ne coute
    //    rien de plus au service : c'est le meme endpoint sur une autre plage, et
    //    TanStack Query les met en cache sous deux cles distinctes.
    const { debut, fin, debutPrecedent, finPrecedent, libelle } = useMemo(() => {
        const maintenant = new Date();
        const zone = getLocalTimeZone();

        // Une plage saisie au calendrier prime sur les raccourcis, et sa periode de
        // comparaison est la meme duree, juste avant.
        if (raccourci === 'libre' && plage) {
            const d = plage.start.toDate(zone);
            const f = plage.end.toDate(zone);
            const duree = f.getTime() - d.getTime();
            return {
                debut: d,
                fin: f,
                debutPrecedent: new Date(d.getTime() - duree),
                finPrecedent: new Date(d.getTime() - 1),
                libelle: `${format(d, 'd MMM', { locale: fr })} – ${format(f, 'd MMM yyyy', { locale: fr })}`,
            };
        }
        if (raccourci === 'annee') {
            const d = startOfYear(maintenant);
            return {
                debut: d,
                fin: endOfYear(maintenant),
                debutPrecedent: startOfYear(subYears(maintenant, 1)),
                finPrecedent: endOfYear(subYears(maintenant, 1)),
                libelle: format(d, 'yyyy'),
            };
        }
        if (raccourci === 'origine') {
            return {
                debut: new Date('2024-01-01'),
                fin: maintenant,
                debutPrecedent: undefined,
                finPrecedent: undefined,
                libelle: "Depuis l'origine",
            };
        }
        const d = startOfMonth(maintenant);
        return {
            debut: d,
            fin: endOfMonth(maintenant),
            debutPrecedent: startOfMonth(subMonths(maintenant, 1)),
            finPrecedent: endOfMonth(subMonths(maintenant, 1)),
            libelle: format(d, 'MMMM yyyy', { locale: fr }),
        };
    }, [raccourci, plage]);

    // Le calendrier reflete la periode ACTIVE, d'ou qu'elle vienne : sans cela il
    // s'ouvrait vide apres un clic sur « Ce mois ».
    const plageAffichee = useMemo(
        () => plage ?? { start: versDateCalendaire(debut), end: versDateCalendaire(fin) },
        [plage, debut, fin],
    );

    const parametres = useMemo(() => ({ debut, fin }), [debut, fin]);
    const parametresPrecedents = useMemo(
        () => ({ debut: debutPrecedent, fin: finPrecedent }),
        [debutPrecedent, finPrecedent],
    );

    // ── Lectures
    const effectifs = usePersonnelStatsQuery({});
    const comptes = useComptesEnAttenteQuery();
    const global = useGlobalStats(parametres);
    const globalPrecedent = useGlobalStats(parametresPrecedents);
    const depenses = useDepenseSummaryQuery(parametres);
    const resume = useFinanceResumeQuery(parametres);
    const serie = useDashboardStats(annee);
    const trafic = useTraficLivreursQuery();

    // Trois sources alimentent les chiffres de periode. Si l'une tombe, un `?? 0`
    // afficherait « 0 FCFA », qui se lit comme une mesure : on annonce l'echec.
    const financeEnErreur = global.isError || depenses.isError || resume.isError;
    const financeEnCharge = global.isLoading || depenses.isLoading || resume.isLoading;
    const relancerFinance = () => {
        void global.refetch();
        void depenses.refetch();
        void resume.refetch();
    };

    const { exportCAToExcel, isLoadingCAExport } = useCAExport();

    const ca = global.data?.chiffreAffaire ?? 0;
    const totalDepenses = resume.data?.totalDepenses ?? 0;
    const marge = ca - totalDepenses;
    const margePrecedente =
        globalPrecedent.data && globalPrecedent.data.chiffreAffaire !== undefined
            ? globalPrecedent.data.chiffreAffaire - (globalPrecedent.data.depenses ?? 0)
            : undefined;

    const sections = construireEtat({
        statsGlobales: global.data,
        statsPeriodePrecedente: globalPrecedent.data,
        resume: resume.data,
        depenses: depenses.data,
        debut,
        fin,
    });

    const reperes = [
        { cle: 'partenaires', libelle: 'Partenaires actifs', valeur: effectifs.data?.partenaireActif ?? null, href: '/restaurants' },
        {
            cle: 'turboys',
            libelle: 'Turboys',
            valeur: effectifs.data?.turboys ?? null,
            href: '/delivery-men/men',
            details: [
                { libelle: 'Indép.', valeur: effectifs.data?.turboysIndependant ?? null, href: '/delivery-men/men?typeLivreur=INDEPENDANT&tab=independant' },
                { libelle: 'Journ.', valeur: effectifs.data?.turboysJournalier ?? null, href: '/delivery-men/men?typeLivreur=JOURNALIER&tab=journalier' },
                // V54 : absent d'un backend anterieur, on n'affiche alors rien.
                ...(effectifs.data?.turboysSuperviseurLivreur !== undefined
                    ? [{ libelle: 'Superv.', valeur: effectifs.data.turboysSuperviseurLivreur, href: '/delivery-men/men?typeLivreur=SUPERVISEUR_LIVREUR&tab=superviseur_livreur' }]
                    : []),
            ],
        },
        { cle: 'personnel', libelle: 'Personnel Turbo', valeur: effectifs.data?.personnel ?? null, href: '/personnel' },
        { cle: 'utilisateurs', libelle: 'Utilisateurs actifs', valeur: effectifs.data?.utilisateurs ?? null, href: '/users' },
    ];

    const horsService = trafic.data?.horsService?.total ?? 0;
    const disponibles = trafic.data?.disponibles?.total ?? 0;
    const enActivite = trafic.data?.enActivite?.total ?? 0;
    const totalLivreurs = trafic.data?.totalLivreurs ?? 0;
    const enAttente = comptes.data ?? 0;

    const actions = [
        {
            cle: 'gps',
            titre: `${horsService} livreurs sans position GPS`,
            incise: 'la carte du trafic est vide',
            consequence: `Sur ${totalLivreurs} livreurs, autant n'apparaissent nulle part sur la carte du trafic : on ne peut ni les affecter, ni voir où ils sont.`,
            href: '/trafic',
            libelleAction: 'Voir le trafic',
            actif: voitLivreurs && horsService > 0,
        },
        {
            cle: 'dispo',
            titre: 'Aucun livreur disponible',
            incise: 'les offres ne partiront pas',
            consequence: `Personne n'est en file sur ${totalLivreurs} livreurs : soit la journée n'a pas commencé, soit le pointage ne remonte plus.`,
            href: '/delivery-men/pointages-a-valider',
            libelleAction: 'Vérifier les pointages',
            actif: voitLivreurs && totalLivreurs > 0 && disponibles === 0,
        },
        {
            cle: 'comptes',
            titre:
                enAttente > 1
                    ? `${enAttente} comptes livreurs attendent une validation`
                    : '1 compte livreur attend une validation',
            incise: 'ils ne peuvent pas se connecter',
            consequence: "Tant que le compte n'est pas validé, le livreur ne peut pas se connecter à l'application.",
            href: '/delivery-men/not-valide',
            libelleAction: 'Valider les comptes',
            actif: voitLivreurs && !comptes.isError && enAttente > 0,
        },
    ];

    // `toMonthlyChartData` nomme le mois `month` et l'encours `comptes` ; les composants
    // parlent francais. La correspondance est ici, une seule fois.
    const serieGraphique = (serie.chartData ?? []).map((m) => ({
        mois: m.month,
        revenus: m.revenus,
        depenses: m.depenses,
        encours: m.comptes,
        investissements: m.investissements,
    }));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between">
                <div>
                    <h1 className="text-xl font-bold">Pilotage Turbo Delivery</h1>
                    <p className="text-sm text-muted">
                        {format(debut, 'd MMMM', { locale: fr })} – {format(fin, 'd MMMM yyyy', { locale: fr })}
                    </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                    <SelecteurPeriode
                        libelle={libelle}
                        onPlage={(p) => {
                            setPlage(p);
                            // Une plage complete bascule sur « libre » ; une plage
                            // effacee rend la main aux raccourcis.
                            setRaccourci(p ? 'libre' : 'mois');
                        }}
                        onRaccourci={(r) => {
                            setRaccourci(r);
                            if (r !== 'libre') setPlage(null);
                        }}
                        plage={plageAffichee}
                        raccourci={raccourci}
                    />
                    {voitFinance && (
                        <Button
                            isPending={isLoadingCAExport}
                            onPress={() =>
                                exportCAToExcel({
                                    debut,
                                    fin,
                                    selectedMonth: null,
                                    selectedYear: debut.getFullYear(),
                                })
                            }
                            size="sm"
                            variant="outline"
                        >
                            <Download aria-hidden="true" className="size-4" />
                            Télécharger les détails
                        </Button>
                    )}
                </div>
            </div>

            <BandeauAction elements={actions} />

            <BandePerimetre reperes={reperes} />

            {voitFinance && financeEnErreur && (
                <Card className="border border-danger/40 p-0">
                    <Card.Content className="p-0">
                        <EtatErreur
                            enCours={global.isFetching || resume.isFetching}
                            onReessayer={relancerFinance}
                            quoi="les indicateurs financiers"
                        />
                    </Card.Content>
                </Card>
            )}

            {voitFinance && !financeEnErreur && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <CarteIndicateur
                        chargement={financeEnCharge}
                        href="/finance/revenue"
                        icone={Wallet}
                        libelle="Chiffre d'affaires"
                        libelleReference="vs période précédente"
                        reference={globalPrecedent.data?.chiffreAffaire}
                        sens="favorable"
                        valeur={ca}
                    />
                    <CarteIndicateur
                        chargement={financeEnCharge}
                        contexte={totalDepenses === 0 ? 'aucune charge imputée' : undefined}
                        href="/finance/dashboard"
                        icone={ArrowDownRight}
                        libelle="Dépenses"
                        libelleReference="vs période précédente"
                        reference={globalPrecedent.data?.depenses}
                        sens="defavorable"
                        valeur={totalDepenses}
                    />
                    <CarteIndicateur
                        chargement={financeEnCharge}
                        contexte={marge >= 0 ? 'excédent' : 'déficit'}
                        href="/finance/analyse-rentabilite"
                        icone={TrendingUp}
                        libelle="Marge"
                        libelleReference="vs période précédente"
                        principal
                        reference={margePrecedente}
                        sens="favorable"
                        tonContexte={marge >= 0 ? 'favorable' : 'attention'}
                        valeur={marge}
                    />
                    <CarteIndicateur
                        chargement={financeEnCharge}
                        contexte={ca ? `${Math.round(((resume.data?.totalFacturesEnCours ?? 0) / ca) * 100)} % du CA` : undefined}
                        href="/finance/recouvrement?tab=factures"
                        icone={Clock}
                        libelle="Encours à recouvrer"
                        tonContexte="attention"
                        valeur={resume.data?.totalFacturesEnCours ?? 0}
                    />
                </div>
            )}

            {voitFinance && !financeEnErreur && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <Card.Header>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <Card.Title className="text-sm">
                                        Revenus et dépenses par mois · {annee}
                                    </Card.Title>
                                    <Card.Description>
                                        La marge, en surimpression, est la différence des deux barres.
                                    </Card.Description>
                                </div>
                                <select
                                    aria-label="Année du graphique"
                                    className="rounded-md border border-separator bg-surface px-2 py-1 text-xs"
                                    onChange={(e) => setAnnee(Number(e.target.value))}
                                    value={annee}
                                >
                                    {[0, 1, 2].map((k) => {
                                        const a = new Date().getFullYear() - k;
                                        return (
                                            <option key={a} value={a}>
                                                {a}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </Card.Header>
                        <Card.Content className="min-h-0 flex-1">
                            {serie.isLoading ? (
                                <Skeleton className="h-full min-h-[260px] w-full rounded-lg" />
                            ) : serie.isError ? (
                                <EtatErreur compact quoi="l'évolution mensuelle" />
                            ) : (
                                <GraphiqueMensuel donnees={serieGraphique} />
                            )}
                        </Card.Content>
                    </Card>

                    <Card>
                        <Card.Header>
                            <Card.Title className="text-sm">Détail de la période</Card.Title>
                        </Card.Header>
                        <Card.Content>
                            {financeEnCharge ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 8 }).map((_, k) => (
                                        <Skeleton className="h-5 w-full rounded" key={k} />
                                    ))}
                                </div>
                            ) : (
                                <EtatFinancier libellePeriode={libelle} masquerCumul sections={sections} />
                            )}
                        </Card.Content>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {voitFinance && (
                    <Card>
                        <Card.Header>
                            <Card.Title className="flex items-center gap-2 text-sm">
                                <Layers aria-hidden="true" className="size-4 text-muted" />
                                Cumul depuis 2024
                            </Card.Title>
                        </Card.Header>
                        <Card.Content>
                            {financeEnCharge ? (
                                <div className="space-y-2">
                                    {[0, 1, 2, 3].map((k) => (
                                        <Skeleton className="h-6 w-full rounded" key={k} />
                                    ))}
                                </div>
                            ) : resume.isError ? (
                                <EtatErreur compact onReessayer={() => void resume.refetch()} quoi="les cumuls" />
                            ) : (
                                <ul className="space-y-2">
                                    {[
                                        ["Chiffre d'affaires", resume.data?.chiffreAffaireCumule ?? 0, '/finance/revenue'],
                                        ['Dépenses', resume.data?.totalDepensesCumule ?? 0, '/finance/dashboard'],
                                        ['Marge', resume.data?.margeCumule ?? 0, '/finance/analyse-rentabilite'],
                                        ['Encours', resume.data?.totalFacturesEnCoursCumule ?? 0, '/finance/recouvrement?tab=factures'],
                                    ].map(([libelleLigne, valeur, lien]) => (
                                        <li key={libelleLigne as string}>
                                            <a
                                                className="flex items-baseline justify-between gap-4 rounded-sm py-0.5 hover:text-accent"
                                                href={lien as string}
                                            >
                                                <span className="text-sm text-muted">{libelleLigne as string}</span>
                                                <Montant taille="sm" valeur={valeur as number} />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card.Content>
                    </Card>
                )}

                <Card>
                    <Card.Header>
                        <Card.Title className="text-sm">
                            Répartition du parc · {effectifs.data?.turboys ?? 0} turboys
                        </Card.Title>
                    </Card.Header>
                    <Card.Content>
                        {effectifs.isLoading ? (
                            <Skeleton className="h-40 w-full rounded-lg" />
                        ) : (
                            <RepartitionParc
                                parts={[
                                    { libelle: 'Indépendants', valeur: effectifs.data?.turboysIndependant ?? 0, couleur: '#2563eb' },
                                    { libelle: 'Journaliers', valeur: effectifs.data?.turboysJournalier ?? 0, couleur: '#d97706' },
                                    { libelle: 'Superviseurs-livreurs', valeur: effectifs.data?.turboysSuperviseurLivreur ?? 0, couleur: '#15803d' },
                                ]}
                            />
                        )}
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header>
                        <Card.Title className="text-sm">Disponibilité du jour</Card.Title>
                        {horsService > 0 && (
                            <Card.Description>
                                {horsService} livreurs sur {totalLivreurs} n&apos;ont aucune position connue.
                            </Card.Description>
                        )}
                    </Card.Header>
                    <Card.Content>
                        <DisponibiliteJour
                            barres={[
                                { libelle: 'En course', valeur: enActivite, couleur: '#2563eb' },
                                { libelle: 'Disponibles', valeur: disponibles, couleur: '#15803d' },
                                { libelle: 'Hors service', valeur: horsService, couleur: '#b91c1c' },
                            ]}
                            total={totalLivreurs}
                        />
                    </Card.Content>
                </Card>
            </div>

            {voitFinance && !serie.isError && (
                <Card>
                    <Card.Header>
                        <Card.Title className="text-sm">Mois par mois · {annee}</Card.Title>
                        <Card.Description>
                            Les mêmes chiffres que le graphique, en valeurs exactes — un graphique seul
                            n&apos;est pas lisible par un lecteur d&apos;écran.
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        {serie.isLoading ? (
                            <div className="space-y-1.5">
                                {Array.from({ length: 6 }).map((_, k) => (
                                    <Skeleton className="h-6 w-full rounded" key={k} />
                                ))}
                            </div>
                        ) : (
                            <TableauMensuel annee={annee} lignes={serieGraphique} />
                        )}
                    </Card.Content>
                </Card>
            )}
        </div>
    );
}
