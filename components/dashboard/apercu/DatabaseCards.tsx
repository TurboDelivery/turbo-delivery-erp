import { title } from '@/components/primitives';
import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { TurboysButton } from '@/components/dashboard/apercu/TurboysButton';

export default function DatabaseCards({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {items.map((item, index) => (
        <Card key={index}>
          <CardHeader>
            <h3 className={title({ size: 'h6', class: 'text-primary' })}>{item.label}</h3>
          </CardHeader>
          <CardBody>
            <div className="flex justify-between gap-1 items-center">
              <p className={title({ size: 'h4' })}>{item.value}</p>
              {item.label === 'Turboys' && (
                <div className="flex flex-col gap-2">
                  <TurboysButton name={'Indépendants'} param={'INDEPENDANT'} />
                  <Divider />
                  <TurboysButton name={'Journaliers'} param={'JOURNALIER'} />
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
