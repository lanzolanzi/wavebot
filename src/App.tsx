import { useState, useEffect, useRef } from 'react';
import { Anchor, BookOpen, Compass, Download, Play, ShieldAlert, Target, ShieldCheck, TriangleAlert } from 'lucide-react';
import MapArea from './components/MapArea';
import { SystemStatusWidget, TelemetryWidget } from './components/Widgets';
import { MissionPhase, Coordinates, TelemetryData, SystemStatus } from './types/mission';

const INITIAL_BOAT_POS = { lat: 43.882644, lng: 8.038771 }; // Base specificata
const TARGET_POS = { lat: 43.881744, lng: 8.038771 }; // ~100m sud (Mare aperto)

function calcDistance(p1: Coordinates, p2: Coordinates) {
  if (!p1 || !p2) return 0;
  const R = 6371e3; // Raggio della Terra in metri
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const deltaLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}

export default function App() {
  const [phase, setPhase] = useState<MissionPhase>(MissionPhase.STANDBY);
  const [boatPos, setBoatPos] = useState<Coordinates>(INITIAL_BOAT_POS);
  const [auvPos, setAuvPos] = useState<Coordinates>(INITIAL_BOAT_POS);
  const [targetPos, setTargetPos] = useState<Coordinates | null>(null);
  const [targetDepth, setTargetDepth] = useState<number>(40);
  
  const [status, setStatus] = useState<SystemStatus>({
    boatBattery: 100,
    auvBattery: 100,
    rfLink: 15.2,
    acousticLink: 0,
    opticalLink: 0
  });

  const [telem, setTelem] = useState<TelemetryData>({
    depth: 0,
    temp: 15.4,
    ph: 8.12,
    heading: 0,
    speed: 0
  });

  const acousticWarnTriggered = useRef(false);
  const auvBatteryWarnTriggered = useRef(false);
  const boatBatteryWarnTriggered = useRef(false);

  // Safety interlocks and trigger resets
  useEffect(() => {
    if (phase === MissionPhase.STANDBY) {
       acousticWarnTriggered.current = false;
       auvBatteryWarnTriggered.current = false;
       boatBatteryWarnTriggered.current = false;
    }
  }, [phase]);

  // AUV Battery drain protection
  useEffect(() => {
    if (status.auvBattery < 5 && !auvBatteryWarnTriggered.current && (phase === MissionPhase.AUV_RELEASED || phase === MissionPhase.DATA_COLLECTION)) {
        auvBatteryWarnTriggered.current = true;
        setPhase(MissionPhase.HOMING);
    }
  }, [status.auvBattery, phase]);

  // USV Battery drain protection
  useEffect(() => {
    if (status.boatBattery < 20 && !boatBatteryWarnTriggered.current && 
        phase !== MissionPhase.STANDBY && 
        phase !== MissionPhase.RETURN_TO_BASE) {
        
        boatBatteryWarnTriggered.current = true;
        
        if (phase === MissionPhase.DEPLOYING_BOAT || phase === MissionPhase.ON_STATION || phase === MissionPhase.RECOVERED) {
          setPhase(MissionPhase.RETURN_TO_BASE);
        } else if (phase === MissionPhase.AUV_RELEASED || phase === MissionPhase.DATA_COLLECTION || phase === MissionPhase.HOMING || phase === MissionPhase.DOCKING) {
          // If AUV is out, bring it back first
          if (phase !== MissionPhase.HOMING && phase !== MissionPhase.DOCKING) {
             setPhase(MissionPhase.HOMING);
          }
        }
    }
  }, [status.boatBattery, phase]);

  // Simulation Loop
  useEffect(() => {
    let interval: number;

    const moveTowards = (current: Coordinates, target: Coordinates, speed: number) => {
      const dx = target.lat - current.lat;
      const dy = target.lng - current.lng;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < speed) return target;
      return {
        lat: current.lat + (dx / dist) * speed,
        lng: current.lng + (dy / dist) * speed,
      };
    };

    if (phase === MissionPhase.DEPLOYING_BOAT && targetPos) {
      interval = window.setInterval(() => {
        let currentBoatPos = boatPos; // Fallback
        setBoatPos(prev => {
          currentBoatPos = moveTowards(prev, targetPos, 0.00015); // Faster
          if (currentBoatPos.lat === targetPos.lat && currentBoatPos.lng === targetPos.lng) {
            setPhase(MissionPhase.ON_STATION);
          }
          return currentBoatPos;
        });
        setAuvPos(currentBoatPos); 
      }, 200);
    } 
    else if (phase === MissionPhase.AUV_RELEASED) {
      let currentDepth = 0;
      interval = window.setInterval(() => {
        currentDepth += 5; // Faster dive
        setTelem(t => ({ ...t, depth: currentDepth }));
        setStatus(s => ({ ...s, acousticLink: 65.5 + Math.random() * 5 })); 
        if (currentDepth >= targetDepth) {
          setPhase(MissionPhase.DATA_COLLECTION);
        }
      }, 200);
    }
    else if (phase === MissionPhase.DATA_COLLECTION && targetPos) {
      let angle = 0;
      interval = window.setInterval(() => {
        angle += 0.2; // Faster patrol
        setAuvPos({
          lat: targetPos.lat + Math.sin(angle) * 0.0003, 
          lng: targetPos.lng + Math.cos(angle) * 0.0003,
        });
        setTelem(t => ({
          ...t,
          heading: (angle * 180 / Math.PI) % 360,
          speed: 3.5 + Math.random() * 0.5,
          temp: 8.2 + Math.random() * 0.2,
          ph: 8.1 + Math.random() * 0.1
        }));
        
        const newAcoustic = 40 + Math.random() * 30; 
        
        setStatus(s => ({ 
          ...s, 
          acousticLink: newAcoustic
        }));

        // Threshold check for acoustic link
        if (newAcoustic < 50 && !acousticWarnTriggered.current) {
           acousticWarnTriggered.current = true;
        } else if (newAcoustic >= 50 && acousticWarnTriggered.current) {
           acousticWarnTriggered.current = false;
        }

      }, 400); // Faster simulation (was 1000ms)
    }
    else if (phase === MissionPhase.HOMING) {
      // AUV must first surface, then goes back to boat
      let homingDepth = telem.depth;
      interval = window.setInterval(() => {
        if (homingDepth > 0) {
           homingDepth = Math.max(0, homingDepth - 10); // Faster ascent
           setTelem(t => ({ ...t, depth: homingDepth, speed: 0 })); 
        } else {
           // Surfaced, move towards boat
           setTelem(t => ({ ...t, speed: 3.5 + Math.random() * 0.5 }));
           setAuvPos(prev => {
             const next = moveTowards(prev, boatPos, 0.0001); // Faster return
             const dist = calcDistance(next, boatPos);
             if (dist < 10) {
               setPhase(MissionPhase.DOCKING);
             }
             return next;
           });
        }
      }, 200);
    }
    else if (phase === MissionPhase.EMERGENCY_RECOVERY) {
       // Super fast ascent with balloon
       let emergencyDepth = telem.depth;
       interval = window.setInterval(() => {
          if (emergencyDepth > 0) {
             emergencyDepth = Math.max(0, emergencyDepth - 20); // 20m per step!
             setTelem(t => ({ ...t, depth: emergencyDepth, speed: 0 }));
          } else {
             // Reached surface, proceed to boat
             setAuvPos(prev => {
                const next = moveTowards(prev, boatPos, 0.0002); // Faster return too
                const dist = calcDistance(next, boatPos);
                if (dist < 15) { // Looser docking target for emergency
                   setPhase(MissionPhase.RECOVERED);
                }
                return next;
             });
          }
       }, 200);
    }
    else if (phase === MissionPhase.DOCKING) {
      setStatus(s => ({ ...s, acousticLink: 0, opticalLink: 40.5 }));
      let progress = 0;
      interval = window.setInterval(() => {
         progress += 40; // Faster transfer
         setStatus(s => ({ ...s, opticalLink: 42.0 + Math.random() * 5 }));
         if (progress >= 100) {
           setPhase(MissionPhase.RECOVERED);
         }
      }, 300);
    }
    else if (phase === MissionPhase.RECOVERED) {
       setStatus(s => ({ ...s, opticalLink: 0, acousticLink: 0 }));
       setTelem({ depth: 0, temp: 15.0, ph: 8.14, heading: 0, speed: 0 });
       setAuvPos(boatPos);
       
       // Automatic return to base if battery is low and we just recovered
       if (status.boatBattery < 20) {
          setPhase(MissionPhase.RETURN_TO_BASE);
       }
    }
    else if (phase === MissionPhase.RETURN_TO_BASE) {
      interval = window.setInterval(() => {
        setBoatPos(prev => {
          const next = moveTowards(prev, INITIAL_BOAT_POS, 0.0003); // Faster return speed
          const dist = calcDistance(next, INITIAL_BOAT_POS);
          if (dist < 10) {
            setPhase(MissionPhase.STANDBY);
            setTargetPos(null); // Reset target for next mission
          }
          return next;
        });
      }, 200);
    }

    return () => clearInterval(interval);
  }, [phase, targetPos, targetDepth]); // boatPos is removed from dependencies to avoid interval reset, targetPos is needed

  // Keep AUV attached to Boat during attached phases
  useEffect(() => {
    const isAttached = phase === MissionPhase.STANDBY || phase === MissionPhase.ON_STATION || phase === MissionPhase.RECOVERED || phase === MissionPhase.RETURN_TO_BASE;
    if (isAttached) {
      setAuvPos(boatPos);
    }
  }, [boatPos, phase]);

  // Battery Charge/Drain Simulation
  useEffect(() => {
    const batteryInterval = setInterval(() => {
      setStatus(prev => {
        let newBoatBat = prev.boatBattery;
        let newAuvBat = prev.auvBattery;

        // Boat charges at base (STANDBY), drains elsewhere
        if (phase === MissionPhase.STANDBY) {
           newBoatBat = Math.min(100, newBoatBat + 1.5); // Faster charge
        } else {
           newBoatBat = Math.max(0, newBoatBat - 0.1); // Faster drain
        }

        // AUV charges when surface/attached, drains when submerged
        const isAuvSubmerged = phase === MissionPhase.AUV_RELEASED || phase === MissionPhase.DATA_COLLECTION || phase === MissionPhase.HOMING || phase === MissionPhase.EMERGENCY_RECOVERY || phase === MissionPhase.DOCKING;
        if (!isAuvSubmerged) {
           newAuvBat = Math.min(100, newAuvBat + 1.0); 
        } else {
           newAuvBat = Math.max(0, newAuvBat - 0.1); 
        }

        return { ...prev, boatBattery: newBoatBat, auvBattery: newAuvBat };
      });
    }, 1000); // Standard real-time interval (1000ms)

    return () => clearInterval(batteryInterval);
  }, [phase]);

  const handleDeploy = () => {
    if (!targetPos) {
       setTargetPos(TARGET_POS);
    }
    setPhase(MissionPhase.DEPLOYING_BOAT);
  };

  const handleMapClick = (coords: Coordinates) => {
    if (phase === MissionPhase.STANDBY) {
       const dist = calcDistance(INITIAL_BOAT_POS, coords);
       if (dist <= 500) {
          setTargetPos(coords);
       } else {
          // Just ignore clicks that are too far if we have no logs
       }
    }
  };

  const currentDist = calcDistance(INITIAL_BOAT_POS, boatPos);

  return (
    <div className="h-screen w-screen bg-[#0B0F13] text-slate-300 flex flex-col font-sans select-none overflow-hidden">
      <div className="p-2 md:p-3 flex flex-col gap-2 md:gap-3 flex-1 h-full min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-2 h-10 shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shrink-0" />
            <h1 className="text-lg font-bold tracking-widest text-white uppercase flex flex-wrap items-center">
              WaveBot <span className="text-cyan-400 font-bold ml-2 text-sm max-sm:hidden">by INNOVA Tech</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-400 text-[9px] ml-3 tracking-widest font-bold border border-cyan-800">BETA</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end border-l border-slate-800 pl-4 text-xs">
               <span className="text-slate-500 uppercase">Stato Sistema</span>
               <span className="text-green-400 font-mono">ATTIVO / USV-77A</span>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex flex-col xl:flex-row gap-2 md:gap-3 min-h-0">
          
          {/* Left Sidebar - Operations */}
          <aside className="w-full xl:w-80 flex flex-col gap-2 md:gap-3 shrink-0 overflow-y-auto custom-scrollbar pr-1 xl:pr-0">
          
          {/* Mission Control Panel */}
          <div className="bg-[#151B23] border border-slate-800 rounded p-4 flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-tighter mb-1">Centro Comando (Fasi operative)</h2>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleDeploy}
                disabled={phase !== MissionPhase.STANDBY}
                className="w-full flex items-center justify-start px-3 gap-2 py-2 border border-cyan-700 bg-cyan-900/20 hover:bg-cyan-900/40 disabled:opacity-50 disabled:bg-[#0B0F13] disabled:border-slate-800 disabled:cursor-not-allowed text-white rounded font-medium text-xs uppercase tracking-widest transition-all"
              >
                <Target className="w-4 h-4 text-cyan-400" /> 1. Invia Barca (B-USV)
              </button>

              <div className="flex flex-col gap-1 my-1 px-1">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Profondità Target AUV</label>
                   <span className="text-xs font-mono text-cyan-400 font-bold">{targetDepth}m</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  step="5"
                  value={targetDepth}
                  onChange={(e) => setTargetDepth(Number(e.target.value))}
                  disabled={phase !== MissionPhase.ON_STATION && phase !== MissionPhase.STANDBY && phase !== MissionPhase.DEPLOYING_BOAT}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              
              <button 
                onClick={() => setPhase(MissionPhase.AUV_RELEASED)}
                disabled={phase !== MissionPhase.ON_STATION}
                className="w-full flex items-center justify-start px-3 gap-2 py-2 border border-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:bg-[#0B0F13] disabled:border-slate-800 disabled:cursor-not-allowed text-white rounded font-medium text-xs uppercase tracking-widest transition-all"
              >
                <Anchor className="w-4 h-4 text-slate-400" /> 2. Sgancia Sottomarino
              </button>
              
              <button 
                onClick={() => setPhase(MissionPhase.HOMING)}
                disabled={phase !== MissionPhase.DATA_COLLECTION}
                className="w-full flex items-center justify-start px-3 gap-2 py-2 border border-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:bg-[#0B0F13] disabled:border-slate-800 disabled:cursor-not-allowed text-white rounded font-medium text-xs uppercase tracking-widest transition-all"
              >
                <Target className="w-4 h-4 text-slate-400" /> 3. Avvia Rientro (Homing)
              </button>

              <button 
                onClick={() => setPhase(MissionPhase.RETURN_TO_BASE)}
                disabled={phase !== MissionPhase.ON_STATION && phase !== MissionPhase.RECOVERED}
                className="w-full flex items-center justify-start px-3 gap-2 py-2 border border-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:bg-[#0B0F13] disabled:border-slate-800 disabled:cursor-not-allowed text-white rounded font-medium text-xs uppercase tracking-widest transition-all"
              >
                <Compass className="w-4 h-4 text-slate-400" /> 4. Ritorna alla Base
              </button>

              <button 
                onClick={() => setPhase(MissionPhase.EMERGENCY_RECOVERY)}
                disabled={phase !== MissionPhase.DATA_COLLECTION && phase !== MissionPhase.AUV_RELEASED && phase !== MissionPhase.HOMING}
                className="w-full mt-4 flex items-center justify-center px-3 gap-2 py-3 border border-red-900 bg-red-950/20 hover:bg-red-900/40 disabled:opacity-30 disabled:cursor-not-allowed text-red-500 rounded font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <TriangleAlert className="w-4 h-4" /> EMERGENZA RISALITA
              </button>
            </div>
          </div>
        </aside>

        {/* Center - Map */}
        <main className="flex-1 flex flex-col gap-2 md:gap-3 min-h-0 overflow-hidden">
           {/* Visualizer Frame */}
           <div className="flex-1 min-h-[150px] relative rounded border border-slate-800 bg-[#1A1F26] overflow-hidden">
              <MapArea 
                 initialPos={INITIAL_BOAT_POS}
                 boatPos={boatPos} 
                 auvPos={auvPos} 
                 targetPos={targetPos}
                 phase={phase}
                 onMapClick={handleMapClick}
              />
              
              {/* Overlay Alert for Docking High-Res Transfer */}
              {phase === MissionPhase.DOCKING && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#151B23] border border-cyan-500 p-6 rounded shadow-2xl z-[500] flex flex-col items-center">
                   <Download className="w-12 h-12 text-cyan-500 animate-bounce mb-4" />
                   <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-2">CONNESSIONE MODEM OTTICO</h2>
                   <p className="text-[10px] font-mono text-cyan-400">Sincronizzazione dati HD in corso...</p>
                   <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
                      <div className="h-full bg-cyan-500 animate-[pulse_1s_ease-in-out_infinite] w-full" style={{ animation: 'progress 2s linear infinite' }} />
                   </div>
                </div>
              )}
           </div>

           {/* Bottom Dashboard Widgets */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 shrink-0 pb-1 h-auto min-h-min">
              <SystemStatusWidget status={status} distance={currentDist} />
              <TelemetryWidget telem={telem} phase={phase} />
           </div>
        </main>
      </div>
     </div>
    </div>
  );
}
