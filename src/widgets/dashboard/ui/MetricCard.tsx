import type { ComponentType } from 'react';
import { Card, CardContent } from '@/shared/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, icon: Icon, subtitle, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-semibold">{value}</h3>
              {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
            </div>
            {trend && (
              <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% from last event
              </p>
            )}
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
