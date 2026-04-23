import { Battery, BatteryMedium, Cpu, Database, FlaskConical, Navigation, Radio, Waves, Wifi } from "lucide-react";
import { SystemStatus, TelemetryData } from "../types/mission";

export function SystemStatusWidget({ status, distance }: { status: SystemStatus, distance: number }) {
  return (
    <div className="bg-[#151B23] border border-slate-800 rounded p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Statistiche & Collegamenti</h2>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 border border-emerald-900 rounded">CONNESSO</span>
      </div>
      
      <div className="flex flex-col gap-3 flex-1 justify-between">
        <div className="flex justify-between gap-3">
            <div className="bg-[#0B0F13] p-3 border border-slate-800 flex-1 rounded relative">
                <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
                    Batteria USV <Battery className={`w-4 h-4 ${status.boatBattery < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
                </div>
                <div className={`text-lg font-mono mt-1 ${status.boatBattery < 20 ? 'text-red-500 font-bold' : 'text-slate-200'}`}>{Math.round(status.boatBattery)}%</div>
                <div className={`absolute bottom-0 left-0 h-0.5 ${status.boatBattery < 20 ? 'bg-red-600' : 'bg-emerald-500'}`} style={{width: `${Math.round(status.boatBattery)}%`}}></div>
            </div>
            <div className="bg-[#0B0F13] p-3 border border-slate-800 flex-1 rounded relative">
                <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
                    Batteria AUV <BatteryMedium className={`w-4 h-4 ${status.auvBattery < 20 ? 'text-red-500 animate-pulse' : 'text-cyan-500'}`} />
                </div>
                <div className={`text-lg font-mono mt-1 ${status.auvBattery < 20 ? 'text-red-500 font-bold' : 'text-slate-200'}`}>{Math.round(status.auvBattery)}%</div>
                <div className={`absolute bottom-0 left-0 h-0.5 ${status.auvBattery < 20 ? 'bg-red-600' : 'bg-cyan-500'}`} style={{width: `${Math.round(status.auvBattery)}%`}}></div>
            </div>
        </div>
        
        {/* Links */}
        <div className="bg-slate-900/40 border-l-2 border-cyan-500 p-3 rounded-r">
            <div className="text-[10px] text-cyan-400 font-bold uppercase mb-2">Ponti di Trasmissione Dati</div>
            <div className="grid grid-cols-3 gap-2">
                <div>
                   <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center max-w-full truncate" title="RF Sat/4G">
                      <Radio className="w-3 h-3 inline mr-1 text-slate-400 shrink-0"/> RF Sat/4G
                   </div>
                   <div className="text-sm text-slate-300 font-mono mt-1 z-10 relative">{status.rfLink.toFixed(1)} <span className="text-[10px] text-slate-500">Mbps</span></div>
                </div>
                <div>
                   <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center max-w-full truncate" title="Acustico">
                      <Waves className="w-3 h-3 inline mr-1 text-slate-400 shrink-0"/> Acustico
                   </div>
                   <div className="text-sm font-mono mt-1 z-10 relative transition-colors text-slate-300">
                      {status.acousticLink.toFixed(1)} <span className="text-[10px] text-slate-500">kbps</span>
                   </div>
                </div>
                <div>
                   <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center max-w-full truncate" title="Ottico">
                      <Wifi className="w-3 h-3 inline mr-1 text-slate-400 shrink-0"/> Ottico <span className="lowercase text-[8px] font-normal ml-1">&lt;10m</span>
                   </div>
                   <div className="text-sm text-slate-300 font-mono mt-1 z-10 relative">{status.opticalLink.toFixed(0)} <span className="text-[10px] text-slate-500">Mbps</span></div>
                </div>
            </div>
        </div>
        
        {/* Separation Distance */}
        <div className="bg-[#0B0F13] py-2 px-3 border border-slate-800 rounded flex justify-between items-center mt-auto">
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Distanza Base - USV</span>
           <span className="font-mono text-base font-bold text-cyan-400">{distance.toFixed(1)} m</span>
        </div>
      </div>
    </div>
  )
}

export function TelemetryWidget({ telem, phase }: { telem: TelemetryData, phase: string }) {
  const isSubmerged = phase === 'AUV_RELEASED' || phase === 'DATA_COLLECTION' || phase === 'HOMING' || phase === 'EMERGENCY_RECOVERY' || phase === 'DOCKING';
  
  return (
    <div className="bg-[#151B23] border border-slate-800 rounded p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Telemetria Sottomarino (AUV)</h2>
        <span className={`text-[10px] font-bold px-2 py-0.5 border rounded ${isSubmerged ? 'text-amber-400 border-amber-900 bg-amber-950/30' : 'text-slate-500 border-slate-800 bg-slate-900/50'}`}>
          {isSubmerged ? 'IN LETTURA' : 'IN PAUSA'}
        </span>
      </div>
      
      {!isSubmerged ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F13] text-slate-500 text-[10px] font-mono border border-slate-800 rounded">
          <Database className="w-6 h-6 text-slate-700 mb-2" />
          <span>PAYLOAD DISATTIVATO O IN STANDBY</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 h-full">
          <div className="bg-[#0B0F13] p-3 border border-slate-800 rounded flex flex-col justify-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Profondità</div>
            <div className="text-lg text-slate-200 font-mono">{-telem.depth.toFixed(1)} <span className="text-xs text-slate-500">m</span></div>
          </div>
          <div className="bg-[#0B0F13] p-3 border border-slate-800 rounded flex flex-col justify-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Temperatura</div>
            <div className="text-lg text-slate-200 font-mono">{telem.temp.toFixed(1)} <span className="text-xs text-slate-500">°C</span></div>
          </div>
          <div className="bg-[#0B0F13] p-3 border border-slate-800 rounded flex flex-col justify-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mora / Rotta</div>
            <div className="text-lg text-slate-200 font-mono flex items-center gap-1">
               <Navigation className="w-4 h-4 text-cyan-500" style={{ transform: `rotate(${telem.heading}deg)` }}/> 
               {Math.round(telem.heading)}°
            </div>
          </div>
          <div className="bg-[#0B0F13] p-3 border border-slate-800 rounded flex flex-col justify-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Velocità</div>
            <div className="text-lg text-slate-200 font-mono">{telem.speed.toFixed(1)} <span className="text-xs text-slate-500">kn</span></div>
          </div>
          <div className="bg-[#0B0F13] p-3 border border-slate-800 rounded flex flex-col justify-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Qualità Acqua (pH)</div>
            <div className="text-lg text-amber-400 font-mono flex items-center gap-1">
               <FlaskConical className="w-4 h-4 text-amber-500" />
               {telem.ph.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
