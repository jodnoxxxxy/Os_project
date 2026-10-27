import React, { useState, useMemo } from 'react';
import { CpuAlgorithm, CpuSchedulingResult, Process } from '../types/os';
import { getCpuAlgorithmName, simulateCpuScheduling } from '../algorithms/cpuScheduling';
import { Plus, Trash2, Shuffle, RotateCcw, BarChart3, Clock, Cpu, Award } from 'lucide-react';

interface CpuSchedulingViewProps {
  processes: Process[];
  onUpdateProcesses: (processes: Process[]) => void;
  onResetDefaults: () => void;
}

const COLOR_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#f97316'];

export const CpuSchedulingView: React.FC<CpuSchedulingViewProps> = ({
  processes,
  onUpdateProcesses,
  onResetDefaults,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<CpuAlgorithm>('FCFS');
  const [quantum, setQuantum] = useState<number>(2);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  // Compute current algorithm simulation
  const result: CpuSchedulingResult = useMemo(() => {
    return simulateCpuScheduling(processes, selectedAlgo, quantum);
  }, [processes, selectedAlgo, quantum]);

  // Compute comparison of all algorithms
  const comparisonResults = useMemo(() => {
    if (!showComparison) return [];
    const algos: CpuAlgorithm[] = ['FCFS', 'SJF_NP', 'SRTF', 'PRIORITY_NP', 'PRIORITY_P', 'RR'];
    return algos.map((algo) => ({
      algo,
      name: getCpuAlgorithmName(algo),
      result: simulateCpuScheduling(processes, algo, quantum),
    }));
  }, [processes, quantum, showComparison]);

  const bestAlgoForWaitingTime = useMemo(() => {
    if (comparisonResults.length === 0) return null;
    return [...comparisonResults].sort((a, b) => a.result.avgWaitingTime - b.result.avgWaitingTime)[0];
  }, [comparisonResults]);

  // Handlers for process table
  const handleAddProcess = () => {
    const nextNum = processes.length + 1;
    const nextColor = COLOR_PALETTE[(nextNum - 1) % COLOR_PALETTE.length];
    const newProc: Process = {
      id: `P${nextNum}`,
      arrivalTime: processes.length > 0 ? Math.max(...processes.map((p) => p.arrivalTime)) + 1 : 0,
      burstTime: Math.floor(Math.random() * 6) + 2,
      priority: Math.floor(Math.random() * 5) + 1,
      color: nextColor,
    };
    onUpdateProcesses([...processes, newProc]);
  };

  const handleDeleteProcess = (id: string) => {
    if (processes.length <= 1) return;
    onUpdateProcesses(processes.filter((p) => p.id !== id));
  };

  const handleUpdateProcess = (id: string, field: keyof Process, value: number) => {
    onUpdateProcesses(
      processes.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: Math.max(0, value) };
        }
        return p;
      })
    );
  };

  const handleRandomize = () => {
    const count = 5;
    const newProcs: Process[] = [];
    for (let i = 1; i <= count; i++) {
      newProcs.push({
        id: `P${i}`,
        arrivalTime: Math.floor(Math.random() * 5),
        burstTime: Math.floor(Math.random() * 8) + 2,
        priority: Math.floor(Math.random() * 5) + 1,
        color: COLOR_PALETTE[(i - 1) % COLOR_PALETTE.length],
      });
    }
    onUpdateProcesses(newProcs);
  };

  return (
    <div className="space-y-6">
      {/* Module Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            CPU Process Scheduling Simulation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate and compare how operating system schedulers allocate CPU time among competing processes.
          </p>
        </div>

        {/* Algorithm Selection Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {(
            [
              ['FCFS', 'FCFS'],
              ['SJF_NP', 'SJF (NP)'],
              ['SRTF', 'SRTF (P)'],
              ['PRIORITY_NP', 'Priority (NP)'],
              ['PRIORITY_P', 'Priority (P)'],
              ['RR', 'Round Robin'],
            ] as [CpuAlgorithm, string][]
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

      {/* Control Strip & Quantum */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">Active Algorithm:</span>
          <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded">
            {getCpuAlgorithmName(selectedAlgo)}
          </span>

          {selectedAlgo === 'RR' && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
              <label className="text-xs text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Time Quantum (Q):
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={quantum}
                onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-center text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddProcess}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Add Process
          </button>
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            Randomize
          </button>
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset Presets
          </button>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              showComparison
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {showComparison ? 'Hide Comparison' : 'Compare All Algos'}
          </button>
        </div>
      </div>

      {/* Process Table & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Process Table Input ({processes.length})
            </h3>
            <span className="text-[11px] text-slate-500">Lower priority number = Higher priority</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2 px-2">PID</th>
                  <th className="py-2 px-2">Arrival (AT)</th>
                  <th className="py-2 px-2">Burst (BT)</th>
                  <th className="py-2 px-2">Priority</th>
                  <th className="py-2 px-1 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono">
                {processes.map((proc) => (
                  <tr key={proc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: proc.color }} />
                        <span className="font-bold text-slate-200">{proc.id}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        value={proc.arrivalTime}
                        onChange={(e) => handleUpdateProcess(proc.id, 'arrivalTime', parseInt(e.target.value) || 0)}
                        className="w-14 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="1"
                        value={proc.burstTime}
                        onChange={(e) => handleUpdateProcess(proc.id, 'burstTime', parseInt(e.target.value) || 1)}
                        className="w-14 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="1"
                        value={proc.priority}
                        onChange={(e) => handleUpdateProcess(proc.id, 'priority', parseInt(e.target.value) || 1)}
                        className="w-14 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <button
                        onClick={() => handleDeleteProcess(proc.id)}
                        disabled={processes.length <= 1}
                        title="Delete process"
                        className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KPI Metric Summary Cards */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block font-medium">Avg Waiting Time</span>
              <span className="text-xl font-bold font-mono text-indigo-400 mt-1 block">
                {result.avgWaitingTime} <span className="text-xs text-slate-500 font-normal">ms</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">WT = TAT - BT</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block font-medium">Avg Turnaround</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {result.avgTurnaroundTime} <span className="text-xs text-slate-500 font-normal">ms</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">TAT = CT - AT</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block font-medium">CPU Utilization</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                {result.cpuUtilization}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Busy / Total Time</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block font-medium">Throughput</span>
              <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
                {result.throughput}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Procs / Unit Time</span>
            </div>
          </div>

          {/* Interactive Gantt Chart Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>Visual Gantt Chart</span>
                <span className="text-slate-500 font-normal lowercase font-mono">({result.totalTime} ms total)</span>
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block" /> Idle
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block ml-2" /> Active
              </div>
            </div>

            {/* Gantt Bar */}
            <div className="w-full overflow-x-auto pb-2">
              <div className="min-w-[480px]">
                <div className="flex w-full h-11 rounded-md overflow-hidden border border-slate-700 bg-slate-950">
                  {result.ganttChart.map((seg, idx) => {
                    const widthPercent = (seg.duration / Math.max(1, result.totalTime)) * 100;
                    const isIdle = seg.processId === 'IDLE';

                    return (
                      <div
                        key={idx}
                        style={{
                          width: `${Math.max(widthPercent, 3)}%`,
                          backgroundColor: isIdle ? '#1e293b' : seg.color || '#4f46e5',
                        }}
                        className={`h-full flex items-center justify-center font-mono text-xs font-bold transition-all relative group border-r border-slate-900/40 ${
                          isIdle ? 'text-slate-500' : 'text-white'
                        }`}
                        title={`${seg.processId}: Time ${seg.startTime} to ${seg.endTime} (${seg.duration}ms)`}
                      >
                        <span className="truncate px-1">{seg.processId}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Timeline Axis Markers */}
                <div className="flex w-full justify-between text-[10px] font-mono text-slate-400 mt-1.5 px-0.5">
                  <span>0</span>
                  {result.ganttChart.map((seg, idx) => (
                    <span key={idx}>{seg.endTime}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Execution Result Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Process Execution Breakdown & Mathematical Proofs
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Process</th>
                <th className="py-2.5 px-3">Arrival Time (AT)</th>
                <th className="py-2.5 px-3">Burst Time (BT)</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Completion (CT)</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-400">Turnaround (TAT)</th>
                <th className="py-2.5 px-3 font-semibold text-indigo-400">Waiting Time (WT)</th>
                <th className="py-2.5 px-3">Response Time (RT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-mono">
              {result.processMetrics.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-200">{m.id}</td>
                  <td className="py-2.5 px-3 text-slate-300">{m.arrivalTime}</td>
                  <td className="py-2.5 px-3 text-slate-300">{m.burstTime}</td>
                  <td className="py-2.5 px-3 text-slate-400">{m.priority}</td>
                  <td className="py-2.5 px-3 text-slate-200">{m.completionTime}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">{m.turnaroundTime}</td>
                  <td className="py-2.5 px-3 font-bold text-indigo-400">{m.waitingTime}</td>
                  <td className="py-2.5 px-3 text-slate-300">{m.responseTime}</td>
                </tr>
              ))}
              <tr className="bg-slate-950/60 font-bold border-t border-slate-700">
                <td colSpan={5} className="py-3 px-3 text-slate-400 text-right uppercase tracking-wider text-[11px]">
                  Algorithm Averages:
                </td>
                <td className="py-3 px-3 text-emerald-400 font-mono text-sm">{result.avgTurnaroundTime} ms</td>
                <td className="py-3 px-3 text-indigo-400 font-mono text-sm">{result.avgWaitingTime} ms</td>
                <td className="py-3 px-3 text-slate-400 font-mono text-sm">{result.avgResponseTime} ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Algorithm Comparison Panel */}
      {showComparison && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Comparative Performance Matrix across All 6 CPU Schedulers
              </h3>
            </div>
            {bestAlgoForWaitingTime && (
              <span className="text-xs text-emerald-400 font-mono">
                Optimal for Min Waiting Time: <strong className="underline">{bestAlgoForWaitingTime.name}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {comparisonResults.map(({ algo, name, result: r }) => {
              const isBest = bestAlgoForWaitingTime?.algo === algo;
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
                        Best WT
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Avg Waiting Time:</span>
                      <span className="font-bold text-indigo-400">{r.avgWaitingTime} ms</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Avg Turnaround:</span>
                      <span className="font-bold text-emerald-400">{r.avgTurnaroundTime} ms</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>CPU Utilization:</span>
                      <span className="text-amber-400">{r.cpuUtilization}%</span>
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
          <span>Execution Step-by-Step Kernel Trace ({result.executionLogs.length} events)</span>
          <span className="text-indigo-400">{showLogs ? 'Collapse' : 'Expand Trace Logs'}</span>
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
