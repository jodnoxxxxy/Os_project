import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DiskAlgorithm, DiskDirection, DiskSchedulingResult } from '../types/os';
import { getDiskAlgorithmName, simulateDiskScheduling } from '../algorithms/diskScheduling';
import { ArrowLeft, ArrowRight, BarChart3, HardDrive, Info, RotateCcw, Shuffle } from 'lucide-react';
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

const ALGORITHMS: { id: DiskAlgorithm; label: string; hint: string }[] = [
  { id: 'FCFS', label: 'FCFS', hint: 'Serves requests in the order they arrived.' },
  { id: 'SSTF', label: 'SSTF', hint: 'Always moves to the nearest pending request.' },
  { id: 'SCAN', label: 'SCAN', hint: 'Sweeps to the end of the disk, then reverses direction.' },
  { id: 'C-SCAN', label: 'C-SCAN', hint: 'Sweeps in one direction, then jumps back to the start without serving on the return.' },
  { id: 'LOOK', label: 'LOOK', hint: 'Like SCAN, but turns around at the last request instead of the disk edge.' },
  { id: 'C-LOOK', label: 'C-LOOK', hint: 'Like C-SCAN, but only travels as far as the outermost requests.' },
];

const DIRECTION_ALGORITHMS: DiskAlgorithm[] = ['SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'];

