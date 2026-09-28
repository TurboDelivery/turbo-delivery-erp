'use client';

import React from 'react';
import { Button, Input, Label, TextField } from '@heroui-v3/react';
import { ShieldBan, Undo2 } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  formatNombre,
  useInscrireListeNoireMutation,
  useListeNoireQuery,
  useRetirerListeNoireMutation,
  type ILigneListeNoire,
} from '@/features/bdd-clients';

/**
 * Les numéros qui ne sont pas des clients.
 *
 * <h3>Pourquoi cet écran existe</h3>
 * <p>Le standard d'un restaurant figure sur des centaines de tickets. Sans cette liste,
 * il devient mécaniquement le client le plus fidèle du réseau, en tête de tous les
 * classements et de tous les exports. Le contrôle de saisie la lisait depuis le premier
 * jour ; rien ne l'alimentait, ce qui en faisait une garde sans gâchette.</p>
 *
 * <h3>Ce que l'inscription fait vraiment</h3>
 * <p>Elle bloque les saisies futures ET retire la fiche déjà constituée. Bloquer l'avenir
 * en laissant les mille commandes déjà saisies ne réglerait rien : le standard resterait
 * en tête. L'écran écrit donc combien de commandes sortent des classements, avant et
 * après le geste.</p>
 *
 * <h3>Le libellé n'est pas décoratif</h3>
 * <p>Il est obligatoire côté serveur. Une liste de numéros sans nom est illisible six
 * mois plus tard, et plus personne n'ose en retirer un de peur de rouvrir ce qu'un autre
 * avait fermé.</p>
 */

function formatInstant(valeur: string | null): string {
  if (!valeur) return '—';
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ListeNoireView() {
  const { data, error, isLoading, refetch } = useListeNoireQuery();
  const inscrire = useInscrireListeNoireMutation();
  const retirer = useRetirerListeNoireMutation();

  const [telephone, setTelephone] = React.useState('');
  const [libelle, setLibelle] = React.useState('');
  const [motif, setMotif] = React.useState('');
  const [aRetirer, setARetirer] = React.useState<ILigneListeNoire | null>(null);

  const pret = telephone.trim() !== '' && libelle.trim() !== '';

  const ajouter = () => {
    if (!pret) return;
    inscrire.mutate(
      { libelle: libelle.trim(), motif: motif.trim() || null, telephone: telephone.trim() },
      {
        onSuccess: () => {
          setTelephone('');
          setLibelle('');
          setMotif('');
        },
      },
    );
  };

  const confirmerLeRetrait = () => {
    if (!aRetirer) return;
    retirer.mutate(aRetirer.telephone, { onSuccess: () => setARetirer(null) });
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Numéros exclus</h1>
        <p className="text-sm text-muted">
          Un standard, un livreur, un numéro de test. Ces numéros sont refusés à la saisie,
          et la fiche qu&apos;ils portaient sort des classements et des exports.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-large border border-separator bg-surface p-4">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Exclure un numéro
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <TextField onChange={setTelephone} value={telephone}>
            <Label>Numéro</Label>
            <Input placeholder="07 09 44 44 01" />
          </TextField>
          <TextField isRequired onChange={setLibelle} value={libelle}>
            <Label>Ce que c&apos;est</Label>
            <Input placeholder="Standard Em Sherif" />
          </TextField>
          <TextField onChange={setMotif} value={motif}>
            <Label>Motif</Label>
            <Input placeholder="Facultatif" />
          </TextField>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {telephone.trim() === ''
              ? 'Entre le numéro à exclure.'
              : libelle.trim() === ''
                ? 'Dis ce qu’est ce numéro : sans nom, personne n’osera le retirer plus tard.'
                : 'La fiche qui porte ce numéro sera retirée, et reviendra si tu le retires d’ici.'}
          </span>
          <Button
            isDisabled={!pret || inscrire.isPending}
            onPress={ajouter}
            size="sm"
            variant="primary"
          >
            <ShieldBan aria-hidden="true" className="size-4" />
            Exclure
          </Button>
        </div>
      </div>

      {error ? (
        <EtatErreur
          detail={(error as Error).message}
          onReessayer={() => void refetch()}
          quoi="les numéros exclus"
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div className="h-14 animate-pulse rounded-md bg-surface-2" key={i} />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="rounded-large border border-separator bg-surface p-6 text-center text-sm text-muted">
          Aucun numéro exclu.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-separator rounded-large border border-separator bg-surface">
          {data.map((ligne) => (
            <li className="flex items-center justify-between gap-4 p-3" key={ligne.telephone}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-foreground">
                  <span className="tabular-nums">{ligne.telephoneMasque}</span> {ligne.libelle}
                </span>
                <span className="truncate text-xs text-muted">
                  exclu le {formatInstant(ligne.createdAt)}
                  {ligne.motif ? ` · ${ligne.motif}` : ''}
                  {ligne.ficheRetireeId ? (
                    <>
                      {' · '}
                      <span className="tabular-nums">
                        {formatNombre(ligne.capturesRetirees)}
                      </span>{' '}
                      commande{ligne.capturesRetirees > 1 ? 's' : ''} retirée
                      {ligne.capturesRetirees > 1 ? 's' : ''}
                    </>
                  ) : null}
                </span>
              </div>
              <Button onPress={() => setARetirer(ligne)} size="sm" variant="ghost">
                <Undo2 aria-hidden="true" className="size-4" />
                Retirer
              </Button>
            </li>
          ))}
        </ul>
      )}

      <FenetreAction
        enAttente={retirer.isPending}
        libelleAction="Retirer de la liste"
        onAction={confirmerLeRetrait}
        onFermer={() => setARetirer(null)}
        ouvert={aRetirer !== null}
        titre="Remettre ce numéro dans la base"
      >
        <p className="text-sm text-foreground">
          <strong className="tabular-nums">{aRetirer?.telephoneMasque}</strong>{' '}
          {aRetirer?.libelle} sera de nouveau accepté à la saisie.
        </p>
        <p className="text-xs text-muted">
          {aRetirer?.ficheRetireeId
            ? `Sa fiche et ses ${formatNombre(aRetirer.capturesRetirees)} commande(s) reviennent dans les classements et les exports.`
            : 'Aucune fiche n’avait été retirée par cette exclusion : rien ne revient, seule la saisie se rouvre.'}
        </p>
        <p className="text-xs text-muted">
          Une fiche supprimée pour une autre raison ne revient pas : le serveur ne rend que
          ce que cette liste avait retiré.
        </p>
      </FenetreAction>
    </section>
  );
}
