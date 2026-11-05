'use client';

import React, { useMemo, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  ChampDate,
  ChampListe,
  ChampMontant,
  ChampTexte,
} from '@/components/commons/champs-formulaire';
import { formatFcfa } from '@/features/encours';
import { ICreerVirement, IPayeur } from '@/features/virements';

interface VirementFormModalProps {
  ouvert: boolean;
  onFermer: () => void;
  onEnregistrer: (dto: ICreerVirement) => void;
  enAttente: boolean;
  payeurs: IPayeur[];
  payeurParDefaut?: string;
  /** Le taux de retenue de la cible, pour montrer ce que le relevé en déduira. */
  tauxRetenue?: number | null;
}

const AUJOURDHUI = () => new Date().toISOString().slice(0, 10);

/**
 * Saisie d'un virement reçu.
 *
 * <p>Ce formulaire alimente le « montant réglé » des relevés envoyés aux partenaires :
 * ce qui est saisi ici finit dans un document qui engage l'entreprise. D'où la
 * vérification avant envoi, et l'aperçu du prélèvement — pour que l'opérateur voie tout
 * de suite ce que le relevé en fera.</p>
 */
export function VirementFormModal({
  ouvert,
  onFermer,
  onEnregistrer,
  enAttente,
  payeurs,
  payeurParDefaut,
  tauxRetenue,
}: VirementFormModalProps) {
  const [dateOperation, setDateOperation] = useState(AUJOURDHUI);
  const [dateValeur, setDateValeur] = useState(AUJOURDHUI);
  const [reference, setReference] = useState('');
  const [libelle, setLibelle] = useState('');
  const [montant, setMontant] = useState<number | undefined>(undefined);
  const [payeurId, setPayeurId] = useState(payeurParDefaut ?? '');

  const optionsPayeurs = useMemo(
    () => payeurs.map((p) => ({ label: p.banque ? `${p.nom} — ${p.banque}` : p.nom, value: p.id })),
    [payeurs],
  );

  /**
   * Ce que le relevé retiendra de ce virement.
   *
   * <p>⚠ La formule n'est pas `montant × taux` : le virement est ce qui RESTE après la
   * retenue, donc on remonte à la facture d'origine. Arrondi au franc, comme le serveur,
   * sinon l'aperçu et le relevé ne diraient pas la même chose.</p>
   */
  const prelevement = useMemo(() => {
    if (!montant || !tauxRetenue || tauxRetenue <= 0 || tauxRetenue >= 100) return 0;
    return Math.round((montant * tauxRetenue) / (100 - tauxRetenue));
  }, [montant, tauxRetenue]);

  const erreurs = useMemo(() => {
    const e: Record<string, string> = {};
    if (!payeurId) e.payeurId = 'Choisissez le payeur qui a émis ce virement.';
    if (!reference.trim()) e.reference = 'La référence bancaire est obligatoire.';
    if (!libelle.trim()) e.libelle = 'Le libellé figure sur le relevé envoyé au partenaire.';
    if (!montant || montant <= 0) e.montant = 'Le montant doit être supérieur à zéro.';
    if (dateOperation && dateOperation > AUJOURDHUI()) {
      // Une date future ferait entrer dans un relevé arrêté aujourd'hui de l'argent
      // qui n'est pas arrivé.
      e.dateOperation = "La date d'opération ne peut pas être dans le futur.";
    }
    return e;
  }, [payeurId, reference, libelle, montant, dateOperation]);

  const valide = Object.keys(erreurs).length === 0;

  const reinitialiser = () => {
    setDateOperation(AUJOURDHUI());
    setDateValeur(AUJOURDHUI());
    setReference('');
    setLibelle('');
    setMontant(undefined);
  };

  return (
    <FenetreAction
      actionInactive={!valide}
      enAttente={enAttente}
      libelleAction="Enregistrer le virement"
      onAction={() => {
        if (!valide) return;
        onEnregistrer({
          dateOperation,
          dateValeur,
          reference: reference.trim(),
          libelle: libelle.trim(),
          montant: montant as number,
          payeurId,
        });
        reinitialiser();
      }}
      onFermer={() => {
        reinitialiser();
        onFermer();
      }}
      ouvert={ouvert}
      titre="Enregistrer un virement reçu"
    >
      <div className="space-y-4">
        <ChampListe
          erreur={erreurs.payeurId}
          label="Payeur"
          messageListeVide="Aucun payeur enregistré. Créez-en un avant de saisir un virement."
          onChange={setPayeurId}
          options={optionsPayeurs}
          placeholder="Qui a émis ce virement ?"
          valeur={payeurId}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* ChampDate ne porte pas de texte d'aide : la précision va sous le couple. */}
          <ChampDate
            erreur={erreurs.dateOperation}
            label="Date d'opération"
            onChange={setDateOperation}
            valeur={dateOperation}
          />
          <ChampDate
            label="Date de valeur"
            onChange={setDateValeur}
            valeur={dateValeur}
          />
        </div>
        <p className="-mt-2 text-xs text-muted">
          C&apos;est la date d&apos;<span className="font-medium">opération</span> qui situe le
          virement dans la période du relevé.
        </p>

        <ChampTexte
          aide="Telle qu'elle figure sur le relevé bancaire. Une référence déjà saisie pour ce payeur est refusée."
          erreur={erreurs.reference}
          label="Référence bancaire"
          onChange={setReference}
          placeholder="MV55856"
          valeur={reference}
        />

        <ChampTexte
          aide="Repris tel quel dans l'Annexe 2 du relevé envoyé au partenaire."
          erreur={erreurs.libelle}
          label="Libellé"
          onChange={setLibelle}
          placeholder="REGLEMENT FACT TURBO"
          valeur={libelle}
        />

        <ChampMontant
          erreur={erreurs.montant}
          label="Montant reçu (FCFA)"
          onChange={setMontant}
          valeur={montant}
        />

        {prelevement > 0 && (
          <div className="rounded-lg border border-default-200 bg-content2 p-3 text-sm">
            <p className="font-medium">Ce que le relevé en déduira</p>
            <p className="mt-1 text-muted">
              Avec une retenue de {tauxRetenue} %, ce virement couvre{' '}
              <span className="font-mono tabular-nums">
                {formatFcfa((montant ?? 0) + prelevement)}
              </span>{' '}
              de facture : {formatFcfa(montant ?? 0)} reçus et{' '}
              {formatFcfa(prelevement)} prélevés à la source.
            </p>
          </div>
        )}
      </div>
    </FenetreAction>
  );
}
