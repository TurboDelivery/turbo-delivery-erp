'use client';

import { Button } from '@heroui-v3/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { CarburantRapideModal } from '@/components/turboys/programmes/carburant-rapide-modal';
import { DuplicationSemaineDialog } from '@/components/turboys/programmes/duplication-semaine-dialog';
import { EngagementCarburant } from '@/components/turboys/programmes/engagement-carburant';
import { ProgrammeApercuPanneau } from '@/components/turboys/programmes/programme-apercu-panneau';
import { ProgrammeFormModal } from '@/components/turboys/programmes/programme-form-modal';
import { PreuvesCarburantDialog } from '@/components/turboys/programmes/preuves-carburant-dialog';
import { LigneRelancePreuves, RelancePreuvesDialog } from '@/components/turboys/programmes/relance-preuves-dialog';
import { SoumissionSurplus } from '@/components/turboys/programmes/soumission-surplus';
import { HistoriqueProgramme } from '@/components/turboys/programmes/programme-historique-modal';
import { WeeklyJoursEditor, defaultJours } from '@/components/turboys/programmes/weekly-jours-editor';
import { SemaineProgrammes } from '@/features/programmes/refonte/semaine-programmes';
import { programmeKeys } from '@/features/turboys/queries/programme.query';
import { ticketsKeyQuery } from '@/features/tickets/queries/index.query';
import { type CleManque, manquesProgramme } from '@/features/turboys/utils/manques.utils';
import type { IAuditAction } from '@/features/supervision/types';
import type {
    IAutosuffisanceJour,
    IJourProgramme,
    IPreuveCarburant,
    IProgramme,
    ISurplus,
    StatutProgramme,
} from '@/features/turboys/types/programme.types';
import { exporterProgrammesExcel, exporterProgrammesPdf, libelleMontantGroupe, regrouperPourExport } from '@/features/turboys/utils/programmes-export.utils';

/** Le banc de la semaine des programmes : quatre jeux d'essai, deux thèmes, trois états. */

const NOMS = [
    'OTE Azo', 'KOHI Albert Rene', 'DIABATE Moussa', 'KONE Salif', 'YAO Kouassi',
    'TRAORE Ibrahim', 'BAMBA Adama', 'COULIBALY Seydou', 'OUATTARA Lassina', 'DIALLO Mamadou',
    'SANOGO Karim', 'FOFANA Aboubacar', 'TOURE Bakary', 'CISSE Yacouba',
];

const RESTOS = ['Chez Paul, Cocody', 'Le Bistrot, Plateau', 'Kfc Marcory', 'La Villa, Riviera'];
const SITES = new Map(RESTOS.map((nom, i) => [`r${i}`, { commune: ['Cocody', 'Plateau', 'Marcory', 'Riviera'][i], nom }]));
const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const TYPES = ['JOURNALIER', 'SUPERVISEUR_LIVREUR', 'INDEPENDANT'];

