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
    Button, CalendarDate, Card, CardBody,
    CardFooter, CardHeader, Checkbox, CheckboxGroup,
    Chip, CircularProgress, DatePicker, DateRangePicker,
    Divider, Drawer, DrawerBody, DrawerContent,
    Dropdown, DropdownItem, DropdownMenu, DropdownSection,
    DropdownTrigger, HeroUIProvider, Image, Input,
    Link, Modal, ModalBody, ModalContent,
    ModalFooter, ModalHeader, Pagination, Popover,
    PopoverContent, PopoverTrigger, Progress, Radio,
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
