import React from 'react';

export function ArchitectureTab() {
  return (
    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-50 overflow-y-auto p-8 font-sans text-slate-300">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 text-cyan-400">Architettura di Sistema & Payload JSON</h1>
        
        <p className="mb-4 text-slate-400">
          Questa sezione documenta la struttura architetturale e i contratti dati tra i veicoli.
          Il <strong className="text-white">Surface Vehicle (B)</strong> funge da ponte radio verso il centro di controllo (interfaccia web), mentre il <strong className="text-white">Subsea Vehicle (R)</strong> comunica con B tramite modem acustico in fase di crociera e modem ottico in docking.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-4 border-b border-slate-700 pb-2">1. Flusso di Comunicazione (Backend Logic)</h2>
        <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm border border-slate-700 space-y-2 text-cyan-200">
          <p><span className="text-indigo-400">Operatore UI</span> ↔ [Sat/4G RF Link] ↔ <span className="text-emerald-400">USV (B-Boat)</span></p>
          <p className="pl-4">↳ Durante missione: <span className="text-emerald-400">USV (B)</span> ↔ [Acoustic Modem 1.5 kbps] ↔ <span className="text-blue-400">AUV (R)</span></p>
          <p className="pl-4">↳ Durante docking (dist &lt; 10m): <span className="text-emerald-400">USV (B)</span> ↔ [Optical Modem 10 Mbps] ↔ <span className="text-blue-400">AUV (R)</span></p>
        </div>

        <h2 className="text-xl font-semibold text-white mt-8 mb-4 border-b border-slate-700 pb-2">2. Schema JSON dei Messaggi</h2>

        <h3 className="text-lg text-emerald-400 mt-4 mb-2">A. Deployment Command (UI → USV → AUV)</h3>
        <p className="text-sm text-slate-400 mb-2">Trasmesso via RF all'USV, e successivamente trasferito via cavo/acustico all'AUV prima dello sgancio (Release).</p>
        <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm border border-slate-700">
          <code className="text-indigo-300">
{`{
  "pkt_type": "CMD_DEPLOY",
  "timestamp": 1716382000,
  "mission_id": "M_883A",
  "waypoints": [
    {"lat": 42.1001, "lng": 10.1200, "depth": 150, "task": "SCAN"},
    {"lat": 42.1005, "lng": 10.1205, "depth": 180, "task": "HOLD"}
  ],
  "timeout_sec": 3600
}`}
          </code>
        </pre>

        <h3 className="text-lg text-cyan-400 mt-6 mb-2">B. Acoustic Telemetry Payload (AUV → USV)</h3>
        <p className="text-sm text-slate-400 mb-2">Compresso per via della banda ristretta (bitrate basso). Inviato ogni X secondi.</p>
        <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm border border-slate-700">
          <code className="text-green-300">
{`{
  "t": "T", // type: Telemetry
  "id": "R1",
  "pos": [42.1001, 10.1200], // Lat, Lng
  "d": 152.4, // Depth
  "h": 275, // Heading
  "ph": 8.12, // pH level
  "b": 85, // Battery %
  "img": "data:image/jpeg;base64,/9j/4AAQSk... [LOW RES THUMBNAIL]"
}`}
          </code>
        </pre>

        <h3 className="text-lg text-amber-400 mt-6 mb-2">C. Optical High-Speed Dump (AUV → USV)</h3>
        <p className="text-sm text-slate-400 mb-2">Attivato automaticamente durante il docking (distanza &lt; 10m). Scarica file video e log completi.</p>
        <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm border border-slate-700">
          <code className="text-amber-200">
{`{
  "pkt_type": "OPT_SYNC",
  "session": "S_991",
  "files": [
    {"name": "cam_main_1080p_part1.mp4", "size_mb": 450, "checksum": "a8f..."},
    {"name": "sonar_log_hd.dat", "size_mb": 12, "checksum": "b1c..."}
  ],
  "tx_rate_mbps": 12.5,
  "status": "TRANSFERRING"
}`}
          </code>
        </pre>

        <div className="mt-12 bg-slate-800 p-4 border-l-4 border-cyan-500 rounded text-sm mb-4">
          <strong className="text-white block mb-1">Nota sulla Sensoristica:</strong>
          Il sistema utilizza un filtro di Kalman esteso sull'USV per predire la posizione dell'AUV tra due ping acustici successivi, offrendo un'interfaccia fluida (come visibile dal movimento interpolato sulla mappa).
        </div>

        <div className="bg-red-950/20 p-4 border-l-4 border-red-600 rounded text-sm">
          <strong className="text-red-400 block mb-1">Safety: Recovery Balloon System</strong>
          In caso di guasto critico o perdita di propulsione, l'AUV è dotato di un sistema di emergenza ridondante. Un comando acustico (o un timer di sicurezza) attiva il gonfiaggio di un palloncino ad alta pressione, garantendo una risalita rapida (~10m/s) e la localizzazione in superficie.
        </div>
      </div>
    </div>
  );
}
