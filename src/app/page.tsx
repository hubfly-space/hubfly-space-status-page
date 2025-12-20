import { getSystemStatus } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Server, 
  Globe, 
  Activity
} from "lucide-react";
import clsx from "clsx";

export const dynamic = 'force-dynamic';
// Revalidate every 60 seconds
export const revalidate = 60;

const StatusIcon = ({ status, className }: { status: string; className?: string }) => {
  if (status === 'operational') return <CheckCircle2 className={clsx("w-5 h-5 text-emerald-500", className)} />;
  if (status === 'degraded') return <AlertTriangle className={clsx("w-5 h-5 text-amber-500", className)} />;
  return <XCircle className={clsx("w-5 h-5 text-red-500", className)} />;
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    operational: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    degraded: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    down: "bg-red-500/10 text-red-400 border-red-500/20",
  }[status as 'operational' | 'degraded' | 'down'] || "bg-slate-800 text-slate-400";

  return (
    <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5", styles)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", status === 'operational' ? "bg-emerald-400" : status === 'degraded' ? "bg-amber-400" : "bg-red-400")} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default async function Home() {
  const data = await getSystemStatus();

  const overallStatusColor = {
    operational: "bg-emerald-500",
    degraded: "bg-amber-500",
    down: "bg-red-500",
  }[data.status] || "bg-slate-500";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-100">Hubfly Status</h1>
          </div>
          <a 
            href="https://hubfly.space" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors"
          >
            hubfly.space &rarr;
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Overall Status Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className={clsx("absolute top-0 left-0 w-1.5 h-full", overallStatusColor)} />
          <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <StatusIcon status={data.status} className="w-8 h-8" />
                <h2 className="text-2xl font-bold text-white">
                  {data.status === 'operational' ? 'All Systems Operational' : 
                   data.status === 'degraded' ? 'Partial System Outage' : 'Major System Outage'}
                </h2>
              </div>
              <p className="text-slate-400 max-w-xl">
                All services are currently running smoothly. Monitoring checks are performed every minute across all regions.
              </p>
            </div>
            <div className="text-right hidden md:block">
               <div className="text-sm text-slate-500 font-mono">Last updated</div>
               <div className="text-slate-300 font-medium">
                 {formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}
               </div>
            </div>
          </div>
        </div>

        {/* Regions Grid */}
        <div className="grid grid-cols-1 gap-8">
          {data.regions.map((region) => (
            <div key={region.id} className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <Globe className="w-5 h-5 text-slate-500" />
                <h3 className="text-xl font-semibold text-slate-100">{region.name}</h3>
                <div className="h-px flex-1 bg-slate-800" />
                <StatusBadge status={region.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {region.services.map((service) => (
                  <div 
                    key={service.id}
                    className="group relative flex flex-col p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-700 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        <span className="font-medium text-slate-200">{service.name}</span>
                      </div>
                      <StatusIcon status={service.status} className="w-4 h-4" />
                    </div>
                    
                    {(service.status === 'down' || service.status === 'degraded') && service.error && (
                      <div className="mb-3 px-2 py-1.5 rounded text-xs bg-red-500/10 text-red-200 border border-red-500/20 font-mono break-all">
                        {service.error}
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className={clsx(
                          "w-1.5 h-1.5 rounded-full animate-pulse", 
                          service.latency < 200 ? "bg-emerald-500" : service.latency < 500 ? "bg-amber-500" : "bg-red-500"
                        )} />
                        {service.latency}ms
                      </div>
                      <span>
                        {formatDistanceToNow(new Date(service.lastChecked))} ago
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
           <p className="text-slate-500 text-sm">
             &copy; {new Date().getFullYear()} Hubfly. All rights reserved.
           </p>
           <div className="flex items-center gap-6 text-sm text-slate-500">
             <a href="#" className="hover:text-slate-300 transition-colors">API</a>
             <a href="#" className="hover:text-slate-300 transition-colors">Support</a>
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
               System Normal
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
}