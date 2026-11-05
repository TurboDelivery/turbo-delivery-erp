'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@heroui-v3/react';
import { Ban, Plus, UserPlus } from 'lucide-react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ChampListe, ChampTexte, ChampZoneTexte } from '@/components/commons/champs-formulaire';
import CarteStat from '@/components/commons/CarteStat';
import { TitreSection } from '@/components/commons/TitreSection';
import { formatFcfa, formatNombre } from '@/features/encours';
import {
  IVirementRecu,
  useAnnulerVirementMutation,
  useCreerPayeurMutation,
  useCreerVirementMutation,
} from '@/features/virements';
import { useVirementsTable } from '@/features/virements/hooks/use-virements-table';
import { useAbility } from '@casl/react';
import { AbilityContext } from '@/lib/casl/ability-context';

import { VirementFormModal } from './virement-form-modal';
import { VirementsTable } from './virements-table';

/**
 * Écran « Recouvrement &gt; Virements ».
 *
 * <p>Spécification « Export Rapport Performance » du 05/11/2026, section 7. Ces lignes
 * deviennent le « montant réglé » des relevés de compte : c'est ici que se décide ce
 * qu'un partenaire lira comme solde dû.</p>
 *
 * <p>Le vocabulaire est celui du relevé — reçu, prélèvement, couvert — pour qu'un
 * opérateur qui saisit et un partenaire qui lit n'aient pas à traduire.</p>
 */
