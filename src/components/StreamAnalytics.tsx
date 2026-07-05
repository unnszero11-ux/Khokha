import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StreamAnalyticsProps {
  data: any[];
}

export default function StreamAnalytics({ data }: StreamAnalyticsProps) {
  // Mocking data processing for visualization
  const chartData = useMemo(() => {
    // In a real app, this would process `data` (historical stream records)
    return [
      { name: 'Monday', viewers: 120, watchTime: 45, revenue: 15 },
      { name: 'Tuesday', viewers: 200, watchTime: 60, revenue: 30 },
      { name: 'Wednesday', viewers: 180, watchTime: 50, revenue: 20 },
      { name: 'Thursday', viewers: 250, watchTime: 75, revenue: 50 },
      { name: 'Friday', viewers: 300, watchTime: 80, revenue: 80 },
    ];
  }, [data]);

  return (
    <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl">
      <h2 className="text-xl font-black text-white mb-6">Historical Stream Performance</h2>
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis dataKey="name" stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
            <Legend />
            <Line type="monotone" dataKey="viewers" stroke="#8b5cf6" name="Total Viewers" strokeWidth={2} />
            <Line type="monotone" dataKey="watchTime" stroke="#22c55e" name="Avg Watch Time" strokeWidth={2} />
            <Line type="monotone" dataKey="revenue" stroke="#eab308" name="Gift Revenue" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
