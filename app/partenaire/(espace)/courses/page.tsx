'use client';

/**
 * MES COURSES + SUIVI TEMPS RÉEL (EF-04 / EF-05).
 *
 * Listing type admin de la maquette (v-courses) : deux onglets, filtres combinables
 * (EF-04.7), export CSV, tableau HeroUI sur ordinateur et cartes tactiles sur mobile.
 * Le suivi (tovl) s'ouvre en modale : carte Google Maps (S/C/T), chronologie en 6
 * étapes (EF-05.2) et actions de la course — renvoi du lien de localisation,
 * confirmation de remise, complétion des données de clôture (RG-09).
 *
 * La liste se rafraîchit toutes les 15 s ; le détail aussi tant que la course est active.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
} from '@heroui/react';
import {
  ClipboardList,
  Download,
  Eye,
  Navigation,
  PackageCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import { ecrirePartenaire, ErreurPartenaire, lirePartenaire } from '@/features/espace-partenaire/api';
import CarteSuivi from '@/features/espace-partenaire/composants/carte-suivi';
import { useProfilPartenaire } from '@/features/espace-partenaire/composants/coquille-partenaire';

/* ------------------------------------------------------------------ types */

type StatutCourse =
  | 'EN_ATTENTE_AFFECTATION'
  | 'TURBOYS_AFFECTE'
  | 'EN_ROUTE_CLIENT'
  | 'LIVREE_RETOUR_EN_COURS'
  | 'CLOTURE_BLOQUEE'
  | 'TERMINEE'
  | 'ANNULEE';

type StatutLocalisation = 'PAS_DE_LIEN' | 'LIEN_ENVOYE' | 'POSITION_RECUE' | 'EXPIRE';

interface LigneCourse {
  courseId: string;
  code: string;
  creeLe: string;
  statut: StatutCourse;
  zone: string | null;
  tarifFcfa: number;
  montantCommandeFcfa: number | null;
  client: string | null;
  contact: string | null;
  turboys: string | null;
  localisation: StatutLocalisation;
  clotureBloquee: boolean;
  donneesCompletes: boolean;
}

interface EtapeChronologie {
  phase: string;
  libelle: string;
  horodatage: string | null;
  atteinte: boolean;
}

interface DetailCourse extends LigneCourse {
  chronologie: EtapeChronologie[];
  localisationStatut?: StatutLocalisation;
  localisationLatitude?: number | null;
  localisationLongitude?: number | null;
  localisationRepere?: string | null;
  localisationPrecisionM?: number | null;
}

interface ZoneLivraison {
  id: string;
  zone: string;
  nom: string;
  tarifFcfa: number;
  latitude: number;
  longitude: number;
}

/* --------------------------------------------------------------- lexiques */

type CouleurChip = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

const STATUTS: Record<StatutCourse, { libelle: string; couleur: CouleurChip; classe?: string }> = {
  EN_ATTENTE_AFFECTATION: { libelle: "En attente d'affectation", couleur: 'default' },
  TURBOYS_AFFECTE: { libelle: 'Turboys affecté', couleur: 'primary' },
  EN_ROUTE_CLIENT: { libelle: 'En route client', couleur: 'warning' },
  LIVREE_RETOUR_EN_COURS: { libelle: 'Livrée — retour en cours', couleur: 'secondary' },
  CLOTURE_BLOQUEE: { libelle: 'Clôture bloquée', couleur: 'danger' },
  TERMINEE: { libelle: 'Terminée', couleur: 'success' },
  ANNULEE: { libelle: 'Annulée', couleur: 'default', classe: 'line-through opacity-60' },
};

/** Statuts pour lesquels le bouton d'action est « Suivre » (course encore vivante). */
const STATUTS_ACTIFS: StatutCourse[] = [
  'EN_ATTENTE_AFFECTATION',
  'TURBOYS_AFFECTE',
  'EN_ROUTE_CLIENT',
  'LIVREE_RETOUR_EN_COURS',
];

/** Statuts pendant lesquels le Turboys est réellement en mouvement (poll position). */
const STATUTS_EN_MOUVEMENT: StatutCourse[] = [
  'TURBOYS_AFFECTE',
  'EN_ROUTE_CLIENT',
  'LIVREE_RETOUR_EN_COURS',
];

