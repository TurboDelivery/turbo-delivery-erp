'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Modal, ModalBody, ModalContent } from '@heroui/react';
import { ArrowLeft, Check, Send } from 'lucide-react';

import { ecrirePartenaire, ErreurPartenaire } from '@/features/espace-partenaire/api';

import { chiffresSeuls, formaterFcfa, type ReponseDemande, type Zone } from './types';

/**
 * MODALE « Client & envoi » du parcours complet (EF-02) : rappel de la zone,
 * client obligatoire, montant facultatif (sinon exigé avant clôture), puis
 * vue de confirmation avec la référence — plein écran sur mobile.
 */
export default function ModaleDemande({
  zone,
  ouverte,
  onFermer,
  onEnvoyee,
}: {
  zone: Zone | null;
  ouverte: boolean;
  onFermer: () => void;
  onEnvoyee: () => void;
}) {
  const [nom, setNom] = useState('');
  const [contact, setContact] = useState('');
  const [montant, setMontant] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ReponseDemande | null>(null);

  useEffect(() => {
    if (ouverte) {
      setNom('');
      setContact('');
      setMontant('');
      setErreur(null);
      setConfirmation(null);
    }
  }, [ouverte, zone?.id]);

  const telephone = chiffresSeuls(contact);
  const telephoneValide = telephone.length === 10;
  const nomValide = nom.trim().length > 0;

  async function envoyer() {
    if (!zone || envoi) return;
    setErreur(null);
    setEnvoi(true);
    try {
      const montantNumerique = chiffresSeuls(montant);
      const reponse = await ecrirePartenaire<ReponseDemande>('demandes', {
        zoneId: zone.id,
        nomClient: nom.trim(),
        contactClient: telephone,
        montantCommande: montantNumerique ? Number(montantNumerique) : null,
        rush: false,
      });
      setConfirmation(reponse);
      onEnvoyee();
    } catch (e) {
      setErreur(e instanceof ErreurPartenaire ? e.message : 'Une erreur est survenue — réessayez');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal
      isOpen={ouverte}
      onClose={onFermer}
      placement="center"
      hideCloseButton
      scrollBehavior="inside"
      classNames={{
        base: 'm-0 h-dvh max-h-none w-full max-w-full rounded-none sm:m-auto sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-2xl',
      }}
    >
      <ModalContent>
        {() =>
          confirmation ? (
            /* ---- Confirmation ---- */
            <ModalBody className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="h-8 w-8" aria-hidden strokeWidth={2.6} />
              </span>
              <h2 className="text-xl font-extrabold text-gray-900">Demande envoyée !</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 font-mono text-sm font-bold text-gray-700">
                Réf. {confirmation.reference}
              </span>
              <p className="text-sm text-gray-500">Votre Turboys est en cours d&apos;affectation.</p>

              <div className="w-full divide-y divide-gray-100 rounded-2xl border border-gray-100 text-sm">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-gray-400">Zone</span>
                  <b className="text-gray-800">{confirmation.zone}</b>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-gray-400">Tarif livraison</span>
                  <b className="text-gray-800">{formaterFcfa(confirmation.tarifFcfa)} FCFA</b>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-gray-400">Client</span>
                  <b className="max-w-[60%] truncate text-gray-800">{nom.trim() || '—'}</b>
                </div>
              </div>

              {confirmation.lienLocalisation && (
                <p className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-gray-600">
                  📍 Un lien de localisation a été envoyé par SMS au client — sa position exacte sera
                  transmise à votre Turboys.
                </p>
              )}

              <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
                <Button
                  as={Link}
                  href="/partenaire"
                  variant="bordered"
                  className="h-12 flex-1 font-semibold"
                >
                  Retour au tableau de bord
                </Button>
                <Button color="primary" className="h-12 flex-1 font-semibold" onPress={onFermer}>
                  Nouvelle demande
                </Button>
              </div>
            </ModalBody>
          ) : (
            /* ---- Formulaire client & envoi ---- */
            <>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-gray-900">{zone?.nom ?? '—'}</p>
                  <p className="text-xs text-gray-400">Zone de livraison choisie</p>
                </div>
                <span className="shrink-0 text-lg font-extrabold text-primary">
                  {zone ? `${formaterFcfa(zone.tarifFcfa)} F` : ''}
                </span>
              </div>

              <ModalBody className="flex flex-col gap-4 px-5 py-4">
                <Button
                  variant="light"
                  size="sm"
                  className="h-10 self-start px-2 font-semibold text-gray-500"
                  startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}
                  onPress={onFermer}
                >
                  Changer de zone
                </Button>

                <Input
                  label="Nom du client"
                  isRequired
                  labelPlacement="outside"
                  size="lg"
                  variant="bordered"
                  placeholder="Ex. Mme Koné Awa"
                  value={nom}
                  onValueChange={setNom}
                  autoComplete="off"
                />
                <Input
                  label="Contact du client"
                  isRequired
                  labelPlacement="outside"
                  size="lg"
                  variant="bordered"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Ex. 07 07 12 34 56"
                  value={contact}
                  onValueChange={setContact}
                  isInvalid={contact !== '' && !telephoneValide}
                  errorMessage="Numéro invalide — 10 chiffres attendus."
                  autoComplete="off"
                />
                <Input
                  label="Montant de la commande"
                  labelPlacement="outside"
                  size="lg"
                  variant="bordered"
                  inputMode="numeric"
                  placeholder="Ex. 12 500"
                  value={montant}
                  onValueChange={setMontant}
                  description="Facultatif — sinon requis avant clôture."
                  endContent={<span className="text-xs font-semibold text-gray-400">FCFA</span>}
                />

                {erreur && (
                  <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                    {erreur}
                  </p>
                )}

                <Button
                  color="primary"
                  className="h-12 font-bold"
                  startContent={!envoi && <Send className="h-4 w-4" aria-hidden />}
                  isLoading={envoi}
                  isDisabled={!nomValide || !telephoneValide}
                  onPress={envoyer}
                >
                  Envoyer la demande
                </Button>

                <p className="pb-2 text-xs leading-relaxed text-gray-400">
                  📍 À l&apos;envoi, un lien de localisation est envoyé par SMS au client — sa position
                  exacte sera transmise à votre Turboys.
                </p>
              </ModalBody>
            </>
          )
        }
      </ModalContent>
    </Modal>
  );
}