/** Reproductible : deux rendus doivent montrer la même chose. */
function fabriquer(graine: number, nb: number, statuts: StatutProgramme[]): IProgramme[] {
    let e = graine;
    const suivant = () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
    // Les forfaits journaliers du document papier : 4 000 pour un journalier, 2 000 pour
    // un superviseur ; l'independant ne touche rien. Un programme sur six n'a rien de saisi.
    const JOURNALIER_PAR_TYPE: Record<string, number | null> = { INDEPENDANT: null, JOURNALIER: 4000, SUPERVISEUR_LIVREUR: 2000 };
    return Array.from({ length: nb }).map((_, i) => {
        const statut = statuts[Math.floor(suivant() * statuts.length)];
        const type = TYPES[i % TYPES.length];
        const montantJour = i % 6 === 5 ? null : JOURNALIER_PAR_TYPE[type];
        const jours: IJourProgramme[] = JOURS.map((j, k) => {
            const absence = i % 4 === 1 && k === 2;
            const actif = !absence && suivant() > 0.22;
            return {
                absenceJustifiee: absence ? false : null,
                statutJour: absence ? 'ABSENT' : null,
                actif,
                date: `2026-08-${String(24 + k).padStart(2, '0')}`,
                debut: actif ? `0${6 + (k % 3)}:00:00` : null,
                fin: actif ? `1${6 + (k % 3)}:30:00` : null,
                jour: j,
                montantCarburant: actif ? montantJour : null,
                postes: actif ? [{ restaurantId: `r${i % RESTOS.length}`, restaurantNom: RESTOS[i % RESTOS.length] }] : [],
            };
        });
        // Une semaine sur cinq est en sept jours sur sept : le repos n'a pas ete pris.
        if (i % 5 === 2) jours.forEach((j) => { j.actif = true; j.statutJour = null; j.montantCarburant = montantJour; });
        // Fige par le serveur des que le programme est parti chez le livreur.
        const engage = statut === 'NOTIFIE' || statut === 'ACCEPTE' || statut === 'REFUSE';
        const somme = jours.reduce((t, j) => (j.actif && j.montantCarburant != null ? t + j.montantCarburant : t), 0);
        const aUnMontant = jours.some((j) => j.actif && j.montantCarburant != null);
        // Le WhatsApp : parti, refuse par Twilio, sans numero, ou jamais tente.
        const whatsapp = !engage
            ? { whatsappStatut: null, whatsappLe: null, whatsappDetail: null }
            : i % 4 === 0
              ? { whatsappStatut: 'ENVOYE', whatsappLe: '2026-08-24T07:12:00Z', whatsappDetail: 'SM7f3a' }
              : i % 4 === 1
                ? { whatsappStatut: 'ECHEC', whatsappLe: '2026-08-24T07:12:00Z', whatsappDetail: 'Twilio refuse nos identifiants (code 20003) : le jeton TWILIO_AUTH_TOKEN est absent ou revoque.' }
                : i % 4 === 2
                  ? { whatsappStatut: 'SANS_NUMERO', whatsappLe: '2026-08-24T07:12:00Z', whatsappDetail: "Le livreur n'a pas de numero a dix chiffres sur sa fiche." }
                  : { whatsappStatut: 'NON_CONFIGURE', whatsappLe: '2026-08-24T07:12:00Z', whatsappDetail: 'Aucun gabarit WhatsApp declare pour les programmes.' };
        return {
            ...whatsapp,
            // Un livreur sur sept n'a pas de site : le groupe « Sans site rattache » doit exister.
            siteId: i % 7 === 6 ? null : `r${i % RESTOS.length}`,
            siteDeLaSemaine: i % 3 === 0 && i % 7 !== 6,
            montantCarburantHebdo: engage && aUnMontant ? somme : null,
            accepteLe: null,
            annee: 2026,
            id: `p${graine}-${i}`,
            jours,
            livreurId: `l${i}`,
            livreurNom: NOMS[i % NOMS.length],
            motifRefus: statut === 'REFUSE' ? 'Je suis en congé cette semaine, je l’avais signalé au superviseur.' : null,
            nbRelances: 0,
            publieLe: null,
            refuseLe: null,
            semaine: 35,
            source: 'ERP',
            statut,
            typeLivreur: type,
            /*
             * Le complément : sites, surplus et preuves Wave.
             *
             * Les trois états du bouton œil doivent être visibles sur une même semaine,
             * sinon on ne peut pas comparer leurs couleurs — et c'est précisément ce que
             * ce banc sert à vérifier. Un livreur sur trois a sa preuve, un sur trois a
             * un surplus non prouvé (donc orange, « 1/2 »), les autres restent gris.
             */
            complement: {
                // Un superviseur-livreur sur deux n'a pas encore de base : « Bases à renseigner » doit se voir.
                basesGerees: type === 'SUPERVISEUR_LIVREUR' && i % 2 === 0 ? [`r${i % RESTOS.length}`, `r${(i + 1) % RESTOS.length}`] : [],
                preuvesParJour: (
                    i % 3 !== 2 && jours[0].actif
                        ? {
                              LUNDI: [
                                  {
                                      envoyeLe: '2026-08-24T09:12:00Z',
                                      fichierUrl: '/uploads/exemple-wave.jpg',
                                      id: `pr-${i}`,
                                      jour: 'LUNDI',
                                      montantRecu: montantJour ?? 0,
                                      referenceTransaction: `T_IA6OREV2MUG-QV6Z${i}`,
                                      statut: i % 3 === 0 ? 'VALIDEE' : 'RECUE',
                                      surplusId: null,
                                  },
                              ],
                          }
                        : {}) as Record<string, IPreuveCarburant[]>,
                // Un site desservi le plus souvent, quatre de temps en temps : les deux puces puis « +2 ».
                sitesDesservis:
                    i % 8 === 5
                        ? [1, 2, 3, 4].map((d) => `r${(i + d) % RESTOS.length}`)
                        : i % 4 === 1
                          ? [`r${(i + 2) % RESTOS.length}`]
                          : [],
                sitesParJour: (i % 4 === 1 ? { MERCREDI: [`r${(i + 2) % RESTOS.length}`] } : {}) as Record<string, string[]>,
                surplusParJour: (
                    i % 3 === 1 && jours[0].actif
                        ? {
                              LUNDI: [
                                  {
                                      accordeLe: '2026-08-24T11:00:00Z',
                                      annule: false,
                                      id: `su-${i}`,
                                      jour: 'LUNDI',
                                      montant: 2000,
                                      motif: 'RENFORT_AUTRE_SITE',
                                      siteId: `r${(i + 2) % RESTOS.length}`,
                                  },
                              ],
                          }
                        : {}) as Record<string, ISurplus[]>,
            },
        } satisfies IProgramme;
    });
}

const AUTOSUFFISANCE: IAutosuffisanceJour[] = JOURS.map((j, k) => {
    const independants = 4 + ((k * 3) % 7);
    const planifies = 9 + ((k * 5) % 11);
    return { independants, jour: j, planifies, total: independants + planifies };
});

const JEUX = {
    ordinaire: {
        libelle: 'Semaine ordinaire',
        lignes: fabriquer(11, 14, ['BROUILLON', 'PLANIFIE', 'NOTIFIE', 'ACCEPTE', 'REFUSE']),
    },
    aPublier: { libelle: 'Tout à publier', lignes: fabriquer(29, 12, ['BROUILLON', 'PLANIFIE']) },
    publiee: { libelle: 'Semaine lancée', lignes: fabriquer(41, 12, ['NOTIFIE', 'ACCEPTE']) },
    vide: { libelle: 'Aucun programme', lignes: [] as IProgramme[] },
};

