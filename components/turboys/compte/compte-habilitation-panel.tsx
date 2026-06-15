'use client';

import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Chip, Input, Select, SelectItem, Spinner } from '@heroui/react';
import { useTurboyQuery } from '@/features/turboys/queries/turboy-list.query';
import {
  useChangerStatutPieceMutation,
  useClesQuery,
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

/** Première clé sélectionnée d'un Select HeroUI (SharedSelection -> string). */
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
    <div className="flex flex-col gap-2 border-b py-3 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span className="font-medium">{libelle}</span>
        <Chip size="sm" variant="flat" color={STATUT_COLOR[statut]}>
          {STATUT_LABEL[statut]}
        </Chip>
      </div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Select
          size="sm"
          aria-label={`Statut ${libelle}`}
          className="w-40"
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
            aria-label={`Motif ${libelle}`}
            className="w-52"
            placeholder="Motif du refus"
            value={motifRefus}
            onValueChange={setMotifRefus}
          />
        )}
        <Button
          size="sm"
          color="primary"
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

export default function CompteHabilitationPanel({ driverId }: { driverId: string }) {
  const { data: turboy, isLoading } = useTurboyQuery(driverId);
  const cles = useClesQuery(driverId);
  const evenements = useEvenementsQuery(driverId);

  const [typeLivreur, setTypeLivreur] = useState<TurboyType>('INDEPENDANT');
  const [rattachement, setRattachement] = useState<Rattachement>('SITE_PARTNER');
  const [sitePartnerId, setSitePartnerId] = useState('');
  const [codeEmis, setCodeEmis] = useState<string | null>(null);

  const valider = useValiderCompteMutation(driverId, (vm) => setCodeEmis(vm.code));
  const emettre = useEmettreCleMutation(driverId, (cle) => setCodeEmis(cle.code));

  if (isLoading || !turboy) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center py-10">
          <Spinner label="Chargement du compte…" />
        </CardBody>
      </Card>
    );
  }

  const cni = (turboy.cniStatut ?? 'A_VERIFIER') as PieceStatut;
  const fiche = (turboy.ficheStatut ?? 'A_VERIFIER') as PieceStatut;
  const contrat = (turboy.contratStatut ?? 'A_VERIFIER') as PieceStatut;
  const toutConforme = cni === 'CONFORME' && fiche === 'CONFORME' && contrat === 'CONFORME';
  const siteManquant = rattachement === 'SITE_PARTNER' && !sitePartnerId.trim();
  const dejaValide = (turboy.status ?? 0) >= 4;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-red-600">Comptes &amp; habilitations</h2>
      </CardHeader>
      <CardBody className="space-y-8">
        {codeEmis && (
          <div className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Clé d’activation — à communiquer une seule fois au livreur
            </p>
            <p className="mt-1 font-mono text-2xl tracking-widest">{codeEmis}</p>
            <button className="mt-1 text-xs text-green-700 underline" onClick={() => setCodeEmis(null)}>
              Masquer
            </button>
          </div>
        )}

        {/* Conformité des pièces (RG-05) */}
        <section>
          <h3 className="mb-2 font-semibold">Conformité des pièces</h3>
          <PieceRow driverId={driverId} cible="CNI" libelle="CNI" statut={cni} motif={turboy.cniMotifRefus} />
          <PieceRow driverId={driverId} cible="FICHE" libelle="Fiche d’identification" statut={fiche} motif={turboy.ficheMotifRefus} />
          <PieceRow driverId={driverId} cible="CONTRAT" libelle="Contrat" statut={contrat} motif={turboy.contratMotifRefus} />
        </section>

        {/* Validation du compte (RG-07) */}
        <section>
          <h3 className="mb-3 font-semibold">Validation du compte</h3>
          {dejaValide ? (
            <Chip color="success" variant="flat">
              Compte déjà validé{turboy.type ? ` — ${turboy.type}` : ''}
            </Chip>
          ) : (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <Select
                  label="Type de livreur"
                  labelPlacement="outside"
                  className="md:w-52"
                  selectedKeys={[typeLivreur]}
                  onSelectionChange={(keys) => setTypeLivreur((premiereCle(keys) || 'INDEPENDANT') as TurboyType)}
                >
                  <SelectItem key="INDEPENDANT">Indépendant</SelectItem>
                  <SelectItem key="JOURNALIER">Journalier</SelectItem>
                  <SelectItem key="SUPERVISEUR_LIVREUR">Superviseur</SelectItem>
                </Select>
                <Select
                  label="Rattachement"
                  labelPlacement="outside"
                  className="md:w-56"
                  selectedKeys={[rattachement]}
                  onSelectionChange={(keys) => setRattachement((premiereCle(keys) || 'SITE_PARTNER') as Rattachement)}
                >
                  <SelectItem key="SITE_PARTNER">Site partenaire (TURBO)</SelectItem>
                  <SelectItem key="BIRD">BIRD (indépendant)</SelectItem>
                </Select>
                {rattachement === 'SITE_PARTNER' && (
                  <Input
                    label="ID site partenaire"
                    labelPlacement="outside"
                    className="md:w-64"
                    value={sitePartnerId}
                    onValueChange={setSitePartnerId}
                  />
                )}
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
              {!toutConforme && (
                <p className="mt-2 text-sm text-amber-600">Les 3 pièces doivent être conformes avant validation.</p>
              )}
            </>
          )}
        </section>

        {/* Clé d'activation (RG-08/10) */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Clé d’activation</h3>
            <Button size="sm" variant="bordered" isLoading={emettre.isPending} onPress={() => emettre.mutate(undefined)}>
              Réémettre une clé
            </Button>
          </div>
          <p className="mb-2 text-xs text-gray-500">
            Appareil lié : {turboy.deviceLabel ?? turboy.deviceId ?? '— aucun'}
          </p>
          {cles.isLoading ? (
            <Spinner size="sm" />
          ) : cles.data && cles.data.length > 0 ? (
            <div className="space-y-1">
              {cles.data.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 text-sm">
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
                  {c.expireLe && <span className="text-gray-500">exp. {formatDate(c.expireLe)}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune clé émise.</p>
          )}
        </section>

        {/* Historique (RG-11) */}
        <section>
          <h3 className="mb-2 font-semibold">Historique du compte</h3>
          {evenements.isLoading ? (
            <Spinner size="sm" />
          ) : evenements.data && evenements.data.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {evenements.data.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-400">{formatDate(e.horodatage)}</span>
                  <Chip size="sm" variant="flat">
                    {e.type}
                  </Chip>
                  {e.auteurRole && <span className="text-gray-500">par {e.auteurRole}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Aucun événement.</p>
          )}
        </section>
      </CardBody>
    </Card>
  );
}
