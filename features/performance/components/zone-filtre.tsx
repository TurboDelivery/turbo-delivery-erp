'use client';

import { Spinner } from '@heroui-v3/react';
import { useLinkStatus } from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react';

/**
 * L'attente d'une lecture, rendue VISIBLE.
 *
 * <h3>Le défaut corrigé</h3>
 * <p>Les sélecteurs de ce module écrivent la période dans l'URL et poussent la navigation
 * dans un `useTransition`. C'est le bon choix : React conserve alors l'écran PRÉCÉDENT
 * pendant que le serveur recalcule, au lieu de le vider. Mais il a un prix, et personne ne
 * l'avait payé : pendant ces quelques secondes, l'écran affiche les chiffres de la semaine
 * d'AVANT, inchangés, sans rien qui signale qu'un calcul est en cours. Le seul indice était
 * la liste déroulante qui passait en désactivé, ce qui se lit comme une panne bien plus que
 * comme une attente. L'utilisateur l'a dit ainsi : « on a l'impression que la page est
 * plantée ».</p>
 *
 * <p>L'attente n'est pas courte. Mesure du 15/09 en production : `/api/creneaux` répond en
 * 2,2 à 2,5 s, chaque lecture de performance en 0,5 à 1,0 s. Il y a donc plusieurs secondes
 * pendant lesquelles l'écran doit dire quelque chose.</p>
 *
 * <h3>Deux gestes, un seul vocabulaire</h3>
 * <p>On change de période de DEUX façons sur ces écrans : par un champ de filtre, et par un
 * lien (une carte de contrat, un onglet de semaine, un retour). Le second ne passait par
 * aucune transition, donc il ne produisait rien du tout, et c'est le geste le plus fréquent
 * de l'écran d'entrée. {@link SignalLien} branche `useLinkStatus` sur le MÊME état : quelle
 * que soit la façon dont on a demandé, l'écran répond de la même manière.</p>
 *
 * <h3>Ce qui change, et ce qui ne change pas</h3>
 * <p>On garde la transition, donc on garde les chiffres à l'écran : sur un écran de
 * comparaison, voir la semaine précédente pendant que la suivante arrive vaut mieux qu'un
 * squelette gris, et la règle de refonte l'impose — aucune donnée visible ne disparaît. Ce
 * qui change est le SIGNAL. Le contenu s'estompe et devient inerte, un indicateur apparaît
 * contre les filtres, et une région vocale annonce la mise à jour.</p>
 *
 * <h3>Pourquoi un contexte</h3>
 * <p>L'attente naît dans un composant client (le sélecteur, ou un lien), mais elle doit
 * teinter le CONTENU, que la page rend côté serveur. Un contexte est le seul chemin : le
 * contenu serveur traverse la frontière en `children`, déjà rendu, et le fournisseur
 * l'enveloppe sans jamais le reconstruire. Aucune fonction ne franchit la frontière dans
 * l'autre sens, ce qui est exactement la faute qui a fait tomber cet écran en production le
 * 15/09.</p>
 */

type EtatFiltre = {
  /** Une nouvelle lecture est en cours côté serveur, filtre ou lien confondus. */
  enCours: boolean;
  /** Pousse la requête d'URL construite par le sélecteur, à l'intérieur de la transition. */
  naviguerVers: (requete: string) => void;
  /** Un lien de la zone entre ou sort de son attente de navigation. */
  signalerLien: (actif: boolean) => void;
};

const ContexteFiltre = createContext<EtatFiltre | null>(null);

/**
 * L'état d'attente partagé, ou un état LOCAL hors de toute zone.
 *
 * <p>Le repli n'est pas une commodité : sans lui, un sélecteur ou un lien rendu hors de
 * {@link ZoneFiltre} lèverait à la racine d'une page serveur, et c'est un écran blanc. Ici
 * il navigue normalement, il perd seulement l'estompage du contenu. Une dégradation qu'on
 * voit, jamais une erreur qu'on avale.</p>
 *
 * <p>Les deux sources sont construites à CHAQUE rendu, dans le même ordre : c'est ce
 * qu'exige la règle des crochets, et c'est pourquoi le repli existe même quand le contexte
 * est présent.</p>
 */
