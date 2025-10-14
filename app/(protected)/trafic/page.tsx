import { auth } from "@/auth";
import Content from "./content";
import { getTraficDelivers } from '@/src/actions/trafic.actions';

export default async function Page() {
    const session = await auth();

    const data = await getTraficDelivers();
    return <Content data={data} />;
}
