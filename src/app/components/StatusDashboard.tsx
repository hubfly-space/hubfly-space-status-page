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
        ? "All Systems Operational"
        : data.status === "degraded"
            ? "Degraded Performance Detected"
            : "Major Service Outage";

    const statusMessage = data.status === "operational"
        ? "Everything looks healthy across monitored services. No active incidents detected."
        : "Some services are under active investigation. Updates are posted as soon as new information is available.";

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#f7f2ea] dark:bg-[#0b0a09] text-[#1b1916] dark:text-[#f5f2ed] selection:bg-[#1b1916] selection:text-[#f7f2ea] dark:selection:bg-[#f5f2ed] dark:selection:text-[#0b0a09] transition-colors duration-300 relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.16),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_70%)]" />
                <div className="absolute top-24 right-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.16),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12),transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.25),transparent_55%)] dark:bg-[linear-gradient(120deg,rgba(12,10,9,0.4),transparent_55%)]" />
            </div>

            <div className="relative z-10">
                <div className="border-b border-black/10 dark:border-white/10 bg-[#fbf7f1]/80 dark:bg-[#0b0a09]/80 backdrop-blur">
                    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1b1916] dark:bg-[#f5f2ed] flex items-center justify-center shadow-sm">
                                <Activity className="w-4 h-4 text-[#f5f2ed] dark:text-[#1b1916]" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-[#a3927e] dark:text-[#cbb9a4]">Hubfly</p>
                                <p className="text-sm font-semibold">Space Status Console</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-full border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-[#7a6d5f] dark:text-[#c9b9a6] transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                            <a href="https://hubfly.space" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6d5f] dark:text-[#c9b9a6] hover:text-[#1b1916] dark:hover:text-white transition-colors">
                                hubfly.space
                            </a>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col gap-10">
                    <header className="grid lg:grid-cols-[1.3fr_0.7fr] gap-10 items-end rise-in">
                        <div className="space-y-5">
                            <p className="text-xs uppercase tracking-[0.35em] text-[#a3927e] dark:text-[#c9b9a6]">Live Telemetry</p>
                            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1b1916] dark:text-white">
                                Hubfly Infrastructure Status, in real time.
                            </h1>
                            <p className="text-sm md:text-base text-[#6b5f52] dark:text-[#b7a696] max-w-2xl">
                                Track uptime across regions, review recent incidents, and spot early warning signs before they become customer-facing.
                            </p>
                            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#7a6d5f] dark:text-[#c9b9a6]">
                                <Clock className="w-4 h-4" />
                                Last check {formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}
                                <span className="text-[#cbb9a4] dark:text-[#6f6257]">•</span>
                                Auto refresh enabled
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#141210]/70 backdrop-blur px-5 py-4 shadow-sm rise-in stagger-1">
                                <p className="text-[11px] uppercase tracking-[0.3em] text-[#a3927e] dark:text-[#c9b9a6]">Global Status</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-lg font-semibold">{statusHeadline}</span>
                                    <span className={clsx(
                                        "px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] rounded-full border",
                                        data.status === "operational"
                                            ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                            : data.status === "degraded"
                                                ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                                                : "border-rose-500/40 text-rose-600 bg-rose-500/10"
                                    )}>
                                        {data.status}
                                    </span>
                                </div>
                                <p className="text-xs text-[#6b5f52] dark:text-[#b7a696] mt-2">{statusMessage}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 rise-in stagger-2">
                                {[
                                    { label: "Health", value: `${stats.health}%`, helper: "service uptime" },
                                    { label: "Active", value: `${stats.active}/${stats.total}`, helper: "services online" },
                                    { label: "Incidents", value: `${openIncidents.length}`, helper: "open right now" }
                                ].map((item) => (
                                    <div key={item.label} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#141210]/60 backdrop-blur px-4 py-3 shadow-sm">
                                        <p className="text-[11px] uppercase tracking-[0.25em] text-[#a3927e] dark:text-[#c9b9a6]">{item.label}</p>
                                        <p className="text-lg font-semibold text-[#1b1916] dark:text-white">{item.value}</p>
                                        <p className="text-[11px] text-[#8a7a6a] dark:text-[#a89a8a]">{item.helper}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </header>

                    <div className={clsx(
                        "rounded-2xl border px-6 py-5 shadow-sm rise-in stagger-3",
                        data.status === "operational"
                            ? "border-emerald-500/40 bg-white/80 dark:bg-[#10110e]/70"
                            : data.status === "degraded"
                                ? "border-amber-500/40 bg-white/80 dark:bg-[#14110e]/70"
                                : "border-rose-500/40 bg-white/80 dark:bg-[#140e0e]/70"
                    )}>
                        <div className="flex items-start gap-4">
                            {data.status === "operational" ? <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> :
                                data.status === "degraded" ? <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" /> :
                                    <XCircle className="w-6 h-6 text-rose-500 shrink-0" />}
                            <div>
                                <h3 className="font-semibold text-base">{statusHeadline}</h3>
                                <p className="text-sm text-[#6b5f52] dark:text-[#b7a696] max-w-3xl">{statusMessage}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 border-b border-black/10 dark:border-white/10 pb-6">
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b09f8a]" />
                                <input
                                    type="text"
                                    placeholder="Search a service name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white/80 dark:bg-[#141210]/70 border border-black/10 dark:border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-[#1b1916] dark:text-white placeholder-[#b09f8a] focus:outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors shadow-sm"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex bg-white/70 dark:bg-[#141210]/60 p-1 rounded-full border border-black/10 dark:border-white/10 shadow-sm">
                                    {(['1h', '6h', '24h'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTimeRange(t)}
                                            className={clsx(
                                                "px-3 py-1.5 text-xs font-semibold rounded-full transition-all",
                                                timeRange === t
                                                    ? "bg-[#1b1916] text-white dark:bg-white dark:text-[#1b1916] shadow-sm"
                                                    : "text-[#7a6d5f] dark:text-[#c9b9a6] hover:text-[#1b1916] dark:hover:text-white"
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
                                                "px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] border rounded-full transition-all",
                                                filter === t
                                                    ? "bg-[#1b1916] dark:bg-white text-white dark:text-[#1b1916] border-transparent"
                                                    : "text-[#7a6d5f] dark:text-[#c9b9a6] bg-white/70 dark:bg-[#141210]/50 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
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
                                <p className="text-xs uppercase tracking-[0.35em] text-[#a3927e] dark:text-[#c9b9a6]">Incident Ledger</p>
                                <h2 className="text-lg font-semibold">Recent incidents</h2>
                            </div>
                            <span className="text-xs text-[#7a6d5f] dark:text-[#c9b9a6]">{openIncidents.length} open</span>
                        </div>

                        {incidents.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#141210]/40 px-6 py-10 text-center text-sm text-[#7a6d5f] dark:text-[#c9b9a6]">
                                No incidents recorded recently. Everything is calm.
                            </div>
                        )}

                        {incidents.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                                            className={clsx(
                                                "rounded-2xl border px-5 py-4 bg-white/80 dark:bg-[#141210]/60 shadow-sm",
                                                isOpen ? "border-rose-500/40" : "border-emerald-500/30"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold">{incident.serviceName}</p>
                                                    <p className="text-xs text-[#8a7a6a] dark:text-[#a89a8a]">{incident.regionName}</p>
                                                </div>
                                                <span className={clsx(
                                                    "px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] rounded-full border",
                                                    isOpen
                                                        ? "border-rose-500/40 text-rose-600 bg-rose-500/10"
                                                        : "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                                )}>
                                                    {isOpen ? "Open" : "Resolved"}
                                                </span>
                                            </div>
                                            <div className="mt-3 text-xs text-[#6b5f52] dark:text-[#b7a696]">
                                                <p>Started {formatDistanceToNow(started, { addSuffix: true })}</p>
                                                <p>{resolutionLabel}</p>
                                            </div>
                                            {incident.lastError && (
                                                <p className="mt-3 text-xs text-[#a15f4a] dark:text-[#f2b6a1] border-t border-black/5 dark:border-white/10 pt-3">
                                                    {incident.lastError}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <div className="space-y-12">
                        {filteredRegions.map((region) => (
                            <section key={region.id}>
                                <div className="flex items-center gap-3 mb-5">
                                    <h3 className="text-xs font-semibold text-[#a3927e] dark:text-[#c9b9a6] uppercase tracking-[0.4em]">
                                        {region.name}
                                    </h3>
                                    <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {region.services.map((service) => (
                                        <div
                                            key={service.id}
                                            className="bg-white/85 dark:bg-[#141210]/70 border border-black/10 dark:border-white/10 p-5 rounded-2xl hover:border-black/20 dark:hover:border-white/20 transition-colors group shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-5">
                                                <div className="flex items-center gap-2">
                                                    <Server className="w-4 h-4 text-[#b09f8a] group-hover:text-[#7a6d5f] dark:group-hover:text-[#e0d4c4] transition-colors" />
                                                    <span className="font-semibold text-sm">{service.name}</span>
                                                </div>
                                                <span className={clsx(
                                                    "px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] rounded-full border",
                                                    service.status === "operational"
                                                        ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                                        : service.status === "degraded"
                                                            ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                                                            : "border-rose-500/40 text-rose-600 bg-rose-500/10"
                                                )}>
                                                    {service.status}
                                                </span>
                                            </div>

                                            <div className="h-16 mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <LatencyChart
                                                    data={service.history}
                                                    color={getStatusColor(service.status)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/10 text-xs text-[#7a6d5f] dark:text-[#c9b9a6]">
                                                <span>Latency</span>
                                                <span className="font-mono text-[#1b1916] dark:text-white">{service.latency}ms</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}

                        {filteredRegions.length === 0 && (
                            <div className="py-16 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-[#141210]/30">
                                <p className="text-[#7a6d5f] dark:text-[#c9b9a6] text-sm">No services match the current filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
