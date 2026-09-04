import { ColumnDef } from '@tanstack/react-table';
import { IGrillePaiementLigne } from '@/features/validation-tickets/grille-de-paiement/types/grille-paiement.type';

export const approbationFinaleWaveColumns: ColumnDef<IGrillePaiementLigne>[] = [
  {
    accessorKey: 'turboy',
    header: 'Turboy',
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-semibold text-foreground">{row.original.turboy.nom}</p>
        <p className="text-[11px] text-muted mt-0.5">{row.original.turboy.code}</p>
      </div>
    ),
  },
  {
    accessorKey: 'numeroWave',
    header: 'N° Wave',
    cell: ({ row }) =>
      row.original.numeroWave ? (
        /* Chasse proportionnelle : deux numeros Wave de meme longueur ne s'alignaient pas
           d'une ligne a l'autre, et un chiffre en trop passait inapercu au moment de
           verifier le destinataire d'un virement. */
        <span className="text-sm tabular-nums text-muted">{row.original.numeroWave}</span>
      ) : (
        <span className="text-sm text-muted">—</span>
      ),
  },
  {
    accessorKey: 'netAPayer',
    header: 'Net',
    cell: ({ row }) => (
      /* `text-green-600` etait ecrit en dur, sans variante sombre : depuis que la bascule
         de theme est dans l'en-tete, le montant a virer restait vert clair sur fond fonce,
         illisible au moment de verifier une paie. `text-success-soft-foreground` porte le
         meme sens et suit les deux themes. La carte mobile equivalente, dans
         ApprobationFinaleWaveTable, affiche deja ce montant ainsi. */
      <span className="text-sm font-bold tabular-nums text-success-soft-foreground">
        {row.original.netAPayer.toLocaleString('fr-FR')}
      </span>
    ),
  },
];
