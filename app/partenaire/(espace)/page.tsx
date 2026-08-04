'use client';

/**
 * TABLEAU DE BORD partenaire (maquette v-dash) : bandeau de bienvenue + accès Rush,
 * bandeau EN DIRECT rafraîchi toutes les 15 s, statistiques par plage avec KPI
 * cliquables, graphique CSS « Livraisons par jour », top zones et export CSV.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Spinner } from '@heroui/react';
import {
  AlertTriangle,
  Bike,
  ChevronRight,
  Clock,
  Download,
  Home,
  Lock,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { ErreurPartenaire, lirePartenaire } from '@/features/espace-partenaire/api';
import { useProfilPartenaire } from '@/features/espace-partenaire/composants/coquille-partenaire';

/* ------------------------------------------------------------------ types */

type Direct = {
  coursesEnCours: number;
  turboysEnRoute: number;
  dernierRetourStore: string | null;
  tempsMoyenJourMinutes: number | null;
  aCompleterAvantCloture: number;
};

type TableauBord = {
  demandes: number;
  livrees: number;
  annulees: number;
  actives: number;
  caLivraisonFcfa: number;
  panierMoyenFcfa: number;
  tempsMoyenLivraisonMinutes: number | null;
  tauxReussitePct: number;
  zonesTop: { zone: string; courses: number; caFcfa: number }[];
  livraisonsParJour: Record<string, number>;
};

type ClePlage =
  | 'jour'
  | 'hier'
  | '7j'
  | '30j'
  | 'mois'
  | 'moisPrec'
  | 'trimestre'
  | 'annee'
  | 'tout'
  | 'perso';

type Bornes = { debutIso: string; finIso: string; libelle: string };

/* ------------------------------------------------------------- plages */

const PLAGES: { cle: ClePlage; libelle: string }[] = [
  { cle: 'jour', libelle: "Aujourd'hui" },
  { cle: 'hier', libelle: 'Hier' },
  { cle: '7j', libelle: '7 jours' },
  { cle: '30j', libelle: '30 jours' },
  { cle: 'mois', libelle: 'Mois en cours' },
  { cle: 'moisPrec', libelle: 'Mois dernier' },
  { cle: 'trimestre', libelle: 'Trimestre' },
  { cle: 'annee', libelle: 'Année' },
  { cle: 'tout', libelle: 'Tout' },
  { cle: 'perso', libelle: 'Personnalisé' },
];

