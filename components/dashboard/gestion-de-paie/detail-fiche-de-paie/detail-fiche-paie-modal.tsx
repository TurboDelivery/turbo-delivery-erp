import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    Chip,
} from "@/components/heroui";
import { MoveDownLeft, MoveDownRight, MoveUpRight } from "lucide-react";
import { useInitierPaiementController } from "./controller";
import { CreneauDePaieModal } from "../creneau-de-paie/creneau-de-paie-modal";
import { GainHebdomadaireVm, GainParJour, PaieParLivreur } from "@/types/gestion-de-paie.model";
import EtatErreur from "@/components/commons/EtatErreur";
import { formatMontant } from '@/utils/format.utils';

interface DetailFichePaieProps {
    isOpen: boolean;
    onClose: () => void;
    details?: PaieParLivreur;
    periode?: string;
    nonEligible: boolean
}

export function DetailFichePaieModal({ isOpen, onClose, details, periode, nonEligible }: DetailFichePaieProps) {
    const ctrl = useInitierPaiementController(details, isOpen);
    return (
        <>
            <Modal isOpen={isOpen} size={"2xl"} onClose={onClose}>
                <ModalContent>
                    <>
                        <ModalHeader className="flex flex-col gap-1 text-center text-primary font-bold">Détail de la fiche de paie</ModalHeader>
                        <ModalBody>
                            {
                                // l'echec passe AVANT la donnee : un detail deja charge pour un
                                // autre livreur resterait sinon affiche sous le nouveau nom
                                ctrl.erreur ?
                                    <EtatErreur
                                        quoi="le détail de la fiche de paie"
                                        onReessayer={ctrl.reessayer}
                                        enCours={ctrl.chargement}
                                    />
                                    :
                                    ctrl.detailFichePaie ?
                                    <div className="pl-4 pr-4">
                                        <div className="flex justify-between mb-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-bold text-xl">{ctrl.detailFichePaie?.nomPrenom}</span>
                                                <span className="text-sm">Lieur de travail <span className="text-gray-500 font-bold">{ctrl.detailFichePaie?.lieuTravail ?? ""}</span></span>
                                            </div>
                                            {
                                                nonEligible ?
                                                    <Chip className="bg-purple-100 text-purple-800  ml-2 mr-2"><span className="font-[900]">A encaissé</span></Chip>
                                                    :
                                                    <Chip className="bg-yellow-50 text-orange-500 font-bold">Paie en attente</Chip>
                                            }
                                        </div>
                                        <div className="flex gap-20 mb-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-gray-500">Commssion</div>
                                                <div className="text-md text-gray-500 font-bold">{ctrl.detailFichePaie?.commission ?? 0}&nbsp;&nbsp; FCFA</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-gray-500">Prime</div>
                                                {ctrl.detailFichePaie?.prime && ctrl.detailFichePaie?.prime > 0 ? <span className="ml-1 flex gap-1 text-green-500"><MoveUpRight className="text-green-500" size={16} /> + {ctrl.detailFichePaie?.prime}&nbsp;&nbsp; FCFA</span>
                                                    : <span className="ml-1 flex gap-1 text-red-500"> <MoveDownRight className="text-red-500" size={16} /> + {ctrl.detailFichePaie?.prime ?? 0}&nbsp;&nbsp;  FCFA</span>}

                                            </div>
                                        </div>

                                        <div className="flex gap-20 mb-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-gray-500">Total réalisé</div>
                                                <div className="text-md  text-gray-500">{ctrl.detailFichePaie?.totalRealise ?? 0}&nbsp;&nbsp; FCFA</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-gray-500">Gain initial</div>
                                                <span className="text-md  text-gray-500">{ctrl.detailFichePaie?.gainInitial ?? 0}&nbsp;&nbsp;  FCFA</span>

                                            </div>
                                        </div>
                                        <Card className="p-4">
                                            <div className="flex items-center justify-between mb-4" >
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-gray-500">Total a payer</div>
                                                    <div className="text-md  font-bold text-gray-500">{formatMontant(ctrl.detailFichePaie?.gainInitial ?? 0)}</div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div>Date de récupéreration</div>
                                                    <div className="flex justify-end">
                                                        <div className="text-sm  font-bold text-gray-500">...</div>
                                                    </div>
                                                </div>
                                            </div>
                                            {
                                                (ctrl.detailFichePaie?.gainFicheVM && ctrl.detailFichePaie?.gainFicheVM?.gains) &&
                                                ctrl.detailFichePaie?.gainFicheVM?.gains.map((item: GainParJour, index: number) => (
                                                    <div key={index} onClick={() => ctrl.onpenCrennauxDialog(ctrl.detailFichePaie?.gainFicheVM)} className="cursor-pointer">
                                                        <div className="flex justify-between mt-2 border-b-2 pb-2 text-md hover:bg-primary/10" >
                                                            <div className="text-sm">{item.jour + " " + (index + 1)}</div>
                                                            <div className="text-sm font-bold text-gray-500">{item.gain?.frais}&nbsp;&nbsp;  FCFA</div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </Card>
                                    </div>
                                    : <span className="text-center text-primry font-bold">Aucun details pour cette fiche de paie</span>
                            }
                        </ModalBody>
                        {/*
                          * Pied VIDE de ses deux actions, et c'est voulu.
                          *
                          * « Imprimer » portait `onPress={onClose}` : il fermait la fenetre sans rien
                          * imprimer. « Initier le paiement » ouvrait une maquette dont le bouton
                          * « Envoyer » etait, lui aussi, `onPress={onClose}` — aucun appel d'API, aucune
                          * mutation. Cette maquette affichait un montant CONSTANT (« 290000 FCFA »)
                          * sous le VRAI nom du livreur et son VRAI numero Wave, et deux cases qui
                          * basculaient entre deux autres constantes en simulant un recalcul.
                          *
                          * Un comptable cochait, importait une signature (dont le `onChange` rendait la
                          * chaine vide), cliquait « Envoyer », et repartait en croyant avoir initie une
                          * paie. Rien n'etait parti, et rien ne le lui disait.
                          *
                          * Le VRAI module de paiement existe et vit ailleurs :
                          * `/finance/gestion-paiements` (features/gestion-paiements), expose dans le
                          * menu sous `read Paiement`, avec une vraie mutation `initierPaiement(ids, mois)`.
                          * Cet ecran-ci n'est pas dans le menu ; il n'est atteignable qu'en tapant son
                          * URL, la regle de prefixe `/external_delivery` (`read Commande`) le laissant
                          * passer. Il reste utile en LECTURE — le detail de la fiche est reel — donc on
                          * retire les leurres sans supprimer l'ecran.
                          */}
                        <ModalFooter>
                            <Button color="danger" variant="light" className="text-sm" size="sm" onPress={onClose}>
                                Fermer
                            </Button>
                        </ModalFooter>
                    </>
                    <CreneauDePaieModal onClose={ctrl.creneauDePaieClosure.onClose} isOpen={ctrl.creneauDePaieClosure.isOpen} gainsHedomadaires={ctrl.gainsHedomadaires} periode={periode} />
                </ModalContent>
            </Modal>
        </>
    );
}