const INDEPENDANTS = fabriquer(97, 5, ['ACCEPTE']);

/**
 * Bascule le thème sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` déclare encore les jetons
 * shadcn en triplets HSL bruts dans la même portée `.dark` que HeroUI, et sur un div
 * imbriqué c'est le triplet qui gagne — `bg-success` ne peint alors plus rien.</p>
 */
function useThemeSombre(): [boolean, (v: (p: boolean) => boolean) => void] {
    const [sombre, setSombre] = React.useState(false);
    React.useEffect(() => {
        const html = document.documentElement;
        const avant = html.className;
        html.className = sombre ? 'dark' : 'light';
        return () => {
            html.className = avant;
        };
    }, [sombre]);
    return [sombre, setSombre];
}

/**
 * L'éditeur d'un programme, seul, pour voir et piloter la saisie.
 *
 * <p>Semé avec DEUX sites disponibles, une base et un renfort : c'est la seule
 * configuration où la règle « au moins un site coché par jour travaillé » (RG-S03) a un
 * sens visible, et où « Appliquer à toute la semaine » montre qu'il copie les sites.</p>
 */
function BancEditeur() {
    const [jours, setJours] = React.useState<IJourProgramme[]>(() =>
        defaultJours().map((j, i) => (i < 6 ? { ...j, actif: true, montantCarburant: i < 3 ? 4000 : null } : j)),
    );
    const sitesDisponibles = [
        { id: 'r0', nom: RESTOS[0] ?? 'Chicken Nation Yopougon' },
        { id: 'r1', nom: RESTOS[1] ?? 'Angré 2' },
    ];
    const [sitesParJour, setSitesParJour] = React.useState<Record<string, string[]>>(() =>
        Object.fromEntries(defaultJours().map((j) => [j.jour, ['r0']])),
    );
    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">L&apos;éditeur, tel qu&apos;il s&apos;ouvre dans la modale</h2>
            <WeeklyJoursEditor
                onChange={setJours}
                onSitesParJourChange={setSitesParJour}
                restaurants={RESTOS.map((r, i) => ({ id: `r${i}`, nom: r }))}
                sitesDisponibles={sitesDisponibles}
                sitesParJour={sitesParJour}
                value={jours}
            />
        </section>
    );
}

/** La saisie rapide du carburant : un programme publié sans montant, puis trois en lot. */
function BancCarburantRapide({ programmes }: { programmes: IProgramme[] }) {
    const [cibles, setCibles] = React.useState<IProgramme[]>([]);
    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">Le carburant en un geste</h2>
            <div className="flex flex-wrap gap-2">
                <Button onPress={() => setCibles([programmes[0]])} size="sm" variant="outline">
                    Carburant de {programmes[0].livreurNom}
                </Button>
                <Button onPress={() => setCibles(programmes)} size="sm" variant="outline">
                    Carburant de {programmes.length} programmes cochés
                </Button>
            </div>
            <CarburantRapideModal
                isOpen={cibles.length > 0}
                onOpenChange={(o) => {
                    if (!o) setCibles([]);
                }}
                programmes={cibles}
            />
        </section>
    );
}

/**
 * La duplication d'une semaine, avec choix de la source ET de la cible.
 *
 * <p>La fenetre lit desormais le contenu des deux semaines pour dire, AVANT le clic, ce
 * que chacune porte. Le banc pre-remplit donc le cache plutot que de passer un compte en
 * propriete : sans cela il appellerait le reseau, et un banc qui appelle le reseau ne
 * montre plus rien quand le reseau tombe.</p>
 *
 * <p>Semaine 39 : 29 programmes (la source). Semaine 40 : vide. Semaine 41 : 14
 * programmes, pour voir le refus.</p>
 */
/**
 * La fenêtre « Modifier le programme », ouverte SUR le champ manquant (RG-L03, CA-41).
 *
 * <p>La page qui la monte exige une session : sans ce banc, on ne pouvait pas voir où le
 * curseur se pose quand on clique une pastille de manque. Un bouton par manque ; chacun
 * ouvre le premier programme du jeu à qui il manque justement cela.</p>
 */
function BancFormulaire({ programmes }: { programmes: IProgramme[] }) {
    const [cas, setCas] = React.useState<{ champ: CleManque; p: IProgramme } | null>(null);

    const client = React.useMemo(() => {
        const c = new QueryClient({
            defaultOptions: {
                queries: { gcTime: Infinity, refetchOnMount: false, refetchOnReconnect: false, refetchOnWindowFocus: false, retry: false, staleTime: Infinity },
            },
        });
        c.setQueryData(['restaurants', 'all', 'programmes'], RESTOS.map((nom, i) => ({ id: `r${i}`, nomEtablissement: nom })));
        c.setQueryData(ticketsKeyQuery('livreur-list'), programmes.map((p) => ({ id: p.livreurId, nom: p.livreurNom, prenoms: '', typeLivreur: p.typeLivreur })));
        return c;
    }, [programmes]);

    const premier = (champ: CleManque) => programmes.find((p) => manquesProgramme(p).some((m) => m.cle === champ));

    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">Modifier le programme, ouvert sur le champ manquant</h2>
            <div className="flex flex-wrap gap-2">
                {(['SITE', 'BASES', 'HORAIRES', 'CARBURANT'] as const).map((champ) => {
                    const p = premier(champ);
                    return (
                        <Button isDisabled={!p} key={champ} onPress={() => p && setCas({ champ, p })} size="sm" variant="outline">
                            Ouvrir sur {champ}
                        </Button>
                    );
                })}
            </div>
            <QueryClientProvider client={client}>
                <ProgrammeFormModal
                    anneeInitiale={2026}
                    champInitial={cas?.champ ?? null}
                    isOpen={cas !== null}
                    onOpenChange={(ouvert) => {
                        if (!ouvert) setCas(null);
                    }}
                    programme={cas?.p ?? null}
                    semaineInitiale={35}
                />
            </QueryClientProvider>
        </section>
    );
}

