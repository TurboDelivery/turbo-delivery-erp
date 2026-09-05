'use client';

import { Button, Modal } from '@heroui-v3/react';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  ChampListe,
  ChampTexte,
  ChampZoneTexte,
} from '@/components/commons/champs-formulaire';

import {
  useCreerRegularisationMutation,
  useMoisMasseSalarialeQuery,
} from '@/features/personnel/queries/personnel-historisation.query';
import { IRegularisationRemuneration } from '@/features/personnel/types/personnel-historisation.types';
import { formaterMontant } from '@/features/personnel/utils/personnel-historisation.utils';

interface Props {
  employeId: string;
  ouvert: boolean;
  onFermer: () => void;
}

/** Saisie libre → nombre. Une virgule décimale et les espaces de saisie sont tolérés. */
function nombre(valeur: string): number {
  const propre = valeur.replace(/\s/g, '').replace(',', '.');
  if (!propre) return 0;
  const n = Number(propre);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Régularisation d'un mois clôturé (F3, règle 2 — scénario de recette n°3).
 *
 * Un mois clôturé ne se réécrit jamais : la correction est une écriture datée d'un mois
 * OUVERT qui déclare explicitement le mois qu'elle rattrape et son motif. L'historique reste
 * donc vrai, et la correction reste visible en tant que telle sur les deux mois.
 */
export function RegularisationModal({ employeId, ouvert, onFermer }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id ? String(session.user.id) : null;
  const { data: mois, isLoading: chargementMois } = useMoisMasseSalarialeQuery();
  const mutation = useCreerRegularisationMutation(employeId);

  const moisClotures = useMemo(() => (mois ?? []).filter((m) => m.statut === 'CLOTURE'), [mois]);
  const moisOuverts = useMemo(() => (mois ?? []).filter((m) => m.statut !== 'CLOTURE'), [mois]);

  const [moisOrigine, setMoisOrigine] = useState('');
  const [moisOuvert, setMoisOuvert] = useState('');
  const [base, setBase] = useState('');
  const [primes, setPrimes] = useState('');
  const [retenues, setRetenues] = useState('');
  const [motif, setMotif] = useState('');

  // Valeurs par défaut les plus probables : le dernier mois clôturé se corrige sur le mois
  // ouvert le plus récent. L'utilisateur peut évidemment changer les deux.
  useEffect(() => {
    if (!ouvert) return;
    setMoisOrigine((actuel) => actuel || moisClotures[0]?.mois || '');
    setMoisOuvert((actuel) => actuel || moisOuverts[0]?.mois || '');
  }, [ouvert, moisClotures, moisOuverts]);

  const net = nombre(base) + nombre(primes) - nombre(retenues);
  const aucunMontant = nombre(base) === 0 && nombre(primes) === 0 && nombre(retenues) === 0;

  const reinitialiser = () => {
    setBase('');
    setPrimes('');
    setRetenues('');
    setMotif('');
  };

  const fermer = () => {
    onFermer();
  };

  const enregistrer = () => {
    if (!moisOrigine || !moisOuvert) {
      toast.error('Choisissez le mois corrigé et le mois de paiement.');
      return;
    }
    // Contrôle repris du serveur (409) pour ne pas faire un aller-retour inutile.
    if (moisOrigine >= moisOuvert) {
      toast.error("Le mois corrigé doit être antérieur au mois de régularisation.");
      return;
    }
    if (aucunMontant) {
      toast.error('Une régularisation sans montant n’a pas d’objet.');
      return;
    }
    if (!motif.trim()) {
      toast.error('Le motif est obligatoire.');
      return;
    }

    const donnees: IRegularisationRemuneration = {
      employeId,
      moisOrigine,
      moisOuvert,
      base: nombre(base),
      primes: nombre(primes),
      retenues: nombre(retenues),
      motif: motif.trim(),
    };

    mutation.mutate(
      { donnees, userId },
      {
        onSuccess: () => {
          toast.success('Régularisation enregistrée sur le mois ouvert.');
          reinitialiser();
          onFermer();
        },
        onError: (erreur: unknown) => {
          const reponse = (erreur as { response?: { status?: number; data?: { message?: string } } })?.response;
          toast.error(
            reponse?.data?.message ??
              (reponse?.status === 409
                ? 'Mois incompatibles : le mois corrigé doit être clôturé et le mois de paiement ouvert.'
                : "L'enregistrement de la régularisation a échoué."),
          );
        },
      },
    );
  };

  return (
    <Modal isOpen={ouvert} onOpenChange={(o) => !o && fermer()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-lg">
            <Modal.Header>
              <Modal.Heading className="flex flex-col items-start gap-1">
                <span>Régulariser un mois clôturé</span>
                <span className="text-xs font-normal text-muted">
                  Un mois clôturé est figé : la correction est payée sur un mois ouvert et reste
                  tracée sur les deux.
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ChampListe
                  label="Mois corrigé (clôturé)"
                  onChange={setMoisOrigine}
                  options={moisClotures.map((m) => ({ label: m.moisLibelle, value: m.mois }))}
                  placeholder={chargementMois ? 'Chargement…' : 'Choisir un mois'}
                  valeur={moisOrigine}
                />
                <ChampListe
                  label="Payée sur le mois (ouvert)"
                  onChange={setMoisOuvert}
                  options={moisOuverts.map((m) => ({ label: m.moisLibelle, value: m.mois }))}
                  placeholder={chargementMois ? 'Chargement…' : 'Choisir un mois'}
                  valeur={moisOuvert}
                />
              </div>

              {moisClotures.length === 0 ? (
                <p className="text-xs text-warning-soft-foreground">
                  Aucun mois clôturé : une correction se fait alors directement sur le mois
                  concerné, sans régularisation.
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ChampTexte label="Base" onChange={setBase} placeholder="0" valeur={base} />
                <ChampTexte label="Primes" onChange={setPrimes} placeholder="0" valeur={primes} />
                <ChampTexte
                  label="Retenues"
                  onChange={setRetenues}
                  placeholder="0"
                  valeur={retenues}
                />
              </div>

              <p className="text-xs text-muted">
                Net de la régularisation :{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  {formaterMontant(net)}
                </span>
                <span> (base + primes − retenues, un net négatif est une reprise)</span>
              </p>

              <ChampZoneTexte
                label="Motif"
                lignes={2}
                onChange={setMotif}
                placeholder="Prime de juin oubliée à la saisie, retenue appliquée à tort…"
                valeur={motif}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button onPress={fermer} size="sm" variant="ghost">
                Annuler
              </Button>
              <Button
                isPending={mutation.isPending}
                onPress={enregistrer}
                size="sm"
                variant="primary"
              >
                Enregistrer la régularisation
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