export function useFiltre(): EtatFiltre {
  const partage = useContext(ContexteFiltre);
  const local = useFiltreLocal();
  return partage ?? local;
}

function useFiltreLocal(): EtatFiltre {
  const router = useRouter();
  const [transitionEnCours, demarrer] = useTransition();

  /*
   * Un COMPTEUR et non un booléen : plusieurs liens peuvent être en attente en même temps
   * (un clic, puis un second avant que le premier n'aboutisse). Un booléen remis à faux par
   * le premier qui se termine éteindrait l'indicateur alors que l'écran travaille encore.
   */
  const [liensEnAttente, setLiensEnAttente] = useState(0);

  const naviguerVers = useCallback(
    (requete: string) => {
      demarrer(() => router.push(requete ? `?${requete}` : '?', { scroll: false }));
    },
    [router],
  );

  const signalerLien = useCallback((actif: boolean) => {
    setLiensEnAttente((n) => Math.max(0, n + (actif ? 1 : -1)));
  }, []);

  return useMemo(
    () => ({
      enCours: transitionEnCours || liensEnAttente > 0,
      naviguerVers,
      signalerLien,
    }),
    [transitionEnCours, liensEnAttente, naviguerVers, signalerLien],
  );
}

/**
 * La zone qui porte l'attente : elle englobe l'entête, les filtres et le contenu.
 *
 * <p>Elle ne dessine rien et n'émet aucun nœud du DOM, donc l'espacement que la page
 * applique à ses enfants continue de s'appliquer. Elle ouvre le contexte et laisse la page
 * composer : c'est elle qui décide de ce qui s'estompe, par l'endroit où elle pose
 * {@link ContenuFiltre}.</p>
 *
 * <p>Elle doit envelopper l'entête aussi, et pas seulement le contenu : les liens de retour
 * et le lien vers le classement y vivent, et ils ont besoin du contexte pour signaler leur
 * propre attente.</p>
 */
