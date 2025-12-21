import { getSystemStatus } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Activity,
  Clock,
} from "lucide-react";
import clsx from "clsx";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const StatusIcon = ({
  status,
  className,
}: {
  status: string;
  className?: string;
}) => {
  if (status === "operational")
    return <CheckCircle2 className={clsx("text-emerald-500", className)} />;
  if (status === "degraded")
    return <AlertTriangle className={clsx("text-amber-500", className)} />;
  return <XCircle className={clsx("text-red-500", className)} />;
};

const UptimeBar = ({
  history,
}: {
  history: { status: string; latency: number; timestamp: number }[];
}) => {
  const totalBars = 60;
  const paddedHistory = [
    ...Array(Math.max(0, totalBars - history.length)).fill(null),
    ...history,
  ];

  return (
    <div className="flex items-end gap-px h-10 mt-2 w-full ">
      {paddedHistory.map((entry, i) => {
        if (!entry) {
          return (
            <div key={i} className="flex-1 bg-slate-800/30 rounded-sm h-2" />
          );
        }

        const color =
          entry.status === "operational"
            ? "bg-emerald-500"
            : entry.status === "degraded"
              ? "bg-amber-500"
              : "bg-red-500";

        return (
          <div
            key={entry.timestamp}
            className={clsx(
              "flex-1 rounded-sm transition-all relative group/bar",
              color,
              "hover:h-10 hover:-translate-y-1.5",
            )}
            style={{ height: "6px" }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:block z-10 ">
              <div className="bg-slate-900/95 text-slate-200 text-xs px-2.5 py-1.5 rounded-md border border-slate-700 shadow-lg whitespace-nowrap">
                <div className="font-medium capitalize">{entry.status}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {entry.latency} ms •{" "}
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default async function Home() {
  const data = await getSystemStatus();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans antialiased">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-lg tracking-tight text-white">
              Hubfly <span className="text-slate-500 font-normal">Status</span>
            </span>
          </div>
          <a
            href="https://hubfly.space"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            hubfly.space
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Global Status Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className={clsx(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  data.status === "operational"
                    ? "bg-emerald-950 text-emerald-400"
                    : data.status === "degraded"
                      ? "bg-amber-950 text-amber-400"
                      : "bg-red-950 text-red-400",
                )}
              >
                <StatusIcon status={data.status} className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                  {data.status === "operational"
                    ? "All Systems Operational"
                    : data.status === "degraded"
                      ? "Degraded Performance"
                      : "Service Disruption"}
                </h1>
                <p className="text-slate-400 mt-1">
                  Monitored across {data.regions.length} region
                  {data.regions.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Updated{" "}
                  {formatDistanceToNow(new Date(data.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Regions */}
        <div className="space-y-12">
          {data.regions.map((region) => (
            <section key={region.id}>
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">
                  {region.name}
                </h2>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <div className="space-y-4">
                {region.services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={clsx(
                            "mt-1.5 w-3 h-3 rounded-full",
                            service.status === "operational"
                              ? "bg-emerald-500"
                              : service.status === "degraded"
                                ? "bg-amber-500"
                                : "bg-red-500",
                          )}
                        />
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-slate-100">
                              {service.name}
                            </h3>
                            {service.status !== "operational" && (
                              <span
                                className={clsx(
                                  "px-2 py-0.5 text-[10px] font-medium uppercase rounded",
                                  service.status === "degraded"
                                    ? "bg-amber-950 text-amber-300 border border-amber-800/50"
                                    : "bg-red-950 text-red-300 border border-red-800/50",
                                )}
                              >
                                {service.status}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Response time:{" "}
                            <span
                              className={clsx(
                                service.latency > 500
                                  ? "text-amber-400"
                                  : "text-slate-300",
                              )}
                            >
                              {service.latency} ms
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <UptimeBar history={service.history} />
                      </div>
                    </div>

                    {service.error && service.status !== "operational" && (
                      <div className="mt-4 p-3 text-sm bg-red-950/30 border border-red-900/50 rounded-lg text-red-200/90 font-mono">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          <div className="break-all">{service.error}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-800 mt-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All systems operational</span>
          </div>
          <p>© {new Date().getFullYear()} Hubfly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
