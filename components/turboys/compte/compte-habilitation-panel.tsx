'use client';

import { useMemo, useState } from 'react';
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Spinner,
} from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useTurboyQuery } from '@/features/turboys/queries/turboy-list.query';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import {
  useChangerStatutPieceMutation,
  useClesQuery,
  useCoteQuery,
  useEmettreCleMutation,
  useEvenementsQuery,
  useValiderCompteMutation,
} from '@/features/turboys/queries/compte-livreur.queries';
import { PieceCible, PieceStatut, Rattachement } from '@/features/turboys/types/compte-livreur.types';
import { TurboyType } from '@/features/turboys/types/turboys.types';

const STATUT_COLOR: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  CONFORME: 'success',
  A_VERIFIER: 'warning',
  REFUSE: 'danger',
};
const STATUT_LABEL: Record<string, string> = {
  CONFORME: 'Conforme',
  A_VERIFIER: 'À vérifier',
  REFUSE: 'Refusé',
};

/** Première clé d'un Select HeroUI (Set -> string). */
const premiereCle = (keys: unknown): string => Array.from((keys as Set<string>) ?? []).at(0) ?? '';

function formatDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('fr-FR');
}

interface PieceRowProps {
  driverId: string;
  cible: PieceCible;
  libelle: string;
  statut: PieceStatut;
  motif: string | null;
}

