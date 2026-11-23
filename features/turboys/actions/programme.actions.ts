'use server';

import { programmeAPI } from '@/features/turboys/apis/programme.api';
import type { IAuditAction } from '@/features/supervision/types';
import {
  IProgramme,
  ICreerProgrammePayload,
  IModifierProgrammePayload,
  IAutosuffisanceJour,
  IAccorderSurplusPayload,
  IAffecterSitePayload,
  ISoumissionSurplus,
  ISurplus,
  IBandeauCarburant,
  IEtatCarburantSemaine,
  IDupliquerSemainePayload,
  IDuplicationSemaine,
} from '@/features/turboys/types/programme.types';
import { ActionResponse } from '@/types';
import { handleServerActionError } from '@/utils/handleServerActionError';
import { AxiosError } from 'axios';

// Liste (query directe, non enveloppée — comme getTurboysByType).
export async function listerProgrammesSemaineAction(annee: number, semaine: number): Promise<IProgramme[]> {
  return programmeAPI.listerSemaine(annee, semaine);
}

export async function listerAutosuffisanceAction(annee: number, semaine: number): Promise<IAutosuffisanceJour[]> {
  return programmeAPI.autosuffisance(annee, semaine);
}

// Remonte le message métier du backend (ex. 409 « le programme doit être en BROUILLON »).
function erreurMetier<T>(error: unknown, fallback: string): ActionResponse<T> {
  if (error instanceof AxiosError) {
    const serverMsg = error.response?.data?.message || error.response?.data || error.message;
    return { success: false, error: typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg) };
  }
  return handleServerActionError(error, fallback);
}

export async function creerProgrammeAction(payload: ICreerProgrammePayload): Promise<ActionResponse<IProgramme>> {
  try {
    const data = await programmeAPI.creer(payload);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, 'Erreur lors de la création du programme');
  }
}

export async function modifierProgrammeAction(payload: IModifierProgrammePayload): Promise<ActionResponse<IProgramme>> {
  try {
    const data = await programmeAPI.modifier(payload.id, payload);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, 'Erreur lors de la modification du programme');
  }
}

export async function planifierProgrammeAction(id: string): Promise<ActionResponse<IProgramme>> {
  try {
    const data = await programmeAPI.planifier(id);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, 'Erreur lors de la planification du programme');
  }
}

export async function publierProgrammeAction(id: string): Promise<ActionResponse<IProgramme>> {
  try {
    const data = await programmeAPI.publier(id);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, 'Erreur lors de la publication du programme');
  }
}

export async function envoyerProgrammeAction(id: string): Promise<ActionResponse<IProgramme>> {
  try {
    const data = await programmeAPI.envoyer(id);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, "Erreur lors de l'envoi du programme au livreur");
  }
}

export async function supprimerProgrammeAction(id: string): Promise<ActionResponse<null>> {
  try {
    await programmeAPI.supprimer(id);
    return { success: true, data: null };
  } catch (error) {
    if (error instanceof AxiosError) {
      const serverMsg = error.response?.data?.message || error.response?.data || error.message;
      return { success: false, error: typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg) };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Erreur lors de la suppression du programme' };
  }
}

export async function listerIndependantsAction(annee: number, semaine: number): Promise<IProgramme[]> {
  return programmeAPI.independants(annee, semaine);
}

// ── Surplus de carburant (§7) ───────────────────────────────────────────────

export async function listerSurplusAction(programmeId: string): Promise<ISurplus[]> {
  return programmeAPI.listerSurplus(programmeId);
}

export async function etatSoumissionSurplusAction(annee: number, semaine: number): Promise<ISoumissionSurplus> {
  return programmeAPI.etatSoumissionSurplus(annee, semaine);
}

/**
 * Accorder un surplus.
 *
 * Le message du serveur est RENVOYÉ TEL QUEL : il dit lequel des trois refus s'applique —
 * jour de repos, semaine clôturée, « Autre » sans précision. Un libellé générique
 * obligerait l'opérateur à deviner lequel.
 */
export async function accorderSurplusAction(
  programmeId: string,
  payload: IAccorderSurplusPayload,
): Promise<ActionResponse<ISurplus>> {
  try {
    const data = await programmeAPI.accorderSurplus(programmeId, payload);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, "Erreur lors de l'ajout du surplus");
  }
}

export async function modifierSurplusAction(
  programmeId: string,
  surplusId: string,
  payload: IAccorderSurplusPayload,
): Promise<ActionResponse<ISurplus>> {
  try {
    const data = await programmeAPI.modifierSurplus(programmeId, surplusId, payload);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, 'Erreur lors de la modification du surplus');
  }
}

export async function annulerSurplusAction(
  programmeId: string,
  surplusId: string,
  motif: string,
): Promise<ActionResponse<ISurplus>> {
  try {
    const data = await programmeAPI.annulerSurplus(programmeId, surplusId, motif);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, "Erreur lors de l'annulation du surplus");
  }
}

/**
 * Affecter à un autre site aujourd'hui (§3.3, RG-S08).
 *
 * Le message du serveur est RENVOYÉ TEL QUEL : il dit lequel des refus s'applique —
 * programme non publié, livreur au repos ce jour-là, site déjà prévu. Le remplacer par
 * un libellé générique obligerait l'opérateur à deviner lequel des trois.
 */
export async function affecterSiteAction(
  id: string,
  payload: IAffecterSitePayload,
): Promise<ActionResponse<IProgramme>> {
  try {
    const data = await programmeAPI.affecterSite(id, payload);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, "Erreur lors de l'affectation du site");
  }
}

/** Dupliquer CE programme sur la semaine suivante (§6.2). */
export async function dupliquerSurSemaineSuivanteAction(id: string): Promise<ActionResponse<IProgramme>> {
  try {
    const data = await programmeAPI.dupliquerSurSemaineSuivante(id);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, 'Erreur lors de la duplication sur la semaine suivante');
  }
}

export async function bandeauCarburantAction(annee: number, semaine: number): Promise<IBandeauCarburant> {
  return programmeAPI.bandeauCarburant(annee, semaine);
}

export async function etatCarburantAction(annee: number, semaine: number): Promise<IEtatCarburantSemaine> {
  return programmeAPI.etatCarburant(annee, semaine);
}

/** Le message du serveur, tel quel : un 409 dit pourquoi et quoi faire. */
function erreurTexte(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const serverMsg = error.response?.data?.message || error.response?.data || error.message;
    return typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg);
  }
  return error instanceof Error ? error.message : fallback;
}

export async function dupliquerSemaineAction(payload: IDupliquerSemainePayload): Promise<ActionResponse<IDuplicationSemaine>> {
  try {
    const data = await programmeAPI.dupliquerSemaine(payload);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: erreurTexte(error, 'Erreur lors de la duplication de la semaine') };
  }
}

export async function renvoyerWhatsAppAction(id: string): Promise<ActionResponse<IProgramme>> {
  try {
    const data = await programmeAPI.renvoyerWhatsApp(id);
    return { success: true, data };
  } catch (error) {
    return erreurMetier(error, "Erreur lors de l'envoi WhatsApp");
  }
}

export async function historiqueProgrammeAction(id: string): Promise<IAuditAction[]> {
  return programmeAPI.historique(id);
}
