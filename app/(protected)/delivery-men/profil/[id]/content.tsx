'use client'

import Image from "next/image";
import { useState } from "react";
import { Edit, Upload } from "lucide-react";
import { LivreurDetail } from "@/types/livreur";
import { Button, Card, Input } from "@heroui/react";
import { createUrlFile } from "@/utils/createUrlFile";
import RetourButton from "@/components/dashboard/retourButton";
import { updateLivreur } from "@/src/livreurInfo/livreur-info.action";

export default function Content({ user }: { user: LivreurDetail }) {
    // 📌 State local pour gérer les champs
    const [formData, setFormData] = useState({
        nom: user.nom || "",
        prenoms: user.prenoms || "",
        birthDay: user.birthDay || "",
        telephone: user.telephone || "",
        habitation: user.habitation || "",
        email: user.email || "",
        numeroCni: user.numeroCni || "",
        immatriculation: user.immatriculation || "",
        type: user.type || "",
        avatar: null as File | null, // 📌 ajout avatar
        cniUrlR: null as File | null, // 📌 ajout avatar
        cniUrlV: null as File | null, // 📌 ajout avatar
    });

    const [avatarPreview, setAvatarPreview] = useState<string>(
        user?.avatarUrl ? createUrlFile(user.avatarUrl, "backend") : "/assets/images/avatar.png"
    );

    const [CniRectoPreview, setCniRectoPreview] = useState<string>(
        user?.cniUrlR ? createUrlFile(user.cniUrlR, "backend") : "/assets/images/logo.png"
    );

    const [CniVersoPreview, setCniVersoPreview] = useState<string>(
        user?.cniUrlV ? createUrlFile(user.cniUrlV, "backend") : "/assets/images/logo.png"
    );

    // 📌 Gestion des changements texte
    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // 📌 Gestion du changement de photo
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, cniUrlR: file }));
            setAvatarPreview(URL.createObjectURL(file)); // aperçu direct
        }
    };

    const handleCniRectoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, cniUrlR: file }));
            setCniRectoPreview(URL.createObjectURL(file)); // aperçu direct
        }
    };

    const handleCniVersoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, cniUrlV: file }));
            setCniVersoPreview(URL.createObjectURL(file)); // aperçu direct
        }
    };

    // 📌 Soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        const data = new FormData();
    
        // Ajouter tous les champs texte
        data.append("nom", formData.nom);
        data.append("prenoms", formData.prenoms);
        data.append("birthDay", formData.birthDay);
        data.append("telephone", formData.telephone);
        data.append("habitation", formData.habitation);
        data.append("email", formData.email);
        data.append("numeroCni", formData.numeroCni);
        data.append("immatriculation", formData.immatriculation);
        data.append("type", formData.type);
    
        // Ajouter les fichiers si présents
        if (formData.avatar) data.append("avatar", formData.avatar);
        if (formData.cniUrlR) data.append("cniRecto", formData.cniUrlR);
        if (formData.cniUrlV) data.append("cniVerso", formData.cniUrlV);
    
        // ⚡ Envoi au serveur
        await updateLivreur(user.id, data); // Ici updateLivreur doit accepter FormData
    };    

    return (
        <Card className="py-6 px-4 lg:px-20 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <RetourButton />
                    <h1 className="text-xl font-bold text-red-500 ml-2">
                        {user.nom} {user.prenoms}
                    </h1>
                </div>
            </div>

            {/* Avatar avec possibilité de changer */}
            <div className="my-4 flex justify-between items-center">
                {/* CNI Recto à gauche */}
                <div className="flex flex-col items-center">
                    <Card className="w-32 h-20 relative overflow-hidden">
                        <Image
                            src={CniRectoPreview}
                            alt="Recto"
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </Card>
                    <label className="mt-3 flex items-center gap-2 px-3 py-1 bg-gray-200 rounded cursor-pointer hover:bg-gray-300">
                        <Upload size={16} /> Changer Recto CNI
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCniRectoChange}
                        />
                    </label>
                </div>

                {/* Photo de profil au centre */}
                <div className="flex flex-col items-center">
                    <Card className="w-32 h-32 relative overflow-hidden rounded-full">
                        <Image
                            src={avatarPreview}
                            alt="Photo de profil"
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </Card>
                    <label className="mt-3 flex items-center gap-2 px-3 py-1 bg-gray-200 rounded cursor-pointer hover:bg-gray-300">
                        <Upload size={16} /> Changer Photo
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </label>
                </div>

                {/* CNI Verso à droite */}
                <div className="flex flex-col items-center">
                    <Card className="w-32 h-20 relative overflow-hidden">
                        <Image
                            src={CniVersoPreview}
                            alt="Verso"
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </Card>
                    <label className="mt-3 flex items-center gap-2 px-3 py-1 bg-gray-200 rounded cursor-pointer hover:bg-gray-300">
                        <Upload size={16} /> Changer Verso CNI
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCniVersoChange}
                        />
                    </label>
                </div>
            </div>


            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 gap-x-16 mb-6">
                    <Input label="Nom" type="text" value={formData.nom} onChange={e => handleChange("nom", e.target.value)} />
                    <Input label="Prénom" type="text" value={formData.prenoms} onChange={e => handleChange("prenoms", e.target.value)} />
                    <Input label="Date de naissance" type="date" value={formData.birthDay} onChange={e => handleChange("birthDay", e.target.value)} />
                    <Input label="Téléphone" type="tel" value={formData.telephone} onChange={e => handleChange("telephone", e.target.value)} />
                    <Input label="Domicile" type="text" value={formData.habitation} onChange={e => handleChange("habitation", e.target.value)} />
                    <Input label="Email" type="email" value={formData.email} onChange={e => handleChange("email", e.target.value)} />

                    <label className="flex flex-col mb-4">
                        <span className="mb-1 font-medium text-gray-700">Type</span>
                        <select
                            value={formData.type}
                            onChange={e => handleChange("type", e.target.value)}
                            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                            <option value="TURBO">TURBO</option>
                            <option value="FREE">FREE</option>
                        </select>
                    </label>
                    <Input label="Immatriculation" type="text" value={formData.immatriculation} onChange={e => handleChange("immatriculation", e.target.value)} />
                    <Input label="Document d'identité" type="text" value="Carte d'identité (CNI)" isReadOnly />
                    <Input label="Numéro de la pièce" type="text" value={formData.numeroCni} onChange={e => handleChange("numeroCni", e.target.value)} />
                </div>



                <div className="mt-4">
                    <Button
                        type="submit"
                        className="w-full py-2 bg-primary text-white font-medium rounded-md hover:bg-primary transition duration-200"
                    >
                        <Edit size={16} className="mr-1" /> Mettre A Jour
                    </Button>
                </div>
            </form>
        </Card>
    );
}
