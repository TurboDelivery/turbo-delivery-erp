'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IFacture } from '@/feature-finance/revenus/types/recouvrement/prets.types';
import { IRecouvrement } from '@/feature-finance/revenus/types/recouvrement/recouvrement.types';
import { Building, DollarSign, Download, Eye, Hash, Loader2 } from 'lucide-react';
import { useRecouvrementsRestaurantQuery } from '@/features/recouvrements/queries/restaurants-recouvrement-list.qurey';
import { getFullUrlFile } from '@/utils/getFullUrlFile';

interface PretDetailModalProps {
  facture: IFacture;
}

export function PretDetailModal({ facture }: PretDetailModalProps) {
  // Utiliser restaurantId s'il existe, sinon l'id de la facture
  const restaurantId = facture.restaurantId || facture.id;

  // Récupérer les recouvrements pour ce restaurant
  const { data: recouvrements, isLoading, error } = useRecouvrementsRestaurantQuery(restaurantId);

  // Calculer les totaux
  const totalRecouvre = recouvrements?.reduce((sum: number, recouv: IRecouvrement) => sum + recouv.montant, 0) || 0;
  const totalFacture = facture.totalFraisLivraisons + facture.totalCommission;
  const resteARecouvrer = totalFacture - totalRecouvre;

  const formatMontant = (montant: number) => {
    return montant.toLocaleString('fr-FR');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 cursor-pointer hover:text-blue-800 transition-colors">
          <Eye className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">Voir détails</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-red-500" />
            Détails des recouvrements - <span className="font-bold text-red-500">{facture.nomRestaurant}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Informations sur la facture */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-800">Informations de la facture</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">ID Restaurant</Label>
              <Input value={facture.restaurantId || facture.id || 'Non disponible'} readOnly className="mt-1" />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Nom du restaurant</Label>
              <Input value={facture.nomRestaurant} readOnly className="mt-1" />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Frais de livraison</Label>
              <Input value={`${formatMontant(facture.totalFraisLivraisons)} FCFA`} readOnly className="mt-1" />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Commission</Label>
              <Input value={`${formatMontant(facture.totalCommission)} FCFA`} readOnly className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-sm text-gray-600">Total facture</Label>
              <Input value={`${formatMontant(totalFacture)} FCFA`} readOnly className="mt-1 font-bold text-red-600" />
            </div>
          </div>
        </div>

        {/* Résumé des recouvrements */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-lg mb-3 text-blue-800">Résumé des recouvrements</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalRecouvre)} FCFA</div>
              <div className="text-sm text-gray-600">Total recouvré</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatMontant(resteARecouvrer)} FCFA</div>
              <div className="text-sm text-gray-600">Reste à recouvrer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{recouvrements?.length || 0}</div>
              <div className="text-sm text-gray-600">Nombre de recouvrements</div>
            </div>
          </div>
        </div>

        {/* Liste des recouvrements */}
        <div>
          <h3 className="font-semibold text-lg mb-3 text-gray-800">Liste des recouvrements</h3>

          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-red-500" />
              <span className="ml-2 text-gray-600">Chargement des recouvrements...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              <p>Erreur lors du chargement des recouvrements</p>
            </div>
          )}

          {!isLoading && !error && (!recouvrements || recouvrements.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun recouvrement trouvé pour ce restaurant</p>
            </div>
          )}

          {!isLoading && !error && recouvrements && recouvrements.length > 0 && (
            <div className="space-y-3">
              {(recouvrements as IRecouvrement[])?.map((recouv) => (
                <div key={recouv.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">REF-{recouv.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-gray-500">{new Date(recouv.dateRecouvrement).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-green-600">{formatMontant(recouv.montant)} FCFA</span>
                    </div>

                    {recouv.preuve && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `${getFullUrlFile(recouv.preuve)}`;
                            link.download = recouv.preuve;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Télécharger
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Ouvrir l'image dans un nouvel onglet pour aperçu
                            window.open(`${getFullUrlFile(recouv.preuve)}`, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir preuve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="cursor-pointer">
              Fermer
            </Button>
          </DialogClose>
          <Button type="button" onClick={() => window.print()} variant="destructive" className="cursor-pointer">
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