export function ZoneFiltre({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const valeur = useFiltreLocal();

  return (
    <ContexteFiltre.Provider value={valeur}>
      {className ? <div className={className}>{children}</div> : children}
    </ContexteFiltre.Provider>
  );
}

/**
 * Le contenu périmé : estompé, inerte, et annoncé comme occupé.
 *
 * <p>`aria-busy` porte l'information pour les technologies d'assistance ; l'opacité la porte
 * pour l'œil ; `pointer-events-none` empêche de cliquer un lien ou un bouton d'export
 * calculés sur des chiffres qui vont changer — exporter en tableur la semaine qu'on vient de
 * quitter est une erreur silencieuse et coûteuse.</p>
 *
 * <p>L'opacité est 70 %, la valeur retenue partout ailleurs dans cet ERP. Descendre plus bas
 * rendrait les chiffres illisibles, et les rendre illisibles reviendrait à les faire
 * disparaître — ce que la règle de refonte interdit. Le texte reste sélectionnable : on doit
 * pouvoir copier une valeur encore affichée.</p>
 *
 * <p>⚠ `className` n'est pas décoratif : cette enveloppe s'insère ENTRE la page et son
 * contenu, donc elle doit reprendre l'espacement que la page appliquait à ses enfants
 * (`space-y-4`), sans quoi le contenu se tasserait.</p>
 */
export function ContenuFiltre({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const { enCours } = useFiltre();

  return (
    <div
      aria-busy={enCours || undefined}
      className={[
        className,
        'transition-opacity duration-200 motion-reduce:transition-none',
        enCours ? 'pointer-events-none opacity-70' : 'opacity-100',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

/**
 * L'indicateur posé contre les champs de filtre.
 *
 * <p>Il occupe sa place en permanence et ne fait que changer d'opacité : apparaître en
 * poussant les champs ferait sauter la ligne au moment précis où l'on vient de cliquer
 * dedans.</p>
 *
 * <p>La teinte est celle du texte secondaire, pas l'accent. L'accent de cet ERP est réservé
 * à ce qui appelle une action ; une attente informe, elle ne demande rien. Le libellé est
 * celui déjà employé ailleurs dans le projet, à l'identique.</p>
 */
export function IndicateurFiltre() {
  const { enCours } = useFiltre();

  return (
    <div
      aria-hidden="true"
      className={[
        'flex items-center gap-2 pb-2 text-sm text-muted',
        'transition-opacity duration-150 motion-reduce:transition-none',
        enCours ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <Spinner color="current" size="sm" />
      <span>Mise à jour…</span>
    </div>
  );
}

/**
 * L'attente d'un LIEN, versée dans le même état que celle des filtres.
 *
 * <p>Cliquer une carte de contrat, un onglet de semaine ou un lien de retour déclenche une
 * vraie navigation, qui ne passe par la transition d'aucun sélecteur. Rien ne s'estompait,
 * rien ne s'annonçait, et l'écran restait figé plusieurs secondes : la plainte de départ,
 * mot pour mot, sur le geste le plus courant de l'écran d'entrée.</p>
 *
 * <p>`useLinkStatus` rend l'attente du lien qui l'entoure. Hors d'un `Link` il rend
 * `{pending: false}`, donc ce composant est inoffensif partout ailleurs.</p>
 *
 * <p>Deux usages :</p>
 * <ul>
 *   <li>avec un enfant, il PREND SA PLACE pendant l'attente. On y met l'icône du lien : le
 *       chevron cède au sablier dans la même boîte de 16 px, donc sans décalage, et le
 *       retour est local au lien qu'on vient de cliquer ;</li>
 *   <li>sans enfant, il ne dessine rien et se contente de déclarer l'attente. C'est ce qu'il
 *       faut pour un lien sans icône, dont la largeur ne doit pas bouger.</li>
 * </ul>
 *
 * <p>⚠ On lui passe un ÉLÉMENT, jamais un type : `&lt;SignalLien&gt;&lt;ChevronRight /&gt;&lt;/SignalLien&gt;`
 * et jamais `&lt;SignalLien icone={ChevronRight} /&gt;`. Une icône lucide est un objet
 * `forwardRef`, donc une fonction : la passer en prop depuis un composant serveur fait
 * tomber la page entière, build vert compris. C'est la panne du 15/09, et elle a mis cet
 * écran hors service en production.</p>
 */
export function SignalLien({ children }: { children?: ReactNode }) {
  const { pending } = useLinkStatus();
  const { signalerLien } = useFiltre();

  useEffect(() => {
    if (!pending) return;

    signalerLien(true);
    return () => signalerLien(false);
  }, [pending, signalerLien]);

  if (children === undefined) return null;

  return pending ? (
    <Spinner aria-hidden="true" className="shrink-0" color="current" size="sm" />
  ) : (
    <>{children}</>
  );
}

/**
 * L'annonce vocale de l'attente.
 *
 * <p>Séparée de l'indicateur visuel, qui est `aria-hidden` : un lecteur d'écran ne perçoit
 * ni l'opacité ni l'arc qui tourne. Sans cette région, l'utilisateur non voyant choisit une
 * semaine et n'entend plus rien jusqu'à ce que les chiffres changent sous lui.</p>
 */
export function AnnonceFiltre() {
  const { enCours } = useFiltre();

  return (
    <p aria-live="polite" className="sr-only" role="status">
      {enCours ? 'Mise à jour des données en cours' : 'Données à jour'}
    </p>
  );
}
