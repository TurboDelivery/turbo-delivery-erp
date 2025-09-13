import Link from 'next/link';
import { usePathname } from 'next/navigation'
import { title } from '@/components/primitives';

export default function SectionHeader() {
    const pathname = usePathname()
    const pushUrl = pathname === '/delivery-men/slot' ? '/delivery-men/creneau-progression' : pathname === '/delivery-men/slot/turboys-assignes' ? '/delivery-men/creneau-progression/turboys-assignes' : ''

    return (
        <div className="flex items-center justify-between w-full py-2 px-3">
            {/* Titre à gauche */}
            <h1 className={title({ size: 'h4', class: 'text-primary' })}>
                CRENEAUX
            </h1>

            {/* Lien à droite avec icône */}
            <Link href={pushUrl} className="flex items-center gap-2 text-primary">
                <span className={title({ size: 'h6', class: 'text-primary' })}>VOIR DETAIL</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </Link>
        </div>
    );
}