const LOCALISATIONS: Record<StatutLocalisation, { titre: string; classe: string }> = {
  PAS_DE_LIEN: { titre: 'Pas de lien de localisation', classe: 'bg-gray-100 grayscale opacity-60' },
  LIEN_ENVOYE: { titre: 'Lien envoyé — en attente de la position', classe: 'bg-amber-100 ring-1 ring-amber-300' },
  POSITION_RECUE: { titre: 'Position exacte reçue', classe: 'bg-green-100 ring-1 ring-green-300' },
  EXPIRE: { titre: 'Lien expiré', classe: 'bg-red-50 ring-1 ring-red-200 grayscale' },
};

const LOCALISATION_DETAIL: Record<StatutLocalisation, { texte: string; classe: string }> = {
  PAS_DE_LIEN: { texte: 'Zone seule (pas de lien)', classe: 'text-gray-500' },
  LIEN_ENVOYE: { texte: 'Lien envoyé, en attente', classe: 'text-amber-600' },
  POSITION_RECUE: { texte: 'Position exacte reçue — transmise au Turboys', classe: 'text-green-600' },
  EXPIRE: { texte: 'Lien expiré', classe: 'text-red-500' },
};

/* ------------------------------------------------------------- formatage */

const fmtNombre = new Intl.NumberFormat('fr-FR');
const fcfa = (montant: number | null | undefined) =>
  montant == null ? '—' : `${fmtNombre.format(montant)} F`;
const dateFr = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const heureFr = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('');
}

