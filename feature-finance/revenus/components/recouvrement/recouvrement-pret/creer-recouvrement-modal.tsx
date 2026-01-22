'use client'

import { CalendarInput } from "@/components/components-finance/block/dateInput"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useState } from "react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecouvrementCreateDTO, recouvrementFormSchema } from "@/feature-finance/revenus/schemas/recouvrement/recouvrement.schema"
import { useAjouterRecouvrementMutation } from "@/feature-finance/revenus/queries/recouvrement/recouvrement.mutation"
import { usePretListQuery } from "@/feature-finance/revenus/queries/prets/pret-list.query"
import { IFacture } from "@/feature-finance/revenus/types/recouvrement/prets.types"

export function CreerRecouvrementModal() {

    const [selectedDate, setSelectedDate] = useState<Date>()
    const [open, setOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [selectedFacture, setSelectedFacture] = useState<IFacture | null>(null)

    // 🧠 factures est maintenant strictement typé
    const { data: factures = [] } = usePretListQuery({})

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
        control,
        watch,
    } = useForm<RecouvrementCreateDTO>({
        resolver: zodResolver(recouvrementFormSchema),
        defaultValues: {
            montant: 0,
            dateRecouvrement: '',
            restaurantId: '',
            preuve: undefined
        },
    })

    const watchedRestaurantId = watch('restaurantId')

    const { mutateAsync: recouvrementCreateMutation, isPending: isLoading } =
        useAjouterRecouvrementMutation()

    const onSubmitForm = async (data: RecouvrementCreateDTO) => {
        try {

            if (!selectedFile) {
                toast.error("Veuillez sélectionner un fichier de preuve")
                return
            }

            const facture = factures.find((f: IFacture) => f.id === data.restaurantId)

            if (!facture) {
                toast.error("Facture sélectionnée introuvable")
                return
            }

            await recouvrementCreateMutation({
                ...data,
                preuve: selectedFile,
                factureDetails: facture,
            })

            reset()
            setSelectedDate(undefined)
            setSelectedFile(null)
            setSelectedFacture(null)
            setOpen(false)

            toast.success("Recouvrement créé avec succès")

        } catch (error) {
            console.error(error)
            toast.error("Erreur lors de la création du recouvrement")
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setValue('preuve', file)
        }
    }

    const handleDateChange = (date?: Date) => {
        setSelectedDate(date)
        if (date) {
            setValue('dateRecouvrement', date.toISOString().split('T')[0])
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white flex gap-2">
                    <Plus size={18} />
                    Effectuer un recouvrement
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[600px]">

                <DialogHeader>
                    <DialogTitle>Ajouter un recouvrement</DialogTitle>
                    <DialogDescription>Ajoutez un nouveau recouvrement</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">

                    {/* Sélection facture */}
                    <div>
                        <Label>Restaurant *</Label>
                        <Controller
                            name="restaurantId"
                            control={control}
                            render={() => (
                                <Select
                                    value={watchedRestaurantId}
                                    onValueChange={(value) => {
                                        setValue('restaurantId', value, { shouldValidate: true })
                                        const facture = factures.find((f: IFacture) => f.id === value)
                                        setSelectedFacture(facture || null)
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez un prêt" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {factures.map((facture: IFacture) => (
                                            <SelectItem key={facture.id} value={facture.id}>
                                                {facture.nomRestaurant} — {facture.totalFraisLivraisons + facture.totalCommission} FCFA
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.restaurantId && <p className="text-red-500 text-sm">{errors.restaurantId.message}</p>}
                    </div>

                    {/* Montant */}
                    <div>
                        <Label>Montant *</Label>
                        <Input type="number" {...register('montant', { valueAsNumber: true })} />
                    </div>

                    {/* Date */}
                    <div>
                        <Label>Date *</Label>
                        <CalendarInput value={selectedDate} onChange={handleDateChange} />
                    </div>

                    {/* Fichier */}
                    <div>
                        <Label>Preuve *</Label>
                        <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Annuler</Button>
                        </DialogClose>

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Création...' : 'Ajouter'}
                        </Button>
                    </DialogFooter>

                </form>
            </DialogContent>
        </Dialog>
    )
}
