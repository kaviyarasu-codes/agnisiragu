// src/components/StatCard.tsx
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  change?: number;
}

export default function StatCard({ title, value, icon: Icon, color, change }: Props) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <span
            className={`inline-flex items-center mt-2 text-xs font-medium px-2 py-0.5 rounded-full
              ${change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {change >= 0 ? '+' : ''}{change}% today
          </span>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  );
}
