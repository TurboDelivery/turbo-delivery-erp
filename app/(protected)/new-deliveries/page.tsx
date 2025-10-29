import Content from './content';
import { getPaginationCourseExterneJournaliere } from '@/src/actions/courses.actions';

export default async function DeliveryPage() {
    const data = await getPaginationCourseExterneJournaliere(0, 10);  
    return ( <Content data={data} /> );
}
