import SearchUrl from './searche-url';
import ButtonRetour from './bouton-retour';
import { title } from '@/components/primitives';

export default function SectionHeaderRetour({text,searchUrl}:{text:string,searchUrl?:"invisible"|undefined}) {
    return (
        <div className='pb-10'>
            <div className="flex items-center ">
                <ButtonRetour/>
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>{text}</h1>
            </div>
            {
                searchUrl && searchUrl !=='invisible'
                ? <div className='relative flex items-center gap-24 mmax-w-36 py-6'>
                    <SearchUrl />
                </div>: ''
            }         
        </div>
    );
}
