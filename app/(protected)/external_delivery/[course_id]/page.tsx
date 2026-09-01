import { Metadata } from 'next';
import NotFound from '@/app/not-found';
import Content from './content';
import { getCourseExterne } from '@/src/actions/courses.actions';
import { getLivreursDisponible } from '@/src/actions/delivery-men.actions';

export const metadata: Metadata = {
  title: 'Détail de la course',
};

export default async function CourseExterneDetailPage(props: { params: Promise<{ course_id: string }> }) {
  const params = await props.params;
  const course = await getCourseExterne(params.course_id);
  if (!course) {
    return <NotFound />;
  }
  // `getLivreursDisponible` relance desormais au lieu de rendre null : ce repli
  // ne s'executait plus, l'echec part vers la frontiere d'erreur du segment.
  const delivers = await getLivreursDisponible();
  return <Content course={course} delivers={delivers} />;
}
