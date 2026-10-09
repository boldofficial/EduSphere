import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TrendBadgeProps {
  trend: 'improving' | 'declining' | 'stable' | undefined;
  showText?: boolean;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({ trend, showText = true }) => {
  if (!trend) return null;

  const config = {
    improving: {
      color:
        'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      icon: <TrendingUp className="w-3 h-3 mr-1" />,
      label: 'Improving',
    },
    declining: {
      color:
        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      icon: <TrendingDown className="w-3 h-3 mr-1" />,
      label: 'Declining',
    },
    stable: {
      color:
        'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      icon: <Minus className="w-3 h-3 mr-1" />,
      label: 'Stable',
    },
  };

  const { color, icon, label } = config[trend];

  return (
    <Badge variant="outline" className={`${color} font-medium flex items-center px-1.5 py-0.5`}>
      {icon}
      {showText && label}
    </Badge>
  );
};
