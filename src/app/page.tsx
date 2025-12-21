import { getSystemStatus } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Globe, 
  Activity,
  Clock
} from "lucide-react";
import clsx from "clsx";

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const StatusIcon = ({ status, className }: { status: string; className?: string }) => {
  if (status === 'operational') return <CheckCircle2 className={clsx("text-emerald-500", className)} />;
  if (status === 'degraded') return <AlertTriangle className={clsx("text-amber-500", className)} />;
  return <XCircle className={clsx("text-red-500", className)} />;
};

const UptimeBar = ({ history }: { history: { status: string; latency: number; timestamp: number }[] }) => {
  // Ensure we always have bars to show, pad if empty
  const totalBars = 45;
  const paddedHistory = [...Array(Math.max(0, totalBars - history.length)).fill(null), ...history];

  return (
    <div className="flex items-end gap-0.5 h-8 mt-3 w-full opacity-80 hover:opacity-100 transition-opacity">
      {paddedHistory.map((entry, i) => {
        if (!entry) {
          return <div key={i} className="flex-1 bg-slate-800/50 rounded-sm h-full" />;
        }
        
        const color = entry.status === 'operational' ? 'bg-emerald-500' : entry.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500';
        // Height variation for liveliness based on latency (fake distinctness if needed, or static)
        // Let's make it full height for clarity, or varying opacity.
        return (
            <div 
              key={entry.timestamp} 
              className={clsx("flex-1 rounded-sm transition-all hover:scale-110 relative group", color)}
              style={{ height: '100%' }}
            >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 w-max">
                    <div className="bg-slate-900 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 shadow-xl whitespace-nowrap">
                        <div className="font-bold capitalize">{entry.status}</div>
                        <div className="text-slate-400">{entry.latency}ms • {new Date(entry.timestamp).toLocaleTimeString()}</div>
                    </div>
                </div>
            </div>
        );
      })}
    </div>
  );
}

export default async function Home() {
  const data = await getSystemStatus();

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans selection:bg-cyan-500/30">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />
      
      {/* Navbar */}
      <nav className="border-b border-slate-800/60 bg-[#0B1120]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-20 rounded-full" />
                <Activity className="w-6 h-6 text-cyan-400 relative" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Hubfly<span className="text-slate-500">Status</span></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://hubfly.space" className="text-sm font-medium hover:text-cyan-400 transition-colors">
              hubfly.space
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 relative z-10">
        
        {/* Hero Status */}
        <div className="relative group">
            <div className={clsx(
                "absolute -inset-1 rounded-2xl blur opacity-25 transition duration-1000 group-hover:duration-200",
                data.status === 'operational' ? "bg-gradient-to-r from-emerald-600 to-cyan-600" : 
                data.status === 'degraded' ? "bg-gradient-to-r from-amber-600 to-orange-600" : 
                "bg-gradient-to-r from-red-600 to-pink-600"
            )}></div>
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className={clsx(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl",
                        data.status === 'operational' ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50" : 
                        data.status === 'degraded' ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/50" : 
                        "bg-red-500/10 text-red-400 ring-1 ring-red-500/50"
                    )}>
                        <StatusIcon status={data.status} className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            {data.status === 'operational' ? 'All Systems Operational' : 
                             data.status === 'degraded' ? 'Partial System Outage' : 'Major System Outage'}
                        </h1>
                        <p className="text-slate-400 mt-1 text-lg">
                           Services are being monitored across {data.regions.length} regions.
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400">
                        <Clock className="w-3 h-3" />
                        Updated {formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}
                    </div>
                </div>
            </div>
        </div>

        {/* Regions & Services */}
        <div className="space-y-10">
            {data.regions.map((region) => (
                <div key={region.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <Globe className="w-5 h-5 text-cyan-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">{region.name}</h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {region.services.map((service) => (
                            <div 
                                key={service.id}
                                className="group bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 rounded-xl p-5 hover:bg-slate-800/60 hover:border-slate-700 transition-all duration-300"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4 min-w-[200px]">
                                        <div className={clsx("mt-1 w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]", 
                                            service.status === 'operational' ? "bg-emerald-400 text-emerald-400" : 
                                            service.status === 'degraded' ? "bg-amber-400 text-amber-400" : 
                                            "bg-red-400 text-red-400"
                                        )} />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-slate-200">{service.name}</h3>
                                                {service.status !== 'operational' && (
                                                    <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                                                        service.status === 'degraded' ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"
                                                    )}>
                                                        {service.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono mt-1">
                                                Response time: <span className={service.latency > 500 ? "text-amber-400" : "text-slate-400"}>{service.latency}ms</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Uptime Visualization */}
                                    <div className="flex-1 max-w-xl w-full">
                                        <UptimeBar history={service.history} />
                                    </div>
                                </div>
                                
                                {service.error && (service.status === 'down' || service.status === 'degraded') && (
                                    <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10 flex items-start gap-3 text-sm text-red-200/80 font-mono">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                                        <div className="break-all">{service.error}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </main>

      <footer className="border-t border-slate-800/60 bg-[#0B1120] mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span>Systems operational</span>
           </div>
           <p>&copy; {new Date().getFullYear()} Hubfly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