/** [payeurInitial] préselectionne un payeur : utile au banc, et à un lien profond. */
export function VirementsView({ payeurInitial = '' }: { payeurInitial?: string } = {}) {
  const ability = useAbility(AbilityContext);
  const peutSaisir = ability.can('create', 'Virement');

  const [payeurId, setPayeurId] = useState(payeurInitial);
  const [formOuvert, setFormOuvert] = useState(false);
  const [payeurOuvert, setPayeurOuvert] = useState(false);
  const [motifAnnulation, setMotifAnnulation] = useState('');

  const creerVirement = useCreerVirementMutation();
  const annulerVirement = useAnnulerVirementMutation();
  const creerPayeur = useCreerPayeurMutation();

  const [nouveauPayeurNom, setNouveauPayeurNom] = useState('');
  const [nouveauPayeurBanque, setNouveauPayeurBanque] = useState('');

  const payeurIds = useMemo(() => (payeurId ? [payeurId] : []), [payeurId]);

  const {
    table,
    colonnes,
    payeurs,
    chargement,
    enEchec,
    total,
    nombre,
    virementAAnnuler,
    setVirementAAnnuler,
  } = useVirementsTable(
    payeurIds,
    (virement: IVirementRecu) => setVirementAAnnuler(virement),
    peutSaisir,
  );

  const optionsPayeurs = useMemo(
    () => payeurs.map((p) => ({ label: p.banque ? `${p.nom} — ${p.banque}` : p.nom, value: p.id })),
    [payeurs],
  );

  /** Un chiffre ne s'affiche que s'il est MESURÉ : payeur choisi, lecture réussie. */
  const chiffreConnu = Boolean(payeurId) && !enEchec && !chargement;

  return (
    <div className="space-y-6">
      <div>
        <TitreSection>Virements reçus</TitreSection>
        <p className="-mt-3 text-sm text-muted">
          L&apos;argent réellement reçu en banque. C&apos;est lui, et non le « recouvré » porté
          sur la facture, qui fait le solde dû d&apos;un relevé de compte.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[18rem] flex-1">
          <ChampListe
            label="Payeur"
            messageListeVide="Aucun payeur enregistré."
            onChange={setPayeurId}
            options={optionsPayeurs}
            placeholder="Choisir un payeur"
            valeur={payeurId}
          />
        </div>

        {peutSaisir && (
          <>
            <Button onPress={() => setPayeurOuvert(true)} variant="outline">
              <UserPlus aria-hidden="true" className="size-4" />
              Nouveau payeur
            </Button>
            <Button isDisabled={!payeurId} onPress={() => setFormOuvert(true)}>
              <Plus aria-hidden="true" className="size-4" />
              Enregistrer un virement
            </Button>
          </>
        )}
      </div>

      {/*
        * ⚠ Un tiret, et non zéro, tant que le chiffre n'est pas CONNU. « 0 FCFA » est une
        * AFFIRMATION : il se lit « ce payeur n'a rien versé », et sur un écran qui sert à
        * établir un solde dû, c'est exactement la conclusion à ne pas induire.
        *
        * Deux cas, tous deux vus au banc. Avant toute sélection, les cartes annonçaient
        * zéro. Et sur une LECTURE EN ÉCHEC, elles annonçaient zéro juste au-dessus du
        * message « la donnée existe, elle n'a pas pu être lue » — l'écran se contredisait
        * à dix centimètres d'intervalle.
        */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CarteStat
          libelle="Virements reçus"
          note={enEchec ? 'Nombre inconnu : la lecture a échoué' : undefined}
          valeur={chiffreConnu ? formatNombre(nombre) : '—'}
        />
        <CarteStat
          libelle="Total reçu"
          note={
            enEchec
              ? 'Montant inconnu : la lecture a échoué'
              : payeurId
                ? "Hors virements annulés. Le prélèvement à la source s'y ajoute dans le relevé."
                : 'Choisissez un payeur'
          }
          valeur={chiffreConnu ? formatFcfa(total) : '—'}
        />
      </div>

      <VirementsTable
        aucunPayeur={!payeurId}
        chargement={chargement}
        colonnes={colonnes}
        enEchec={enEchec}
        table={table}
      />

      <VirementFormModal
        enAttente={creerVirement.isPending}
        onEnregistrer={(dto) =>
          creerVirement.mutate(dto, { onSuccess: () => setFormOuvert(false) })
        }
        onFermer={() => setFormOuvert(false)}
        ouvert={formOuvert}
        payeurParDefaut={payeurId}
        payeurs={payeurs}
      />

      <FenetreAction
        actionInactive={!nouveauPayeurNom.trim()}
        enAttente={creerPayeur.isPending}
        libelleAction="Créer le payeur"
        onAction={() =>
          creerPayeur.mutate(
            { nom: nouveauPayeurNom.trim(), banque: nouveauPayeurBanque.trim() || null },
            {
              onSuccess: () => {
                setPayeurOuvert(false);
                setNouveauPayeurNom('');
                setNouveauPayeurBanque('');
              },
            },
          )
        }
        onFermer={() => setPayeurOuvert(false)}
        ouvert={payeurOuvert}
        titre="Nouveau payeur"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Le payeur n&apos;est pas le partenaire : c&apos;est l&apos;entité qui émet les
            virements. Son rattachement à un groupe ou à des établissements se fait ensuite, et
            c&apos;est lui qui détermine les virements repris dans un relevé.
          </p>
          <ChampTexte
            label="Nom du payeur"
            onChange={setNouveauPayeurNom}
            placeholder="Baobab Energy Côte d'Ivoire"
            valeur={nouveauPayeurNom}
          />
          <ChampTexte
            label="Banque"
            onChange={setNouveauPayeurBanque}
            placeholder="Facultatif"
            valeur={nouveauPayeurBanque}
          />
        </div>
      </FenetreAction>

      <FenetreAction
        actionInactive={!motifAnnulation.trim()}
        destructif
        enAttente={annulerVirement.isPending}
        libelleAction="Annuler ce virement"
        onAction={() => {
          if (!virementAAnnuler) return;
          annulerVirement.mutate(
            { id: virementAAnnuler.id, motif: motifAnnulation.trim() },
            {
              onSuccess: () => {
                setVirementAAnnuler(null);
                setMotifAnnulation('');
              },
            },
          );
        }}
        onFermer={() => {
          setVirementAAnnuler(null);
          setMotifAnnulation('');
        }}
        ouvert={virementAAnnuler !== null}
        titre="Annuler un virement"
      >
        <div className="space-y-4">
          <p className="text-sm">
            <Ban aria-hidden="true" className="mr-1 inline size-4" />
            Le virement n&apos;est pas effacé : il reste visible, marqué annulé. Un relevé déjà
            envoyé doit rester rejouable.
          </p>
          {virementAAnnuler && (
            <p className="rounded-lg border border-default-200 bg-content2 p-3 font-mono text-sm tabular-nums">
              {virementAAnnuler.reference} — {formatFcfa(virementAAnnuler.montant)}
            </p>
          )}
          <ChampZoneTexte
            label="Motif"
            onChange={setMotifAnnulation}
            placeholder="Pourquoi ce virement est-il retiré du relevé ?"
            valeur={motifAnnulation}
          />
        </div>
      </FenetreAction>
    </div>
  );
}
