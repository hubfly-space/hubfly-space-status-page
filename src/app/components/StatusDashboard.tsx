"use client";

import { useState, useMemo, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "next-themes";
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Clock,
    Search,
    Activity,
    Server,
    Sun,
    Moon
} from "lucide-react";
import clsx from "clsx";
import LatencyChart from "./LatencyChart";
import { StatusResponse } from "@/lib/types";

type TimeRange = '1h' | '6h' | '24h';

export default function StatusDashboard({ data }: { data: StatusResponse }) {
    const [filter, setFilter] = useState<"all" | "operational" | "issues">("all");
    const [search, setSearch] = useState("");
    const [timeRange, setTimeRange] = useState<TimeRange>('1h');
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const stats = useMemo(() => {
        let totalServices = 0;
        let operational = 0;

        data.regions.forEach(r => {
            r.services.forEach(s => {
                totalServices++;
                if (s.status === "operational") operational++;
            });
        });

        return {
            health: Math.round((operational / totalServices) * 100) || 100,
            total: totalServices,
            active: operational
        };
    }, [data]);

    const filteredRegions = useMemo(() => {
        // Determine cutoff based on timeRange
        const now = Date.now();
        const rangeMs =
            timeRange === '1h' ? 3600000 :
                timeRange === '6h' ? 21600000 :
                    86400000;
        const cutoff = now - rangeMs;

        return data.regions.map(region => ({
            ...region,
            services: region.services.filter(service => {
                const matchesFilter =
                    filter === "all" ? true :
                        filter === "operational" ? service.status === "operational" :
                            service.status !== "operational";

                const matchesSearch = service.name.toLowerCase().includes(search.toLowerCase());

                return matchesFilter && matchesSearch;
            }).map(service => ({
                ...service,
                // Filter history based on timeRange
                history: service.history.filter(h => h.timestamp > cutoff)
            }))
        })).filter(region => region.services.length > 0);
    }, [data, filter, search, timeRange]);

    const getStatusColor = (status: string) => {
        if (status === "operational") return "#22c55e";
        if (status === "degraded") return "#eab308";
        return "#ef4444";
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-600 dark:text-zinc-400 font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
            {/* Navbar / Top Bar */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b]">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-zinc-900 dark:bg-white flex items-center justify-center rounded-[1px] shadow-sm">
                            <Activity className="w-3.5 h-3.5 text-white dark:text-black" />
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-white tracking-tight text-sm uppercase">Hubfly<span className="text-zinc-400 dark:text-zinc-600 mx-1">/</span>Status</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-1.5 rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <a href="https://hubfly.space" className="text-xs font-medium hover:text-zinc-900 dark:hover:text-white transition-colors">
                            hubfly.space &rarr;
                        </a>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">
                {/* Header & Stats */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-2">System Operational Status</h1>
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                            <span className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                Last check: {formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span>Refreshes automatically</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 bg-white dark:bg-zinc-900/50 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm dark:shadow-none">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-600">Health</span>
                            <span className="text-2xl font-mono text-zinc-900 dark:text-white">{stats.health}%</span>
                        </div>
                        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-600">Active</span>
                            <span className="text-2xl font-mono text-emerald-600 dark:text-emerald-500">{stats.active}<span className="text-zinc-400 dark:text-zinc-700 text-lg">/{stats.total}</span></span>
                        </div>
                    </div>
                </header>

                {/* Global Status Banner - Minimal */}
                <div className={clsx(
                    "w-full p-5 border-l-4 shadow-sm",
                    data.status === "operational" ? "border-emerald-500 bg-white dark:bg-emerald-500/5 ring-1 ring-inset ring-zinc-200 dark:ring-0" :
                        data.status === "degraded" ? "border-yellow-500 bg-white dark:bg-yellow-500/5 ring-1 ring-inset ring-zinc-200 dark:ring-0" :
                            "border-red-500 bg-white dark:bg-red-500/5 ring-1 ring-inset ring-zinc-200 dark:ring-0"
                )}>
                    <div className="flex items-start gap-4">
                        {data.status === "operational" ? <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> :
                            data.status === "degraded" ? <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0" /> :
                                <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
                        <div>
                            <h3 className={clsx("font-medium mb-1",
                                data.status === "operational" ? "text-emerald-700 dark:text-emerald-400" :
                                    data.status === "degraded" ? "text-yellow-700 dark:text-yellow-400" : "text-red-700 dark:text-red-400"
                            )}>
                                {data.status === "operational" ? "All Systems Operational" :
                                    data.status === "degraded" ? "Degraded Performance Detected" :
                                        "Major Service Outage"}
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                                {data.status === "operational"
                                    ? "All services are running normally. No incidents reported in the last 24 hours."
                                    : "We are currently experiencing issues with some of our services. Our team is investigating."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col gap-6 md:gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Find service..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-md pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors shadow-sm dark:shadow-none"
                            />
                        </div>

                        {/* Filters Group */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Time Range */}
                            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-md border border-zinc-200 dark:border-zinc-800">
                                {(['1h', '6h', '24h'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeRange(t)}
                                        className={clsx(
                                            "px-3 py-1 text-xs font-medium rounded-[4px] transition-all",
                                            timeRange === t
                                                ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

                            {/* Status Filter */}
                            <div className="flex gap-1">
                                {(["all", "operational", "issues"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setFilter(t)}
                                        className={clsx(
                                            "px-3 py-1.5 text-xs font-medium uppercase tracking-wide border transition-all rounded-md",
                                            filter === t
                                                ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white shadow-sm"
                                                : "text-zinc-500 bg-white dark:bg-transparent border-zinc-200 dark:border-transparent hover:border-zinc-300 dark:hover:border-zinc-800"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Regions & Services */}
                <div className="space-y-12">
                    {filteredRegions.map((region) => (
                        <section key={region.id}>
                            <div className="flex items-baseline gap-3 mb-6">
                                <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">
                                    {region.name}
                                </h3>
                                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-900" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {region.services.map((service) => (
                                    <div
                                        key={service.id}
                                        className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 p-5 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group shadow-sm dark:shadow-none"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-2">
                                                <Server className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" />
                                                <span className="font-medium text-zinc-900 dark:text-zinc-200 text-sm">{service.name}</span>
                                            </div>
                                            <div className={clsx(
                                                "w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#09090b]",
                                                service.status === "operational" ? "bg-emerald-500" :
                                                    service.status === "degraded" ? "bg-yellow-500" :
                                                        "bg-red-500"
                                            )} />
                                        </div>

                                        <div className="h-16 mb-4 opacity-75 group-hover:opacity-100 transition-opacity">
                                            <LatencyChart
                                                data={service.history}
                                                color={getStatusColor(service.status)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-900">
                                            <span className={clsx("text-[10px] font-bold uppercase tracking-wider",
                                                service.status === "operational" ? "text-zinc-500" :
                                                    service.status === "degraded" ? "text-yellow-600" : "text-red-600"
                                            )}>
                                                {service.status}
                                            </span>
                                            <span className="text-[10px] font-mono text-zinc-400">
                                                {service.latency}ms
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}

                    {filteredRegions.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10">
                            <p className="text-zinc-500 text-sm">No services found matching filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
