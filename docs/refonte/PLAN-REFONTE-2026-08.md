# PLAN DE CHANTIER, ERP TURBO DELIVERY

## 0. Ce que j'ai revérifié dans le dépôt, et trois corrections à l'audit

J'ai rejoué les mesures les plus structurantes avant de bâtir le plan dessus. Trois écarts changent des priorités.

**Correction 1, la plus importante. `app/(protected)/tickets/content.tsx` (973 lignes) est du code mort.**
`app/(protected)/tickets/page.tsx` rend `TicketPageClient`, pas `content.tsx` (vérifié : le fichier ne contient que 6 lignes et importe `@/components/tickets/ticket-page-client`). Aucun import de `content.tsx` nulle part dans app, components, features, src, lib, hooks. L'axe UX en fait « l'écran le plus fréquenté » et lui impute 4 `z-2` inexistants, un `<table>` nu, un `max-h-[420px]` et 34 classes claires sans variante `dark:`. Ces défauts existent bien dans le fichier, mais aucun opérateur ne les voit.
L'écran vivant est `components/tickets/table/ticket-table.tsx`, qui utilise déjà HeroUI Table (ligne 5) et a ses colonnes dans `components/tickets/table/ticket-table-columns.tsx`. Il respecte donc déjà les deux conventions du projet. Le seul défaut réel qui survit est `components/tickets/table/ticket-table.tsx:215` : `max-h-[420px] overflow-y-auto`, hauteur en dur, exactement ce que la règle « hauteur mesurée » interdit. Les `z-2` de `components/tickets/tabs/ticket-tab-all.tsx:94,96,117,226` sont en commentaire.
Conséquence : ne pas ouvrir de lot « refonte de la page Tickets ». La supprimer, et corriger une ligne.

**Correction 2.** `app/(protected)/analystics/content.tsx` est mort aussi : `app/(protected)/analystics/page.tsx` rend `DatabaseCards` + `FinanceDashboard`. Or c'était le seul émetteur de liens vers `/ticktes-terminers` (lignes 25, 61, 122, 147). Les deux routes fautives `/tikets-terminers` et `/ticktes-terminers` sont donc réellement inatteignables par navigation.

**Correction 3.** Les axes ne comptent pas pareil. Recomptés aujourd'hui : 399 fichiers importent `@heroui/` (l'audit dit 397, 400 et 399 selon l'axe), 115 fichiers importent sonner, 66 importent react-toastify, 21 fichiers portent `min-h-screen`. L'écart sur les dépendances mortes (19 sur l'axe migration, 43 sur l'axe inventaire) vient de deux méthodes différentes : à retrancher une par une avant suppression, pas en bloc.

**Confirmé sans réserve :** `env.local` est suivi par git. `utils/route-permission.ts:46` finit bien par `return true`. `app/api/factures/pagination/route.ts` ne lit aucune session, cible `http://backend-prod...` en clair (ligne 9) et renvoie `Access-Control-Allow-Origin: '*'`. `lib/api-client-http.tsx:76` retombe sur `http://localhost:3000`. `features/agent-recouvreur/apis/index.ts:47` fait `fetch(url)` nu avec le commentaire assumant l'omission de X-User-Id. `utils/format.utils.ts:14` renvoie `"0 FCFA"` et la ligne 16 passe en `currency: 'XOF'`. `App.tsx:58` monte ToastContainer, `components/layouts/app-toaster.tsx:41` monte Toaster. `app/layout.tsx:2-3` importe les deux feuilles concurrentes et `app/globals.css:6` ouvre bien un `@theme inline`. `middleware.ts` a son contrôle de session en commentaire (lignes 3 et 6). `tsc --noEmit` sort à 0 erreur, exit 0.

**Les 4 routes proxy non authentifiées sont bel et bien appelées par du code vivant**, donc elles ne peuvent pas être simplement supprimées : `features/revenus/hooks/use-revenue-period.ts:51,55`, `features/finance-dashboard/queries/global-stats.query.ts:33`, `features/finance-dashboard/hooks/use-ca-export.ts:43`.

---

## 1. Verdict sur HeroUI v3

**Non. Pas maintenant. Pas dans les six prochains mois.**

Trois raisons, dans l'ordre de poids.

**Le coût n'est pas celui de HeroUI, c'est celui de trois montées majeures empilées.** v3 exige Tailwind 4 et React 19, React 19 exige Next 15. Le chantier réel est donc Next 15 + React 19, puis Tailwind 4, puis HeroUI v3, chacun revalidable seulement à la main, sur un ERP utilisé tous les jours. Le seul Tailwind 4 met en jeu 937 bordures sans couleur et 766 classes `default-*`/`content1` qui ne sont générées que par le plugin `heroui()` de `tailwind.config.js:214`, sans qu'une seule erreur de compilation ne se déclenche.

**Il n'y a aucun point de passage.** 399 fichiers importent `@heroui/` en direct, 3 203 balises JSX, zéro ré-export maison. Une migration v3 est donc 399 fichiers touchés à la main, sans codemod (l'éditeur le dit lui-même), sur une bêta dont l'API peut encore bouger. Et le graphe est déjà dédoublé : `@heroui/table` existe en 2.2.9 et 2.2.32 simultanément, donc 5 écrans Finance et Personnel rendraient une Table différente des 90 autres pendant toute la migration.

**Le bénéfice pour l'opérateur est nul.** Ce que le commanditaire appelle « image moderne et professionnelle » ne vient pas d'un numéro de version. Il vient de : une seule carte KPI au lieu de 21, un seul emplacement de notification au lieu de deux coins opposés, un seul suffixe de devise au lieu de cinq, des messages d'erreur au lieu de tableaux vides trompeurs, des écrans qui tiennent dans la fenêtre. Tout cela se fait sur HeroUI v2, sans monter quoi que ce soit, et se voit immédiatement.

