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
    const chartData = data.map((d) => ({
        time: d.timestamp,
        latency: d.latency,
        status: d.status,
    }));

    // Use a more muted/functional color if it's the default emerald
    const strokeColor = color === "#10b981" ? "#52525b" : color; // Zinc-600 for normal, else limit alerts

    return (
        <div className="h-full w-full select-none cursor-crosshair">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Tooltip
                        cursor={{ stroke: '#27272a', strokeWidth: 1 }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                    <div className="bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] font-mono shadow-sm">
                                        <span className="text-zinc-300">{item.latency}ms</span>
                                        <span className="text-zinc-500 mx-1">|</span>
                                        <span className="text-zinc-500">
                                            {new Date(item.time).toLocaleTimeString([], { hour12: false })}
                                        </span>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area
                        type="step"
                        dataKey="latency"
                        stroke={color}
                        strokeWidth={1.5}
                        fill={color}
                        fillOpacity={0.1}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
