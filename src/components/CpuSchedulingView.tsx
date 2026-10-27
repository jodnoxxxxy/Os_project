import React, { useMemo, useState } from 'react';
import { CpuAlgorithm, CpuSchedulingResult, Process } from '../types/os';
import { getCpuAlgorithmName, simulateCpuScheduling } from '../algorithms/cpuScheduling';
import { AlertCircle, BarChart3, Clock, Cpu, Plus, RotateCcw, Shuffle, Trash2 } from 'lucide-react';

interface CpuSchedulingViewProps {
  processes: Process[];
  onUpdateProcesses: (processes: Process[]) => void;
  onResetDefaults: () => void;
  quantum: number;
  onUpdateQuantum: (quantum: number) => void;
}

const COLOR_PALETTE = ['#33608c', '#3c6b50', '#a8762a', '#6a4575', '#9b4a3d', '#2f6f73', '#8a7a2a', '#a85f2a'];
const MAX_PROCESSES = 10;

const ALGORITHMS: { id: CpuAlgorithm; label: string; hint: string }[] = [
  { id: 'FCFS', label: 'FCFS', hint: 'First come, first served. Runs processes in arrival order.' },
  { id: 'SJF_NP', label: 'SJF', hint: 'Shortest job first. The shortest ready process runs to completion.' },
  { id: 'SRTF', label: 'SRTF', hint: 'Shortest remaining time first. A shorter job can interrupt the current one.' },
  { id: 'PRIORITY_NP', label: 'Priority', hint: 'Highest-priority process runs to completion. A lower number means higher priority.' },
  { id: 'PRIORITY_P', label: 'Priority (preemptive)', hint: 'A higher-priority arrival interrupts the running process.' },
  { id: 'RR', label: 'Round robin', hint: 'Each process gets one time slice, then moves to the back of the queue.' },
];

