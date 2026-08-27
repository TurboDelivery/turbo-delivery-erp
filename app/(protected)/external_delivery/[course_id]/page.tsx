import { Metadata } from 'next';
import NotFound from '@/app/not-found';
import Content from './content';
import { getCourseExterne } from '@/src/actions/courses.actions';
import { getLivreursDisponible } from '@/src/actions/delivery-men.actions';

export const metadata: Metadata = {
  title: 'Détail de la course',
};

export default async function CourseExterneDetailPage({ params }: { params: { course_id: string } }) {
  const course = await getCourseExterne(params.course_id);
  if (!course) {
    return <NotFound />;
  }
  const delivers = (await getLivreursDisponible()) ?? [];
  return <Content course={course} delivers={delivers} />;
}
