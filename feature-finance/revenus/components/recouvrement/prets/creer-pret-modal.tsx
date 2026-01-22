// "use client"
// import { CalendarInput } from "@/components/block/dateInput"
// import { Button } from "@/components/ui/button"
// import {
//     Dialog,
//     DialogClose,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Plus } from "lucide-react"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"

// import { useState } from "react"
// import { toast } from "sonner"
// import { PretCreateDTO, pretSchema } from "@/feature/revenus/schemas/recouvrement/prets.schema"
// import { useAjouterPretMutation } from "@/feature/revenus/queries/prets/pret.mutation"
// import { StatutPret } from "@/feature/revenus/types/recouvrement/prets.types"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// export function CreerPretModal() {
//     const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
//     const [open, setOpen] = useState(false)

//     const {
//         register,
//         handleSubmit,
//         formState: { errors, isSubmitting },
//         reset,
//         setValue,
//     } = useForm<PretCreateDTO>({
//         resolver: zodResolver(pretSchema),
//         defaultValues: {
//             preteur: '',
//             montant: 0,
//             statut: StatutPret.EN_ATTENTE,
//             deadline: '',
//         },
//     })

//     const ajouterPretMutation = useAjouterPretMutation()

//     const onSubmit = async (data: PretCreateDTO) => {
//         console.log("onSubmit appelé avec les données:", data)
//         try {
//             const formData = {
//                 ...data,
//                 deadline: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
//             }

//             await ajouterPretMutation.mutateAsync(formData)

//             reset()
//             setOpen(false)

//             toast.success("Prêt créé avec succès", {
//                 description: `Le prêt "${formData.preteur}" a été ajouté avec succès`,
//                 duration: 4000,
//             })

//         } catch (error) {
//             console.error("Erreur lors de la création du prêt:", error)
//         }
//     }

//     return (
//         <Dialog open={open} onOpenChange={setOpen}>
//             <DialogTrigger asChild>
//                 <Button
//                     className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 md:gap-2 px-3 py-2 h-9 md:h-10 text-sm md:text-base"
//                     size="sm"
//                 >
//                     <Plus className="w-4 h-4 md:w-5 md:h-5" />
//                     <span className="hidden md:inline">Ajouter</span>
//                     <span className="hidden sm:inline"> un prêt</span>
//                 </Button>
//             </DialogTrigger>
//             <DialogContent className="sm:max-w-[600px] max-w-[95vw] w-full mx-2 sm:mx-auto my-2 sm:my-0 max-h-[90vh] overflow-y-auto">
//                 <DialogHeader className="px-1 sm:px-0">
//                     <DialogTitle className="text-lg sm:text-xl">Ajouter un prêt</DialogTitle>
//                     <DialogDescription className="text-sm sm:text-base">
//                         Ajoutez un nouveau prêt à votre liste
//                     </DialogDescription>
//                 </DialogHeader>

//                 <form onSubmit={handleSubmit(onSubmit)} className="px-1 sm:px-0">
//                     <div className="grid gap-4 sm:gap-6">
//                         {/* Nom du prêt */}
//                         <div className="grid gap-2 sm:gap-3">
//                             <Label htmlFor="preteur" className="text-sm text-gray-500">
//                                 Partenaire
//                             </Label>
//                             <Input
//                                 id="preteur"
//                                 {...register('preteur')}
//                                 placeholder="Nom du prêteur"
//                                 className="w-full"
//                             />
//                             {errors.preteur && (
//                                 <p className="text-red-500 text-xs sm:text-sm">{errors.preteur.message}</p>
//                             )}
//                         </div>

//                         {/* Montant */}
//                         <div className="grid gap-2 sm:gap-3">
//                             <Label htmlFor="montant" className="text-sm text-gray-500">
//                                 Montant
//                             </Label>
//                             <Input
//                                 id="montant"
//                                 {...register('montant', { valueAsNumber: true })}
//                                 placeholder="Montant"
//                                 type="number"
//                                 className="w-full"
//                             />
//                             {errors.montant && (
//                                 <p className="text-red-500 text-xs sm:text-sm">{errors.montant.message}</p>
//                             )}
//                         </div>

//                         {/* Statut */}
//                         <div className="grid gap-2 sm:gap-3">
//                             <Label htmlFor="statut" className="text-sm text-gray-500">
//                                 Statut
//                             </Label>
//                             <Select
//                                 onValueChange={(value: StatutPret) => setValue("statut", value)}
//                                 defaultValue={StatutPret.EN_ATTENTE}
//                             >
//                                 <SelectTrigger className="w-full">
//                                     <SelectValue placeholder="Sélectionnez un statut" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value={StatutPret.EN_ATTENTE}>En attente</SelectItem>
//                                     <SelectItem value={StatutPret.PARTIEL}>Partiellement payé</SelectItem>
//                                     <SelectItem value={StatutPret.PAYEE}>Payé</SelectItem>
//                                 </SelectContent>
//                             </Select>   
//                         </div>

//                         {/* Date du prêt */}
//                         <div className="flex flex-col gap-1 sm:gap-2">
//                             <Label htmlFor="datePret" className="text-sm text-gray-500">
//                                 Date d'échéance *
//                             </Label>
//                             <CalendarInput
//                                 value={selectedDate}
//                                 onChange={(date) => {
//                                     setSelectedDate(date)
//                                     if (date) {
//                                         setValue('deadline', date.toISOString().split('T')[0])
//                                     }
//                                 }}
//                                 placeholder="Sélectionnez une date"
//                             />
//                             {errors.deadline && (
//                                 <p className="text-red-500 text-xs sm:text-sm">{errors.deadline.message}</p>
//                             )}
//                         </div>
//                     </div>

//                     {/* Footer */}
//                     <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
//                         <DialogClose asChild>
//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 className="rounded-full w-full sm:w-auto cursor-pointer order-2 sm:order-1"
//                                 size="sm"
//                             >
//                                 Annuler
//                             </Button>
//                         </DialogClose>
//                         <Button
//                             type="submit"
//                             className="cursor-pointer bg-amber-500 hover:bg-amber-600 w-full sm:w-auto order-1 sm:order-2"
//                             disabled={isSubmitting || ajouterPretMutation.isPending}
//                             size="sm"
//                         >
//                             {isSubmitting || ajouterPretMutation.isPending ? 'Création...' : 'Ajouter'}
//                         </Button>
//                     </DialogFooter>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     )
// }