function PieceRow({ driverId, cible, libelle, statut, motif }: PieceRowProps) {
  const [valeur, setValeur] = useState<PieceStatut>(statut);
  const [motifRefus, setMotifRefus] = useState<string>(motif ?? '');
  const mutation = useChangerStatutPieceMutation(driverId);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">{libelle}</span>
        <Chip size="sm" variant="flat" color={STATUT_COLOR[statut]}>
          {STATUT_LABEL[statut]}
        </Chip>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          size="sm"
          variant="bordered"
          aria-label={`Statut ${libelle}`}
          className="w-full sm:w-40"
          selectedKeys={[valeur]}
          onSelectionChange={(keys) => setValeur((premiereCle(keys) || 'A_VERIFIER') as PieceStatut)}
        >
          <SelectItem key="CONFORME">Conforme</SelectItem>
          <SelectItem key="A_VERIFIER">À vérifier</SelectItem>
          <SelectItem key="REFUSE">Refusé</SelectItem>
        </Select>
        {valeur === 'REFUSE' && (
          <Input
            size="sm"
            variant="bordered"
            aria-label={`Motif ${libelle}`}
            className="w-full sm:w-52"
            placeholder="Motif du refus"
            value={motifRefus}
            onValueChange={setMotifRefus}
          />
        )}
        <Button
          size="sm"
          color="primary"
          className="shrink-0"
          isLoading={mutation.isPending}
          onPress={() =>
            mutation.mutate({ piece: cible, statut: valeur, motif: valeur === 'REFUSE' ? motifRefus : undefined })
          }
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

const sectionClass = 'bg-white rounded-xl border border-gray-100 shadow-sm p-6';
const titleClass = 'text-base font-semibold text-primary mb-4';

export default function CompteHabilitationPanel({ driverId }: { driverId: string }) {
  const { data: turboy, isLoading } = useTurboyQuery(driverId);
  const cles = useClesQuery(driverId);
  const evenements = useEvenementsQuery(driverId);
  const cote = useCoteQuery(driverId);
  const restaurantsQuery = useQuery({
    queryKey: ['restaurants', 'all', 'habilitation'],
    queryFn: getAllRestaurants,
    staleTime: 5 * 60 * 1000,
  });
  const restaurants = useMemo(
    () => (restaurantsQuery.data ?? []).map((r) => ({ id: r.id, nom: r.nomEtablissement })),
    [restaurantsQuery.data],
  );

  const [typeLivreur, setTypeLivreur] = useState<TurboyType>('INDEPENDANT');
  const [rattachement, setRattachement] = useState<Rattachement>('SITE_PARTNER');
  const [sitePartnerId, setSitePartnerId] = useState('');
  const [codeEmis, setCodeEmis] = useState<string | null>(null);

  const valider = useValiderCompteMutation(driverId, (vm) => setCodeEmis(vm.code));
  const emettre = useEmettreCleMutation(driverId, (cle) => setCodeEmis(cle.code));

  if (isLoading || !turboy) {
    return (
      <section className={`${sectionClass} flex items-center justify-center py-10`}>
        <Spinner label="Chargement du compte…" />
      </section>
    );
  }

  const cni = (turboy.cniStatut ?? 'A_VERIFIER') as PieceStatut;
  const fiche = (turboy.ficheStatut ?? 'A_VERIFIER') as PieceStatut;
  const contrat = (turboy.contratStatut ?? 'A_VERIFIER') as PieceStatut;
  const toutConforme = cni === 'CONFORME' && fiche === 'CONFORME' && contrat === 'CONFORME';
  const siteManquant = rattachement === 'SITE_PARTNER' && !sitePartnerId.trim();
  const dejaValide = (turboy.status ?? 0) >= 4;

  const score = cote.data?.cote ?? turboy.cote ?? null;
  const coteColor: 'success' | 'warning' | 'danger' | 'default' =
    score == null ? 'default' : score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger';
  const coteBar =
    score == null ? 'bg-gray-300' : score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const coteLabel = score == null ? 'Non évaluée' : score >= 80 ? 'Fiable' : score >= 50 ? 'Moyenne' : 'Faible';

  return (
    <div className="space-y-6">
      {/* Cote de fiabilité (RG-29) */}
      <section className={sectionClass}>
        <h2 className={titleClass}>Cote de fiabilité</h2>
        {cote.isLoading ? (
          <Spinner size="sm" />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-800">
                {score ?? '—'}
                <span className="ml-0.5 text-base font-normal text-gray-400">/100</span>
              </span>
              <Chip variant="flat" color={coteColor}>
                {coteLabel}
              </Chip>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className={`h-full rounded-full ${coteBar}`} style={{ width: `${score ?? 0}%` }} />
            </div>
            {cote.data && cote.data.historique.length > 0 ? (
              <ul className="mt-4 space-y-1.5 text-sm text-gray-600">
                {cote.data.historique.slice(0, 8).map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-400">{formatDate(h.horodatage)}</span>
                    <Chip size="sm" variant="flat" color={h.delta < 0 ? 'danger' : 'success'}>
                      {h.delta > 0 ? `+${h.delta}` : h.delta}
                    </Chip>
                    {h.raison && <span>{h.raison}</span>}
                    <span className="text-gray-400">→ {h.coteApres}/100</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray-400">Aucune variation enregistrée.</p>
            )}
          </>
        )}
      </section>

      {/* Conformité des pièces (RG-05) */}
      <section className={sectionClass}>
        <h2 className={titleClass}>Conformité des pièces</h2>
        <div className="space-y-3">
          <PieceRow driverId={driverId} cible="CNI" libelle="CNI" statut={cni} motif={turboy.cniMotifRefus} />
          <PieceRow driverId={driverId} cible="FICHE" libelle="Fiche d’identification" statut={fiche} motif={turboy.ficheMotifRefus} />
          <PieceRow driverId={driverId} cible="CONTRAT" libelle="Contrat" statut={contrat} motif={turboy.contratMotifRefus} />
        </div>
      </section>

      {/* Validation du compte (RG-07) */}
      <section className={sectionClass}>
        <h2 className={titleClass}>Validation du compte</h2>
        {dejaValide ? (
          <Chip color="success" variant="flat">
            Compte déjà validé{turboy.type ? ` — ${turboy.type}` : ''}
          </Chip>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Type de livreur"
                variant="bordered"
                selectedKeys={[typeLivreur]}
                onSelectionChange={(keys) => setTypeLivreur((premiereCle(keys) || 'INDEPENDANT') as TurboyType)}
              >
                <SelectItem key="INDEPENDANT">Indépendant</SelectItem>
                <SelectItem key="JOURNALIER">Journalier</SelectItem>
                <SelectItem key="SUPERVISEUR_LIVREUR">Superviseur</SelectItem>
              </Select>
              <Select
                label="Rattachement"
                variant="bordered"
                selectedKeys={[rattachement]}
                onSelectionChange={(keys) => setRattachement((premiereCle(keys) || 'SITE_PARTNER') as Rattachement)}
              >
                <SelectItem key="SITE_PARTNER">Site partenaire — assigné</SelectItem>
                <SelectItem key="BIRD">BIRD — non rattaché (libre)</SelectItem>
              </Select>
              {rattachement === 'SITE_PARTNER' && (
                <Autocomplete
                  label="Site partenaire"
                  variant="bordered"
                  isLoading={restaurantsQuery.isLoading}
                  defaultItems={restaurants}
                  selectedKey={sitePartnerId || null}
                  onSelectionChange={(key) => setSitePartnerId((key as string) ?? '')}
                  placeholder="Rechercher un restaurant…"
                  listboxProps={{ itemClasses: { base: 'py-2 data-[hover=true]:bg-default-100' } }}
                >
                  {(r) => (
                    <AutocompleteItem key={r.id} textValue={r.nom}>
                      <span className="text-sm">{r.nom}</span>
                    </AutocompleteItem>
                  )}
                </Autocomplete>
              )}
              <p className="col-span-full text-xs text-gray-400">
                Le rattachement est indépendant du type de livreur : tout contrat
                (y compris journalier / superviseur) peut être BIRD ou assigné.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-400">
                {toutConforme
                  ? 'Les 3 pièces sont conformes — validation possible.'
                  : 'Les 3 pièces doivent être conformes avant de valider.'}
              </p>
              <Button
                color="primary"
                isDisabled={!toutConforme || siteManquant}
                isLoading={valider.isPending}
                onPress={() =>
                  valider.mutate({
                    typeLivreur,
                    rattachement,
                    sitePartnerId: rattachement === 'SITE_PARTNER' ? sitePartnerId.trim() : null,
                  })
                }
              >
                Valider le compte
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Clé d'activation (RG-08/10) */}
      <section className={sectionClass}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-primary">Clé d’activation</h2>
          <Button
            size="sm"
            variant="bordered"
            isLoading={emettre.isPending}
            onPress={() => emettre.mutate(undefined)}
          >
            Réémettre une clé (changer d’appareil)
          </Button>
        </div>
        {/* Clé fraîchement émise (validation OU réémission) — affichée ICI, au même
            niveau que le bouton, plus en bandeau tout en haut de la page. */}
        {codeEmis && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              Clé d’activation — à communiquer une seule fois au livreur
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.3em] text-green-900">{codeEmis}</p>
            <button type="button" onClick={() => setCodeEmis(null)} className="mt-1 text-xs text-green-700 underline">
              Masquer
            </button>
          </div>
        )}
        <p className="mb-1 text-xs text-gray-400">
          Appareil lié : {turboy.deviceLabel ?? turboy.deviceId ?? '— aucun'}
        </p>
        <p className="mb-3 text-xs text-gray-400">
          Réémettre une clé délie l’appareil actuel : le livreur pourra se
          connecter sur un nouveau téléphone en saisissant la nouvelle clé.
        </p>
        {cles.isLoading ? (
          <Spinner size="sm" />
        ) : cles.data && cles.data.length > 0 ? (
          <div className="space-y-1.5">
            {cles.data.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    c.statut === 'ACTIVE'
                      ? 'success'
                      : c.statut === 'CONSOMMEE'
                        ? 'primary'
                        : c.statut === 'REVOQUEE'
                          ? 'danger'
                          : 'default'
                  }
                >
                  {c.statut}
                </Chip>
                <span className="font-mono">••••{c.codeApercu ?? '????'}</span>
                {c.expireLe && <span className="text-gray-400">exp. {formatDate(c.expireLe)}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucune clé émise.</p>
        )}
      </section>

      {/* Historique (RG-11) */}
      <section className={sectionClass}>
        <h2 className={titleClass}>Historique du compte</h2>
        {evenements.isLoading ? (
          <Spinner size="sm" />
        ) : evenements.data && evenements.data.length > 0 ? (
          <ul className="space-y-1.5 text-sm text-gray-600">
            {evenements.data.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2">
                <span className="text-gray-400">{formatDate(e.horodatage)}</span>
                <Chip size="sm" variant="flat">
                  {e.type}
                </Chip>
                {e.auteurRole && <span className="text-gray-400">par {e.auteurRole}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Aucun événement.</p>
        )}
      </section>
    </div>
  );
}
