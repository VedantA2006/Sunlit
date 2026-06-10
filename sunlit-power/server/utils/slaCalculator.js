const SLA_LIMITS = {
  Critical: { responseHours: 2, resolutionHours: 24 },
  High: { responseHours: 4, resolutionHours: 48 },
  Medium: { responseHours: 8, resolutionHours: 72 },
  Low: { responseHours: 24, resolutionHours: 120 }
};

const getSlaHours = (priority) => {
  return SLA_LIMITS[priority] || SLA_LIMITS.Medium;
};

const calculateSlaStatus = (createdAt, priority, isResolved, resolvedAt) => {
  const limits = getSlaHours(priority);
  const resolutionLimitMs = limits.resolutionHours * 60 * 60 * 1000;
  const createdTime = new Date(createdAt).getTime();
  const endTime = isResolved && resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  
  const elapsedMs = endTime - createdTime;
  const percentElapsed = (elapsedMs / resolutionLimitMs) * 100;
  
  let status = 'Green';
  if (percentElapsed > 100) {
    status = 'Red';
  } else if (percentElapsed >= 80) {
    status = 'Yellow';
  }
  
  const remainingMs = Math.max(0, resolutionLimitMs - elapsedMs);
  const isBreached = elapsedMs > resolutionLimitMs;

  return {
    limitHours: limits.resolutionHours,
    elapsedMs,
    percentElapsed: Math.round(percentElapsed * 100) / 100,
    remainingMs,
    status, // Green, Yellow, Red
    isBreached
  };
};

module.exports = { getSlaHours, calculateSlaStatus };
