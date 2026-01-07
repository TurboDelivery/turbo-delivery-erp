import React from 'react';

const TicketStatsSkeleton = () => {
  return (
    <div className="rounded-xl p-4 sm:p-6 bg-white border border-gray-200">
      <p className="animate-pulse bg-gray-300 h-4 w-1/4 rounded mb-2"></p>
      <p className="animate-pulse bg-gray-300 h-8 w-1/2 rounded"></p>
    </div>
  );
};

export default TicketStatsSkeleton;
