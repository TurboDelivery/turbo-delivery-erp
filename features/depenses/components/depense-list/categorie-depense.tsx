import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreerCategorieModal } from './creer-categorie';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { CategorieDetailModal } from '@/features/depenses/components/depense-list/detail/categorie-detail';
import { ModifierCategorieModal } from '@/features/depenses/components/modifier/modifier-categorie-modal';
import SupprimerCategorieModal from '@/features/depenses/components/supprimer/supprimer-categorie-modal';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';

export function CategorieDepenseList() {
  const { categories: categorie_depenses } = useCategorieDepense();

  // Couleur des résultats
  const getCategoriesStyle = (nomCategorie: string) => {
    const colors = ['bg-red-500 text-white', 'bg-green-500 text-white', 'bg-blue-500 text-white', 'bg-yellow-500 text-white', 'bg-pink-500 text-white', 'bg-purple-500 text-white'];
    // Générer une couleur cohérente basée sur le nom de la catégorie
    const hash = nomCategorie.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomIndex = hash % colors.length;
    return colors[randomIndex];
  };

  // fonction pour formater la createdAt
  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch (error) {
      console.warn('Erreur de formatage de date:', error);
      return dateString;
    }
  };

  return (
    <div className="w-full px-4 py-6">
      <Card className="">
        <CardHeader className="">
          <CardTitle>
            <div className="flex justify-between items-center">
              <span className="text-lg font-normal">Liste des catégories de dépenses</span>
              <CreerCategorieModal />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tableau — desktop uniquement (≥ md) */}
          <Table className="hidden md:table">
            <TableHeader className="">
              <TableRow className="bg-red-500 hover:bg-red-600">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Nom </TableHead>
                <TableHead className="font-semibold">Montant total</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorie_depenses.map((categorie_depense) => (
                <TableRow key={categorie_depense.id} className="transition-colors">
                  <TableCell className="font-medium border-b-2">{formatDate(categorie_depense.createdAt)}</TableCell>
                  <TableCell className="border-b-2">
                    <span className={`font-semibold rounded-full px-2 py-1 ${getCategoriesStyle(categorie_depense.nomCategorie)}`}>{categorie_depense.nomCategorie}</span>
                  </TableCell>
                  <TableCell className="border-b-2">{Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(categorie_depense.totalDepense)}</TableCell>
                  <TableCell className="border-b-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary">
                          <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <CategorieDetailModal categorie={categorie_depense} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <ModifierCategorieModal categorieDepense={categorie_depense} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <SupprimerCategorieModal categorieDepense={categorie_depense} />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Mobile — cartes tactiles (remplace le tableau < md) */}
          <div className="md:hidden space-y-3 p-4">
            {categorie_depenses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Aucune catégorie</p>
            ) : (
              categorie_depenses.map((categorie_depense) => (
                <div key={categorie_depense.id} className="bg-white dark:bg-transparent border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`font-semibold rounded-full px-2 py-1 text-sm ${getCategoriesStyle(categorie_depense.nomCategorie)}`}>{categorie_depense.nomCategorie}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary" className="shrink-0">
                          <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <CategorieDetailModal categorie={categorie_depense} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <ModifierCategorieModal categorieDepense={categorie_depense} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <SupprimerCategorieModal categorieDepense={categorie_depense} />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">Date</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(categorie_depense.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400">Montant total</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(categorie_depense.totalDepense)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