function BancDuplication() {
    const [ouvert, setOuvert] = React.useState(false);

    const client = React.useMemo(() => {
        // ⚠ `staleTime` ne suffit PAS : le hook impose le sien (30 s), et au-dela la
        // donnee semee est jugee perimee, la requete repart vers le reseau et le banc
        // affiche 0 la ou il avait seme 14. Ce sont les `refetchOn*` qu'il faut couper,
        // eux ne sont pas redefinis par le hook.
        const c = new QueryClient({
            defaultOptions: {
                queries: {
                    gcTime: Infinity,
                    refetchOnMount: false,
                    refetchOnReconnect: false,
                    refetchOnWindowFocus: false,
                    retry: false,
                },
            },
        });
        const faux = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}` }));
        c.setQueryData(programmeKeys.semaine(2026, 39), faux(29));
        c.setQueryData(programmeKeys.semaine(2026, 40), []);
        c.setQueryData(programmeKeys.semaine(2026, 41), faux(14));
        return c;
    }, []);

    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">Dupliquer une semaine</h2>
            <p className="mb-3 text-xs text-muted">
                Cache pre-rempli : semaine 39 = 29 programmes, 40 = vide, 41 = 14 programmes.
                Passer la cible de 40 a 41 doit faire apparaitre le refus.
            </p>
            <Button onPress={() => setOuvert(true)} size="sm" variant="outline">
                Ouvrir la duplication
            </Button>
            <QueryClientProvider client={client}>
                <DuplicationSemaineDialog
                    onDupliquer={() => setOuvert(false)}
                    onFermer={() => setOuvert(false)}
                    ouvert={ouvert}
                    semaineAffichee={{ annee: 2026, semaine: 39 }}
                />
            </QueryClientProvider>
        </section>
    );
}

/** Le journal d'audit d'un programme, tel qu'il se lit dans sa fenêtre. */
const ACTIONS: IAuditAction[] = [
    {
        chemin: '/api/erp/programmes/dupliquer', dureeMs: 412, ecran: 'Programmes', entiteId: 'p11-1', entiteLibelle: 'Emploi du temps',
        entiteType: 'Emploi du temps', erreur: null, httpMethode: 'POST', id: 'a1', ip: '10.0.0.4', module: 'Planification',
        occurredAt: '2026-08-24T08:02:00Z', role: 'OPS_MANAGER', sessionId: null, statutHttp: 200, succes: true, typeAction: 'CREATION',
        utilisateur: 'Ramata Coulibaly', utilisateurId: 'u1',
        valeursApres: { jours: 'LUN 08:00-17:00 4000 F [Kfc Marcory] ; MAR 08:00-17:00 4000 F ; MER repos ; JEU 08:00-17:00 4000 F ; VEN 08:00-17:00 4000 F ; SAM repos ; DIM repos', statutProgramme: 'BROUILLON', sitePartnerId: 'r2' },
        valeursAvant: null,
    },
    {
        chemin: '/api/erp/programmes/p11-1', dureeMs: 96, ecran: 'Programmes', entiteId: 'p11-1', entiteLibelle: 'Emploi du temps',
        entiteType: 'Emploi du temps', erreur: null, httpMethode: 'PUT', id: 'a2', ip: '10.0.0.4', module: 'Planification',
        occurredAt: '2026-08-24T08:19:00Z', role: 'OPS_MANAGER', sessionId: null, statutHttp: 200, succes: true, typeAction: 'MODIFICATION',
        utilisateur: 'Ramata Coulibaly', utilisateurId: 'u1',
        valeursApres: { jours: 'LUN 08:00-17:00 3000 F [Kfc Marcory] ; MAR 08:00-17:00 3000 F ; MER repos ; JEU 08:00-17:00 3000 F ; VEN 08:00-17:00 3000 F ; SAM repos ; DIM repos', sitePartnerId: 'r0' },
        valeursAvant: { jours: 'LUN 08:00-17:00 4000 F [Kfc Marcory] ; MAR 08:00-17:00 4000 F ; MER repos ; JEU 08:00-17:00 4000 F ; VEN 08:00-17:00 4000 F ; SAM repos ; DIM repos', sitePartnerId: 'r2' },
    },
    {
        chemin: '/api/erp/programmes/p11-1/publier', dureeMs: 288, ecran: 'Programmes', entiteId: 'p11-1', entiteLibelle: 'Emploi du temps',
        entiteType: 'Emploi du temps', erreur: null, httpMethode: 'POST', id: 'a3', ip: '10.0.0.4', module: 'Planification',
        occurredAt: '2026-08-24T08:31:00Z', role: 'OPS_MANAGER', sessionId: null, statutHttp: 200, succes: true, typeAction: 'MODIFICATION',
        utilisateur: 'Ramata Coulibaly', utilisateurId: 'u1',
        valeursApres: { montantCarburantHebdo: 12000, statutProgramme: 'NOTIFIE', whatsappStatut: 'ECHEC' },
        valeursAvant: { montantCarburantHebdo: null, statutProgramme: 'BROUILLON', whatsappStatut: null },
    },
];

/**
 * La soumission des surplus au décaissement, dans ses trois états.
 *
 * <p>Les trois comptent : la semaine pas finie est le cas le plus fréquent et le seul
 * dont l'empêchement n'est devinable par personne ; « tout soumis » doit se distinguer
 * d'« aucun surplus », qui n'affiche RIEN.</p>
 */
function BancSoumissionSurplus() {
    const base = { annee: 2026, chargeId: null, semaine: 35, soumissibleLe: '2026-09-07' };
    return (
        <section className="mt-6 flex flex-col gap-3 rounded-lg border border-separator p-4">
            <h2 className="text-sm font-semibold">La soumission des surplus au décaissement</h2>

            <div>
                <p className="mb-1 text-xs text-muted">Soumissible</p>
                <SoumissionSurplus
                    etat={{
                        ...base,
                        empechement: null,
                        montantASoumettre: 15000,
                        montantDejaSoumis: 0,
                        nbASoumettre: 6,
                        nbDejaSoumis: 0,
                        soumissible: true,
                    }}
                    onSoumettre={() => undefined}
                    peutSoumettre
                />
            </div>

            <div>
                <p className="mb-1 text-xs text-muted">La semaine n’est pas finie</p>
                <SoumissionSurplus
                    etat={{
                        ...base,
                        empechement: "La semaine 35/2026 n'est pas terminée. Les surplus se soumettent à partir du lundi 2026-09-07.",
                        montantASoumettre: 4500,
                        montantDejaSoumis: 0,
                        nbASoumettre: 2,
                        nbDejaSoumis: 0,
                        soumissible: false,
                    }}
                    onSoumettre={() => undefined}
                    peutSoumettre
                />
            </div>

            <div>
                <p className="mb-1 text-xs text-muted">Tout est déjà parti</p>
                <SoumissionSurplus
                    etat={{
                        ...base,
                        empechement: 'Tous les surplus de la semaine 35/2026 sont déjà soumis.',
                        montantASoumettre: 0,
                        montantDejaSoumis: 15000,
                        nbASoumettre: 0,
                        nbDejaSoumis: 6,
                        soumissible: false,
                    }}
                    onSoumettre={() => undefined}
                    peutSoumettre
                />
            </div>

            <div>
                <p className="mb-1 text-xs text-muted">Aucun surplus : rien ne s’affiche</p>
                <SoumissionSurplus
                    etat={{
                        ...base,
                        empechement: 'Aucun surplus à soumettre pour la semaine 35/2026.',
                        montantASoumettre: 0,
                        montantDejaSoumis: 0,
                        nbASoumettre: 0,
                        nbDejaSoumis: 0,
                        soumissible: false,
                    }}
                    onSoumettre={() => undefined}
                    peutSoumettre
                />
            </div>
        </section>
    );
}

/**
 * La ligne de relance des preuves Wave, dans ses trois états.
 *
 * <p>Le troisième — rien ne manque — n'affiche RIEN, et c'est ce qu'il faut vérifier :
 * un « 0 manquante » permanent occuperait le bandeau sans jamais rien demander.</p>
 */
function BancRelancePreuves() {
    // ⚠ NE PAS cliquer « Envoyer » ici : la mutation est la vraie. Ce banc ne sert qu'à LIRE
    // qui est coché à l'ouverture, depuis le bandeau (tous) et depuis une ligne (un seul).
    const [ouverture, setOuverture] = React.useState<{ seulement: string | null } | null>(null);
    const client = React.useMemo(() => {
        const c = new QueryClient({
            defaultOptions: {
                queries: { gcTime: Infinity, refetchOnMount: false, refetchOnReconnect: false, refetchOnWindowFocus: false, retry: false, staleTime: Infinity },
            },
        });
        c.setQueryData(programmeKeys.relancePreuves(2026, 35), {
            annee: 2026,
            livreurs: ['BAMBA Adama', 'CISSE Yacouba', 'KOHI Albert Rene'].map((nom, i) => ({
                livreurId: `l${i}`,
                livreurNom: nom,
                montantManquant: 5000 * (i + 1),
                nbManquantes: i + 1,
                programmeId: `p${i}`,
                versements: [],
            })),
            nbManquantes: 6,
            semaine: 35,
        });
        return c;
    }, []);

    return (
        <section className="mt-6 flex flex-col gap-3 rounded-lg border border-separator p-4">
            <h2 className="text-sm font-semibold">La relance des preuves Wave</h2>

            <div className="flex flex-wrap gap-2">
                <Button onPress={() => setOuverture({ seulement: null })} size="sm" variant="outline">
                    Relance depuis le bandeau
                </Button>
                <Button onPress={() => setOuverture({ seulement: 'p1' })} size="sm" variant="outline">
                    Relance depuis la ligne de CISSE Yacouba
                </Button>
            </div>
            <QueryClientProvider client={client}>
                <RelancePreuvesDialog
                    annee={2026}
                    onFermer={() => setOuverture(null)}
                    ouvert={ouverture !== null}
                    semaine={35}
                    seulement={ouverture?.seulement ?? null}
                />
            </QueryClientProvider>

            <div>
                <p className="mb-1 text-xs text-muted">Sept manquantes, profil habilité</p>
                <LigneRelancePreuves
                    etat={{ annee: 2026, livreurs: [], nbManquantes: 7, semaine: 35 }}
                    onOuvrir={() => undefined}
                    peutRelancer
                />
            </div>

            <div>
                <p className="mb-1 text-xs text-muted">Sept manquantes, profil non habilité (CA-55)</p>
                <LigneRelancePreuves
                    etat={{ annee: 2026, livreurs: [], nbManquantes: 7, semaine: 35 }}
                    onOuvrir={() => undefined}
                    peutRelancer={false}
                />
            </div>

            <div>
                <p className="mb-1 text-xs text-muted">Rien ne manque : rien ne s’affiche</p>
                <LigneRelancePreuves
                    etat={{ annee: 2026, livreurs: [], nbManquantes: 0, semaine: 35 }}
                    onOuvrir={() => undefined}
                    peutRelancer
                />
            </div>
        </section>
    );
}

/** L'historique d'un programme et le regroupement des exports, côte à côte. */
function BancHistorique() {
    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">L&apos;historique d&apos;un programme</h2>
            <HistoriqueProgramme actions={ACTIONS} sites={new Map(Array.from(SITES, ([id, s]) => [id, s.nom]))} />
        </section>
    );
}

/** Le regroupement du document papier : ce que les exports produisent. */
function BancExports({ programmes }: { programmes: IProgramme[] }) {
    const ctx = { carburantSemainePrecedente: 573000, sites: SITES };
    const s = regrouperPourExport(programmes, ctx);
    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">Les exports, groupés par site</h2>
            <div className="mb-3 flex flex-wrap gap-2">
                <Button onPress={() => exporterProgrammesExcel(programmes, 2026, 35, ctx)} size="sm" variant="outline">
                    Excel
                </Button>
                <Button onPress={() => exporterProgrammesPdf(programmes, 2026, 35, 'Tous', ctx)} size="sm" variant="outline">
                    PDF
                </Button>
            </div>
            <ul className="flex flex-col gap-1 text-xs">
                {[...s.livreurs, ...s.supervision].map((g) => (
                    <li className="flex items-baseline justify-between gap-4" key={g.cle}>
                        <span className="text-foreground">
                            {g.titre} <span className="text-muted">{g.sousTitre}</span>
                        </span>
                        <span className="tabular-nums text-foreground">
                            {g.programmes.length} · {libelleMontantGroupe(g)}
                        </span>
                    </li>
                ))}
                <li className="mt-1 flex items-baseline justify-between gap-4 border-t border-separator pt-1 font-semibold">
                    <span>Grand total</span>
                    <span className="tabular-nums">{s.total.toLocaleString('fr-FR')} FCFA</span>
                </li>
            </ul>
        </section>
    );
}

/**
 * L'aperçu individuel, en panneau latéral.
 *
 * <p>Le banc en ouvre DEUX : un seul livreur, pour voir le panneau sans flèches, et une
 * liste de trois, pour voir la navigation ‹ › qui ne ferme pas le panneau. C'est le
 * comportement de §6.3 qu'on ne peut pas vérifier sur un élément unique.</p>
 */
function BancApercu({ liste }: { liste: IProgramme[] }) {
    const [seul, setSeul] = React.useState(false);
    const [parcours, setParcours] = React.useState<number | null>(null);
    const noms = new Map(Array.from(SITES, ([id, s]) => [id, s.nom] as const));

    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">L&apos;aperçu individuel (panneau 420 px)</h2>
            <div className="flex flex-wrap gap-2">
                <Button onPress={() => setSeul(true)} size="sm" variant="outline">
                    Un seul livreur ({liste[0]?.livreurNom})
                </Button>
                <Button isDisabled={liste.length < 2} onPress={() => setParcours(0)} size="sm" variant="outline">
                    Parcourir {Math.min(3, liste.length)} livreurs aux flèches
                </Button>
            </div>

            <ProgrammeApercuPanneau
                annee={2026}
                nomSite={noms}
                onFermer={() => setSeul(false)}
                programme={seul ? (liste[0] ?? null) : null}
                semaine={35}
                telephone="07 00 00 00 00"
            />

            <ProgrammeApercuPanneau
                annee={2026}
                nomSite={noms}
                onFermer={() => setParcours(null)}
                onPrecedent={parcours !== null && parcours > 0 ? () => setParcours(parcours - 1) : undefined}
                onSuivant={
                    parcours !== null && parcours < Math.min(3, liste.length) - 1
                        ? () => setParcours(parcours + 1)
                        : undefined
                }
                position={parcours !== null ? { index: parcours, total: Math.min(3, liste.length) } : null}
                programme={parcours !== null ? (liste[parcours] ?? null) : null}
                semaine={35}
                telephone="07 00 00 00 00"
            />
        </section>
    );
}

export default function ApercuProgrammes() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [etat, setEtat] = React.useState<'normal' | 'chargement' | 'echec'>('normal');
    const [sombre, setSombre] = useThemeSombre();
    const [semaine, setSemaine] = React.useState(35);
    const [type, setType] = React.useState('TOUS');
    const [partenaire, setPartenaire] = React.useState('TOUS');
    const [journal, setJournal] = React.useState<string[]>([]);
    // La vraie fenêtre des preuves, sur le programme et le jour cliqués (l'œil d'une case).
    const [preuvesDe, setPreuvesDe] = React.useState<{ jour: string; programme: IProgramme } | null>(null);
    const noter = (m: string) => setJournal((j) => [...j, m]);

    return (
        <div>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · Programmes</span>
                    {(Object.keys(JEUX) as (keyof typeof JEUX)[]).map((k) => (
                        <Button key={k} onPress={() => setJeu(k)} size="sm" variant={jeu === k ? 'primary' : 'ghost'}>
                            {JEUX[k].libelle}
                        </Button>
                    ))}
                    <span className="mx-1 h-4 w-px bg-separator" />
                    {(['normal', 'chargement', 'echec'] as const).map((e) => (
                        <Button key={e} onPress={() => setEtat(e)} size="sm" variant={etat === e ? 'secondary' : 'ghost'}>
                            {e}
                        </Button>
                    ))}
                    <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
                        {sombre ? 'sombre' : 'clair'}
                    </Button>
                </header>

                {journal.length > 0 && (
                    <p className="border-b border-separator px-4 py-1 text-xs text-muted">
                        {journal[journal.length - 1]}
                    </p>
                )}

                <main className="mx-auto max-w-[1600px] p-4">
                    <SemaineProgrammes
                        annee={2026}
                        autosuffisance={AUTOSUFFISANCE}
                        autosuffisanceIsError={etat === 'echec'}
                        autosuffisanceIsLoading={etat === 'chargement'}
                        // Le bandeau du serveur et la relance : sans eux, ni le compteur de preuves,
                        // ni le bouton posé à côté, ni « vs semaine précédente » ne se voient.
                        bandeau={
                            jeu === 'vide'
                                ? null
                                : {
                                      annee: 2026,
                                      dotationValidee: 172000,
                                      montantEngage: 120000,
                                      nbProgrammesJournaliers: 5,
                                      nbProgrammesSuperviseurs: 5,
                                      preuvesAttendues: 18,
                                      preuvesManquantes: 7,
                                      preuvesRecues: 11,
                                      preuvesValidees: 6,
                                      semaine: 35,
                                      totalADecaisser: 180000,
                                      totalJournaliers: 110000,
                                      totalSuperviseurs: 70000,
                                      totalSurplus: 8000,
                                  }
                        }
                        relancePreuves={
                            jeu === 'vide' ? null : (
                                <LigneRelancePreuves
                                    compact
                                    etat={{ annee: 2026, livreurs: [], nbManquantes: 7, semaine: 35 }}
                                    onOuvrir={() => noter('Relance ouverte depuis le bandeau')}
                                    peutRelancer
                                />
                            )
                        }
                        carburantSemainePrecedente={jeu === 'vide' ? null : 573000}
                        engagement={
                            jeu === 'publiee' ? (
                                <EngagementCarburant
                                    etat={{
                                        annee: 2026,
                                        ecart: 24000,
                                        engagement: {
                                            createdAt: '2026-08-24T08:00:00Z',
                                            creerPar: 'Ramata Coulibaly',
                                            dateDepense: '2026-08-24',
                                            designation: 'Carburant programmes semaine 35/2026',
                                            id: 'charge-apercu',
                                            montant: 150000,
                                            statut: 'EN_ATTENTE_DGA',
                                        },
                                        nbProgrammesPublies: 8,
                                        nbProgrammesSansMontant: 2,
                                        semaine: 35,
                                        totalPublie: 174000,
                                    }}
                                    onEngager={() => noter('Mise à jour de l’engagement')}
                                    peutEngager
                                />
                            ) : (
                                <EngagementCarburant
                                    etat={{
                                        annee: 2026,
                                        ecart: null,
                                        engagement: null,
                                        nbProgrammesPublies: 6,
                                        nbProgrammesSansMontant: 1,
                                        semaine: 35,
                                        totalPublie: 120000,
                                    }}
                                    onEngager={() => noter('Engagement demandé')}
                                    peutEngager
                                />
                            )
                        }
                        independants={INDEPENDANTS}
                        independantsIsError={etat === 'echec'}
                        independantsIsLoading={etat === 'chargement'}
                        isError={etat === 'echec'}
                        isLoading={etat === 'chargement'}
                        onApercu={(p) => noter(`Aperçu de ${p.livreurNom}`)}
                        onCarburant={(p) => noter(`Carburant de ${p.livreurNom}`)}
                        onCarburantLot={(ps) => noter(`Carburant en lot sur ${ps.length} programme(s)`)}
                        onDupliquerSemainePrecedente={() => noter('Duplication de la semaine précédente')}
                        onEditer={(p, champ) => noter(`Édition de ${p.livreurNom}${champ ? ` sur le champ ${champ}` : ''}`)}
                        onEnvoyer={(p) => noter(`Envoi au livreur ${p.livreurNom}`)}
                        onExporterExcel={(seulement) => noter(seulement ? `Export Excel de ${seulement.length} programme(s) cochés` : 'Export Excel')}
                        onExporterPdf={(seulement) => noter(seulement ? `Export PDF de ${seulement.length} programme(s) cochés` : 'Export PDF')}
                        onHistorique={(p) => noter(`Historique de ${p.livreurNom}`)}
                        onImporterFichier={() => noter('Import de fichier')}
                        onNouveau={() => noter('Nouveau programme')}
                        onPartenaireFiltre={setPartenaire}
                        onPlanifier={(p) => noter(`Planification de ${p.livreurNom}`)}
                        onPublier={(p) => noter(`Publication de ${p.livreurNom}`)}
                        onPublierLot={(ids) => noter(`Publication en lot de ${ids.length} programme(s)`)}
                        onReessayer={() => noter('Relecture demandée')}
                        onRenvoyerWhatsApp={(p) => noter(`WhatsApp renvoyé à ${p.livreurNom}`)}
                        onReessayerIndependants={() => noter('Relecture des indépendants')}
                        onSemaine={(d) => setSemaine((s) => s + d)}
                        onSupprimer={(p) => noter(`Suppression de ${p.livreurNom}`)}
                        onTelechargerModele={() => noter('Téléchargement du modèle')}
                        onTypeFiltre={setType}
                        partenaireFiltre={partenaire}
                        partenaires={[...RESTOS.map((r, i) => ({ id: `r${i}`, nom: r })), { id: 'r-vide', nom: 'Kiosque Angré (personne de prévu)' }]}
                        programmes={JEUX[jeu].lignes}
                        semaine={semaine}
                        typeFiltre={type}
                        typeOptions={[
                            { cle: 'TOUS', libelle: 'Tous' },
                            { cle: 'JOURNALIER', libelle: 'Journaliers' },
                            { cle: 'SUPERVISEUR_LIVREUR', libelle: 'Superviseurs' },
                            { cle: 'INDEPENDANT', libelle: 'Indépendants' },
                        ]}
                        /* Le bandeau unique du haut de page : le banc doit le montrer,
                           puisqu'il remplace la mention qui était sur chaque ligne. */
                        whatsappNonConfigure={JEUX[jeu].lignes.some((p) => p.whatsappStatut === 'NON_CONFIGURE')}
                        /* Le bouton œil des preuves Wave : sans ce rappel, le banc ne le
                           montre pas du tout, et sa couleur est précisément ce qu'on doit
                           pouvoir vérifier à l'œil. */
                        onPreuves={(p, jour) => setPreuvesDe({ jour, programme: p })}
                        onApercuExport={(seulement) => noter(seulement ? `Aperçu de l’export de ${seulement.length} programme(s)` : 'Aperçu de l’export')}
                        /* Les quatre gestes du menu de ligne qui ne s'affichent QUE si leur
                           rappel est fourni. Sans eux, le banc montrait un menu amputé de
                           moitié, et surtout on ne pouvait pas vérifier à l'œil lesquels
                           sont grisés selon le statut : le surplus et l'affectation en cours
                           d'opérations n'ont de sens que sur un programme parti, et le
                           serveur les refuse ailleurs. */
                        onAffecterSite={(p) => noter(`Affectation de site pour ${p.livreurNom}`)}
                        onDupliquerSuivante={(p) => noter(`Duplication de ${p.livreurNom} sur S+1`)}
                        onRelancerPreuves={(p) => noter(`Relance des preuves de ${p.livreurNom}`)}
                        onSurplus={(p) => noter(`Surplus carburant pour ${p.livreurNom}`)}
                        /* Deux secteurs et un site orphelin : les onglets, leurs comptes
                           et « Sans secteur » doivent tous être visibles d'un coup. */
                        onConfigurerSecteurs={() => noter('Configuration des secteurs')}
                        secteursEnLecture
                        secteurs={[
                            { id: 's1', nom: 'Abidjan Nord', siteIds: ['r0', 'r1'] },
                            { id: 's2', nom: 'Abidjan Sud', siteIds: ['r2', 'r-vide'] },
                        ]}
                    />
                    {/* ⚠ Valider ou relancer depuis cette fenêtre appelle le VRAI serveur : ne
                        cliquer que « Relancer ce livreur », qui est ici intercepté. */}
                    <PreuvesCarburantDialog
                        cible={preuvesDe}
                        onFermer={() => setPreuvesDe(null)}
                        onRelancer={(p) => {
                            setPreuvesDe(null);
                            noter(`Relance de ${p.livreurNom} depuis la fenêtre des preuves`);
                        }}
                        peutValider={false}
                    />
                    <BancEditeur />
                    <BancFormulaire programmes={JEUX.ordinaire.lignes} />
                    <BancExports programmes={JEUX.ordinaire.lignes} />
                    <BancDuplication />
                    <BancHistorique />
                    <BancApercu liste={JEUX.ordinaire.lignes} />
                    <BancSoumissionSurplus />
                    <BancRelancePreuves />
                    <BancCarburantRapide programmes={[JEUX.ordinaire.lignes[5], JEUX.ordinaire.lignes[3], JEUX.ordinaire.lignes[4]]} />
                </main>
            </div>
        </div>
    );
}
