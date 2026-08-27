'use client';

import { useState } from 'react';

import { Avatar, Button } from '@heroui/react';
import { AlertTriangle, ArrowRight, Camera, FileText, MapPin, Phone } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { createUrlFile } from '@/utils/createUrlFile';
import {
  IIncident,
  ILivreurTrafic,
  STATUT_TRAFIC_LABEL,
  StatutIncident,
  useChangerStatutMutation,
} from '@/features/standard';

import { useAppel } from './appel-provider';
import { IncidentStatutChip } from './incident-statut-chip';
import {
  TON_INCIDENT,
  TON_TRAFIC,
  attenteLisible,
  heureIncident,
  lienTelephone,
} from '../utils/incident-ui.utils';

/** Transition proposée depuis le statut courant (avant-uniquement, RG-24). */
const SUITE: Partial<Record<StatutIncident, { statut: StatutIncident; libelle: string }>> = {
  RECU: { statut: 'EN_COURS', libelle: 'Prendre en charge' },
  EN_COURS: { statut: 'TRAITE', libelle: 'Marquer traité' },
  TRAITE: { statut: 'CLOTURE', libelle: 'Clôturer' },
};

interface Props {
  incident: IIncident;
  /** Fiche terrain du livreur (photo, téléphone, statut de service) si connue. */
  livreur?: ILivreurTrafic;
  /** Arrivé pendant que l'écran était ouvert : la carte le signale. */
  estNouveau?: boolean;
  canUpdate: boolean;
  onOuvrir: (incident: IIncident) => void;
}

/**
 * Carte d'incident du poste STANDARD. Tout ce qui permet d'agir est sur la carte
 * — qui a signalé, quoi, quand, la preuve, le téléphone et l'appel — pour que
 * l'opérateur n'ait pas à ouvrir une fiche avant de décider.
 */
