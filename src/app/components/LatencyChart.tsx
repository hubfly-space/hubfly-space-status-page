"use client";

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    YAxis,
} from "recharts";

interface LatencyChartProps {
    data: { timestamp: number; latency: number; status: string }[];
    color?: string;
}

export default function LatencyChart({ data, color = "#10b981" }: LatencyChartProps) {
    // Format data for Recharts
    const chartData = data.map((d) => ({
        time: d.timestamp,
        latency: d.latency,
        status: d.status,
    }));

    return (
        <div className="h-full w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                    <div className="bg-slate-900/90 border border-slate-700/50 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl text-xs">
                                        <p className="text-slate-200 font-medium">
                                            {item.latency}ms
                                        </p>
                                        <p className="text-slate-500">
                                            {new Date(item.time).toLocaleTimeString()}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="latency"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#gradient-${color})`}
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
