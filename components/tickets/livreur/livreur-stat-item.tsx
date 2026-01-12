import React from 'react';

type LivreurStatItemProps = {
  label: string;
  value: string | number;
  valueColor?: string;
  labelColor?: string;
};

function LivreurStatItem({ label, value, valueColor, labelColor = 'text-gray-500' }: LivreurStatItemProps) {
  return (
    <div>
      <p className={`text-xs sm:text-sm ${labelColor} capitalize`}>{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${valueColor} break-words`}>{value}</p>
    </div>
  );
}

export default LivreurStatItem;
