'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import ReactPDF from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { Button } from '@heroui-v3/react';
import { toast } from 'sonner';
import { livreurTicketsListQueryOption } from '@/features/tickets/queries/livreur-ticket-list.query';
import { livreurStatsQueryOption } from '@/features/tickets/queries/livreur-stats.query';
import { genererReleveDePaie } from '@/features/tickets/utils/tickets-livreur-export.utils';
import { RelevePaiePdf } from '@/components/tickets/export/releve-paie-pdf';

interface Props {
  turboyId: string;
  turboyNom: string;
  creneauDebut: Date;
  creneauFin: Date;
}

export default function FichePaieButton({ turboyId, turboyNom, creneauDebut, creneauFin }: Props) {
  const [loading, setLoading] = useState(false);

  const ticketsQuery = useQuery({
    ...livreurTicketsListQueryOption({
      idLivreur: turboyId,
      creneauDebut,
      creneauFin,
      livreurPage: 0,
      livreurPageSize: 1000,
    }),
    enabled: false,
  });

  const statsQuery = useQuery({
    ...livreurStatsQueryOption({
      livreurId: turboyId,
      debut: creneauDebut,
      fin: creneauFin,
    }),
    enabled: false,
  });

  /*
   * L'echec etait MUET. Deux lectures reseau, une generation de PDF, et pas un seul
   * `catch` : une panne remontait en rejet de promesse non traite, hors de l'ecran.
   * Le `return` sur donnees absentes etait pire encore — le bouton s'eteignait comme
   * si tout s'etait bien passe, et l'operateur cliquait a nouveau, indefiniment.
   */
  const handleClick = async () => {
    setLoading(true);
    const suivi = toast.loading(`Génération de la fiche de paie de ${turboyNom}…`);
    try {
      const [ticketsResult, statsResult] = await Promise.all([
        ticketsQuery.refetch(),
        statsQuery.refetch(),
      ]);

      if (ticketsResult.isError || statsResult.isError) {
        toast.error('Lecture impossible : la fiche de paie n’a pas pu être générée.', {
          id: suivi,
          description: 'Vérifiez la connexion, puis réessayez.',
        });
        return;
      }

      const livreurData = ticketsResult.data?.content[0];
      if (!livreurData) {
        // Aucun ticket sur le creneau n'est un RESULTAT, pas une panne : on le dit
        // comme tel, au lieu de laisser croire que le bouton ne repond pas.
        toast.warning(`Aucun ticket pour ${turboyNom} sur ce créneau.`, {
          id: suivi,
          description: 'Il n’y a rien à mettre sur une fiche de paie.',
        });
        return;
      }

      const primeHebdo = statsResult.data?.primeHebdo ?? false;
      const pourcentageApplicable = primeHebdo ? 0.7 : 0.6;
      const pdfData = genererReleveDePaie(livreurData, pourcentageApplicable, 0);
      const period =
        format(creneauDebut, 'dd/MM/yyyy') + ' - ' + format(creneauFin, 'dd/MM/yyyy');
      const blob = await ReactPDF.pdf(RelevePaiePdf({ data: pdfData, period })).toBlob();
      saveAs(blob, `releve_paie_${turboyNom.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      toast.success(`Fiche de paie de ${turboyNom} téléchargée.`, { id: suivi });
    } catch (erreur) {
      toast.error('La fiche de paie n’a pas pu être générée.', {
        id: suivi,
        description: erreur instanceof Error ? erreur.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    /*
     * Le bleu etait ecrit en dur — bordure, texte, survol et jusqu'au rond de
     * chargement — sans equivalent sombre. Et l'attente etait un rond dessine a la
     * main la ou `isPending` la porte deja.
     */
    <Button isPending={loading} onPress={handleClick} size="sm" variant="outline">
      <FileText aria-hidden="true" className="size-3.5" />
      {loading ? 'Génération…' : 'Fiche de paie'}
    </Button>
  );
}
