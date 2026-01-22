
interface RevenusHeaderProps {
    title: string;
}
export default function RevenusHeader({title}: RevenusHeaderProps) {
   
    return (
        <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2 capitalize ">{title}</h2>
        </div>
    )
}