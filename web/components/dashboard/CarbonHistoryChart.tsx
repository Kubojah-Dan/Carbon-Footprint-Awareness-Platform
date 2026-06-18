import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CarbonHistoryChartProps {
  chartData: Array<{ name: string; Emissions: number }>;
  isDemoData: boolean;
  mounted: boolean;
}

export function CarbonHistoryChart({ chartData, isDemoData, mounted }: CarbonHistoryChartProps) {
  return (
    <Card className="glass-card h-[290px] flex flex-col justify-between">
      <CardHeader className="block pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-ink">Carbon History Trend</CardTitle>
          {isDemoData && (
            <span className="text-[10px] font-mono font-bold bg-[#E8960A]/15 text-[#E8960A] px-2 py-0.5 rounded-full">
              Demo Mode
            </span>
          )}
        </div>
        <p className="text-xs text-ink-soft">
          {isDemoData ? 'Simulating monthly footprint progression.' : 'Your 6-month historical carbon emissions trend.'}
        </p>
      </CardHeader>
      <CardContent className="flex-1 w-full pt-2">
        {mounted ? (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4DB87A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4DB87A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#5A7060' }} stroke="#D1E8D9" />
                <YAxis tick={{ fontSize: 9, fill: '#5A7060' }} stroke="#D1E8D9" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #D1E8D9',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#0F1C14'
                  }} 
                />
                <Area type="monotone" dataKey="Emissions" stroke="#2D7A4F" strokeWidth={2} fillOpacity={1} fill="url(#dashboardTrendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-44 w-full bg-tint/10 animate-pulse rounded-xl" />
        )}
      </CardContent>
    </Card>
  );
}
