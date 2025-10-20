import Content from "./content"
import { Metadata } from "next";
import { getAllCreneauPerformanceBird } from "@/src/creneau-livreur/creneau-livreur.action";  

export const metadata: Metadata = {
    title: "PROGRESSION DES BIRD",
    description: "LISTE PROGRESSION DES BIRD",
};


export default async function Page() {
    const initialData = await getAllCreneauPerformanceBird()
    return <Content initialData={initialData} />
}