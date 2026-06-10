import React from 'react';

export const SlaBadge = ({ createdAt, priority, status, resolvedAt, slaBreached }) => {
  const getSlaInfo = () => {
    // Limits in hours
    const priorityLimits = {
      'Critical': 24,
      'High': 48,
      'Medium': 72,
      'Low': 120
    };

    const limitHours = priorityLimits[priority] || 72;
    const start = new Date(createdAt);
    const end = resolvedAt ? new Date(resolvedAt) : new Date();
    
    const elapsedMs = end.getTime() - start.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const percentage = (elapsedHours / limitHours) * 100;

    const isCompleted = ['Resolved', 'Closed'].includes(status);

    if (isCompleted) {
      if (slaBreached || elapsedHours > limitHours) {
        return {
          label: `Breached (${elapsedHours.toFixed(1)}h / ${limitHours}h)`,
          bg: 'bg-red-100 text-red-800 border-red-200',
          indicator: 'bg-red-500'
        };
      } else {
        return {
          label: `SLA Met (${elapsedHours.toFixed(1)}h)`,
          bg: 'bg-green-100 text-green-800 border-green-200',
          indicator: 'bg-green-500'
        };
      }
    } else {
      // For open tickets
      if (elapsedHours >= limitHours) {
        return {
          label: `Breached (${elapsedHours.toFixed(1)}h / ${limitHours}h)`,
          bg: 'bg-red-100 text-red-800 border-red-200',
          indicator: 'bg-red-500 animate-pulse'
        };
      } else if (elapsedHours >= 0.8 * limitHours) {
        return {
          label: `Warning (${elapsedHours.toFixed(1)}h / ${limitHours}h)`,
          bg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          indicator: 'bg-yellow-500 animate-bounce'
        };
      } else {
        return {
          label: `Normal (${percentage.toFixed(0)}%)`,
          bg: 'bg-green-50 text-green-700 border-green-100',
          indicator: 'bg-green-500'
        };
      }
    }
  };

  const info = getSlaInfo();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${info.indicator}`}></span>
      {info.label}
    </span>
  );
};

export default SlaBadge;
