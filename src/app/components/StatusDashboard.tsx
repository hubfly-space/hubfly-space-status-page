"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Globe,
    Clock,
    Search,
    Filter,
    Zap,
} from "lucide-react";
import clsx from "clsx";
import LatencyChart from "./LatencyChart";
import { StatusResponse } from "@/lib/types";

export default function StatusDashboard({ data }: { data: StatusResponse }) {
    const [filter, setFilter] = useState<"all" | "operational" | "issues">("all");
    const [search, setSearch] = useState("");

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
        return data.regions.map(region => ({
            ...region,
            services: region.services.filter(service => {
                const matchesFilter =
                    filter === "all" ? true :
                        filter === "operational" ? service.status === "operational" :
                            service.status !== "operational";

                const matchesSearch = service.name.toLowerCase().includes(search.toLowerCase());

                return matchesFilter && matchesSearch;
            })
        })).filter(region => region.services.length > 0);
    }, [data, filter, search]);

    const getStatusColor = (status: string) => {
        if (status === "operational") return "#10b981"; // emerald-500
        if (status === "degraded") return "#f59e0b";   // amber-500
        return "#ef4444";                              // red-500
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617]" />
                <div className="absolute top-0 left-0 w-full h-[500px] bg-cyan-500/5 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-full h-[500px] bg-indigo-500/5 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03]" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-400 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            Live Systems
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Status</span>
                        </h1>
                        <p className="text-slate-400 max-w-lg text-lg">
                            Real-time performance metrics and operational status across all Hubfly services globally.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                            <div className="text-sm text-slate-400 mb-1">System Health</div>
                            <div className="text-3xl font-bold text-white tabular-nums">{stats.health}%</div>
                        </div>
                        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000 ease-out"
                                style={{ width: `${stats.health}%` }}
                            />
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                            <Clock className="w-3.5 h-3.5" />
                            Last updated {formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}
                        </div>
                    </div>
                </header>

                {/* Global Status Banner */}
                <div className={clsx(
                    "rounded-2xl p-1 border backdrop-blur-xl relative overflow-hidden group",
                    data.status === "operational" ? "border-emerald-500/20 bg-emerald-500/5" :
                        data.status === "degraded" ? "border-amber-500/20 bg-amber-500/5" :
                            "border-red-500/20 bg-red-500/5"
                )}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className={clsx(
                                "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-inset",
                                data.status === "operational" ? "bg-emerald-500/10 ring-emerald-500/20 text-emerald-400" :
                                    data.status === "degraded" ? "bg-amber-500/10 ring-amber-500/20 text-amber-400" :
                                        "bg-red-500/10 ring-red-500/20 text-red-400"
                            )}>
                                {data.status === "operational" ? <CheckCircle2 className="w-8 h-8" /> :
                                    data.status === "degraded" ? <AlertTriangle className="w-8 h-8" /> :
                                        <XCircle className="w-8 h-8" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">
                                    {data.status === "operational" ? "All Systems Operational" :
                                        data.status === "degraded" ? "Degraded Performance Detected" :
                                            "Major Service Outage"}
                                </h2>
                                <p className="text-slate-400">
                                    {data.status === "operational"
                                        ? "All services are running normally with optimal performance."
                                        : "Our engineering team is currently investigating issues."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="sticky top-4 z-20 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 hover:border-slate-600 transition-colors"
                        />
                    </div>
                    <div className="flex p-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg">
                        {(["all", "operational", "issues"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={clsx(
                                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                    filter === t
                                        ? "bg-slate-700 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Regions Grid */}
                <div className="space-y-12">
                    {filteredRegions.map((region) => (
                        <section key={region.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center gap-3 mb-6">
                                <Globe className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-lg font-semibold text-white tracking-wide uppercase text-opacity-90">
                                    {region.name}
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {region.services.map((service) => (
                                    <div
                                        key={service.id}
                                        className="group bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 hover:border-slate-700/80 transition-all hover:bg-slate-800/40 relative overflow-hidden"
                                    >
                                        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx(
                                                        "w-2 h-2 rounded-full ring-2 ring-offset-2 ring-offset-slate-900",
                                                        service.status === "operational" ? "bg-emerald-500 ring-emerald-500/30" :
                                                            service.status === "degraded" ? "bg-amber-500 ring-amber-500/30" :
                                                                "bg-red-500 ring-red-500/30"
                                                    )} />
                                                    <h4 className="font-medium text-slate-100 group-hover:text-white transition-colors">
                                                        {service.name}
                                                    </h4>
                                                </div>

                                                <div className={clsx(
                                                    "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border",
                                                    service.status === "operational"
                                                        ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                                                        : service.status === "degraded"
                                                            ? "bg-amber-500/5 text-amber-400 border-amber-500/10"
                                                            : "bg-red-500/5 text-red-400 border-red-500/10"
                                                )}>
                                                    {service.status}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="h-24 w-full -mx-2">
                                                    <LatencyChart
                                                        data={service.history}
                                                        color={getStatusColor(service.status)}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                                                    <div className="text-slate-500 flex items-center gap-1.5">
                                                        <Zap className="w-3 h-3" />
                                                        Latency
                                                    </div>
                                                    <div className={clsx(
                                                        "font-mono font-medium",
                                                        service.latency > 500 ? "text-amber-400" : "text-emerald-400"
                                                    )}>
                                                        {service.latency}ms
                                                    </div>
                                                </div>
                                            </div>

                                            {service.error && service.status !== "operational" && (
                                                <div className="mt-2 text-xs bg-red-500/5 border border-red-500/10 text-red-200 p-3 rounded-lg flex gap-2">
                                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                                    {service.error}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}

                    {filteredRegions.length === 0 && (
                        <div className="text-center py-24 text-slate-500">
                            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No services match your filters.</p>
                            <button
                                onClick={() => { setFilter("all"); setSearch(""); }}
                                className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