**La condition qui renverse ce verdict, et il faut les quatre ensemble :**
1. HeroUI v3 sort en version stable, non bêta, avec un outil de migration officiel publié.
2. Le lot Next 15 + React 19 est en production depuis au moins un mois, stabilisé.
3. La couche wrapper du Lot 3 existe, donc le nombre de points de contact est passé de 399 fichiers à une douzaine.
4. Une préproduction ERP existe, avec un filet de comparaison visuelle automatisé.

Tant qu'une seule de ces quatre conditions manque, la réponse reste non. Et si les quatre sont réunies, la migration coûte alors une fraction de ce qu'elle coûte aujourd'hui, ce qui est exactement l'intérêt d'attendre.

**Corollaire à assumer devant le commanditaire :** on ne repousse pas la modernisation, on la découple de la montée de version. Le Lot 2 ci-dessous produit un ERP visuellement homogène en quelques semaines. HeroUI v3 n'y ajouterait rien de visible.

---

## 2. L'ordre contraint, et ce qui casse si on l'inverse

```
LOT 0   Sécurité P0            aucune dépendance
LOT 1   Purge                  doit précéder tout le reste
LOT 2   Socle visuel           dépend de 1
LOT 3   Couche wrapper HeroUI  dépend de 1
LOT S2  Garde serveur CASL     dépend de 0
LOT 4   TanStack v5            indépendant, à faire tôt
LOT 5   Next 15 + React 19     dépend de 4 (confort) et du filet visuel
LOT 6   Tailwind 4             dépend de 2, 3, 5 et du filet visuel
LOT 7   HeroUI v3              reporté, conditions au point 1
```

**Purge avant tout.** Si on migre d'abord, on migre 24 095 lignes mortes, dont un fichier de 973 lignes que personne ne rend. On paie trois fois : à la migration, à la recette, et le jour où quelqu'un reprend par erreur le fichier abandonné.

**TanStack v5 avant Next 15, jamais après.** La dette réelle tient en 37 lignes (19 `keepPreviousData`, 9 `cacheTime`, 8 `useInfiniteQuery` sans `initialPageParam`, 1 `useMutation` positionnel) et ne touche ni le rendu ni l'authentification. Fait seul, il se recette en un après-midi. Fusionné dans le lot Next 15, il devient indiscernable d'une régression de rendu pendant la recette.

**Next 15 et React 19 dans le même commit, jamais séparés.** React 19 n'est pas supporté par Next 14. L'inverse est également vrai et c'est le piège le plus vicieux du dossier : `useFormState` ne peut pas devenir `useActionState` avant Next 15. Le React vendorisé par Next 14.2.35 est en `18.3.0-canary-178c267a4e-20241218` et ne contient pas `useActionState`, alors que `@types/react/canary.d.ts` le déclare. Le typecheck passe, le runtime plante. Les 8 sites concernés incluent `components/auth/form-login.tsx:16` : une connexion cassée en production ferme l'ERP à tout le monde.

**Fusion des deux feuilles CSS avant Tailwind 4, sans exception.** `app/layout.tsx:2-3` importe `styles/tailwind.css` puis `app/globals.css`. `app/globals.css:6` ouvre un bloc `@theme inline` en syntaxe Tailwind v4, que Tailwind 3.4 ignore purement et simplement. Le jour où v4 est activé, ce bloc devient vivant et bascule toute la palette de HSL vers oklch d'un coup, sur les 109 pages, sans une seule erreur de compilation et sans qu'aucun test ne le voie. C'est le seul point du dossier où l'inversion produit une panne visuelle totale et silencieuse.

**Couche wrapper et tokens avant Tailwind 4.** Sans wrapper, la couche de compatibilité sur la couleur de bordure par défaut (937 sites) et sur les tokens `default-*` (766 sites, 110 fichiers) doit être posée dans 399 fichiers au lieu d'un fichier de thème.

**Sécurité P0 en premier, indépendamment de tout.** Le secret de signature des sessions est dans l'historique git depuis le 22/07/2025 et quatre routes servent factures et chiffre d'affaires à qui connaît l'URL. Rien dans ce plan ne justifie d'attendre.

**Ce qui ne doit surtout pas être inversé :** Tailwind 4 avant Next 15. Cela imposerait HeroUI v3 en bêta comme condition d'entrée, donc 399 fichiers réécrits avant toute autre chose, sur un chantier qui ne se découpe pas en livraisons partielles. Le risque n'est pas technique, il est calendaire : on part pour un trimestre sans rien pouvoir déployer.

---

## 3. Découpage en lots

### LOT 0, Sécurité P0. Déployable seul. Fenêtre de maintenance requise.
**Objectif.** Fermer les deux fuites qui ne dépendent d'aucun arbitrage.

