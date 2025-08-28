import Content from "./content"
import { Metadata } from "next";
import { getAllCreneauPerformanceTurbo } from "@/src/creneau-livreur/creneau-livreur.action";

export const metadata: Metadata = {
    title: "Progression des Turboys assignes ",
    description: "Liste des activités des Turboys assignes.",
};

export default async function Page(){
    const initialData = await getAllCreneauPerformanceTurbo()
    return <Content initialData={initialData} />
}