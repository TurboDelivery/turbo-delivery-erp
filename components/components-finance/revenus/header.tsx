interface RevenusHeaderProps {
  title: string;
}
export default function RevenusHeader({ title }: RevenusHeaderProps) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold capitalize text-primary">{title}</h2>
    </div>
  );
}