function debutJour(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function finJour(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Bornes ISO de la plage — heure locale (Abidjan ≈ UTC), 'perso' est géré à part. */
function calculerBornes(cle: Exclude<ClePlage, 'perso'>): Bornes {
  const maintenant = new Date();
  const libelle = PLAGES.find((p) => p.cle === cle)?.libelle ?? '';
  let debut: Date;
  let fin: Date = maintenant;

  switch (cle) {
    case 'jour':
      debut = debutJour(maintenant);
      break;
    case 'hier': {
      const hier = new Date(maintenant);
      hier.setDate(hier.getDate() - 1);
      debut = debutJour(hier);
      fin = finJour(hier);
      break;
    }
    case '7j': {
      const d = new Date(maintenant);
      d.setDate(d.getDate() - 6);
      debut = debutJour(d);
      break;
    }
    case '30j': {
      const d = new Date(maintenant);
      d.setDate(d.getDate() - 29);
      debut = debutJour(d);
      break;
    }
    case 'mois':
      debut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
      break;
    case 'moisPrec':
      debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
      fin = finJour(new Date(maintenant.getFullYear(), maintenant.getMonth(), 0));
      break;
    case 'trimestre':
      debut = new Date(maintenant.getFullYear(), Math.floor(maintenant.getMonth() / 3) * 3, 1);
      break;
    case 'annee':
      debut = new Date(maintenant.getFullYear(), 0, 1);
      break;
    case 'tout':
      debut = new Date(2020, 0, 1);
      break;
  }

  return { debutIso: debut.toISOString(), finIso: fin.toISOString(), libelle };
}

/* ------------------------------------------------------------- helpers */

const fmtNombre = new Intl.NumberFormat('fr-FR');

function heureLocale(valeur: string | null): string {
  if (!valeur) return '—';
  if (valeur.includes('T')) {
    const d = new Date(valeur);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
  }
  return valeur;
}

function messageErreur(e: unknown): string {
  return e instanceof ErreurPartenaire ? e.message : 'Une erreur est survenue — réessayez';
}

/* ================================================================= page */

export default function PageTableauBord() {
  const profil = useProfilPartenaire();

  /* --- EN DIRECT, rafraîchi toutes les 15 s --- */
  const [direct, setDirect] = useState<Direct | null>(null);

  useEffect(() => {
    let arrete = false;
    const relever = () =>
      lirePartenaire<Direct>('direct')
        .then((d) => !arrete && setDirect(d))
        .catch(() => undefined);
    relever();
    const intervalle = setInterval(relever, 15_000);
    return () => {
      arrete = true;
      clearInterval(intervalle);
    };
  }, []);

  /* --- plage sélectionnée + statistiques --- */
  const [cle, setCle] = useState<ClePlage>('jour');
  const [bornes, setBornes] = useState<Bornes>(() => calculerBornes('jour'));
  const [persoDebut, setPersoDebut] = useState('');
  const [persoFin, setPersoFin] = useState('');
  const [stats, setStats] = useState<TableauBord | null>(null);
  const [statsChargement, setStatsChargement] = useState(true);
  const [erreurStats, setErreurStats] = useState<string | null>(null);
  const [version, setVersion] = useState(0); // pour « Réessayer »

  function choisirPlage(nouvelle: ClePlage) {
    setCle(nouvelle);
    if (nouvelle !== 'perso') {
      setBornes(calculerBornes(nouvelle));
    }
  }

  function appliquerPerso() {
    if (!persoDebut || !persoFin) {
      toast.error('Renseignez les deux dates');
      return;
    }
    const debut = debutJour(new Date(`${persoDebut}T00:00:00`));
    const fin = finJour(new Date(`${persoFin}T00:00:00`));
    if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || debut > fin) {
      toast.error('Plage de dates invalide');
      return;
    }
    setBornes({
      debutIso: debut.toISOString(),
      finIso: fin.toISOString(),
      libelle: `Du ${debut.toLocaleDateString('fr-FR')} au ${fin.toLocaleDateString('fr-FR')}`,
    });
  }

  useEffect(() => {
    let arrete = false;
    setStatsChargement(true);
    lirePartenaire<TableauBord>('tableau-bord', { debut: bornes.debutIso, fin: bornes.finIso })
      .then((s) => {
        if (!arrete) {
          setStats(s);
          setErreurStats(null);
        }
      })
      .catch((e) => {
        if (!arrete) setErreurStats(messageErreur(e));
      })
      .finally(() => {
        if (!arrete) setStatsChargement(false);
      });
    return () => {
      arrete = true;
    };
  }, [bornes, version]);

  /* --- dérivés graphiques --- */
  const barres = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.livraisonsParJour)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30);
  }, [stats]);
  const maxBarre = Math.max(1, ...barres.map(([, n]) => n));
  const pasEtiquette = Math.max(1, Math.ceil(barres.length / 10));
  const maxZone = Math.max(1, ...(stats?.zonesTop.map((z) => z.courses) ?? []));

  const lienCourses = `/partenaire/courses?${new URLSearchParams({
    debut: bornes.debutIso,
    fin: bornes.finIso,
  }).toString()}`;

  /* --- export CSV client-side --- */
  function exporterCsv() {
    if (!stats) return;
    const lignes: (string | number)[][] = [
      ['Plage', bornes.libelle],
      [],
      ['Indicateur', 'Valeur'],
      ['Livraisons effectuées', stats.demandes],
      ['Commandes livrées', stats.livrees],
      ['Annulées', stats.annulees],
      ['Actives', stats.actives],
      ['Taux de réussite (%)', stats.tauxReussitePct],
      ['CA livraison (FCFA)', stats.caLivraisonFcfa],
      ['Panier moyen (FCFA)', stats.panierMoyenFcfa],
      ['Temps moyen de livraison (min)', stats.tempsMoyenLivraisonMinutes ?? ''],
      [],
      ['Date', 'Livraisons'],
      ...Object.entries(stats.livraisonsParJour).sort(([a], [b]) => a.localeCompare(b)),
      [],
      ['Zone', 'Courses', 'CA (FCFA)'],
      ...stats.zonesTop.map((z) => [z.zone, z.courses, z.caFcfa]),
    ];
    const csv = lignes
      .map((l) => l.map((c) => String(c).replace(/;/g, ',')).join(';'))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turbo-statistiques-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Export CSV généré — ${bornes.libelle}`);
  }

  /* --------------------------------------------------------------- rendu */

  const tuilesDirect = [
    {
      libelle: 'Courses en cours',
      valeur: direct ? fmtNombre.format(direct.coursesEnCours) : '—',
      icone: Zap,
      classe: 'bg-orange-50 text-orange-600',
    },
    {
      libelle: 'Turboys en route',
      valeur: direct ? fmtNombre.format(direct.turboysEnRoute) : '—',
      icone: Bike,
      classe: 'bg-blue-50 text-blue-600',
    },
    {
      libelle: 'Temps moyen du jour',
      valeur:
        direct && direct.tempsMoyenJourMinutes != null
          ? `${fmtNombre.format(direct.tempsMoyenJourMinutes)} min`
          : '—',
      icone: Clock,
      classe: 'bg-emerald-50 text-emerald-600',
    },
    {
      libelle: 'Dernier retour au store',
      valeur: direct ? heureLocale(direct.dernierRetourStore) : '—',
      icone: Home,
      classe: 'bg-violet-50 text-violet-600',
    },
  ];

  const cartesKpi = stats
    ? [
        {
          libelle: 'Livraisons effectuées',
          valeur: fmtNombre.format(stats.demandes),
          sous: `${fmtNombre.format(stats.actives)} active(s) · ${fmtNombre.format(stats.annulees)} annulée(s)`,
        },
        {
          libelle: 'Commandes livrées',
          valeur: fmtNombre.format(stats.livrees),
          sous: `${fmtNombre.format(stats.tauxReussitePct)} % de réussite`,
        },
        {
          libelle: 'CA livraison',
          valeur: `${fmtNombre.format(stats.caLivraisonFcfa)} FCFA`,
          sous: 'sur la période',
        },
        {
          libelle: 'Panier moyen',
          valeur: `${fmtNombre.format(stats.panierMoyenFcfa)} FCFA`,
          sous: 'par commande livrée',
        },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6">
      {/* ============ Bandeau de bienvenue ============ */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-5 text-white sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <h1 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
              Bonjour, {profil.storeNom ?? profil.nom ?? 'partenaire'} 👋
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Un client à livrer ? Votre Turboys part en quelques secondes.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 sm:w-72">
            <Button
              as={Link}
              href="/partenaire/demande"
              color="primary"
              size="lg"
              radius="lg"
              className="min-h-[52px] text-base font-bold"
              startContent={<Bike className="h-5 w-5" aria-hidden />}
            >
              Demander un Turboys
            </Button>

            {profil.rushActive &&
              (profil.rushOuvert ? (
                <Link
                  href="/partenaire/demande?mode=rush"
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-400/25"
                >
                  <Zap className="h-4 w-4" aria-hidden />
                  MODE RUSH
                  <span className="text-xs font-medium text-amber-200/70">un tap = un Turboys</span>
                </Link>
              ) : (
                <div className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/40">
                  <Lock className="h-4 w-4" aria-hidden />
                  MODE RUSH
                  <span className="text-xs font-medium">hors plages</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ============ EN DIRECT ============ */}
      <section className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            En direct
          </h2>
          {direct && direct.aCompleterAvantCloture > 0 && (
            <Link
              href="/partenaire/courses?filtre=a-completer"
              className="flex min-h-[44px] items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-200"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden />À COMPLÉTER AVANT CLÔTURE (
              {direct.aCompleterAvantCloture})
            </Link>
          )}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {tuilesDirect.map(({ libelle, valeur, icone: Icone, classe }) => (
            <div
              key={libelle}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classe}`}
              >
                <Icone className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold leading-tight">{valeur}</p>
                <p className="truncate text-xs text-gray-500">{libelle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Statistiques ============ */}
      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Exploitation des données
            </p>
            <h2 className="text-xl font-bold">Vos statistiques</h2>
            <p className="text-xs text-gray-500">
              Chaque indicateur est cliquable — {bornes.libelle}
            </p>
          </div>
          <Button
            variant="bordered"
            radius="lg"
            className="min-h-[48px] font-semibold"
            startContent={<Download className="h-4 w-4" aria-hidden />}
            isDisabled={!stats}
            onPress={exporterCsv}
          >
            Exporter CSV
          </Button>
        </div>

        {/* Sélecteur de plage */}
        <div className="mt-3 flex flex-wrap gap-2">
          {PLAGES.map(({ cle: c, libelle }) => (
            <button
              key={c}
              type="button"
              onClick={() => choisirPlage(c)}
              className={`min-h-[48px] rounded-full border px-4 text-sm font-medium transition-colors ${
                cle === c
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {libelle}
            </button>
          ))}
        </div>

        {cle === 'perso' && (
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border border-gray-100 bg-white p-3">
            <Input
              type="date"
              size="sm"
              label="Du"
              value={persoDebut}
              onValueChange={setPersoDebut}
              className="w-40"
            />
            <Input
              type="date"
              size="sm"
              label="Au"
              value={persoFin}
              onValueChange={setPersoFin}
              className="w-40"
            />
            <Button
              color="primary"
              radius="lg"
              className="min-h-[48px] font-semibold"
              onPress={appliquerPerso}
            >
              Appliquer
            </Button>
          </div>
        )}

        {/* Erreur / chargement */}
        {erreurStats && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
            <span className="flex-1">{erreurStats}</span>
            <Button
              size="sm"
              variant="bordered"
              className="min-h-[44px]"
              onPress={() => setVersion((v) => v + 1)}
            >
              Réessayer
            </Button>
          </div>
        )}

        {statsChargement && !stats && (
          <div className="mt-8 flex justify-center">
            <Spinner color="primary" label="Chargement des statistiques…" />
          </div>
        )}

        {/* Cartes KPI */}
        {stats && (
          <>
            <div
              className={`mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4 ${
                statsChargement ? 'opacity-60' : ''
              }`}
            >
              {cartesKpi.map(({ libelle, valeur, sous }) => (
                <Link
                  key={libelle}
                  href={lienCourses}
                  className="group flex min-h-[96px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {libelle}
                    <ChevronRight
                      className="h-4 w-4 text-gray-300 transition-colors group-hover:text-primary"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-1 text-2xl font-bold leading-tight">{valeur}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{sous}</p>
                </Link>
              ))}
            </div>

            {/* Graphique + zones */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
              {/* Livraisons par jour — barres CSS pures */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-3">
                <h3 className="font-bold">Livraisons par jour</h3>
                <p className="text-xs text-gray-500">{bornes.libelle}</p>
                {barres.length === 0 ? (
                  <p className="mt-8 pb-8 text-center text-sm text-gray-400">
                    Aucune livraison sur la période
                  </p>
                ) : (
                  <div className="mt-4 flex h-44 items-end gap-1">
                    {barres.map(([jour, n], i) => (
                      <div
                        key={jour}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                        title={`${new Date(`${jour}T12:00:00`).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })} — ${fmtNombre.format(n)} livraison(s)`}
                      >
                        <div
                          className={`w-full max-w-[26px] rounded-t-md ${
                            n > 0 ? 'bg-primary/80' : 'bg-gray-100'
                          }`}
                          style={{
                            height: n > 0 ? `${Math.max(6, Math.round((n / maxBarre) * 100))}%` : '4px',
                          }}
                        />
                        <span className="h-4 text-[10px] text-gray-400">
                          {i % pasEtiquette === 0 ? Number(jour.slice(8)) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Zones les plus livrées */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-2">
                <h3 className="font-bold">Vos zones les plus livrées</h3>
                <p className="text-xs text-gray-500">Part des courses de la période</p>
                {stats.zonesTop.length === 0 ? (
                  <p className="mt-8 pb-8 text-center text-sm text-gray-400">
                    Aucune course sur la période
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {stats.zonesTop.map((z, i) => (
                      <li key={z.zone} className="flex items-center gap-3">
                        <span className="w-5 shrink-0 text-sm font-bold text-gray-400">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-semibold">{z.zone}</span>
                            <span className="shrink-0 text-xs text-gray-500">
                              {fmtNombre.format(z.courses)} · {fmtNombre.format(z.caFcfa)} FCFA
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-primary/70"
                              style={{ width: `${Math.round((z.courses / maxZone) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
