import React from 'react';

interface SeverityBadgeProps {
  severity: number;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const getSeverityStyle = (s: number) => {
    switch (s) {
      case 1:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 2:
        return 'bg-green-100 text-green-800 border-green-200';
      case 3:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 4:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 5:
      default:
        return 'bg-red-100 text-red-800 border-red-200 animate-pulse font-semibold';
    }
  };

  const getSeverityLabel = (s: number) => {
    switch (s) {
      case 1:
        return 'Low Priority';
      case 2:
        return 'Moderate';
      case 3:
        return 'High';
      case 4:
        return 'Severe';
      case 5:
      default:
        return 'Critical / Emergency';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityStyle(severity)}`}>
      {getSeverityLabel(severity)} (Severity {severity}/5)
    </span>
  );
}