**Périmètre.**
- Rotation `AUTH_SECRET` en production. `git rm --cached env.local`, ajout de `env.local` à `.gitignore` et à `.dockerignore` (aujourd'hui les lignes 7-8 n'attrapent que `.env` et `.env.*`, pas `env.local` sans point, donc `Dockerfile:41 COPY . .` l'embarque). Purge de l'historique et du cache GHA (`deploy.yml:114-115`, `cache-to: type=gha,mode=max`).
- Rotation de `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` avec restriction par referrer HTTP.
- Garde `auth()` en tête de `app/api/factures/pagination/route.ts`, `app/api/finance/global/stats/route.ts`, `app/api/revenue/analytics/route.ts`, `app/api/revenue/analytics/dates/route.ts`. Retrait des en-têtes `Access-Control-Allow-Origin: '*'` (lignes 38 et 57 des deux premiers). Remplacement de l'URL `http://backend-prod...` codée en dur par la variable d'environnement en https.
- `lib/api-client-http.tsx:76-78` : remplacer la construction d'URL par `fetch('/api/auth/logout', { method: 'POST' })` en relatif.
- `features/revenus/hooks/use-revenus-periode.ts:18` et `use-revenus-details.ts:17` : https par variable d'environnement, suppression des `console.log` d'URL (lignes 38 et 27). Ces deux écrans sont aujourd'hui muets en production par blocage de contenu mixte.
- Suppression de `lib/api.client.ts` (code mort, `console.log` de la session complète ligne 24).

**Critère de vérification.** `curl` anonyme sur les 4 routes renvoie 401. Les 4 appelants vivants chargent encore une fois connecté : `features/revenus/hooks/use-revenue-period.ts:51,55`, `features/finance-dashboard/queries/global-stats.query.ts:33`, `features/finance-dashboard/hooks/use-ca-export.ts:43`. Un 401 backend redirige l'opérateur vers `/auth`. Les deux écrans de revenus affichent enfin des données. `git log --all -- env.local` ne renvoie plus rien.

**Alerte.** La rotation d'`AUTH_SECRET` invalide toutes les sessions en cours. À planifier hors heures d'exploitation, annoncée aux opérateurs.

---

### LOT 0bis, Sécurité P1 à fermeture rapide. Déployable seul.
**Objectif.** Retirer les défauts de garde qui se corrigent en quelques lignes.

**Périmètre.**
- `utils/route-permission.ts:46` : `return true` devient `return false`, après avoir déclaré les règles `can:` manquantes pour les 14 routes concernées (`/finance`, `/finance/depense`, `/finance/entrees-caisse`, `/finance/sorties`, `/finance/revenus-encaisses`, `/finance/cycle-facturation`, `/analystics/pay-slip`, `/analystics/pay-slip/[id]/details`, `/type-plat` et les autres). Ajout d'un contrôle de frontière dans `findRuleForPrefix` (ligne 24, `startsWith` fait matcher `/settings/profil-x` sur `/settings/profile`).
- `components/layouts/header.tsx:103` : appliquer `filterMenuByAbility` comme `components/layouts/sidebar.tsx:47`, ou supprimer ce second rendu de menu.
- `app/(protected)/restaurants/[restaurant_id]/_sections/integration-section.tsx:407,438` : masquer la clé API par défaut, révélation explicite.
- `socket.ts:5` : passer `auth: { token: session.user.token }` à `io()`.
- `next.config.js` : ajouter un bloc `headers()` avec `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, puis une CSP en report-only.

**Critère de vérification.** Matrice rôle x route testée à la main : les 6 rôles sur les 14 routes précédemment ouvertes, plus 12 routes témoins qui doivent rester accessibles. C'est le lot où un diff visuel ne sert à rien.

**Alerte.** L'inversion du défaut de `canAccessRoute` peut rendre 14 écrans inaccessibles d'un coup si la liste des règles est incomplète. Ne pas déployer sans la matrice.

---

### LOT 1, Purge. Déployable seul, en trois sous-lots vérifiables.
**Objectif.** Retirer 15 pour cent du code du périmètre de tous les lots suivants.

**Périmètre 1a, sans risque.** 139 des 162 fichiers de `components/icon/` (3 868 lignes). `package-lock.json` (721 Ko, concurrent de `pnpm-lock.yaml` alors que `package.json` déclare `packageManager: pnpm@10.15.1` et un bloc `pnpm.overrides` qui épingle `@internationalized/date`, la dépendance du calendrier). `turbo-delivery-erp.zip` (2,1 Mo), `_rewrite_edit.mjs`, `_tmp_check.mjs`, `remaining-feature.txt`, les 8 fichiers `.ts/.tsx` vides.

**Périmètre 1b, code applicatif mort.** `app/(protected)/tickets/content.tsx` (973 lignes, orphelin vérifié). `app/(protected)/analystics/content.tsx`. `app/(protected)/tikets-terminers/` (359 lignes) et `app/(protected)/ticktes-terminers/` (300 lignes), inatteignables une fois `analystics/content.tsx` supprimé. `app/(protected)/price-list/restaurants-undefined pagination/` (dossier avec un espace, URL réelle `/price-list/restaurants-undefined%20pagination`). `providers/provider-component.tsx` et `providers/tanstack.provider.tsx` (QueryClient fantôme jamais monté, `app/layout.tsx` monte `components/layouts/provider-component.tsx`). `features/responsable-financier/apis/index.ts` (144 lignes, troisième déclaration concurrente de la même ressource). Les 34 fichiers morts de `features/revenus`, dont la duplication `prets/` et `recouvrement-pret/`. `components/commons/next-ui-data-table.tsx`, `components/commons/'confirm-dialog copy.tsx'`, les 15 composants `components/ui/` sans importeur. `components/layouts/user-profile-dropdown.tsx`, `components/nav-bar/sidebar.tsx`, `components/layouts/ToolsList.tsx` (liens du gabarit d'origine, non montés).

**Périmètre 1c, dépendances.** Retrancher une par une la liste des paquets non importés (les deux méthodes de l'audit donnent 19 et 43, il faut trancher fichier par fichier). Retirer en priorité `@heroui/table`, `@heroui/select`, `@heroui/system`, `@heroui/theme` de `package.json` et rediriger les 9 imports concernés vers `@heroui/react` : `components/personnel/deduction-table.tsx:4`, `components/finance/recouvrements/recouvrements/recouvrement-table.tsx:5`, `components/personnel/request-table.tsx:7`, `components/personnel/loan-table.tsx:4`, `components/personnel/leave-table.tsx:7`, plus les 4 imports `@heroui/select` de `components/personnel/`. Redescendre `tailwind-scrollbar` en 3.x (la 4.0.2 installée exige Tailwind 4) ou supprimer le plugin et remplacer ses 2 usages par `.scrollbar-hide`.

**Critère de vérification.** `tsc --noEmit` reste à 0. `next build` passe. Comparaison visuelle : zéro pixel de différence sur les 109 routes. La suppression de `@heroui/table` doit être vérifiée en priorité sur les 5 écrans Finance et Personnel, qui changent d'implémentation de Table.

---

### LOT 2, Socle visuel. C'est le lot qui répond à « image moderne et professionnelle ». Déployable seul, en trois vagues.

**Objectif.** Rendre l'ERP homogène, sans monter une seule version.

**Vague 2a, les fondations.**
- Point d'entrée CSS unique : fusionner `styles/tailwind.css` (811 lignes, HSL) et `app/globals.css` (131 lignes, oklch inerte). Neutraliser le bloc `@theme inline` de `app/globals.css:6-78` et ses classes jamais utilisées (`*-sidebar-*`, `*-chart-1..5`, 0 usage mesuré). Ce geste seul désamorce le piège numéro un du dossier Tailwind 4.
- Un seul système de notification : migrer les 66 fichiers `react-toastify` vers sonner (115 fichiers, déjà majoritaire), supprimer `<ToastContainer>` de `App.tsx:58` et son import CSS `styles/tailwind.css:43`. Aujourd'hui la confirmation d'une action apparaît en haut à droite ou en bas à gauche selon la page.
- Un seul format monétaire : trancher entre `FCFA` et `F CFA`, corriger `utils/format.utils.ts:14` (qui rend `"0 FCFA"` pour zéro et `"1 500 F CFA"` sinon, dans la même colonne, pour 83 fichiers appelants), supprimer les 29 réimplémentations locales et les 5 copies de `formatMontant` du seul dossier `components/finance/agent-recouvreur/`. Même traitement pour les 39 formateurs de date.

**Vague 2b, la mise en page.**
- Retirer `min-h-screen` des 21 fichiers concernés et les `max-w`/`mx-auto` des 6 racines de page qui re-plafonnent la largeur malgré la décision prise dans `components/layouts/content-animation.tsx:38`, notamment `features/validation-finance/components/validation-page-authorized.tsx:55` (`max-w-7xl`) et `app/(protected)/restaurants/create/create-content.tsx:199` (`max-w-4xl`).
- Généraliser `hooks/use-hauteur-disponible.ts`, adopté aujourd'hui par 3 écrans seulement. Cibles prioritaires : `components/tickets/table/ticket-table.tsx:215` (`max-h-[420px]`, écran vivant le plus utilisé), les 2 `calc(100vh-Xrem)` résiduels dans des fichiers qui utilisent déjà le hook (`components/finance/validation-dga/validation-dga-view.tsx:286`, `features/trafic/components/trafic-content.tsx:268`), puis les 15 hauteurs en `vh` en dur. Sur la fenêtre cible 1000x563, `calc(100vh-14rem)` donne 339 px : ça tient de justesse et casse dès qu'un titre passe sur deux lignes.
- Corriger les classes fautives, silencieusement sans effet : `bbg-gray-50` dans `app/(protected)/delivery-men/creneau-progressionById/[id]/content.tsx:33`, `ggap-2` et `ggap-4` dans `.../Cardbody-planning-hebdomadaire.tsx:58,60`.

**Vague 2c, les composants partagés.**
- Une seule carte KPI, paramétrée (libellé, valeur, icône, ton, état de chargement). Les 21 implémentations existantes deviennent des réexports, puis disparaissent. Trois fichiers différents s'appellent littéralement `stat-card.tsx`. C'est la première chose que l'opérateur regarde en haut de chaque écran, et elle ne se ressemble nulle part.
- Un composant d'état d'erreur partagé (message plus bouton Réessayer), branché sur `isError` dans les 74 fichiers qui ont un état de chargement mais aucun état d'erreur. Plus un `error.tsx` par segment lourd : finance, validation-tickets, delivery-men. Aujourd'hui une panne d'API se lit exactement comme « aucune donnée ».
- Passer `isLoading` et `loadingContent` aux 23 `<TableBody>` qui affichent leur message d'état vide pendant le chargement.
- Normaliser les titres de page (environ 30 combinaisons de classes, 7 couleurs) et les libellés d'état vide (22 formulations). Corriger les accents manquants du module Personnel (`deduction-table.tsx:84,111`, `absence-table.tsx:86,113`, `payroll-table.tsx:112,160`, `creneau-weekly-table.tsx:135,165`).
- Envelopper d'un `Tooltip` les boutons désactivés par CASL (`app/(protected)/tickets/content.tsx` étant supprimé, les cibles vivantes sont `components/tickets/table/ticket-insert-bar.tsx:83`, `ticket-mobile-card.tsx:246,259`, `ticket-table-columns.tsx:333,344`, `features/validation-tickets/grille-de-paiement/components/GrillePaiementContent.tsx:170`).

**Vague 2d, les corrections métier visibles.**
- Compteurs plafonnés présentés comme des totaux : `components/finance/orientation-fonds/orientation-fonds-view.tsx:71-73,130,159` (`size: 100`, `aOrienter.length` affiché comme le reste à orienter, sans pagination). Même correctif sur `components/finance/caissier/caissier-view.tsx:79`, `features/validation-tickets/visa-dga/apis/visa-dga.api.ts:58`, `features/recouvrements/hooks/use-restaurant-factures.ts:17`, `features/revenus/hooks/use-recouvrement.ts:53`. Lire et afficher `totalElements`.
- Bouton principal en 404 : `/delivery/create` dans `app/(protected)/external_delivery/all/content.tsx:76` et `.../commande-terminers/content.tsx:130`. Aucune route `/delivery/*` n'existe.
- Entrée de menu active calculée en React via `usePathname` au lieu du `document.querySelector` de `components/layouts/sidebar.tsx:49,73-77`, qui ne trouve jamais rien sur une route dynamique ni sur le tableau de bord (`config/menu-data.tsx:18` déclare `path: '/'` alors que `middleware.ts` redirige vers `/analystics`).

**Critère de vérification.** Comparaison visuelle avant/après sur les 109 routes, avec revue humaine des différences (elles sont voulues ici, le diff sert à repérer celles qui ne le sont pas). Les 12 écrans canaris rejoués par un opérateur. `tsc` à 0.

**Déployable seul.** Oui, et par vague. C'est le lot qui doit partir en premier après la sécurité.

---

### LOT 3, Couche wrapper HeroUI. Déployable seul, invisible pour l'utilisateur.
**Objectif.** Faire passer le nombre de points de contact avec HeroUI de 399 fichiers à une douzaine.

**Périmètre.** Créer `components/heroui/` qui ré-exporte les 12 familles les plus utilisées : Button (411 balises, 189 fichiers), Table et ses 5 sous-composants (90 fichiers), Input (216 balises), Select et SelectItem (67 fichiers), Modal et ses 4 sous-composants (57 fichiers), Card, Chip, Pagination, Spinner, Avatar, Dropdown, Tooltip. Redirection mécanique de la ligne d'import dans les 399 fichiers, par script, sans toucher au JSX. Écrire au passage un `TextField` et un `SelectField` maison au-dessus de Input et Select, et y faire converger les 45 fichiers `react-hook-form` (107 `<Controller>`).

**Critère de vérification.** Zéro import direct `@heroui/*` hors de `components/heroui/`. `tsc` à 0. Comparaison visuelle : zéro pixel de différence sur les 109 routes. C'est le lot idéal pour étalonner le filet visuel, puisqu'il ne doit rien changer.

**Pourquoi le faire même si v3 n'arrive jamais.** Il donne un point unique pour la table de correspondance `color` x `variant`, pour la validation de formulaire homogène, et pour toute correction transverse. Aujourd'hui une correction appliquée « à la Table » n'atteint pas les 5 écrans qui importent `@heroui/table` en direct.

---

### LOT S2, Garde CASL côté serveur. Déployable seul, mais lourd.
**Objectif.** Que le refus d'accès protège la donnée et pas seulement l'affichage.

**Périmètre.** `components/protected-page.tsx:25` est un composant client, et `app/(protected)/layout.tsx:36` lui passe des `children` déjà rendus côté serveur. Les composants serveur des 35 pages concernées s'exécutent donc avant tout contrôle, et leurs données sont sérialisées dans la charge RSC avant l'affichage du 403 (exemple : `app/(protected)/finance/depense/page.tsx:6-15` lance deux prefetch). Calculer l'habilitation dans `app/(protected)/layout.tsx` à partir de `profile.role.libelle` et de `canAccessRoute`, et faire `redirect('/403')` avant de rendre `children`. Garder `ProtectedPage` comme filet client.

**Critère de vérification.** Sur 6 écrans sensibles et 3 rôles restreints, l'onglet réseau ne doit plus contenir les données métier. Matrice rôle x route rejouée.

**Alerte.** `getProfile` (`src/actions/users.actions.ts:275-287`) renvoie `null` sur toute erreur, y compris réseau : un incident backend déconnecterait tout le monde. À traiter dans le même lot.

---

### LOT 4, TanStack Query v4 vers v5. Déployable seul. Le meilleur rapport de tout le dossier de migration.
**Objectif.** Sortir une montée majeure du chemin critique en un après-midi.

**Périmètre.** 37 lignes : 19 `keepPreviousData`, 9 `cacheTime` (dont `components/layouts/provider-component.tsx:35` et `lib/get-query-client.ts:10`), 8 `useInfiniteQuery` sans `initialPageParam`, 1 `useMutation` positionnel (`features/depenses/hooks/use-depense-export.ts:23`). Prérequis : le Lot 1 doit avoir supprimé `providers/tanstack.provider.tsx`, sinon on migre un QueryClient fantôme.

**Critère de vérification.** `tsc` à 0. Devtools fonctionnels (le paquet 5.99.0 est déjà installé contre un cœur 4.44). Les 8 écrans à défilement infini rejoués. Les 123 accès `.isPending` sont déjà en syntaxe v5 et ne bougent pas.

**Ce qui ne bouge pas et rassure :** 0 `onSuccess`/`onError` sur `useQuery`, 0 `suspense`, 184 `invalidateQueries` sur 185 déjà en forme objet.

---

### LOT 5, Next 15 plus React 19. Indissociable. Déployable seul mais en fenêtre de maintenance.
**Objectif.** Le seul vrai lot de migration du plan.

**Périmètre.**
- Codemod officiel `next-async-request-api` sur les 17 fichiers `params`. Deux cas à traiter à la main : `i18n.ts:27`, où `cookies()` est appelé depuis la fonction synchrone `getLang()` que le codemod ne peut pas convertir, et qui est atteinte depuis `App.tsx:17` donc depuis la racine de l'application ; et `app/(protected)/finance/comptabilite/responsable-financier/[id]/page.tsx:12`, page cliente qui exige `React.use(params)` et non `await`. `app/(protected)/finance/recouvrement/[id]/factures/page.tsx:4` est déjà écrit pour Next 15.
- Les 5 appels `headers()`/`cookies()` : `src/actions/audit-connexion.actions.ts:83`, `src/actions/users.actions.ts:53,265`, `app/api/auth/logout/route.ts:6`, `i18n.ts:27`.
- `useFormState` vers `useActionState` sur les 8 fichiers, dont `components/auth/form-login.tsx:16` et `components/auth/form-change-password.tsx:18`. Cas de test à noter dans la recette : `app/(protected)/price-list/useContentCtx.ts:22` et `useContentHeaderPriceListDefined.ts:25` déstructurent un troisième élément qui est `undefined` au runtime depuis toujours. Le bouton d'enregistrement du barème doit enfin afficher un état en cours après la migration.
- `next.config.js:3` : retirer `swcMinify`.
- `components/dropdown.tsx:8,9` : `useRef<any>()` devient `useRef<any>(null)`. Ce correctif est compatible React 18 et peut partir dès aujourd'hui.
- Trancher `react-popper@2.3.0`, seul paquet réellement utilisé dont la plage de pairs exclut React 19, atteignable depuis `components/dropdown.tsx:3` et ses 4 consommateurs d'en-tête. Deux options : forcer le peer, ou remplacer `components/dropdown.tsx` par le Dropdown HeroUI déjà utilisé ailleurs. La seconde supprime aussi la dette `useRef`.
- Monter `eslint-config-next` (resté en 14.2.13) avec Next.

**Critère de vérification.** Dans cet ordre : connexion, déconnexion, comportement sur 401, changement de mot de passe, création et modification d'utilisateur, types de plats, enregistrement du barème de prix. Puis les 17 routes à `params`. Puis `tsc` à 0. Puis comparaison visuelle sur les 109 routes. Vérifier en recette le Client Router Cache de Next 15 (`staleTimes` des segments passe à 0), qui change la navigation entre écrans.

**Points rassurants mesurés.** Aucun `searchParams` en prop de page, aucun `generateMetadata`, aucun `generateStaticParams`. Le changement de politique de cache `fetch` est un non-événement : `app/(protected)/layout.tsx:1` pose `force-dynamic` sur les 109 pages. `Dockerfile:1,51` est en node:20-alpine, suffisant. `next-auth 5.0.0-beta.25` et `nuqs 2.8.9` acceptent déjà Next 15, `@heroui/react 2.6.14` accepte déjà React 19. Aucun `findDOMNode`, `defaultProps`, `propTypes` ni `ReactDOM.render` dans le code applicatif.

**Alerte.** Ce lot touche l'authentification et les 5 sites cookies/headers, dont la déconnexion et la journalisation d'audit de connexion. Le RBAC backend étant désactivé et l'identité voyageant en `X-User-Id`, une régression de session ne produit pas un 403 propre mais des requêtes anonymes qui peuvent aboutir. Ne pas déployer sans avoir rejoué la matrice rôle x route.

---

### LOT 6, Tailwind 4. NON déployable seul sans le filet visuel. Conditionnel.
**Objectif.** Débloquer techniquement HeroUI v3, et rien d'autre.

**Périmètre.** Prérequis absolus : Lot 2a (fusion CSS) fait, Lot 3 (wrapper) fait, Lot 5 en production et stabilisé, filet visuel opérationnel. Ensuite : couche de compatibilité redéfinissant explicitement la couleur de bordure par défaut à l'ancienne valeur (le changement de `gray-200` vers `currentColor` touche 937 sites et n'est pas traité par `@tailwindcss/upgrade`). Redéfinition en CSS des tokens `default-*` et `content1` (766 occurrences, 110 fichiers) qui ne sont générés aujourd'hui que par le plugin `heroui()` de `tailwind.config.js:214` et ne sont pas repris dans `theme.extend.colors`. Puis `@tailwindcss/upgrade` pour les renommages, et les 48 utilitaires supprimés (45 `flex-shrink-`, 2 `bg-opacity-`, 1 `flex-grow-`).

**Critère de vérification.** Comparaison visuelle sur les 109 routes, écran par écran, avec revue humaine de chaque différence. Aucune autre méthode ne voit ces dérives : `tsc` reste à 0 et `next build` reste vert quoi qu'il arrive.

**Verdict de priorité.** Ce lot a la plus mauvaise valeur sur risque du plan : environ 1 500 dérives visuelles silencieuses sur un ERP en production, pour zéro bénéfice utilisateur direct. Il ne se justifie que si le commanditaire valide HeroUI v3 à terme. Sinon, ne pas le faire.

---

### LOT 7, HeroUI v3. Reporté. Conditions au point 1.

---

## 4. Ce qui se fait sans rien migrer

C'est la moitié du plan, et c'est là qu'est la valeur.

**Sécurité, aucune dépendance de version :** rotation du secret et retrait de `env.local`, garde `auth()` sur les 4 routes proxy, retrait du CORS `*`, passage en https, correction du 401 vers `localhost`, inversion du défaut de `route-permission.ts:46`, filtrage CASL du menu horizontal, masquage de la clé API partenaire, authentification de la socket, en-têtes de sécurité, garde serveur RSC. Soit la totalité de l'axe sécurité, Lots 0, 0bis et S2.

**Interface et expérience, aucune dépendance de version :** point d'entrée CSS unique, un seul système de toast, un seul format monétaire, une seule carte KPI, un composant d'erreur partagé sur 74 écrans, les 23 tableaux qui mentent pendant leur chargement, la hauteur mesurée, les compteurs plafonnés du DG et du DGA, le bouton principal en 404, la classe `z-2` (dans du code mort, donc résolue par la suppression), le menu actif, les accents, les classes fautives, les libellés d'état vide, les tooltips sur boutons désactivés. Soit la totalité de l'axe UX à une exception près.

**Architecture, aucune dépendance de version :** la purge des 24 095 lignes mortes, la suppression des 4 sous-paquets HeroUI en double version, le lockfile unique, le doublon `Restaurant` de `types/models.ts:44` et `:408` (98 fichiers concernés, le compilateur croit aujourd'hui que tout Restaurant porte `coursesEnCours`), la clé de cache unique pour la liste des restaurants récupérée cinq fois par session, la couche wrapper HeroUI, l'extraction de `src/actions/bonLivraison.mapper.ts` (65 imports gagnés d'un coup, ce n'est pas une action mais un module de formatage).

**L'exception.** La seule chose qui exige une migration est HeroUI v3. Rien d'autre dans ce dossier n'en dépend, y compris ce que le commanditaire appelle « refaire les interfaces ».

---

## 5. Non-régression sur 152 000 lignes sans aucun test

Le projet n'a aucun test frontend, ESLint est neutralisé au build (`next.config.js:5`, `ignoreDuringBuilds: true`) et `features/` (45 pour cent du code, 823 fichiers) n'est jamais linté du tout. Le seul contrôle automatique est `tsc`, qui par construction ne voit ni une dérive Tailwind, ni un tuple `useFormState` faux, ni une classe inexistante.

Cinq dispositifs, par ordre de rentabilité.

**1. Le filet visuel automatisé. C'est la dépense obligatoire, et elle conditionne les Lots 5 et 6.**
Concrètement : Playwright, un compte de recette par rôle, une session semée en cookie, la liste des routes construite depuis `find app -name page.tsx` (109 entrées), un identifiant figé par route dynamique, capture en 1000x563 (fenêtre poste de travail) et en 1440x900, puis diff pixel.
Le point dur est le déterminisme : les données bougent, donc un diff brut est inutilisable. Il faut intercepter le réseau et rejouer des réponses enregistrées une fois (Playwright `route()` ou MSW). Sans cela, tout le monde abandonnera le diff au bout de trois exécutions.
Coût estimé : 3 à 5 jours. Il se rentabilise sur le seul Lot 3, dont le critère de sortie est « zéro pixel de différence » : c'est le lot idéal pour étalonner l'outil, puisqu'il ne doit rien changer. Et sans lui, le Lot 6 ne doit pas partir, point.

**2. `tsc --noEmit` à 0 comme critère de sortie de chaque lot.**
Vérifié aujourd'hui : exit 0, aucune sortie. `next.config.js` n'ignore qu'ESLint, pas TypeScript, donc le build échoue réellement sur une erreur de type. C'est le seul compteur fiable dont on dispose : il faut le garder à zéro, jamais « à peu près zéro ».

**3. Étendre le lint sans le rendre bloquant.**
Ajouter `eslint: { dirs: ['app','components','features','hooks','lib','src','utils','providers'] }` dans `next.config.js` et un script `lint:all`. Le compteur passe de 82 à 109 problèmes, dont des dépendances de hooks manquantes dans `features/`, cause classique de données périmées à l'écran. Garder `ignoreDuringBuilds: true` tant que le compteur n'est pas à zéro, mais le mesurer et le geler : aucun lot ne doit le faire monter.

**4. Douze écrans canaris, rejoués à la main par un opérateur nommé, à chaque lot.**
Proposition, à valider avec l'exploitation : connexion, tickets (saisie et insertion d'une ligne), grille de paiement, fiche facture en recouvrement, orientation des fonds, caissier, encours, paie du personnel, pointages livreurs à valider, fiche restaurant avec clé API, enregistrement d'un barème de prix, trafic. Un scénario écrit par écran, pas « regardez si ça marche ». Vingt minutes par passage.

**5. La matrice rôle x route, pour tout ce qui touche CASL.**
Six rôles sur les 14 routes aujourd'hui sans règle, plus 12 routes témoins. À jouer avant et après le Lot 0bis, et après le Lot S2 et le Lot 5. Aucun diff visuel ne couvre l'autorisation.

**Deux conditions d'exploitation.**
Une préproduction. S'il n'y en a pas, c'est la première dépense du plan, avant même le Lot 0. Les Lots 5 et 6 ne sont pas déployables sans elle.
Un retour arrière en une commande. Le déploiement se fait à la main depuis un poste, la CI n'atteignant plus le serveur : il faut vérifier que l'image précédente est taguée et redéployable en une minute, et le tester une fois à blanc avant le Lot 5.

**Règle de calendrier.** Aucun lot visuel ni de migration en fin de semaine, ni pendant une clôture de cycle de facturation. Le Lot 0 en fenêtre annoncée, puisqu'il déconnecte tout le monde.

---

## 6. À décider avant d'écrire une ligne

Douze questions fermées. Tant que 1, 2, 3, 4 et 10 n'ont pas de réponse, le chantier ne démarre pas.

1. Existe-t-il une préproduction ERP aujourd'hui ? Oui / Non. Si non, on la construit d'abord.
2. Une fenêtre de maintenance déconnectant tous les opérateurs (rotation d'`AUTH_SECRET`) est-elle acceptée, et à quelle date ? Oui, le … / Non.
3. Le mode sombre est-il une fonctionnalité attendue ? Oui, on paie une refonte par tokens sur 110 fichiers / Non, on retire `<ThemeSwitch />` de `components/layouts/header.tsx:91` cette semaine. Aujourd'hui 92 pour cent des surfaces claires n'ont pas de variante `dark:`, et l'opérateur qui clique par curiosité obtient du texte blanc sur blanc, menu latéral compris.
4. Le suffixe de devise retenu : `FCFA` / `F CFA`. Un seul, pour les 83 fichiers appelants et les 351 écritures manuelles.
5. Les 4 routes proxy doivent-elles rester accessibles à un appelant extérieur à l'ERP (un tableur, un autre outil) ? Non, on les ferme à la session / Oui, et il faut alors une clé.
6. Les routes `/tikets-terminers` et `/ticktes-terminers` peuvent-elles être supprimées ? Oui / Non, un opérateur a un signet dessus. (Vérifié : plus aucun lien entrant vivant.)
7. Les 14 routes aujourd'hui sans règle CASL, dont `/finance`, `/finance/depense`, `/finance/entrees-caisse`, `/analystics/pay-slip`, doivent-elles rester ouvertes à tout compte connecté ? Oui / Non, et fournir la règle par route.
8. La clé API d'intégration partenaire doit-elle rester visible sur la fiche restaurant, et pour quel rôle exactement ?
9. Accepte-t-on de geler l'ajout de fonctionnalités pendant le Lot 5 (Next 15 plus React 19) ? Oui / Non. Si non, le lot ne se fait pas : il ne se découpe pas.
10. HeroUI v3 : accepte-t-on d'attendre la version stable et l'outil de migration officiel ? Oui, on suit ce plan / Non, et il faut alors budgéter une refonte complète de 399 fichiers sur bêta, préproduction obligatoire.
11. Qui recette ? Un opérateur nommé, disponible sur les 12 écrans canaris à chaque lot. Sans nom, pas de recette, donc pas de déploiement.
12. Le RBAC backend sera-t-il réactivé, et quand ? Tant qu'il est désactivé et que l'identité voyage en `X-User-Id` sans jeton, le Lot S2 protège l'affichage mais pas l'API : environ 244 appels sur 276 partent sans `Authorization` (`lib/api-client-http.tsx:211-213` prive explicitement le service `backend` de jeton, et 129 appels sans service n'en construisent aucun).

---

## 7. Ce qui ne vaut pas le coup

Dit franchement, pour que le budget aille ailleurs.

**HeroUI v3 maintenant.** Développé au point 1.

**Tailwind 4 si la réponse à la question 10 est « on attend ».** Il n'existe aucune autre raison de le faire. 1 500 dérives visuelles silencieuses pour zéro bénéfice utilisateur.

**Les 501 imports profonds de `features/`.** Zéro valeur pour l'opérateur, et la règle est mécaniquement inapplicable pour 21 features sur 44 qui n'ont pas de barrel : l'import profond y est la seule voie. Créer les 21 barrels manquants (une passe de génération), poser une règle ESLint `no-restricted-imports` en avertissement, geler le compteur, et n'exiger le barrel que sur le code neuf. Ne pas corriger les 501 à la main.

**L'extraction en masse des 91 `<TableColumn>` déclarés en ligne.** À faire au fil des interventions, en commençant par les fichiers de plus de 400 lignes où la colonne et la logique métier sont mélangées. Un lot dédié coûterait très cher et ne se verrait nulle part.

**Le découpage des gros fichiers au motif de la taille.** 11 fichiers au-dessus de 500 lignes, aucun au-dessus de 1 000, et les deux plus gros sont morts ou legacy. Traiter uniquement `components/finance/hub/finance-hub-view.tsx` (751 lignes, 9 imports profonds, un `<table>` nu ligne 556), parce qu'il cumule les trois défauts.

**Rétablir la couche `queries -> actions -> apiClientHttp` sur les 42 fichiers qui court-circuitent.** Coût élevé, bénéfice non mesurable. Entériner le raccourci dans CLAUDE.md et réserver `actions/` aux cas qui l'exigent.

**Une refonte du mode sombre à 1 153 classes à la main.** Soit il tombe comme sous-produit du passage aux tokens du Lot 2, soit on retire le bouton. Pas de troisième voie.

**La normalisation des 44 features sur les 8 couches documentées.** Quatre features sur 44 les ont. Reconnaître dans CLAUDE.md le noyau réellement tenu (`types` plus `apis` plus `queries`, plus `columns/` qui existe déjà dans 4 features), et traiter séparément les trois dégénérescences (`features/espace-partenaire/` à supprimer, `features/finances-hub/` et `features/pointages-validation/` à normaliser). Le reste est de la cosmétique de dossier.

---

## Ordonnancement recommandé

| Rang | Lot | Valeur sur risque | Déployable seul |
|---|---|---|---|
| 1 | Lot 0, sécurité P0 | maximale | oui, fenêtre requise |
| 2 | Lot 1, purge | très forte | oui, en 3 sous-lots |
| 3 | Lot 0bis, sécurité P1 | très forte | oui, matrice CASL requise |
| 4 | Lot 2, socle visuel (2a puis 2b, 2c, 2d) | très forte | oui, par vague |
| 5 | Filet visuel automatisé | forte, c'est un investissement | sans objet |
| 6 | Lot 4, TanStack v5 | forte | oui |
| 7 | Lot 3, couche wrapper | forte, différée | oui |
| 8 | Lot S2, garde serveur CASL | forte, coûteuse | oui |
| 9 | Lot 5, Next 15 plus React 19 | moyenne | oui, fenêtre requise |
| 10 | Lot 6, Tailwind 4 | faible, conditionnelle | non, exige le filet visuel |
| 11 | Lot 7, HeroUI v3 | négative aujourd'hui | sans objet |

Les rangs 1 à 4 ne dépendent d'aucune montée de version et produisent l'essentiel de ce que le commanditaire demande. Les rangs 9 à 11 sont le chantier de migration proprement dit, et ils peuvent attendre que le socle soit propre.