function parseQueue(raw: string, maxCylinder: number): { values: number[]; ignored: number } {
  const tokens = raw.split(/[\s,]+/).filter((token) => token.length > 0);
  const values: number[] = [];
  let ignored = 0;

  for (const token of tokens) {
    const value = Number(token);
    if (Number.isInteger(value) && value >= 0 && value <= maxCylinder) {
      values.push(value);
    } else {
      ignored += 1;
    }
  }

  return { values, ignored };
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
  const [inputMessage, setInputMessage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const inputFocused = useRef(false);

  const directionRelevant = DIRECTION_ALGORITHMS.includes(selectedAlgo);
  const activeHint = ALGORITHMS.find((algo) => algo.id === selectedAlgo)?.hint;

  useEffect(() => {
    if (!inputFocused.current) {
      setInputQueue(requestQueue.join(', '));
      setInputMessage(null);
    }
  }, [requestQueue]);

  // Keep the setup valid when the disk size is reduced.
  useEffect(() => {
    if (initialHead > maxCylinder) onUpdateInitialHead(maxCylinder);

    const inRange = requestQueue.filter((request) => request >= 0 && request <= maxCylinder);
    if (inRange.length !== requestQueue.length) {
      onUpdateRequestQueue(inRange);
      setInputMessage(
        `Removed ${requestQueue.length - inRange.length} request(s) outside the disk range 0-${maxCylinder}.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxCylinder]);

  const handleQueueChange = (raw: string) => {
    setInputQueue(raw);
    const { values, ignored } = parseQueue(raw, maxCylinder);

    if (values.length > 0) {
      onUpdateRequestQueue(values);
    }

    if (ignored > 0) {
      setInputMessage(
        `Ignored ${ignored} ${ignored === 1 ? 'entry' : 'entries'}. Use whole numbers from 0 to ${maxCylinder}.`
      );
    } else if (values.length === 0) {
      setInputMessage(`Enter at least one cylinder between 0 and ${maxCylinder}.`);
    } else {
      setInputMessage(null);
    }
  };

  const loadPreset = (preset: number[], head: number) => {
    onUpdateRequestQueue(preset);
    onUpdateInitialHead(head);
    setInputQueue(preset.join(', '));
    setInputMessage(null);
  };

  const result: DiskSchedulingResult = useMemo(
    () => simulateDiskScheduling(requestQueue, initialHead, maxCylinder, direction, selectedAlgo),
    [requestQueue, initialHead, maxCylinder, direction, selectedAlgo]
  );

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
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-indigo-400">Module 3</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-100">
            <HardDrive className="h-5 w-5 text-indigo-400" aria-hidden="true" />
            Disk scheduling
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
            The disk arm moves between the cylinders that have pending requests. Seek length is the
            distance it travels, so a shorter total path means less mechanical work.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
          {ALGORITHMS.map((algo) => (
            <button
              key={algo.id}
              type="button"
              onClick={() => setSelectedAlgo(algo.id)}
              title={algo.hint}
              aria-pressed={selectedAlgo === algo.id}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedAlgo === algo.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {algo.label}
            </button>
          ))}
        </div>
      </header>

      <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4" aria-labelledby="disk-input-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="disk-input-heading" className="text-sm font-semibold text-slate-200">
            Inputs
          </h2>
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-300">{getDiskAlgorithmName(selectedAlgo)}</span>
            <span className="mx-1.5">·</span>
            {activeHint}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label htmlFor="disk-queue" className="mb-1 block text-xs font-medium text-slate-300">
              Request queue
            </label>
            <input
              id="disk-queue"
              type="text"
              value={inputQueue}
              onFocus={() => {
                inputFocused.current = true;
              }}
              onBlur={() => {
                inputFocused.current = false;
              }}
              onChange={(event) => handleQueueChange(event.target.value)}
              aria-describedby="disk-queue-help"
              aria-invalid={inputMessage ? true : undefined}
              className={`w-full rounded border bg-slate-950 px-3 py-1.5 font-mono text-xs text-indigo-200 focus:outline-none ${
                inputMessage ? 'border-rose-500/60 focus:border-rose-400' : 'border-slate-700 focus:border-indigo-500'
              }`}
              placeholder="98, 183, 37, 122, 14, 124, 65, 67"
            />
            <p
              id="disk-queue-help"
              className={`mt-1 text-[11px] ${inputMessage ? 'text-rose-300' : 'text-slate-500'}`}
            >
              {inputMessage ?? `${requestQueue.length} requests loaded. Use cylinders from 0 to ${maxCylinder}.`}
            </p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="disk-head" className="mb-1 block text-xs font-medium text-slate-300">
              Starting cylinder
            </label>
            <input
              id="disk-head"
              type="number"
              min={0}
              max={maxCylinder}
              value={initialHead}
              onChange={(event) =>
                onUpdateInitialHead(Math.min(maxCylinder, Math.max(0, Number.parseInt(event.target.value, 10) || 0)))
              }
              className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-center font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="disk-max" className="mb-1 block text-xs font-medium text-slate-300">
              Last cylinder
            </label>
            <input
              id="disk-max"
              type="number"
              min={50}
              max={999}
              value={maxCylinder}
              onChange={(event) =>
                onUpdateMaxCylinder(Math.min(999, Math.max(50, Number.parseInt(event.target.value, 10) || DEFAULT_MAX_CYLINDER)))
              }
              className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-center font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-300">Direction</span>
            <div
              className={`flex rounded border border-slate-700 bg-slate-950 p-0.5 ${
                directionRelevant ? '' : 'opacity-40'
              }`}
              role="group"
              aria-label="Arm direction"
            >
              <button
                type="button"
                onClick={() => onUpdateDirection('left')}
                disabled={!directionRelevant}
                aria-pressed={direction === 'left'}
                className={`flex flex-1 items-center justify-center gap-1 rounded py-1 text-xs font-medium ${
                  direction === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                } disabled:cursor-not-allowed`}
                title={directionRelevant ? 'Toward cylinder 0' : 'Only relevant for SCAN, C-SCAN, LOOK and C-LOOK'}
              >
                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                0
              </button>
              <button
                type="button"
                onClick={() => onUpdateDirection('right')}
                disabled={!directionRelevant}
                aria-pressed={direction === 'right'}
                className={`flex flex-1 items-center justify-center gap-1 rounded py-1 text-xs font-medium ${
                  direction === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                } disabled:cursor-not-allowed`}
                title={directionRelevant ? `Toward cylinder ${maxCylinder}` : 'Only relevant for SCAN, C-SCAN, LOOK and C-LOOK'}
              >
                {maxCylinder}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">Examples:</span>
            <button
              type="button"
              onClick={() => loadPreset(DEFAULT_DISK_REQUESTS, DEFAULT_INITIAL_HEAD)}
              title="The classic 8-request queue starting at cylinder 53"
              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 transition-colors hover:bg-slate-700"
            >
              Textbook queue (head 53)
            </button>
            <button
              type="button"
              onClick={() => loadPreset([82, 170, 43, 140, 24, 16, 190], 50)}
              title="Widely spread requests, where policy makes a large difference"
              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 transition-colors hover:bg-slate-700"
            >
              Spread-out requests (head 50)
            </button>
            <button
              type="button"
              onClick={() => {
                const randomQueue = Array.from({ length: 8 }, () => Math.floor(Math.random() * (maxCylinder + 1)));
                loadPreset(randomQueue, Math.floor(Math.random() * (maxCylinder + 1)));
              }}
              className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 transition-colors hover:bg-slate-700"
            >
              <Shuffle className="h-3 w-3 text-amber-400" aria-hidden="true" />
              Random 8
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowComparison((value) => !value)}
              aria-pressed={showComparison}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                showComparison
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              {showComparison ? 'Hide comparison' : 'Compare algorithms'}
            </button>
            <button
              type="button"
              onClick={onResetDefaults}
              className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>

        {!directionRelevant && (
          <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Direction only matters for SCAN, C-SCAN, LOOK and C-LOOK. FCFS and SSTF ignore it.
          </p>
        )}
      </section>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <dt className="text-[11px] font-medium text-slate-400">Total head movement</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-indigo-400">
            {result.totalHeadMovement}<span className="ml-1 text-xs font-normal text-slate-500">cyl</span>
          </dd>
          <dd className="mt-0.5 text-[10px] text-slate-500">distance travelled by the arm</dd>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <dt className="text-[11px] font-medium text-slate-400">Average seek</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-emerald-400">
            {result.avgSeekLength}<span className="ml-1 text-xs font-normal text-slate-500">cyl</span>
          </dd>
          <dd className="mt-0.5 text-[10px] text-slate-500">movement / request</dd>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <dt className="text-[11px] font-medium text-slate-400">Requests</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-amber-400">{requestQueue.length}</dd>
          <dd className="mt-0.5 text-[10px] text-slate-500">in the queue</dd>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <dt className="text-[11px] font-medium text-slate-400">Start position</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-purple-400">{initialHead}</dd>
          <dd className="mt-0.5 text-[10px] text-slate-500">cylinder 0 to {maxCylinder}</dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4 lg:col-span-7" aria-labelledby="disk-graph-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="disk-graph-heading" className="text-sm font-semibold text-slate-200">
                Arm path
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">{result.algorithmName}</p>
            </div>
            <p className="max-w-full break-all text-right font-mono text-[11px] text-slate-500">
              {result.seekSequence.join(' → ')}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="relative h-64 w-full">
              <svg
                className="h-full w-full"
                viewBox="0 0 500 240"
                preserveAspectRatio="none"
                role="img"
                aria-label={`Disk arm path: ${result.seekSequence.join(', ')}`}
              >
                {result.seekSequence.map((_, index) => {
                  const y = 20 + (index / Math.max(1, result.seekSequence.length - 1)) * 200;
                  return (
                    <line key={index} x1="40" y1={y} x2="480" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2" />
                  );
                })}

                <line x1="40" y1="10" x2="40" y2="225" stroke="#334155" strokeWidth="1" />
                <line x1="260" y1="10" x2="260" y2="225" stroke="#1e293b" strokeWidth="1" />
                <line x1="480" y1="10" x2="480" y2="225" stroke="#334155" strokeWidth="1" />

                {(() => {
                  const points = result.seekSequence.map((value, index) => {
                    const x = 40 + (value / Math.max(1, maxCylinder)) * 440;
                    const y = 20 + (index / Math.max(1, result.seekSequence.length - 1)) * 200;
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
                      {result.seekSequence.map((value, index) => {
                        const x = 40 + (value / Math.max(1, maxCylinder)) * 440;
                        const y = 20 + (index / Math.max(1, result.seekSequence.length - 1)) * 200;
                        const isStart = index === 0;
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r={isStart ? 5 : 4}
                              fill={isStart ? '#10b981' : '#818cf8'}
                              stroke="#0f172a"
                              strokeWidth="1.5"
                            >
                              <title>{`${isStart ? 'Start' : `Step ${index}`}: cylinder ${value}`}</title>
                            </circle>
                            <text x={x} y={y - 7} fill="#cbd5e1" fontSize="10" textAnchor="middle" fontFamily="monospace">
                              {value}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="mt-2 flex justify-between px-6 font-mono text-[11px] text-slate-500">
              <span>Cylinder 0</span>
              <span>Cylinder {Math.round(maxCylinder / 2)}</span>
              <span>Cylinder {maxCylinder}</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4 lg:col-span-5" aria-labelledby="disk-steps-heading">
          <div className="mb-3">
            <h2 id="disk-steps-heading" className="text-sm font-semibold text-slate-200">
              Seek steps
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Each row is one movement of the arm.</p>
          </div>

          <div className="max-h-72 overflow-y-auto">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-800 text-slate-400">
                  <th scope="col" className="px-2 py-2 font-medium">#</th>
                  <th scope="col" className="px-2 py-2 font-medium">From</th>
                  <th scope="col" className="px-2 py-2 font-medium">To</th>
                  <th scope="col" className="px-2 py-2 font-medium text-indigo-400">Seek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {result.steps.map((step) => (
                  <tr key={step.step} className="transition-colors hover:bg-slate-800/40">
                    <td className="px-2 py-2 text-slate-500">{step.step}</td>
                    <td className="px-2 py-2 text-slate-300">{step.from}</td>
                    <td className="px-2 py-2 font-semibold text-slate-200">{step.to}</td>
                    <td className="px-2 py-2 font-semibold text-indigo-400">+{step.distance}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-700 bg-slate-950/60 font-semibold">
                  <td colSpan={3} className="px-2 py-2 text-right text-[11px] font-medium text-slate-400">
                    Total
                  </td>
                  <td className="px-2 py-2 font-mono text-sm text-emerald-400">{result.totalHeadMovement}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showComparison && (
        <section className="space-y-4 rounded-lg border border-amber-500/30 bg-slate-900 p-5" aria-labelledby="disk-comparison-heading">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="disk-comparison-heading" className="text-sm font-semibold text-slate-100">
                All six policies on this queue
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Same requests and starting cylinder. Lower head movement is better.
              </p>
            </div>
            {bestAlgo && (
              <p className="text-xs text-emerald-300">
                Shortest path: <strong className="font-semibold">{bestAlgo.name}</strong> ({bestAlgo.result.totalHeadMovement} cylinders)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comparisonResults.map(({ algo, name, result: comparison }) => {
              const isBest = bestAlgo?.algo === algo;
              return (
                <div
                  key={algo}
                  className={`rounded-lg border p-3.5 ${
                    isBest ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-200">{name}</span>
                    {isBest && (
                      <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                        Shortest
                      </span>
                    )}
                  </div>

                  <dl className="mt-2.5 space-y-1 font-mono text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Head movement</dt>
                      <dd className="font-semibold text-indigo-300">{comparison.totalHeadMovement} cyl</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Average seek</dt>
                      <dd className="text-emerald-300">{comparison.avgSeekLength} cyl</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
        <button
          type="button"
          onClick={() => setShowLogs((value) => !value)}
          aria-expanded={showLogs}
          className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
        >
          <span>Disk log ({result.executionLogs.length} entries)</span>
          <span className="text-indigo-400">{showLogs ? 'Hide' : 'Show'}</span>
        </button>
        {showLogs && (
          <div className="max-h-56 space-y-1 overflow-y-auto border-t border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
            {result.executionLogs.map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
