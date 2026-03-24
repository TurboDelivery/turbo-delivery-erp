import Link from 'next/link';
import React from 'react';
import { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FinanceHighlightCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  tone: 'red' | 'orange';
  href?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}

const toneClasses: Record<FinanceHighlightCardProps['tone'], { container: string; iconBox: string; icon: string; value: string }> = {
  red: {
    container: 'bg-red-200/50',
    iconBox: 'bg-red-300/40',
    icon: 'text-red-700',
    value: 'text-red-500',
  },
  orange: {
    container: 'bg-orange-200/50',
    iconBox: 'bg-orange-300/40',
    icon: 'text-orange-700',
    value: 'text-orange-500',
  },
};

export default function FinanceHighlightCard({
  title,
  value,
  icon: Icon,
  tone,
  href,
  ariaLabel,
  children,
}: FinanceHighlightCardProps) {
  const style = toneClasses[tone];

  const content = (
    <>
      <div className="flex gap-2">
        <div className={cn('rounded-xl p-4', style.iconBox)}>
          <Icon className={cn('size-6', style.icon)} />
        </div>
        <div>
          <h4 className="text-muted-foreground text-sm mb-2">{title}</h4>
          <span className={cn('text-lg', style.value)}>{value}</span>
        </div>
      </div>
      {children}
    </>
  );

  const className = cn(
    'flex max-md:flex-col md:items-center justify-between rounded-xl w-full md:max-w-[50%] py-5 px-4 gap-4',
    style.container,
    href && 'transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer'
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel ?? title}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

