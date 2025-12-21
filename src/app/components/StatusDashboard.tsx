"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Clock,
    Search,
    Activity,
    Server
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
        if (status === "operational") return "#22c55e"; // green-500 (more flat)
        if (status === "degraded") return "#eab308";   // yellow-500
        return "#ef4444";                              // red-500
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-400 font-sans selection:bg-white selection:text-black">
            {/* Navbar / Top Bar */}
            <div className="border-b border-zinc-800 bg-[#09090b]">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-white flex items-center justify-center rounded-[1px]">
                            <Activity className="w-3.5 h-3.5 text-black" />
                        </div>
                        <span className="font-bold text-white tracking-tight text-sm uppercase">Hubfly<span className="text-zinc-600 mx-1">/</span>Status</span>
                    </div>
                    <a href="https://hubfly.space" className="text-xs font-medium hover:text-white transition-colors">
                        hubfly.space &rarr;
                    </a>
                </div>
            </div>

            <div className="w-full max-w-5xl mx-auto px-6 py-12 flex flex-col gap-12">
                {/* Header & Stats */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h1 className="text-3xl font-medium text-white tracking-tight mb-2">System Operational Status</h1>
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                            <span className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                Last check: {formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}
                            </span>
                            <span>•</span>
                            <span>Refreshes automatically</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 bg-zinc-900/50 p-4 border border-zinc-800 rounded-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-600">Health</span>
                            <span className="text-2xl font-mono text-white">{stats.health}%</span>
                        </div>
                        <div className="h-8 w-px bg-zinc-800" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-600">Active</span>
                            <span className="text-2xl font-mono text-emerald-500">{stats.active}<span className="text-zinc-700 text-lg">/{stats.total}</span></span>
                        </div>
                    </div>
                </header>

                {/* Global Status Banner - Minimal */}
                <div className={clsx(
                    "w-full p-5 border-l-4 bg-zinc-900/30",
                    data.status === "operational" ? "border-emerald-500 bg-emerald-500/5" :
                        data.status === "degraded" ? "border-yellow-500 bg-yellow-500/5" :
                            "border-red-500 bg-red-500/5"
                )}>
                    <div className="flex items-start gap-4">
                        {data.status === "operational" ? <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> :
                            data.status === "degraded" ? <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0" /> :
                                <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
                        <div>
                            <h3 className={clsx("font-medium text-white mb-1",
                                data.status === "operational" ? "text-emerald-400" :
                                    data.status === "degraded" ? "text-yellow-400" : "text-red-400"
                            )}>
                                {data.status === "operational" ? "All Systems Operational" :
                                    data.status === "degraded" ? "Degraded Performance Detected" :
                                        "Major Service Outage"}
                            </h3>
                            <p className="text-sm opacity-80 leading-relaxed max-w-2xl">
                                {data.status === "operational"
                                    ? "All services are running normally. No incidents reported in the last 24 hours."
                                    : "We are currently experiencing issues with some of our services. Our team is investigating."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-4 border-b border-zinc-800 pb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Find service..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#09090b] border border-zinc-800 rounded-sm pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(["all", "operational", "issues"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={clsx(
                                    "px-4 py-2 text-xs font-medium uppercase tracking-wide border transition-all rounded-sm",
                                    filter === t
                                        ? "bg-white text-black border-white"
                                        : "text-zinc-500 border-transparent hover:border-zinc-800 hover:text-white"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Regions & Services */}
                <div className="space-y-16">
                    {filteredRegions.map((region) => (
                        <section key={region.id}>
                            <div className="flex items-baseline gap-3 mb-6">
                                <h3 className="text-sm font-bold text-white tracking-widest uppercase">
                                    {region.name}
                                </h3>
                                <div className="h-px flex-1 bg-zinc-900" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800 border border-zinc-800">
                                {region.services.map((service) => (
                                    <div
                                        key={service.id}
                                        className="bg-[#09090b] p-6 hover:bg-zinc-900/30 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-2">
                                                <Server className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                                                <span className="font-medium text-zinc-200 text-sm">{service.name}</span>
                                            </div>
                                            <div className={clsx(
                                                "w-2 h-2 rounded-full",
                                                service.status === "operational" ? "bg-emerald-500" :
                                                    service.status === "degraded" ? "bg-yellow-500" :
                                                        "bg-red-500"
                                            )} />
                                        </div>

                                        <div className="h-16 mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <LatencyChart
                                                data={service.history}
                                                color={getStatusColor(service.status)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                                            <span className={clsx("text-[10px] font-bold uppercase tracking-wider",
                                                service.status === "operational" ? "text-zinc-500" :
                                                    service.status === "degraded" ? "text-yellow-600" : "text-red-600"
                                            )}>
                                                {service.status}
                                            </span>
                                            <span className="text-[10px] font-mono text-zinc-600">
                                                {service.latency}ms
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}

                    {filteredRegions.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-zinc-800 rounded-sm">
                            <p className="text-zinc-600 text-sm">No services found matching filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
