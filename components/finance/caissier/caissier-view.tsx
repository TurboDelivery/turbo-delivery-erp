'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, Table, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { flexRender } from '@tanstack/react-table';
import { Landmark, Clock, CheckCircle2, FileCheck } from 'lucide-react';
import { createCaissierColumns } from './caissier-columns';
import { ChipStatutFacture } from '@/components/finance/common/chip-statut-facture';
import { FactureMobileCard, MobileCardList } from '@/components/finance/shared/facture-mobile-card';
import ConfirmerReceptionModal from './confirmer-reception-modal';
import DepotBanqueCaissierModal from './depot-banque-caissier-modal';
import {
  useCaissierTable,
  useCaissierStatsParStatutQuery,
  useCaissierConfirmationMutation,
  useCaissierDepotBanqueMutation,
} from '@/features/caissier';
import type { IFactureCaissier, IDepotBanqueCaissierBody } from '@/features/caissier';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { formatMontant } from '@/utils/format.utils';


const statutChips = [
  'Tous',
  'Versé au caissier',
  'Rejeté DGA',
  'En attente visa DGA',
  'Visé DGA',
  'Orienté banque',
  'Conservé en caisse',
  'Clôturé',
] as const;
type StatutChip = (typeof statutChips)[number];

export default function CaissierView() {
  const [statut, setStatut] = useState<string>('Versé au caissier');
  const [page, setPage] = useState(0);

  // periode 'cycle' = aucun filtre date côté backend (cf. ICaissierParams).
  // Sans ça, la caisse ne voyait que les factures créées le mois courant et
  // perdait celles versées un mois précédent encore à confirmer/clôturer.
  const params = { periode: 'cycle' as const, statut: statut || undefined, page };
  // L'agregat par statut remplace un chargement de 200 factures qui n'existait QUE
  // pour alimenter les cartes. Chaque requete de cette famille declenche cote serveur
  // un appel HTTP au service utilisateurs (`loadViseurNames`) : on cesse de payer ce
  // prix pour un decompte, et on cesse au passage de le payer pour un chiffre faux.
  /*
   * `isError` n'etait pas lu : sur echec, `agregats` restait indefini, les replis `?? 0`
   * jouaient, et les quatre cartes affirmaient zero — dont « Montant en attente ».
   * Un caissier lit « rien a encaisser » la ou la lecture a simplement echoue.
   */
  const { data: agregats, isError: isErrorAgregats } = useCaissierStatsParStatutQuery({
    periode: 'cycle',
  });

  const [factureAConfirmer, setFactureAConfirmer] = useState<IFactureCaissier | null>(null);
  const [factureDepotBanque, setFactureDepotBanque] = useState<IFactureCaissier | null>(null);

  const columns = useMemo(
    () => createCaissierColumns(
      (facture) => setFactureAConfirmer(facture),
      (facture) => setFactureDepotBanque(facture),
    ),
    [],
  );

  const { table, isLoading, isError, error, totalPages } = useCaissierTable(columns, params);
  const confirmationMutation = useCaissierConfirmationMutation();
  const depotBanqueMutation = useCaissierDepotBanqueMutation();

  const handleStatutChip = (chip: StatutChip) => {
    setStatut(chip === 'Tous' ? '' : chip);
    setPage(0);
  };

  const handleConfirm = (
    facture: IFactureCaissier,
    data: { reference: string },
  ) => {
    confirmationMutation.mutate(
      { id: facture.id, body: { reference: data.reference } },
      {
        onSuccess: () => toast.success('Fiche de paiement enregistrée — facture envoyée en visa DGA'),
        onError: (e) => toast.error('Erreur dépôt banque', { description: e instanceof Error ? e.message : 'Veuillez réessayer.' }),
      },
    );
  };

  const handleDepotBanque = (
    facture: IFactureCaissier,
    data: IDepotBanqueCaissierBody,
  ) => {
    depotBanqueMutation.mutate(
      { id: facture.id, body: data },
      {
        onSuccess: () => toast.success('Dépôt en banque enregistré (bordereau + preuve)'),
        onError: (e) => toast.error('Erreur dépôt en banque', { description: e instanceof Error ? e.message : 'Veuillez réessayer.' }),
      },
    );
  };

  // Agregats — calcules par le SERVEUR sur TOUT le perimetre filtre.
  //
  // Ces trois cartes se calculaient auparavant sur la page de 200 factures deja
  // chargee. Le cycle en compte 856 : elles annoncaient donc au mieux un quart de
  // la realite sur un ecran financier, avec un libelle « (sur les 200 premieres) »
  // qui signalait honnetement l'approximation sans la corriger. Compter juste depuis
  // le client aurait demande une requete par statut, et chaque requete de cette
  // famille declenche cote serveur un appel HTTP au service utilisateurs
  // (`loadViseurNames`) — d'ou l'agregat groupe, obtenu en un seul passage.
  const STATUTS_EN_ATTENTE = ['Versé au caissier', 'Rejeté DGA'];
  const STATUTS_CONFIRMES = ['En attente visa DGA', 'Visé DGA', 'Clôturé'];

  const parStatut = agregats?.parStatut ?? [];
  const sommer = (statuts: string[], champ: 'nombre' | 'montantRecouvre') =>
    parStatut.filter((l) => statuts.includes(l.statut)).reduce((acc, l) => acc + (l[champ] ?? 0), 0);

  const enAttente = sommer(STATUTS_EN_ATTENTE, 'nombre');
  const confirmees = sommer(STATUTS_CONFIRMES, 'nombre');
  // `montantRecouvre` et non `montant` : la carte annonce ce que le caissier DETIENT,
  // c'est-a-dire l'encaisse reellement remise, pas le montant facture au partenaire.
  const montantEnAttente = sommer(STATUTS_EN_ATTENTE, 'montantRecouvre');
  const totalReel = agregats?.nombreTotal ?? 0;

  const statsCards = [
    {
      icon: Clock,
      ton: 'attention' as const,
      label: 'En attente',
      value: String(enAttente),
    },
    {
      icon: Landmark,
      ton: 'primaire' as const,
      label: 'Montant en attente',
      value: formatMontant(montantEnAttente),
    },
    {
      icon: FileCheck,
      ton: 'primaire' as const,
      label: 'Confirmées',
      value: String(confirmees),
    },
    {
      icon: CheckCircle2,
      ton: 'succes' as const,
      label: 'Total factures',
      value: String(totalReel),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted">Comptabilité</p>
        <h1 className="text-2xl font-bold text-primary">Espace Caissier</h1>
      </div>

      {/* Bandeau de statistiques. La carte locale supprimee ici etait une copie
          CARACTERE POUR CARACTERE de celle d'agent-recouvreur-view : deux fichiers
          a corriger le jour ou l'un des deux bougeait. */}
      <GrilleStats colonnes={4}>
        {statsCards.map((card) => (
          <CarteStat
            key={card.label}
            libelle={card.label}
            valeur={card.value}
            icone={card.icon}
            isError={isErrorAgregats}
            ton={card.ton}
          />
        ))}
      </GrilleStats>

      {/*
       * Les puces de filtre etaient des `<button>` ecrits a la main, peints en
       * `bg-indigo-600 text-white` a l'etat actif — de l'indigo, qui n'est ni la couleur
       * de marque ni un jeton du theme. C'est un `ToggleButtonGroup`.
       */}
      <Card>
        <Card.Content>
          <ToggleButtonGroup
            className="flex-wrap"
            onSelectionChange={(sel) => {
              const v = Array.from(sel)[0];
              if (v) handleStatutChip(String(v) as StatutChip);
            }}
            selectedKeys={new Set([statut || 'Tous'])}
            selectionMode="single"
          >
            {statutChips.map((s) => (
              <ToggleButton id={s} key={s}>
                {s}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Card.Content>
      </Card>

      {/* Table — desktop uniquement (≥ md) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Factures caissier" className="min-w-[52rem]">
                <Table.Header>
                  {table.getFlatHeaders().map((header, i) => (
                    <Table.Column id={header.id} isRowHeader={i === 0} key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </Table.Column>
                  ))}
                </Table.Header>

                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : (
                      <p className="py-8 text-center text-sm text-muted">
                        {isError ? String(error) : 'Aucune facture trouvée'}
                      </p>
                    )
                  }
                >
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {table.getFlatHeaders().map((h) => (
                            <Table.Cell key={`sq-${i}-${h.id}`}>
                              <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading ? [] : table.getRowModel().rows).map((row) => (
                    <Table.Row id={row.id} key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <Table.Cell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Table.Footer className="justify-center">
                <PaginationTableau onPage={(pp) => setPage(pp - 1)} page={page + 1} total={totalPages} />
              </Table.Footer>
            )}
          </Table>
        </Card.Content>
      </Card>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <MobileCardList>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-surface-secondary animate-pulse" />
          ))
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">
            {isError ? String(error) : 'Aucune facture trouvée'}
          </p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const f = row.original;
            const isFiche = f.statut === 'Versé au caissier' || f.statut === 'Rejeté DGA';
            const isDepot = f.statut === 'Orienté banque';
            return (
              <FactureMobileCard
                key={f.id}
                numero={f.numero}
                partenaire={f.partenaire}
                montant={formatMontant(f.montant)}
                statut={<ChipStatutFacture statut={f.statut} />}
                fields={[
                  { label: 'Recouvré', value: f.montantRecouvre ? `${formatMontant(f.montantRecouvre)} (${f.pourcentageRecouvre ?? 0}%)` : '—' },
                  { label: 'Cycle', value: f.cycle },
                  { label: 'Agent', value: f.agent },
                ]}
                actions={
                  isFiche ? (
                    <Button
                      className="w-full gap-1.5 text-sm"
                      onPress={() => setFactureAConfirmer(f)}
                      variant={f.statut === 'Rejeté DGA' ? 'danger' : 'primary'}
                    >
                      <Landmark className="w-4 h-4" />
                      {f.statut === 'Rejeté DGA' ? 'Re-soumettre fiche' : 'Enregistrer fiche de paiement'}
                    </Button>
                  ) : isDepot ? (
                    <Button
                      className="w-full gap-1.5 text-sm"
                      onPress={() => setFactureDepotBanque(f)}
                      variant="primary"
                    >
                      <Landmark aria-hidden="true" className="size-4" /> Dépôt en banque
                    </Button>
                  ) : undefined
                }
              />
            );
          })
        )}
        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <PaginationTableau onPage={(pp) => setPage(pp - 1)} page={page + 1} total={totalPages} />
          </div>
        )}
      </MobileCardList>

      {/* Modals */}
      <ConfirmerReceptionModal
        open={!!factureAConfirmer}
        onClose={() => setFactureAConfirmer(null)}
        facture={factureAConfirmer}
        onConfirm={handleConfirm}
      />
      <DepotBanqueCaissierModal
        open={!!factureDepotBanque}
        onClose={() => setFactureDepotBanque(null)}
        facture={factureDepotBanque}
        onConfirm={handleDepotBanque}
      />
    </div>
  );
}
