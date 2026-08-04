'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Modal, ModalBody, ModalContent } from '@heroui/react';
import { AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { ecrirePartenaire, ErreurPartenaire, lirePartenaire } from '@/features/espace-partenaire/api';

import { chiffresSeuls, formaterFcfa, type LigneCourse } from './types';

/**
 * File « À COMPLÉTER AVANT CLÔTURE » (EF-07 / RG-09), épinglée en bas de l'écran :
 * les courses parties sans client ou sans montant. Chaque ligne ouvre la modale de
 * complétion (nom, contact 10 chiffres, montant — tous obligatoires ici) ; une
 * course dont la clôture était bloquée est clôturée dans la foulée.
 */
export default function FileACompleter({ signal }: { signal: number }) {
  const [lignes, setLignes] = useState<LigneCourse[]>([]);
  const [ligneOuverte, setLigneOuverte] = useState<LigneCourse | null>(null);
  const [nom, setNom] = useState('');
  const [contact, setContact] = useState('');
  const [montant, setMontant] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setLignes(await lirePartenaire<LigneCourse[]>('courses/a-completer'));
    } catch {
      // Silencieux : la file se rafraîchit toute seule au prochain passage.
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger, signal]);

  useEffect(() => {
    const intervalle = setInterval(charger, 15_000);
    return () => clearInterval(intervalle);
  }, [charger]);

  function ouvrir(ligne: LigneCourse) {
    setLigneOuverte(ligne);
    setNom(ligne.client ?? '');
    setContact(ligne.contact ?? '');
    setMontant(ligne.montantCommandeFcfa != null ? String(ligne.montantCommandeFcfa) : '');
    setErreur(null);
  }

  const telephone = chiffresSeuls(contact);
  const telephoneValide = telephone.length === 10;
  const nomValide = nom.trim().length > 0;
  const montantNumerique = Number(chiffresSeuls(montant));
  const montantValide = chiffresSeuls(montant).length > 0 && montantNumerique > 0;

  async function completer() {
    if (!ligneOuverte || envoi) return;
    setErreur(null);
    setEnvoi(true);
    try {
      await ecrirePartenaire<LigneCourse>(`courses/${ligneOuverte.courseId}/completer`, {
        nomClient: nom.trim(),
        contactClient: telephone,
        montant: montantNumerique,
      });
      toast.success(
        ligneOuverte.clotureBloquee ? 'Course clôturée ✓' : 'Course complétée — clôture possible',
      );
      setLigneOuverte(null);
      charger();
    } catch (e) {
      // RG-09 : les erreurs serveur arrivent déjà en français — affichées telles quelles.
      setErreur(e instanceof ErreurPartenaire ? e.message : 'Une erreur est survenue — réessayez');
    } finally {
      setEnvoi(false);
    }
  }

  if (lignes.length === 0) return null;

  return (
    <>
      <section
        className="sticky bottom-16 z-30 rounded-2xl bg-gray-900 p-3 text-white shadow-xl lg:bottom-4"
        aria-label="Courses à compléter avant clôture"
      >
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          À COMPLÉTER AVANT CLÔTURE
          <span className="rounded-full bg-white/15 px-2 py-0.5 tabular-nums text-white">
            {lignes.length}
          </span>
        </p>
        <div className="flex flex-col gap-1.5">
          {lignes.map((ligne) => (
            <div
              key={ligne.courseId}
              className="flex min-h-[48px] items-center gap-3 rounded-xl bg-white/5 px-3 py-1.5"
            >
              <span className="shrink-0 font-mono text-xs font-bold">{ligne.code}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-gray-300">{ligne.zone}</span>
              {ligne.clotureBloquee && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-danger/20 px-2 py-0.5 text-[10px] font-bold text-danger">
                  <Lock className="h-3 w-3" aria-hidden /> Clôture bloquée
                </span>
              )}
              <Button
                size="sm"
                color="primary"
                className="h-10 shrink-0 px-4 font-bold"
                onPress={() => ouvrir(ligne)}
              >
                Compléter
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Modale de complétion */}
      <Modal
        isOpen={ligneOuverte !== null}
        onClose={() => setLigneOuverte(null)}
        placement="center"
        hideCloseButton
        scrollBehavior="inside"
        classNames={{
          base: 'm-0 h-dvh max-h-none w-full max-w-full rounded-none sm:m-auto sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-2xl',
        }}
      >
        <ModalContent>
          {() => (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-lg font-extrabold text-gray-900">Compléter la course</p>
                  <p className="truncate text-xs text-gray-400">
                    {ligneOuverte?.code} · {ligneOuverte?.zone}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-extrabold text-primary">
                  {ligneOuverte ? `${formaterFcfa(ligneOuverte.tarifFcfa)} F` : ''}
                </span>
              </div>

              <ModalBody className="flex flex-col gap-4 px-5 py-4">
                {ligneOuverte?.clotureBloquee && (
                  <p className="flex items-start gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      <b>Clôture bloquée.</b> Le Turboys est de retour au store — la course ne peut
                      pas être terminée tant que le nom du client, son contact et le montant de la
                      commande ne sont pas renseignés.
                    </span>
                  </p>
                )}

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
                  isRequired
                  labelPlacement="outside"
                  size="lg"
                  variant="bordered"
                  inputMode="numeric"
                  placeholder="Ex. 12 500"
                  value={montant}
                  onValueChange={setMontant}
                  endContent={<span className="text-xs font-semibold text-gray-400">FCFA</span>}
                />

                {erreur && (
                  <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                    {erreur}
                  </p>
                )}

                <div className="flex gap-2 pb-2">
                  <Button
                    variant="bordered"
                    className="h-12 flex-1 font-semibold"
                    onPress={() => setLigneOuverte(null)}
                  >
                    Annuler
                  </Button>
                  <Button
                    color="primary"
                    className="h-12 flex-1 font-bold"
                    isLoading={envoi}
                    isDisabled={!nomValide || !telephoneValide || !montantValide}
                    onPress={completer}
                  >
                    Enregistrer les données
                  </Button>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
