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
import { SystemStatus } from "@/lib/types";

type TimeRange = '1h' | '6h' | '24h';

export default function StatusDashboard({ data }: { data: SystemStatus }) {
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

    const incidents = data.incidents ?? [];
    const openIncidents = incidents.filter((incident) => !incident.resolvedAt);

    const filteredRegions = useMemo(() => {
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
                history: service.history.filter(h => h.timestamp > cutoff)
            }))
        })).filter(region => region.services.length > 0);
    }, [data, filter, search, timeRange]);

    const getStatusColor = (status: string) => {
        if (status === "operational") return "#22c55e";
        if (status === "degraded") return "#f59e0b";
        return "#ef4444";
    };

    const statusHeadline = data.status === "operational"
        ? "All systems operational"
        : data.status === "degraded"
            ? "Degraded performance"
            : "Major outage";

    const statusMessage = data.status === "operational"
        ? "All monitored services are responding within expected thresholds."
        : "We are investigating elevated errors or latency in one or more services.";

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#f5f5f4] dark:bg-[#0d0d0c] text-[#1c1917] dark:text-[#f2f2f2] selection:bg-[#1c1917] selection:text-[#f5f5f4] dark:selection:bg-[#f2f2f2] dark:selection:text-[#0d0d0c] transition-colors duration-300 relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.18),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.35),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.4),transparent_60%)] dark:bg-[linear-gradient(120deg,rgba(15,23,42,0.35),transparent_60%)]" />
            </div>

            <div className="relative z-10">
                <div className="border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0d0d0c]/80 backdrop-blur">
                    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#111827] dark:bg-white flex items-center justify-center shadow-sm">
                                <Activity className="w-4 h-4 text-white dark:text-[#111827]" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-[#6b7280] dark:text-[#9ca3af]">Hubfly</p>
                                <p className="text-sm font-semibold">Status</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-full border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-[#6b7280] dark:text-[#cbd5f5] transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                            <a href="https://hubfly.space" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7280] dark:text-[#cbd5f5] hover:text-[#111827] dark:hover:text-white transition-colors">
                                hubfly.space
                            </a>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">
                    <header className="grid lg:grid-cols-[1.4fr_0.6fr] gap-8 items-start rise-in">
                        <div className="space-y-4">
                            <p className="text-xs uppercase tracking-[0.35em] text-[#6b7280] dark:text-[#9ca3af]">Service health</p>
                            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#111827] dark:text-white">
                                Hubfly System Status
                            </h1>
                            <p className="text-sm md:text-base text-[#4b5563] dark:text-[#cbd5f5] max-w-2xl">
                                Current operational state, recent incident history, and service latency by region.
                            </p>
                            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#6b7280] dark:text-[#9ca3af]">
                                <Clock className="w-4 h-4" />
                                Last check {formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#111110]/80 px-5 py-4 shadow-sm">
                                <p className="text-[11px] uppercase tracking-[0.3em] text-[#6b7280] dark:text-[#9ca3af]">Overall status</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-base font-semibold">{statusHeadline}</span>
                                    <span className={clsx(
                                        "px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] rounded-full border",
                                        data.status === "operational"
                                            ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                            : data.status === "degraded"
                                                ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                                                : "border-rose-500/40 text-rose-600 bg-rose-500/10"
                                    )}>
                                        {data.status}
                                    </span>
                                </div>
                                <p className="text-xs text-[#4b5563] dark:text-[#cbd5f5] mt-2">{statusMessage}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: "Health", value: `${stats.health}%` },
                                    { label: "Active", value: `${stats.active}/${stats.total}` },
                                    { label: "Open", value: `${openIncidents.length}` }
                                ].map((item) => (
                                    <div key={item.label} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#111110]/70 px-4 py-3 shadow-sm">
                                        <p className="text-[11px] uppercase tracking-[0.25em] text-[#6b7280] dark:text-[#9ca3af]">{item.label}</p>
                                        <p className="text-lg font-semibold text-[#111827] dark:text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </header>

                    <div className="flex flex-col gap-5 border-b border-black/10 dark:border-white/10 pb-6">
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                                <input
                                    type="text"
                                    placeholder="Search services"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white/90 dark:bg-[#111110]/80 border border-black/10 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors shadow-sm"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex bg-white/80 dark:bg-[#111110]/70 p-1 rounded-lg border border-black/10 dark:border-white/10 shadow-sm">
                                    {(['1h', '6h', '24h'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTimeRange(t)}
                                            className={clsx(
                                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                                timeRange === t
                                                    ? "bg-[#111827] text-white dark:bg-white dark:text-[#111827]"
                                                    : "text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    {(["all", "operational", "issues"] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setFilter(t)}
                                            className={clsx(
                                                "px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] border rounded-lg transition-all",
                                                filter === t
                                                    ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827] border-transparent"
                                                    : "text-[#6b7280] dark:text-[#9ca3af] bg-white/80 dark:bg-[#111110]/70 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-[#6b7280] dark:text-[#9ca3af]">Incidents</p>
                                <h2 className="text-lg font-semibold">Recent activity</h2>
                            </div>
                            <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">{openIncidents.length} open</span>
                        </div>

                        {incidents.length === 0 && (
                            <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#111110]/50 px-6 py-10 text-center text-sm text-[#6b7280] dark:text-[#9ca3af]">
                                No incidents recorded recently.
                            </div>
                        )}

                        {incidents.length > 0 && (
                            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#111110]/80 overflow-hidden">
                                <div className="grid grid-cols-[1.2fr_1fr_1fr_0.7fr] gap-3 px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-[#6b7280] dark:text-[#9ca3af] border-b border-black/10 dark:border-white/10">
                                    <span>Service</span>
                                    <span>Region</span>
                                    <span>Timeline</span>
                                    <span>Status</span>
                                </div>
                                {incidents.map((incident) => {
                                    const isOpen = !incident.resolvedAt;
                                    const started = new Date(incident.startedAt);
                                    const resolved = incident.resolvedAt ? new Date(incident.resolvedAt) : null;
                                    const duration = formatDistanceToNow(started, { addSuffix: false });
                                    const resolutionLabel = resolved
                                        ? `Resolved ${formatDistanceToNow(resolved, { addSuffix: true })}`
                                        : `Ongoing for ${duration}`;

                                    return (
                                        <div
                                            key={incident.id}
                                            className="grid grid-cols-[1.2fr_1fr_1fr_0.7fr] gap-3 px-5 py-4 text-sm border-b border-black/5 dark:border-white/10 last:border-b-0"
                                        >
                                            <div>
                                                <p className="font-semibold">{incident.serviceName}</p>
                                                {incident.lastError && (
                                                    <p className="text-xs text-[#b45309] dark:text-[#f59e0b] mt-1">{incident.lastError}</p>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#4b5563] dark:text-[#cbd5f5]">{incident.regionName}</p>
                                            <div className="text-xs text-[#4b5563] dark:text-[#cbd5f5] space-y-1">
                                                <p>Started {formatDistanceToNow(started, { addSuffix: true })}</p>
                                                <p>{resolutionLabel}</p>
                                            </div>
                                            <span className={clsx(
                                                "px-2 py-1 text-[10px] uppercase tracking-[0.2em] rounded-full border self-start",
                                                isOpen
                                                    ? "border-rose-500/40 text-rose-600 bg-rose-500/10"
                                                    : "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                            )}>
                                                {isOpen ? "Open" : "Resolved"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <div className="space-y-10">
                        {filteredRegions.map((region) => (
                            <section key={region.id}>
                                <div className="flex items-center gap-3 mb-4">
                                    <h3 className="text-xs font-semibold text-[#6b7280] dark:text-[#9ca3af] uppercase tracking-[0.3em]">
                                        {region.name}
                                    </h3>
                                    <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {region.services.map((service) => (
                                        <div
                                            key={service.id}
                                            className="bg-white/95 dark:bg-[#111110]/85 border border-black/10 dark:border-white/10 p-5 rounded-xl hover:border-black/20 dark:hover:border-white/20 transition-colors shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Server className="w-4 h-4 text-[#9ca3af]" />
                                                    <span className="font-semibold text-sm">{service.name}</span>
                                                </div>
                                                <span className={clsx(
                                                    "px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] rounded-full border",
                                                    service.status === "operational"
                                                        ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                                        : service.status === "degraded"
                                                            ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                                                            : "border-rose-500/40 text-rose-600 bg-rose-500/10"
                                                )}>
                                                    {service.status}
                                                </span>
                                            </div>

                                            <div className="h-16 mb-4 opacity-80">
                                                <LatencyChart
                                                    data={service.history}
                                                    color={getStatusColor(service.status)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/10 text-xs text-[#6b7280] dark:text-[#9ca3af]">
                                                <span>Latency</span>
                                                <span className="font-mono text-[#111827] dark:text-white">{service.latency}ms</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}

                        {filteredRegions.length === 0 && (
                            <div className="py-12 text-center border border-dashed border-black/10 dark:border-white/10 rounded-xl bg-white/60 dark:bg-[#111110]/40">
                                <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm">No services match the current filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
