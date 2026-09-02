'use client';

/**
 * Point de contact UNIQUE avec HeroUI.
 *
 * <p>323 fichiers importaient `@heroui/react` en direct, plus quatre qui passaient par
 * les sous-paquets `@heroui/table` et `@heroui/select`. Une correction appliquee « a la
 * Table » n'atteignait donc PAS les ecrans qui importaient le sous-paquet, et il
 * n'existait aucun endroit ou poser une regle transverse.</p>
 *
 * <h3>Pourquoi des reexportations NOMMEES et non `export *`</h3>
 * <p>La premiere version faisait `export * from '@heroui/react'`. Elle compilait
 * (`tsc` a 0) et le build passait, mais elle CASSAIT LE RENDU en production des qu'un
 * composant SERVEUR importait par ici :</p>
 * <pre>
 *   Cannot read Symbol exports. Only named exports are supported
 *   on a client module imported on the server.
 * </pre>
 * <p>`@heroui/react` est un module CLIENT. Next ne sait pas enumerer les exports d'un
 * module client depuis le serveur : `export *` l'exige, une reexportation NOMMEE non.
 * C'est une erreur de FRONTIERE serveur/client, invisible au compilateur comme au
 * build, et qui ne se manifeste qu'a l'execution.</p>
 *
 * <p>Consequence pratique : un symbole HeroUI non liste ici n'est pas disponible. Pour
 * en ajouter un, l'ecrire dans la liste ci-dessous. Un type va dans le bloc
 * `export type`, jamais dans le bloc des valeurs.</p>
 *
 * <h3>Comment surcharger un composant</h3>
 * <p>Retirer son nom de la liste, puis le declarer ici :</p>
 * <pre>
 *   import { Button as ButtonHeroUI, type ButtonProps } from '@heroui/react';
 *   export function Button(props: ButtonProps) {
 *     return &lt;ButtonHeroUI size="sm" {...props} /&gt;;
 *   }
 * </pre>
 */
export {
    Autocomplete, AutocompleteItem, Avatar, Badge,
    Button, Card, CardBody,
    CardFooter, CardHeader, Checkbox, CheckboxGroup,
    Chip, CircularProgress, DatePicker, DateRangePicker,
    Drawer, DrawerBody, DrawerContent,
    Dropdown, DropdownItem, DropdownMenu, DropdownSection,
    DropdownTrigger, HeroUIProvider, Image, Input,
    Link, Modal, ModalBody, ModalContent,
    ModalFooter, ModalHeader, Pagination, Popover,
    PopoverContent, PopoverTrigger, Radio,
    RadioGroup, Select, SelectItem, Skeleton,
    Snippet, Spinner, Switch, Tab,
    Table, TableBody, TableCell, TableColumn,
    TableHeader, TableRow, Tabs, Textarea,
    Tooltip, cn, getKeyValue, tv,
    useDisclosure,
} from '@heroui/react';

export type {
    ButtonProps, RangeValue,
} from '@heroui/react';

/**
 * `CalendarDate` ne vient PAS de `@heroui/react` — il appartient a
 * `@internationalized/date`. Il figurait dans le bloc des VALEURS ci-dessus, ou il
 * ne resolvait rien : webpack le signalait en « warning », donc le build restait
 * VERT, `tsc` aussi, et la CI aussi. A l'execution, l'export manquant cassait le
 * chargement de ce module — et comme `app/error.tsx` en depend, c'est la frontiere
 * d'erreur GLOBALE qui tombait : n'importe quelle erreur de page devenait un ecran
 * serveur opaque a digest.
 *
 * Il n'est utilise que comme TYPE (`RangeValue<CalendarDate>`), donc `export type`
 * suffit et ne produit plus aucun export a l'execution.
 */
export type { CalendarDate } from '@internationalized/date';

/* ═══════════════════════════════════════════════════════════════════════════
 * MIGRATION HEROUI v3 — composants deja bascules.
 *
 * <p>Coexistence : `@heroui-v3/react` est la v3, installee sous alias pnpm a cote de la
 * v2. On bascule UN composant a la fois, en changeant une seule ligne ici. Les fichiers
 * appelants ne bougent pas : ils importent toujours depuis `@/components/heroui`.</p>
 *
 * <p>Ce n'est PAS un enveloppage de style — la v3 embarque les siens. C'est un pont de
 * NOM, le temps que les deux versions cohabitent. A la fin, ce fichier disparait et les
 * imports pointent directement sur `@heroui/react`.</p>
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `Divider` a ete renomme `Separator` en v3 ; `orientation` et `className` sont
 * inchanges. L'alias evite de toucher les 7 fichiers appelants.
 */
export { Separator as Divider } from '@heroui-v3/react';

/**
 * `Progress` est devenu `ProgressBar`, et surtout COMPOSE : `<Progress label value/>`
 * s'ecrit desormais en arbre (`ProgressBar.Track` + `ProgressBar.Fill`, `Label` a part).
 * Aucun alias ne pouvait rattraper cela — les 8 fichiers appelants ont ete reecrits.
 * `color="primary"` devient `color="accent"` ; `radius`, `isStriped`, `isDisabled` et
 * `disableAnimation` n'existent plus.
 */
export { ProgressBar, Label } from '@heroui-v3/react';