/** Puce 📍 exigée par la maquette : la couleur du fond porte l'état de la localisation. */
function PuceLocalisation({ statut }: { statut: StatutLocalisation }) {
  const config = LOCALISATIONS[statut] ?? LOCALISATIONS.PAS_DE_LIEN;
  return (
    <span
      title={config.titre}
      aria-label={config.titre}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] leading-none ${config.classe}`}
    >
      📍
    </span>
  );
}

/* ------------------------------------------------------------------ page */

export default function PageCourses() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-10">
          <Spinner color="primary" label="Chargement des courses…" />
        </div>
      }
    >
      <ContenuCourses />
    </Suspense>
  );
}

function ContenuCourses() {
  const profil = useProfilPartenaire();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtreACompleter = searchParams.get('filtre') === 'a-completer';

  /* ------------------------------ filtres (EF-04.7 : tous combinables) */
  const [onglet, setOnglet] = useState<'tous' | 'archives'>('tous');
  const [recherche, setRecherche] = useState('');
  const [rechercheDebouncee, setRechercheDebouncee] = useState('');
  const [zoneFiltre, setZoneFiltre] = useState('');
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const minuterie = setTimeout(() => setRechercheDebouncee(recherche.trim()), 400);
    return () => clearTimeout(minuterie);
  }, [recherche]);

  /* ------------------------------------------------------------ données */
  const [lignes, setLignes] = useState<LigneCourse[]>([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [zones, setZones] = useState<ZoneLivraison[]>([]);

  useEffect(() => {
    lirePartenaire<ZoneLivraison[]>('zones')
      .then(setZones)
      .catch(() => undefined);
  }, []);

  // Garde anti-réponses croisées : seule la DERNIÈRE requête a le droit d'écrire
  // l'état (le poll de 15 s et un changement de filtre peuvent se chevaucher).
  const requeteRef = useRef(0);
  const chargerCourses = useCallback(
    async (silencieux = false) => {
      const numero = ++requeteRef.current;
      if (!silencieux) setChargement(true);
      try {
        const params: Record<string, string> = {
          onglet,
          page: String(page - 1),
          taille: '25',
        };
        if (rechercheDebouncee) params.recherche = rechercheDebouncee;
        if (zoneFiltre) params.zone = zoneFiltre;
        if (du) params.debut = new Date(`${du}T00:00:00`).toISOString();
        if (au) params.fin = new Date(`${au}T23:59:59`).toISOString();
        const resultat = await lirePartenaire<{ total: number; contenu: LigneCourse[] }>(
          'courses',
          params,
        );
        if (numero !== requeteRef.current) return;
        setLignes(resultat.contenu);
        setTotal(resultat.total);
      } catch (erreur) {
        if (numero === requeteRef.current && !silencieux) {
          toast.error(
            erreur instanceof ErreurPartenaire
              ? erreur.message
              : 'Impossible de charger les courses — réessayez',
          );
        }
      } finally {
        if (numero === requeteRef.current) setChargement(false);
      }
    },
    [onglet, page, rechercheDebouncee, zoneFiltre, du, au],
  );

  useEffect(() => {
    chargerCourses();
    const intervalle = setInterval(() => chargerCourses(true), 15_000);
    return () => clearInterval(intervalle);
  }, [chargerCourses]);

  const optionsZones = useMemo(
    () => Array.from(new Set(zones.map((z) => z.zone).filter(Boolean))),
    [zones],
  );

  const lignesAffichees = useMemo(
    () => (filtreACompleter ? lignes.filter((l) => !l.donneesCompletes) : lignes),
    [lignes, filtreACompleter],
  );
  const totalAffiche = filtreACompleter ? lignesAffichees.length : total;
  const pages = Math.max(1, Math.ceil(total / 25));

  /* ---------------------------------------------------------- export CSV */
  function exporterCsv() {
    const entetes = [
      'Code',
      'Turboys',
      'Zone',
      'Tarif livraison (FCFA)',
      'Montant commande (FCFA)',
      'Date',
      'Heure',
      'Statut',
      'Localisation client',
    ];
    const rangs = lignesAffichees.map((l) => [
      l.code,
      l.turboys ?? '',
      l.zone ?? '',
      String(l.tarifFcfa ?? ''),
      l.montantCommandeFcfa != null ? String(l.montantCommandeFcfa) : '',
      dateFr(l.creeLe),
      heureFr(l.creeLe),
      STATUTS[l.statut]?.libelle ?? l.statut,
      LOCALISATIONS[l.localisation]?.titre ?? l.localisation,
    ]);
    const csv = [entetes, ...rangs]
      .map((rang) => rang.map((valeur) => `"${valeur.replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `courses-turbo-${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  /* ------------------------------------------------------ suivi (EF-05) */
  const [courseOuverte, setCourseOuverte] = useState<LigneCourse | null>(null);
  const [detail, setDetail] = useState<DetailCourse | null>(null);
  const [formOuvert, setFormOuvert] = useState(false);
  const [fNom, setFNom] = useState('');
  const [fContact, setFContact] = useState('');
  const [fMontant, setFMontant] = useState('');
  const [envoiForm, setEnvoiForm] = useState(false);
  const [envoiRetrait, setEnvoiRetrait] = useState(false);
  const [envoiRelance, setEnvoiRelance] = useState(false);

  const chargerDetail = useCallback(async (courseId: string) => {
    try {
      const d = await lirePartenaire<DetailCourse>(`courses/${courseId}`);
      setDetail((precedent) =>
        precedent === null || precedent.courseId === d.courseId ? d : precedent,
      );
    } catch (erreur) {
      toast.error(
        erreur instanceof ErreurPartenaire
          ? erreur.message
          : 'Impossible de charger le détail de la course',
      );
    }
  }, []);

  function ouvrirSuivi(ligne: LigneCourse) {
    setCourseOuverte(ligne);
    setDetail(null);
    setFormOuvert(false);
    setFNom(ligne.client ?? '');
    setFContact(ligne.contact ?? '');
    setFMontant(ligne.montantCommandeFcfa != null ? String(ligne.montantCommandeFcfa) : '');
  }

  function fermerSuivi() {
    setCourseOuverte(null);
    setDetail(null);
    setFormOuvert(false);
  }

  useEffect(() => {
    if (!courseOuverte) return;
    chargerDetail(courseOuverte.courseId);
  }, [courseOuverte, chargerDetail]);

  const statutOuvert = detail?.statut ?? courseOuverte?.statut ?? null;
  const detailActif =
    statutOuvert != null &&
    (STATUTS_ACTIFS.includes(statutOuvert) || statutOuvert === 'CLOTURE_BLOQUEE');
  const enMouvement = statutOuvert != null && STATUTS_EN_MOUVEMENT.includes(statutOuvert);

  useEffect(() => {
    if (!courseOuverte || !detailActif) return;
    const intervalle = setInterval(() => chargerDetail(courseOuverte.courseId), 15_000);
    return () => clearInterval(intervalle);
  }, [courseOuverte, detailActif, chargerDetail]);

  async function confirmerRetrait() {
    if (!courseOuverte) return;
    setEnvoiRetrait(true);
    try {
      await ecrirePartenaire<{ confirme: boolean }>(
        `courses/${courseOuverte.courseId}/confirmer-retrait`,
      );
      toast.success('Remise au Turboys confirmée');
      await chargerDetail(courseOuverte.courseId);
      chargerCourses(true);
    } catch (erreur) {
      toast.error(
        erreur instanceof ErreurPartenaire ? erreur.message : 'Confirmation impossible — réessayez',
      );
    } finally {
      setEnvoiRetrait(false);
    }
  }

  async function renvoyerLien() {
    if (!courseOuverte) return;
    setEnvoiRelance(true);
    try {
      const { lien } = await ecrirePartenaire<{ lien: string }>(
        `courses/${courseOuverte.courseId}/relancer-localisation`,
      );
      toast.success('Lien de localisation renvoyé au client', {
        description: lien,
        duration: 10_000,
        action: {
          label: 'Copier',
          onClick: () => {
            navigator.clipboard?.writeText(lien).catch(() => undefined);
          },
        },
      });
      chargerDetail(courseOuverte.courseId);
    } catch (erreur) {
      toast.error(
        erreur instanceof ErreurPartenaire ? erreur.message : "Impossible de renvoyer le lien",
      );
    } finally {
      setEnvoiRelance(false);
    }
  }

  async function soumettreCompletion(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!courseOuverte) return;
    const montant = Number(fMontant.replace(/[^\d]/g, ''));
    if (!Number.isFinite(montant) || montant <= 0) {
      toast.error('Indiquez le montant de la commande en FCFA');
      return;
    }
    setEnvoiForm(true);
    try {
      await ecrirePartenaire<LigneCourse>(`courses/${courseOuverte.courseId}/completer`, {
        nomClient: fNom.trim(),
        contactClient: fContact.trim(),
        montant,
      });
      toast.success('Données de clôture enregistrées');
      setFormOuvert(false);
      await chargerDetail(courseOuverte.courseId);
      chargerCourses(true);
    } catch (erreur) {
      // RG-09 : le serveur renvoie des messages français précis (contact invalide…)
      toast.error(
        erreur instanceof ErreurPartenaire ? erreur.message : 'Enregistrement impossible — réessayez',
      );
    } finally {
      setEnvoiForm(false);
    }
  }

  /* ------------------------------------------------------------- rendu */

  return (
    <main className="flex flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Mes courses & tickets</h1>
        <p className="text-sm text-gray-500">
          Toutes vos opérations de livraison — recherche, filtres et export.
        </p>
      </div>

      <Tabs
        selectedKey={onglet}
        onSelectionChange={(cle) => {
          setOnglet(cle === 'archives' ? 'archives' : 'tous');
          setPage(1);
        }}
        color="primary"
        radius="lg"
        classNames={{ tab: 'h-11 px-5' }}
        aria-label="Type de tickets"
      >
        <Tab key="tous" title="Tous les tickets" />
        <Tab key="archives" title="Archives" />
      </Tabs>

      {/* Filtres combinables (EF-04.7) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Input
          value={recherche}
          onValueChange={(valeur) => {
            setRecherche(valeur);
            setPage(1);
          }}
          isClearable
          onClear={() => {
            setRecherche('');
            setPage(1);
          }}
          placeholder="Code, client ou Turboys…"
          startContent={<Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />}
          aria-label="Rechercher un ticket"
          classNames={{ inputWrapper: 'h-12' }}
        />
        <Select
          selectedKeys={zoneFiltre ? [zoneFiltre] : []}
          onChange={(evenement) => {
            setZoneFiltre(evenement.target.value);
            setPage(1);
          }}
          placeholder="Toutes les zones"
          aria-label="Filtrer par zone"
          classNames={{ trigger: 'h-12' }}
        >
          {optionsZones.map((zone) => (
            <SelectItem key={zone}>{zone}</SelectItem>
          ))}
        </Select>
        <Input
          type="date"
          label="Du"
          value={du}
          onValueChange={(valeur) => {
            setDu(valeur);
            setPage(1);
          }}
          classNames={{ inputWrapper: 'h-12' }}
        />
        <Input
          type="date"
          label="Au"
          value={au}
          onValueChange={(valeur) => {
            setAu(valeur);
            setPage(1);
          }}
          classNames={{ inputWrapper: 'h-12' }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Total : <b className="tabular-nums">{totalAffiche}</b> ticket(s)
        </p>
        <div className="flex items-center gap-2">
          {filtreACompleter && (
            <Chip
              color="warning"
              variant="flat"
              onClose={() => router.replace('/partenaire/courses')}
            >
              À compléter uniquement
            </Chip>
          )}
          <Button
            variant="bordered"
            className="h-12 px-4 font-medium"
            startContent={<Download className="h-4 w-4" aria-hidden />}
            onPress={exporterCsv}
            isDisabled={lignesAffichees.length === 0}
          >
            Exporter
          </Button>
        </div>
      </div>

      {/* Tableau — ordinateur */}
      <div className="hidden md:block">
        <Table aria-label="Mes courses" isStriped removeWrapper={false}>
          <TableHeader>
            <TableColumn>CODE</TableColumn>
            <TableColumn>TURBOYS</TableColumn>
            <TableColumn>ZONE</TableColumn>
            <TableColumn>TARIF LIVRAISON</TableColumn>
            <TableColumn>MONTANT COMMANDE</TableColumn>
            <TableColumn>DATE</TableColumn>
            <TableColumn>HEURE</TableColumn>
            <TableColumn>STATUT</TableColumn>
            <TableColumn>ACTION</TableColumn>
          </TableHeader>
          <TableBody
            items={lignesAffichees}
            isLoading={chargement && lignesAffichees.length === 0}
            loadingContent={<Spinner color="primary" />}
            emptyContent={chargement ? ' ' : 'Aucun ticket sur cette période'}
          >
            {(ligne) => {
              const statut = STATUTS[ligne.statut] ?? STATUTS.EN_ATTENTE_AFFECTATION;
              const actif = STATUTS_ACTIFS.includes(ligne.statut);
              return (
                <TableRow key={ligne.courseId}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold">{ligne.code}</span>
                  </TableCell>
                  <TableCell>{ligne.turboys ?? '—'}</TableCell>
                  <TableCell>{ligne.zone ?? '—'}</TableCell>
                  <TableCell>
                    <span className="tabular-nums">{fcfa(ligne.tarifFcfa)}</span>
                  </TableCell>
                  <TableCell>
                    {ligne.montantCommandeFcfa != null ? (
                      <span className="tabular-nums">{fcfa(ligne.montantCommandeFcfa)}</span>
                    ) : (
                      <span className="text-xs font-medium text-amber-600">manquant</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums">{dateFr(ligne.creeLe)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums">{heureFr(ligne.creeLe)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Chip size="sm" variant="flat" color={statut.couleur} className={statut.classe}>
                        {statut.libelle}
                      </Chip>
                      <PuceLocalisation statut={ligne.localisation} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      color="primary"
                      variant={actif ? 'solid' : 'bordered'}
                      className="font-medium"
                      startContent={
                        actif ? (
                          <Navigation className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                        )
                      }
                      onPress={() => ouvrirSuivi(ligne)}
                    >
                      {actif ? 'Suivre' : 'Détail'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>

      {/* Cartes — mobile / tablette en store (cibles tactiles ≥ 48 px) */}
      <div className="flex flex-col gap-3 md:hidden">
        {chargement && lignesAffichees.length === 0 && (
          <div className="flex justify-center py-8">
            <Spinner color="primary" />
          </div>
        )}
        {!chargement && lignesAffichees.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">Aucun ticket sur cette période</p>
        )}
        {lignesAffichees.map((ligne) => {
          const statut = STATUTS[ligne.statut] ?? STATUTS.EN_ATTENTE_AFFECTATION;
          const actif = STATUTS_ACTIFS.includes(ligne.statut);
          return (
            <button
              key={ligne.courseId}
              type="button"
              onClick={() => ouvrirSuivi(ligne)}
              className="min-h-[48px] rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors active:bg-gray-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">{ligne.code}</span>
                  <PuceLocalisation statut={ligne.localisation} />
                </span>
                <Chip size="sm" variant="flat" color={statut.couleur} className={statut.classe}>
                  {statut.libelle}
                </Chip>
              </div>
              <p className="mt-1.5 truncate text-sm text-gray-700">
                {ligne.client ?? 'Client à renseigner'}
                {ligne.turboys && <span className="text-gray-400"> · {ligne.turboys}</span>}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
                <span className="truncate">
                  {ligne.zone ?? '—'} · {dateFr(ligne.creeLe)} {heureFr(ligne.creeLe)}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-gray-800">
                  {fcfa(ligne.tarifFcfa)}
                </span>
              </div>
              {(ligne.montantCommandeFcfa == null || !ligne.donneesCompletes) && (
                <p className="mt-2 text-xs font-medium text-amber-600">
                  Données à compléter avant clôture
                </p>
              )}
              <p className="mt-2 text-xs font-semibold text-primary">
                {actif ? 'Suivre la course' : 'Voir le détail'}
              </p>
            </button>
          );
        })}
      </div>

      {pages > 1 && !filtreACompleter && (
        <div className="flex justify-center">
          <Pagination page={page} total={pages} onChange={setPage} color="primary" showControls />
        </div>
      )}

      {/* ------------------------------------------- SUIVI TEMPS RÉEL (EF-05) */}
      <Modal
        isOpen={courseOuverte !== null}
        onClose={fermerSuivi}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: 'max-sm:m-0 max-sm:my-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:max-w-full max-sm:rounded-none',
          closeButton: 'z-10 top-3 right-3 h-10 w-10 flex items-center justify-center',
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-0.5 pr-12">
                <span className="text-base font-bold">
                  {statutOuvert && STATUTS_ACTIFS.includes(statutOuvert)
                    ? 'Suivi de la course'
                    : 'Détail de la course'}
                  {courseOuverte ? ` — ${courseOuverte.code}` : ''}
                </span>
                <span className="text-xs font-normal text-gray-500">
                  {(detail ?? courseOuverte)?.client ?? 'Client à renseigner'} ·{' '}
                  {(detail ?? courseOuverte)?.zone ?? '—'}
                </span>
              </ModalHeader>
              <ModalBody className="pb-6">
                {!detail && (
                  <div className="flex justify-center py-12">
                    <Spinner color="primary" label="Chargement du suivi…" />
                  </div>
                )}
                {detail && (
                  <div className="flex flex-col gap-4">
                    {detail.statut === 'CLOTURE_BLOQUEE' && (
                      <div className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600 ring-1 ring-danger-200">
                        ⛔ Clôture bloquée — complétez le nom, le contact et le montant de la
                        commande pour terminer cette course (RG-09).
                      </div>
                    )}

                    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                      {/* Carte */}
                      <div className="h-64 sm:h-80 lg:h-[440px]">
                        <CarteSuivi
                          courseId={detail.courseId}
                          storeLatitude={profil.storeLatitude}
                          storeLongitude={profil.storeLongitude}
                          clientLatitude={detail.localisationLatitude ?? null}
                          clientLongitude={detail.localisationLongitude ?? null}
                          active={enMouvement}
                        />
                      </div>

                      {/* Chronologie + infos + actions */}
                      <div className="flex flex-col gap-4">
                        {detail.turboys && (
                          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {initiales(detail.turboys)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{detail.turboys}</p>
                              <p className="text-xs text-gray-500">Votre Turboys sur cette course</p>
                            </div>
                          </div>
                        )}

                        <div>
                          <h2 className="mb-2 text-sm font-bold">Chronologie de la course</h2>
                          <Chronologie etapes={detail.chronologie} />
                        </div>

                        <dl className="flex flex-col gap-2 rounded-xl bg-gray-50 p-4 text-sm">
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Référence</dt>
                            <dd className="font-mono font-semibold">{detail.code}</dd>
                          </div>
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Zone</dt>
                            <dd className="font-medium">{detail.zone ?? '—'}</dd>
                          </div>
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Tarif livraison</dt>
                            <dd className="font-semibold tabular-nums">{fcfa(detail.tarifFcfa)}</dd>
                          </div>
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Localisation client</dt>
                            <dd
                              className={`text-right text-xs font-medium ${
                                (LOCALISATION_DETAIL[detail.localisation] ?? LOCALISATION_DETAIL.PAS_DE_LIEN).classe
                              }`}
                            >
                              {(LOCALISATION_DETAIL[detail.localisation] ?? LOCALISATION_DETAIL.PAS_DE_LIEN).texte}
                            </dd>
                          </div>
                          {detail.localisationRepere && (
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-gray-500">Repère client</dt>
                              <dd className="text-right text-xs font-medium text-gray-700">
                                {detail.localisationRepere}
                              </dd>
                            </div>
                          )}
                        </dl>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {detail.localisation === 'LIEN_ENVOYE' && (
                            <Button
                              variant="flat"
                              color="warning"
                              className="h-12 font-semibold"
                              isLoading={envoiRelance}
                              onPress={renvoyerLien}
                              startContent={<RefreshCw className="h-4 w-4" aria-hidden />}
                            >
                              Renvoyer le lien de localisation
                            </Button>
                          )}
                          {detail.statut === 'TURBOYS_AFFECTE' && (
                            <Button
                              color="primary"
                              className="h-12 font-semibold"
                              isLoading={envoiRetrait}
                              onPress={confirmerRetrait}
                              startContent={<PackageCheck className="h-4 w-4" aria-hidden />}
                            >
                              Confirmer la remise au Turboys
                            </Button>
                          )}
                          {!detail.donneesCompletes && !formOuvert && (
                            <Button
                              variant={detail.statut === 'CLOTURE_BLOQUEE' ? 'solid' : 'flat'}
                              color={detail.statut === 'CLOTURE_BLOQUEE' ? 'danger' : 'default'}
                              className="h-12 font-semibold"
                              onPress={() => setFormOuvert(true)}
                              startContent={<ClipboardList className="h-4 w-4" aria-hidden />}
                            >
                              Compléter les données
                            </Button>
                          )}
                          {formOuvert && (
                            <form
                              onSubmit={soumettreCompletion}
                              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
                            >
                              <p className="text-sm font-bold">Données de clôture</p>
                              <Input
                                label="Nom du client"
                                isRequired
                                value={fNom}
                                onValueChange={setFNom}
                                placeholder="Ex. Mme Koné Awa"
                              />
                              <Input
                                label="Contact du client"
                                isRequired
                                type="tel"
                                inputMode="numeric"
                                value={fContact}
                                onValueChange={setFContact}
                                placeholder="Ex. 07 07 12 34 56"
                              />
                              <Input
                                label="Montant de la commande (FCFA)"
                                isRequired
                                inputMode="numeric"
                                value={fMontant}
                                onValueChange={setFMontant}
                                placeholder="Ex. 12500"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="light"
                                  className="h-12 flex-1"
                                  onPress={() => setFormOuvert(false)}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  type="submit"
                                  color="primary"
                                  className="h-12 flex-1 font-semibold"
                                  isLoading={envoiForm}
                                >
                                  Enregistrer
                                </Button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </main>
  );
}

/* -------------------------------------------------- chronologie (EF-05.2) */

function Chronologie({ etapes }: { etapes: EtapeChronologie[] }) {
  // L'étape courante est la première non atteinte ; les précédentes sont acquises.
  const indexCourant = etapes.findIndex((etape) => !etape.atteinte);
  return (
    <ol className="flex flex-col">
      {etapes.map((etape, index) => {
        const courante = index === indexCourant;
        const derniere = index === etapes.length - 1;
        return (
          <li key={etape.phase} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                  etape.atteinte
                    ? 'bg-primary'
                    : courante
                      ? 'border-2 border-primary bg-white'
                      : 'border-2 border-gray-300 bg-white'
                }`}
                aria-hidden
              />
              {!derniere && (
                <span className={`w-px flex-1 ${etape.atteinte ? 'bg-primary/40' : 'bg-gray-200'}`} />
              )}
            </div>
            <div
              className={`flex flex-1 items-baseline justify-between gap-2 ${derniere ? '' : 'pb-4'}`}
            >
              <span
                className={`text-sm ${
                  courante
                    ? 'font-bold text-gray-900'
                    : etape.atteinte
                      ? 'font-medium text-gray-700'
                      : 'text-gray-400'
                }`}
              >
                {etape.libelle}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-gray-500">
                {etape.atteinte && etape.horodatage
                  ? heureFr(etape.horodatage)
                  : courante
                    ? 'en cours…'
                    : '—'}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
