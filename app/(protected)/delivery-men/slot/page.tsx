import Content from "./content"
import { Metadata } from "next";
import { getAllCreneauBird } from "@/src/creneau-livreur/creneau-livreur.action";

export const metadata: Metadata = {
    title: "LISTE DES BIRD",
    description: "Liste des Bird.",
};

export default async function Page() {
    const response = await getAllCreneauBird();
    return <Content initialData={response} />
}