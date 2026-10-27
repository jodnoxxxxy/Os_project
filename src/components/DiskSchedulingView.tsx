import React, { useState, useMemo } from 'react';
import { DiskAlgorithm, DiskDirection, DiskSchedulingResult } from '../types/os';
import { getDiskAlgorithmName, simulateDiskScheduling } from '../algorithms/diskScheduling';
import { HardDrive, RotateCcw, Shuffle, BarChart3, ArrowRight, ArrowLeft, Info, Compass } from 'lucide-react';
import { DEFAULT_DISK_REQUESTS, DEFAULT_INITIAL_HEAD, DEFAULT_MAX_CYLINDER } from '../utils/defaults';

interface DiskSchedulingViewProps {
  requestQueue: number[];
  initialHead: number;
  maxCylinder: number;
  direction: DiskDirection;
  onUpdateRequestQueue: (requests: number[]) => void;
  onUpdateInitialHead: (head: number) => void;
  onUpdateMaxCylinder: (max: number) => void;
  onUpdateDirection: (dir: DiskDirection) => void;
  onResetDefaults: () => void;
}

export const DiskSchedulingView: React.FC<DiskSchedulingViewProps> = ({
  requestQueue,
  initialHead,
  maxCylinder,
  direction,
  onUpdateRequestQueue,
  onUpdateInitialHead,
  onUpdateMaxCylinder,
  onUpdateDirection,
  onResetDefaults,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<DiskAlgorithm>('FCFS');
  const [inputQueue, setInputQueue] = useState<string>(requestQueue.join(', '));
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  const handleQueueChange = (val: string) => {
    setInputQueue(val);
    const parsed = val
      .split(/[, ]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= maxCylinder);
    if (parsed.length > 0) {
      onUpdateRequestQueue(parsed);
    }
  };

  const loadPreset = (preset: number[], head: number) => {
    onUpdateRequestQueue(preset);
    onUpdateInitialHead(head);
    setInputQueue(preset.join(', '));
  };

  // Run simulation for active algorithm
  const result: DiskSchedulingResult = useMemo(() => {
    return simulateDiskScheduling(requestQueue, initialHead, maxCylinder, direction, selectedAlgo);
  }, [requestQueue, initialHead, maxCylinder, direction, selectedAlgo]);

  // Run comparison across all 6 disk algorithms
  const comparisonResults = useMemo(() => {
    if (!showComparison) return [];
    const algos: DiskAlgorithm[] = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'];
    return algos.map((algo) => ({
      algo,
      name: getDiskAlgorithmName(algo),
      result: simulateDiskScheduling(requestQueue, initialHead, maxCylinder, direction, algo),
    }));
  }, [requestQueue, initialHead, maxCylinder, direction, showComparison]);

  const bestAlgo = useMemo(() => {
    if (comparisonResults.length === 0) return null;
    return [...comparisonResults].sort((a, b) => a.result.totalHeadMovement - b.result.totalHeadMovement)[0];
  }, [comparisonResults]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            Disk Head Scheduling Simulation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate and evaluate secondary storage arm trajectories to minimize mechanical seek delays.
          </p>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {(
            [
              ['FCFS', 'FCFS'],
              ['SSTF', 'SSTF'],
              ['SCAN', 'SCAN'],
              ['C-SCAN', 'C-SCAN'],
              ['LOOK', 'LOOK'],
              ['C-LOOK', 'C-LOOK'],
            ] as [DiskAlgorithm, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedAlgo(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedAlgo === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Disk Request Queue (track cylinders):
            </label>
            <input
              type="text"
              value={inputQueue}
              onChange={(e) => handleQueueChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. 98, 183, 37, 122, 14, 124, 65, 67"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Initial Head:</label>
            <input
              type="number"
              min="0"
              max={maxCylinder}
              value={initialHead}
              onChange={(e) => onUpdateInitialHead(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-slate-200 text-center focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Max Cylinder:</label>
            <input
              type="number"
              min="50"
              max="999"
              value={maxCylinder}
              onChange={(e) => onUpdateMaxCylinder(Math.max(50, parseInt(e.target.value) || 199))}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-slate-200 text-center focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Arm Direction:</label>
            <div className="flex rounded border border-slate-700 bg-slate-950 p-0.5">
              <button
                onClick={() => onUpdateDirection('left')}
                className={`flex-1 py-1 text-xs font-medium rounded flex items-center justify-center gap-1 ${
                  direction === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toward cylinder 0"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>0</span>
              </button>
              <button
                onClick={() => onUpdateDirection('right')}
                className={`flex-1 py-1 text-xs font-medium rounded flex items-center justify-center gap-1 ${
                  direction === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Toward cylinder ${maxCylinder}`}
              >
                <span>{maxCylinder}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Standard Benchmarks:</span>
            <button
              onClick={() => loadPreset(DEFAULT_DISK_REQUESTS, DEFAULT_INITIAL_HEAD)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              Silberschatz Standard (Head: 53)
            </button>
            <button
              onClick={() => loadPreset([82, 170, 43, 140, 24, 16, 190], 50)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              High Seek Dispersion (Head: 50)
            </button>
            <button
              onClick={() => {
                const rand = Array.from({ length: 8 }, () => Math.floor(Math.random() * maxCylinder));
                loadPreset(rand, Math.floor(Math.random() * maxCylinder));
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              <Shuffle className="w-3 h-3 text-amber-400" />
              Random 8 Requests
            </button>
          </div>

          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              showComparison
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {showComparison ? 'Hide Comparison' : 'Compare 6 Algos'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Total Head Movement</span>
          <span className="text-2xl font-bold font-mono text-indigo-400 mt-1 block">
            {result.totalHeadMovement} <span className="text-xs text-slate-500 font-normal">cylinders</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Total arm distance</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Avg Seek Length</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {result.avgSeekLength} <span className="text-xs text-slate-500 font-normal">cyl/req</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Distance / Request</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Requests Serviced</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {requestQueue.length}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">I/O Queue Size</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Head Start Position</span>
          <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
            {initialHead}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Cylinder [0 - {maxCylinder}]</span>
        </div>
      </div>

      {/* 2D Traversal Seek Graph & Path Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual 2D Seek Trajectory Chart */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>Disk Arm Trajectory Graph</span>
              <span className="text-slate-500 font-mono font-normal">({result.algorithmName})</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Seek Sequence: {result.seekSequence.join(' -> ')}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            {/* SVG 2D Traversal Graph */}
            <div className="w-full h-64 relative">
              <svg className="w-full h-full" viewBox={`0 0 500 240`} preserveAspectRatio="none">
                {/* Horizontal reference grid lines */}
                {result.seekSequence.map((_, idx) => {
                  const y = 20 + (idx / Math.max(1, result.seekSequence.length - 1)) * 200;
                  return (
                    <line
                      key={idx}
                      x1="40"
                      y1={y}
                      x2="480"
                      y2={y}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  );
                })}

                {/* Cylinder Axis Verticals at 0, mid, max */}
                <line x1="40" y1="10" x2="40" y2="225" stroke="#334155" strokeWidth="1" />
                <line x1="260" y1="10" x2="260" y2="225" stroke="#1e293b" strokeWidth="1" />
                <line x1="480" y1="10" x2="480" y2="225" stroke="#334155" strokeWidth="1" />

                {/* Trajectory Polyline */}
                {(() => {
                  const points = result.seekSequence.map((val, idx) => {
                    const x = 40 + (val / maxCylinder) * 440;
                    const y = 20 + (idx / Math.max(1, result.seekSequence.length - 1)) * 200;
                    return `${x},${y}`;
                  });

                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points.join(' ')}
                      />
                      {result.seekSequence.map((val, idx) => {
                        const x = 40 + (val / maxCylinder) * 440;
                        const y = 20 + (idx / Math.max(1, result.seekSequence.length - 1)) * 200;
                        const isStart = idx === 0;
                        return (
                          <g key={idx}>
                            <circle
                              cx={x}
                              cy={y}
                              r={isStart ? 5 : 4}
                              fill={isStart ? '#10b981' : '#818cf8'}
                              stroke="#0f172a"
                              strokeWidth="1.5"
                            />
                            <text
                              x={x}
                              y={y - 7}
                              fill="#cbd5e1"
                              fontSize="10"
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {val}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Cylinder Bottom Axis Labels */}
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-6">
              <span>Cylinder 0</span>
              <span>Cylinder {Math.round(maxCylinder / 2)}</span>
              <span>Cylinder {maxCylinder}</span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Distance Breakdown Table */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Arm Movement Steps & Cylinders Traversed
          </h3>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-2">Step</th>
                  <th className="py-2 px-2">From</th>
                  <th className="py-2 px-2">To</th>
                  <th className="py-2 px-2 font-semibold text-indigo-400">Seek (Cyl)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {result.steps.map((st) => (
                  <tr key={st.step} className="hover:bg-slate-800/40">
                    <td className="py-2 px-2 text-slate-400">#{st.step}</td>
                    <td className="py-2 px-2 text-slate-300">{st.from}</td>
                    <td className="py-2 px-2 text-slate-200 font-bold">{st.to}</td>
                    <td className="py-2 px-2 text-indigo-400 font-bold">+{st.distance}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-700 bg-slate-950 font-bold">
                  <td colSpan={3} className="py-2 px-2 text-slate-400 text-right uppercase text-[11px]">
                    Total Head Movement:
                  </td>
                  <td className="py-2 px-2 text-emerald-400 font-mono text-sm">
                    {result.totalHeadMovement}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Side-by-Side Algorithm Comparison Panel */}
      {showComparison && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Comparative Performance across 6 Disk Scheduling Algorithms
            </h3>
            {bestAlgo && (
              <span className="text-xs text-emerald-400 font-mono">
                Minimal Seek: <strong className="underline">{bestAlgo.name}</strong> ({bestAlgo.result.totalHeadMovement} cylinders)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {comparisonResults.map(({ algo, name, result: r }) => {
              const isBest = bestAlgo?.algo === algo;
              return (
                <div
                  key={algo}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isBest
                      ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">{name}</span>
                    {isBest && (
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                        Minimum Seek
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Head Movement:</span>
                      <span className="font-bold text-indigo-400">{r.totalHeadMovement} cyl</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Average Seek / Req:</span>
                      <span className="font-bold text-emerald-400">{r.avgSeekLength} cyl</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsible Execution Logs */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>Disk Arm Execution Logs ({result.executionLogs.length} entries)</span>
          <span className="text-indigo-400">{showLogs ? 'Collapse' : 'Expand Disk Logs'}</span>
        </button>
        {showLogs && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 max-h-56 overflow-y-auto space-y-1">
            {result.executionLogs.map((log, index) => (
              <div key={index} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