export const CpuSchedulingView: React.FC<CpuSchedulingViewProps> = ({
  processes,
  onUpdateProcesses,
  onResetDefaults,
  quantum,
  onUpdateQuantum,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<CpuAlgorithm>('FCFS');
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  const result: CpuSchedulingResult = useMemo(
    () => simulateCpuScheduling(processes, selectedAlgo, quantum),
    [processes, selectedAlgo, quantum]
  );

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

  const activeHint = ALGORITHMS.find((algo) => algo.id === selectedAlgo)?.hint;

  const handleAddProcess = () => {
    if (processes.length >= MAX_PROCESSES) return;

    const usedNumbers = processes
      .map((process) => Number.parseInt(process.id.replace(/[^0-9]/g, ''), 10))
      .filter((value) => Number.isFinite(value));
    const nextNumber = (usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0) + 1;

    const newProcess: Process = {
      id: `P${nextNumber}`,
      arrivalTime: processes.length > 0 ? Math.max(...processes.map((process) => process.arrivalTime)) : 0,
      burstTime: 4,
      priority: 1,
      color: COLOR_PALETTE[(nextNumber - 1) % COLOR_PALETTE.length],
    };

    onUpdateProcesses([...processes, newProcess]);
  };

  const handleDeleteProcess = (id: string) => {
    if (processes.length <= 1) return;
    onUpdateProcesses(processes.filter((process) => process.id !== id));
  };

  const handleUpdateProcess = (id: string, field: 'arrivalTime' | 'burstTime' | 'priority', value: number) => {
    const minimum = field === 'arrivalTime' ? 0 : 1;
    onUpdateProcesses(
      processes.map((process) =>
        process.id === id ? { ...process, [field]: Math.max(minimum, value) } : process
      )
    );
  };

  const handleRandomize = () => {
    const newProcesses: Process[] = Array.from({ length: 5 }, (_, index) => ({
      id: `P${index + 1}`,
      arrivalTime: Math.floor(Math.random() * 5),
      burstTime: Math.floor(Math.random() * 8) + 2,
      priority: Math.floor(Math.random() * 5) + 1,
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    }));
    onUpdateProcesses(newProcesses);
  };

  return (
    <div className="space-y-6">
      <header className="pb-0">
        <div className="max-w-2xl">
          <p className="eyebrow">Module 1</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-ink">
            <Cpu className="h-5 w-5 text-accent" aria-hidden="true" />
            CPU scheduling
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Enter the processes once, then switch between scheduling policies. The Gantt chart and
            the numbers update immediately, which makes it easy to compare one policy against another.
          </p>
        </div>

        <div className="-mb-px mt-5 flex items-center gap-x-6 overflow-x-auto border-b border-rule scrollbar-none">
          {ALGORITHMS.map((algo) => (
            <button
              key={algo.id}
              type="button"
              onClick={() => setSelectedAlgo(algo.id)}
              title={algo.hint}
              aria-pressed={selectedAlgo === algo.id}
              className={`-mb-px shrink-0 border-b-2 pb-2 text-xs transition-colors ${
                selectedAlgo === algo.id
                  ? 'border-accent font-medium text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {algo.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-lg border border-rule bg-sheet p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm text-ink-soft">
            <span className="font-medium text-ink">{getCpuAlgorithmName(selectedAlgo)}</span>
            <span className="ml-2 text-ink-muted">{activeHint}</span>
          </p>

          {selectedAlgo === 'RR' && (
            <label className="flex items-center gap-2 text-xs text-ink-soft">
              <Clock className="h-3.5 w-3.5 text-warn" aria-hidden="true" />
              Time slice
              <input
                type="number"
                min={1}
                max={20}
                value={quantum}
                onChange={(event) => onUpdateQuantum(Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
                className="w-14 rounded border border-rule-strong bg-well px-2 py-1 text-center text-xs text-ink focus:border-accent focus:outline-none"
                aria-label="Round robin time slice"
              />
              <span className="text-ink-muted">ms</span>
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAddProcess}
            disabled={processes.length >= MAX_PROCESSES}
            title={processes.length >= MAX_PROCESSES ? `The table holds up to ${MAX_PROCESSES} processes.` : 'Add a row to the process table'}
            className="flex items-center gap-1 rounded-md border border-rule-strong bg-wash px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-rule disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5 text-good" aria-hidden="true" />
            Add process
          </button>
          <button
            type="button"
            onClick={handleRandomize}
            className="flex items-center gap-1 rounded-md border border-rule-strong bg-wash px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-rule"
          >
            <Shuffle className="h-3.5 w-3.5 text-warn" aria-hidden="true" />
            Randomise
          </button>
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1 rounded-md border border-rule-strong bg-wash px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-rule"
          >
            <RotateCcw className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
            Reset example
          </button>
          <button
            type="button"
            onClick={() => setShowComparison((value) => !value)}
            aria-pressed={showComparison}
            className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showComparison
                ? 'border-warn-line/50 bg-warn text-warn'
                : 'border-rule-strong bg-wash text-ink hover:bg-rule'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
            {showComparison ? 'Hide comparison' : 'Compare algorithms'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5 rounded-lg border border-rule bg-sheet p-4" aria-labelledby="cpu-input-heading">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 id="cpu-input-heading" className="text-sm font-semibold text-ink">
                Processes
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">{processes.length} of {MAX_PROCESSES} rows used</p>
            </div>
            <p className="max-w-[9rem] text-right text-[11px] leading-snug text-ink-muted">
              A lower priority number means a more important process.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-rule text-ink-muted">
                  <th scope="col" className="px-2 py-2 font-medium">Process</th>
                  <th scope="col" className="px-2 py-2 font-medium" title="When the process becomes ready">
                    Arrival
                  </th>
                  <th scope="col" className="px-2 py-2 font-medium" title="How much CPU time it needs">
                    Burst
                  </th>
                  <th scope="col" className="px-2 py-2 font-medium" title="Lower value means higher priority">
                    Priority
                  </th>
                  <th scope="col" className="px-1 py-2 text-center font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {processes.map((process) => (
                  <tr key={process.id} className="transition-colors hover:bg-wash">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: process.color }} aria-hidden="true" />
                        <span className="font-mono font-semibold text-ink">{process.id}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        value={process.arrivalTime}
                        onChange={(event) =>
                          handleUpdateProcess(process.id, 'arrivalTime', Number.parseInt(event.target.value, 10) || 0)
                        }
                        aria-label={`${process.id} arrival time`}
                        className="w-14 rounded border border-rule bg-well px-1.5 py-1 text-ink focus:border-accent focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={1}
                        value={process.burstTime}
                        onChange={(event) =>
                          handleUpdateProcess(process.id, 'burstTime', Number.parseInt(event.target.value, 10) || 1)
                        }
                        aria-label={`${process.id} burst time`}
                        className="w-14 rounded border border-rule bg-well px-1.5 py-1 text-ink focus:border-accent focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={1}
                        value={process.priority}
                        onChange={(event) =>
                          handleUpdateProcess(process.id, 'priority', Number.parseInt(event.target.value, 10) || 1)
                        }
                        aria-label={`${process.id} priority`}
                        className="w-14 rounded border border-rule bg-well px-1.5 py-1 text-ink focus:border-accent focus:outline-none"
                      />
                    </td>
                    <td className="px-1 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteProcess(process.id)}
                        disabled={processes.length <= 1}
                        title={processes.length <= 1 ? 'Keep at least one process' : `Remove ${process.id}`}
                        aria-label={`Remove ${process.id}`}
                        className="rounded p-1 text-ink-muted transition-colors hover:text-bad disabled:cursor-not-allowed disabled:opacity-20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {processes.length >= MAX_PROCESSES && (
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-warn/80">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              The table is full. Remove a row before adding another process.
            </p>
          )}
        </section>

        <div className="flex flex-col justify-between gap-4 lg:col-span-7">
          <dl className="grid grid-cols-2 border-y border-rule sm:grid-cols-4">
            <div className="px-4 py-3.5">
              <dt className="text-[11px] font-medium text-ink-muted">Average waiting</dt>
              <dd className="mt-1 font-mono text-xl font-semibold text-ink">
                {result.avgWaitingTime}<span className="ml-1 text-xs font-normal text-ink-muted">ms</span>
              </dd>
              <dd className="mt-0.5 font-mono text-[10px] text-ink-muted">TAT - burst</dd>
            </div>
            <div className="border-l border-rule px-4 py-3.5">
              <dt className="text-[11px] font-medium text-ink-muted">Average turnaround</dt>
              <dd className="mt-1 font-mono text-xl font-semibold text-ink">
                {result.avgTurnaroundTime}<span className="ml-1 text-xs font-normal text-ink-muted">ms</span>
              </dd>
              <dd className="mt-0.5 font-mono text-[10px] text-ink-muted">completion - arrival</dd>
            </div>
            <div className="border-t border-rule px-4 py-3.5 sm:border-l sm:border-t-0">
              <dt className="text-[11px] font-medium text-ink-muted">CPU utilisation</dt>
              <dd className="mt-1 font-mono text-xl font-semibold text-ink">{result.cpuUtilization}%</dd>
              <dd className="mt-0.5 font-mono text-[10px] text-ink-muted">busy / total time</dd>
            </div>
            <div className="border-l border-t border-rule px-4 py-3.5 sm:border-t-0">
              <dt className="text-[11px] font-medium text-ink-muted">Throughput</dt>
              <dd className="mt-1 font-mono text-xl font-semibold text-ink">{result.throughput}</dd>
              <dd className="mt-0.5 font-mono text-[10px] text-ink-muted">processes per time unit</dd>
            </div>
          </dl>

          <section className="rounded-lg border border-rule bg-sheet p-4" aria-labelledby="gantt-heading">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id="gantt-heading" className="text-sm font-semibold text-ink">
                Gantt chart
              </h2>
              <p className="font-mono text-[11px] text-ink-muted">{result.totalTime} ms total</p>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="min-w-[420px]">
                <div className="flex h-11 w-full overflow-hidden rounded-md border border-rule-strong bg-well">
                  {result.ganttChart.map((segment, index) => {
                    const isIdle = segment.processId === 'IDLE';
                    return (
                      <div
                        key={`${segment.processId}-${segment.startTime}-${index}`}
                        style={{
                          flexGrow: Math.max(segment.duration, 0.25),
                          flexBasis: 0,
                          minWidth: 18,
                          backgroundColor: isIdle ? '#e9e2d1' : segment.color || '#1f3f66',
                        }}
                        className={`flex h-full min-w-0 items-center justify-center border-r border-rule/60 font-mono text-xs font-semibold ${
                          isIdle ? 'text-ink-muted' : 'text-white'
                        }`}
                        title={`${isIdle ? 'Idle' : segment.processId}: ${segment.startTime} to ${segment.endTime} ms (${segment.duration} ms)`}
                      >
                        <span className="truncate px-1">{isIdle ? 'idle' : segment.processId}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="relative mt-1 h-4 font-mono text-[10px] text-ink-muted" aria-hidden="true">
                  <span className="absolute left-0">0</span>
                  <span className="absolute right-0">{result.totalTime} ms</span>
                </div>
              </div>
            </div>

            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-muted">
              {processes.map((process) => (
                <li key={process.id} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: process.color }} aria-hidden="true" />
                  {process.id}
                </li>
              ))}
              <li className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rule" aria-hidden="true" />
                idle
              </li>
            </ul>
          </section>
        </div>
      </div>

      <section className="rounded-lg border border-rule bg-sheet p-4" aria-labelledby="cpu-results-heading">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 id="cpu-results-heading" className="text-sm font-semibold text-ink">
            Per-process results
          </h2>
          <p className="font-mono text-[10px] text-ink-muted">AT arrival · BT burst · CT completion · TAT turnaround · WT waiting · RT response</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-rule text-ink-muted">
                <th scope="col" className="px-3 py-2.5 font-medium">Process</th>
                <th scope="col" className="px-3 py-2.5 font-medium">AT</th>
                <th scope="col" className="px-3 py-2.5 font-medium">BT</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Priority</th>
                <th scope="col" className="px-3 py-2.5 font-medium">CT</th>
                <th scope="col" className="px-3 py-2.5 font-medium text-good">TAT</th>
                <th scope="col" className="px-3 py-2.5 font-medium text-accent">WT</th>
                <th scope="col" className="px-3 py-2.5 font-medium">RT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-mono">
              {result.processMetrics.map((metric) => (
                <tr key={metric.id} className="transition-colors hover:bg-wash">
                  <td className="px-3 py-2.5 font-semibold text-ink">{metric.id}</td>
                  <td className="px-3 py-2.5 text-ink-soft">{metric.arrivalTime}</td>
                  <td className="px-3 py-2.5 text-ink-soft">{metric.burstTime}</td>
                  <td className="px-3 py-2.5 text-ink-muted">{metric.priority}</td>
                  <td className="px-3 py-2.5 text-ink">{metric.completionTime}</td>
                  <td className="px-3 py-2.5 font-semibold text-good">{metric.turnaroundTime}</td>
                  <td className="px-3 py-2.5 font-semibold text-accent">{metric.waitingTime}</td>
                  <td className="px-3 py-2.5 text-ink-soft">{metric.responseTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showComparison && (
        <section className="space-y-4 rounded-lg border border-warn-line/30 bg-sheet p-5" aria-labelledby="cpu-comparison-heading">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="cpu-comparison-heading" className="text-sm font-semibold text-ink">
                All six algorithms on this workload
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                The same processes, measured by average waiting time. Round robin uses a time slice of {quantum} ms.
              </p>
            </div>
            {bestAlgoForWaitingTime && (
              <p className="text-xs text-good">
                Lowest waiting time: <strong className="font-semibold">{bestAlgoForWaitingTime.name}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {comparisonResults.map(({ algo, name, result: comparison }) => {
              const isBest = bestAlgoForWaitingTime?.algo === algo;
              return (
                <div
                  key={algo}
                  className={`rounded-lg border p-3.5 ${
                    isBest ? 'border-good-line/40 bg-good-bg' : 'border-rule bg-well'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink">{name}</span>
                    {isBest && (
                      <span className="rounded bg-good-bg px-1.5 py-0.5 text-[10px] font-semibold text-good">
                        Lowest WT
                      </span>
                    )}
                  </div>

                  <dl className="mt-2.5 space-y-1 font-mono text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Average waiting</dt>
                      <dd className="font-semibold text-ink">{comparison.avgWaitingTime} ms</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Average turnaround</dt>
                      <dd className="text-ink-soft">{comparison.avgTurnaroundTime} ms</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">CPU utilisation</dt>
                      <dd className="text-ink-soft">{comparison.cpuUtilization}%</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-rule bg-sheet">
        <button
          type="button"
          onClick={() => setShowLogs((value) => !value)}
          aria-expanded={showLogs}
          className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <span>Simulation log ({result.executionLogs.length} entries)</span>
          <span className="text-accent">{showLogs ? 'Hide' : 'Show'}</span>
        </button>
        {showLogs && (
          <div className="max-h-56 space-y-1 overflow-y-auto border-t border-rule bg-well p-4 font-mono text-xs leading-relaxed text-ink-soft">
            {result.executionLogs.map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
