'use client';

import { Alert, Chip, Drawer } from '@heroui-v3/react';

import { ChampCopiable } from '@/components/commons/ChampCopiable';

import { IAuditAction } from '../types';
import { TYPE_ACTION_COULEURS, TYPE_ACTION_LABELS } from '../types';
import { changements, formatInstant, libelleObjet } from '../utils/supervision-format.utils';

/**
 * Le détail complet d'une action du journal.
 *
 * <h3>Pourquoi ce tiroir existe</h3>
 * <p>La cellule « Détail » du tableau montre trois champs. Sur une création de course
 * partenaire elle en cachait trente-sept derrière un compteur qui ne s'ouvrait pas : le
 * journal affirmait qu'il avait tout enregistré, et refusait de le montrer. La règle du
 * projet est qu'aucune donnée visible ne disparaît ; ici elle n'avait jamais été visible.</p>
 *
 * <p>Le tiroir ne fait AUCUN appel réseau : la ligne du journal porte déjà tout, l'écran se
 * contentait de ne pas l'afficher.</p>
 *
 * <h3>Ce que l'identifiant technique fait encore là</h3>
 * <p>Un identifiant raccourci en « #36362945 » se lit dans un tableau dense, mais il ne se
 * recherche pas. L'entier est donc ici, en clair et copiable : c'est la seule clé qui permet
 * de retrouver l'objet dans un autre écran ou dans la base.</p>
 */
export function TiroirActionAudit({
  action,
  onFermer,
  ouvert,
}: {
  action: IAuditAction | null;
  onFermer: () => void;
  ouvert: boolean;
}) {
  const lignes = action ? changements(action) : [];
  const renseignes = lignes.filter((l) => !l.vide);
  const vides = lignes.filter((l) => l.vide);

  return (
    <Drawer isOpen={ouvert} onOpenChange={(o: boolean) => !o && onFermer()}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-full max-w-[95vw] sm:w-[40rem]">
            <Drawer.Header className="pe-8">
              <Drawer.Heading className="text-base font-semibold text-foreground">
                {action ? libelleObjet(action) : 'Action'}
              </Drawer.Heading>
              {action && (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <Chip color={TYPE_ACTION_COULEURS[action.typeAction] ?? 'default'} size="sm" variant="soft">
                    <Chip.Label>{TYPE_ACTION_LABELS[action.typeAction] ?? action.typeAction}</Chip.Label>
                  </Chip>
                  <span>{formatInstant(action.occurredAt, true)}</span>
                  <span>· {action.utilisateur ?? 'Système'}</span>
                  {action.module && <span>· {action.module}</span>}
                </p>
              )}
              <Drawer.CloseTrigger />
            </Drawer.Header>

            <Drawer.Body className="space-y-5">
              {action && !action.succes && action.erreur && (
                /*
                 * Le message d'échec n'était affiché QUE lorsque l'action ne portait aucun
                 * champ. Une action qui échoue APRÈS avoir modifié quelque chose perdait donc
                 * entièrement son motif, c'est-à-dire la seule chose qu'on vient y chercher.
                 */
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>L&apos;action a échoué</Alert.Title>
                    <Alert.Description>{action.erreur}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}

              {renseignes.length > 0 && (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Champs renseignés ({renseignes.length})
                  </h3>
                  <dl className="divide-y divide-separator">
                    {renseignes.map((ligne) => (
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5" key={ligne.champ}>
                        <dt className="w-44 shrink-0 text-sm text-muted" title={ligne.champ}>
                          {ligne.libelle}
                        </dt>
                        <dd className="flex flex-1 flex-wrap items-baseline gap-x-2 text-sm">
                          {ligne.avantBrut != null && ligne.apresBrut != null && (
                            <>
                              <span className="tabular-nums text-danger-soft-foreground line-through decoration-1">
                                {ligne.avant}
                              </span>
                              <span aria-hidden="true" className="text-muted">
                                →
                              </span>
                              <span className="sr-only">devient</span>
                            </>
                          )}
                          <span className="font-medium tabular-nums text-foreground">
                            {ligne.apresBrut != null ? ligne.apres : ligne.avant}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {vides.length > 0 && (
                /*
                 * Les champs restés vides ne sont pas du bruit : sur une création, savoir
                 * qu'un client n'a PAS été renseigné est une information. Ils sont groupés
                 * plutôt que listés un par un, et le compte se recoupe avec celui du bouton.
                 */
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Champs restés vides ({vides.length})
                  </h3>
                  <p className="text-sm text-muted">{vides.map((l) => l.libelle).join(', ')}</p>
                </section>
              )}

              {action && (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Objet concerné
                  </h3>
                  <p className="text-sm text-foreground">{libelleObjet(action)}</p>
                  {action.entiteId && (
                    <div className="mt-1">
                      <ChampCopiable valeur={action.entiteId} />
                    </div>
                  )}
                </section>
              )}

              {action && (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Contexte technique
                  </h3>
                  <dl className="space-y-1 text-sm text-muted">
                    {action.chemin && (
                      <div className="flex gap-2">
                        <dt className="w-32 shrink-0">Appel</dt>
                        <dd className="break-all text-foreground">
                          {action.httpMethode} {action.chemin}
                        </dd>
                      </div>
                    )}
                    {action.statutHttp != null && (
                      <div className="flex gap-2">
                        <dt className="w-32 shrink-0">Réponse</dt>
                        <dd className="tabular-nums text-foreground">
                          {action.statutHttp}
                          {action.dureeMs != null && ` · ${action.dureeMs} ms`}
                        </dd>
                      </div>
                    )}
                    {action.ip && (
                      <div className="flex gap-2">
                        <dt className="w-32 shrink-0">Adresse</dt>
                        <dd className="tabular-nums text-foreground">{action.ip}</dd>
                      </div>
                    )}
                    {action.ecran && (
                      <div className="flex gap-2">
                        <dt className="w-32 shrink-0">Écran</dt>
                        <dd className="text-foreground">{action.ecran}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              <p className="text-xs text-muted">
                Journal en lecture seule. Les valeurs sont celles enregistrées au moment de
                l&apos;action, jamais recalculées depuis.
              </p>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