export function IncidentCard({ incident, livreur, estNouveau, canUpdate, onOuvrir }: Props) {
  const { data: sessionAuth } = useSession();
  const userId = sessionAuth?.user?.id;
  const { appelerLivreur, enAppel } = useAppel();
  const changerStatut = useChangerStatutMutation();

  const ton = TON_INCIDENT[incident.statut];
  const suite = SUITE[incident.statut];
  const nom = livreur?.nomComplet || incident.livreurNom || 'Livreur inconnu';
  const telephone = livreur?.telephone ?? null;
  const hrefTel = lienTelephone(telephone);
  const preuveHref = incident.preuveUrl ? createUrlFile(incident.preuveUrl, 'backend') : null;
  const estPhoto = incident.preuveType === 'PHOTO' || incident.preuveType === null;
  const mapsHref =
    incident.latitude != null && incident.longitude != null
      ? `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`
      : null;

  // Les transitions sont IRRÉVERSIBLES côté serveur (IncidentService refuse tout retour en
  // arrière). « Marquer traité » et « Clôturer » font en plus disparaître l'incident de
  // l'écran et partir une notification au livreur. Or le bouton « Détails » est juste à
  // côté : un clic manqué de quelques pixels est sans retour. On confirme donc ces deux-là,
  // en gardant « Prendre en charge » en un seul clic — se saisir d'un incident n'engage rien.
  const [confirmationAttendue, setConfirmationAttendue] = useState(false);
  const demandeConfirmation = suite?.statut === 'TRAITE' || suite?.statut === 'CLOTURE';

  const avancer = () => {
    if (!suite || !userId) return;
    if (demandeConfirmation && !confirmationAttendue) {
      setConfirmationAttendue(true);
      return;
    }
    setConfirmationAttendue(false);
    changerStatut.mutate({ id: incident.id, dto: { statut: suite.statut }, userId });
  };

  return (
    <article
      className={`rounded-2xl border bg-white p-4 transition-shadow hover:shadow-sm dark:bg-content1 ${ton.carte} ${
        estNouveau ? 'ring-2 ring-[#E11D48]/25' : ''
      }`}
    >
      {/* Motif + heure + appel : ce qu'on lit en premier, et le geste d'urgence. */}
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${ton.pastille}`}>
          <AlertTriangle className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[15px] font-bold text-default-800">{incident.motifLibelle}</h3>
            <IncidentStatutChip statut={incident.statut} />
            {estNouveau && (
              <span className="inline-flex items-center rounded-full bg-[#E11D48] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Nouveau
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-default-400">
            {attenteLisible(incident.signaleLe)} · {heureIncident(incident.signaleLe)}
          </p>
        </div>

        {incident.livreurId && (
          <Button
            size="sm"
            className="shrink-0 bg-[#1AA05A]/10 font-semibold text-[#147A45]"
            startContent={<Phone className="h-4 w-4" />}
            isDisabled={enAppel}
            onPress={() => appelerLivreur(incident.livreurId, nom, incident.id)}
          >
            Appeler
          </Button>
        )}
      </div>

      {/* Qui a signalé : photo, nom, numéro cliquable, et son état de service réel. */}
      <div className="mt-3 flex flex-wrap items-center gap-2.5 rounded-xl bg-default-50 px-3 py-2 dark:bg-default-100/40">
        <Avatar
          size="sm"
          name={nom}
          src={livreur?.avatarUrl ? createUrlFile(livreur.avatarUrl, 'backend') : undefined}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-default-700">{nom}</p>
          {hrefTel ? (
            <a href={hrefTel} className="text-xs font-medium text-primary hover:underline">
              {telephone}
            </a>
          ) : (
            <span className="text-xs text-default-400">Numéro inconnu</span>
          )}
        </div>
        {livreur && (
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${TON_TRAFIC[livreur.statut]}`}
            title={
              livreur.statut === 'DISPONIBLE'
                ? "Présent dans la file d'attente du jour"
                : "État issu du service du jour (pointage), pas d'un drapeau manuel"
            }
          >
            {STATUT_TRAFIC_LABEL[livreur.statut]}
            {livreur.rangFile != null ? ` · file ${livreur.rangFile}` : ''}
          </span>
        )}
      </div>

      {incident.description && (
        <p className="mt-3 line-clamp-2 text-sm text-default-600">{incident.description}</p>
      )}

      {/* Preuve jointe + position + suite à donner. */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {preuveHref ? (
            estPhoto ? (
              <a href={preuveHref} target="_blank" rel="noopener noreferrer" title="Ouvrir la preuve">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preuveHref}
                  alt="Preuve jointe"
                  className="h-12 w-12 rounded-xl border border-default-200 object-cover"
                />
              </a>
            ) : (
              <a
                href={preuveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-default-100 px-2.5 py-1 text-xs font-semibold text-default-600 hover:bg-default-200"
              >
                <FileText className="h-3.5 w-3.5" />
                Preuve
              </a>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-default-300">
              <Camera className="h-3.5 w-3.5" />
              Sans preuve
            </span>
          )}

          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-default-100 px-2.5 py-1 text-xs font-semibold text-default-600 hover:bg-default-200"
            >
              <MapPin className="h-3.5 w-3.5" />
              Position
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="light" onPress={() => onOuvrir(incident)}>
            Détails
          </Button>
          {canUpdate && suite && (
            <>
              {confirmationAttendue && (
                <Button size="sm" variant="light" onPress={() => setConfirmationAttendue(false)}>
                  Annuler
                </Button>
              )}
              <Button
                size="sm"
                className={
                  confirmationAttendue
                    ? 'bg-[#B91C1C] font-semibold text-white'
                    : 'bg-[#17181C] font-semibold text-white'
                }
                endContent={confirmationAttendue ? undefined : <ArrowRight className="h-4 w-4" />}
                isLoading={changerStatut.isLoading}
                isDisabled={!userId}
                onPress={avancer}
              >
                {confirmationAttendue ? `Confirmer : ${suite.libelle.toLowerCase()}` : suite.libelle}
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
