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
      <header className="pb-0">
        <div className="max-w-2xl">
          <p className="eyebrow">Module 3</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-ink">
            <HardDrive className="h-5 w-5 text-accent" aria-hidden="true" />
            Disk scheduling
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            The disk arm moves between the cylinders that have pending requests. Seek length is the
            distance it travels, so a shorter total path means less mechanical work.
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

      <section className="space-y-4 rounded-lg border border-rule bg-sheet p-4" aria-labelledby="disk-input-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="disk-input-heading" className="text-sm font-semibold text-ink">
            Inputs
          </h2>
          <p className="text-xs text-ink-muted">
            <span className="font-medium text-ink-soft">{getDiskAlgorithmName(selectedAlgo)}</span>
            <span className="mx-1.5">·</span>
            {activeHint}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label htmlFor="disk-queue" className="mb-1 block text-xs font-medium text-ink-soft">
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
              className={`w-full rounded border bg-well px-3 py-1.5 font-mono text-xs text-accent focus:outline-none ${
                inputMessage ? 'border-bad-line/60 focus:border-bad-line' : 'border-rule-strong focus:border-accent'
              }`}
              placeholder="98, 183, 37, 122, 14, 124, 65, 67"
            />
            <p
              id="disk-queue-help"
              className={`mt-1 text-[11px] ${inputMessage ? 'text-bad' : 'text-ink-muted'}`}
            >
              {inputMessage ?? `${requestQueue.length} requests loaded. Use cylinders from 0 to ${maxCylinder}.`}
            </p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="disk-head" className="mb-1 block text-xs font-medium text-ink-soft">
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
              className="w-full rounded border border-rule-strong bg-well px-2.5 py-1.5 text-center font-mono text-xs text-ink focus:border-accent focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="disk-max" className="mb-1 block text-xs font-medium text-ink-soft">
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
              className="w-full rounded border border-rule-strong bg-well px-2.5 py-1.5 text-center font-mono text-xs text-ink focus:border-accent focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Direction</span>
            <div
              className={`flex rounded border border-rule-strong bg-well p-0.5 ${
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
                  direction === 'left' ? 'bg-accent text-white' : 'text-ink-muted hover:text-ink'
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
                  direction === 'right' ? 'bg-accent text-white' : 'text-ink-muted hover:text-ink'
                } disabled:cursor-not-allowed`}
                title={directionRelevant ? `Toward cylinder ${maxCylinder}` : 'Only relevant for SCAN, C-SCAN, LOOK and C-LOOK'}
              >
                {maxCylinder}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-ink-muted">Examples:</span>
            <button
              type="button"
              onClick={() => loadPreset(DEFAULT_DISK_REQUESTS, DEFAULT_INITIAL_HEAD)}
              title="The classic 8-request queue starting at cylinder 53"
              className="rounded border border-rule-strong bg-wash px-2.5 py-1 text-ink-soft transition-colors hover:bg-rule"
            >
              Textbook queue (head 53)
            </button>
            <button
              type="button"
              onClick={() => loadPreset([82, 170, 43, 140, 24, 16, 190], 50)}
              title="Widely spread requests, where policy makes a large difference"
              className="rounded border border-rule-strong bg-wash px-2.5 py-1 text-ink-soft transition-colors hover:bg-rule"
            >
              Spread-out requests (head 50)
            </button>
            <button
              type="button"
              onClick={() => {
                const randomQueue = Array.from({ length: 8 }, () => Math.floor(Math.random() * (maxCylinder + 1)));
                loadPreset(randomQueue, Math.floor(Math.random() * (maxCylinder + 1)));
              }}
              className="flex items-center gap-1 rounded border border-rule-strong bg-wash px-2.5 py-1 text-ink-soft transition-colors hover:bg-rule"
            >
              <Shuffle className="h-3 w-3 text-warn" aria-hidden="true" />
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
                  ? 'border-warn-line/50 bg-warn text-warn'
                  : 'border-rule-strong bg-wash text-ink hover:bg-rule'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              {showComparison ? 'Hide comparison' : 'Compare algorithms'}
            </button>
            <button
              type="button"
              onClick={onResetDefaults}
              className="flex items-center gap-1 rounded-md border border-rule-strong bg-wash px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-rule"
            >
              <RotateCcw className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>

        {!directionRelevant && (
          <p className="flex items-start gap-1.5 text-[11px] text-ink-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Direction only matters for SCAN, C-SCAN, LOOK and C-LOOK. FCFS and SSTF ignore it.
          </p>
        )}
      </section>

      <dl className="grid grid-cols-2 border-y border-rule sm:grid-cols-4">
        <div className="px-4 py-3.5">
          <dt className="text-[11px] font-medium text-ink-muted">Total head movement</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-ink">
            {result.totalHeadMovement}<span className="ml-1 text-xs font-normal text-ink-muted">cyl</span>
          </dd>
          <dd className="mt-0.5 text-[10px] text-ink-muted">distance travelled by the arm</dd>
        </div>
        <div className="border-l border-rule px-4 py-3.5">
          <dt className="text-[11px] font-medium text-ink-muted">Average seek</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-ink">
            {result.avgSeekLength}<span className="ml-1 text-xs font-normal text-ink-muted">cyl</span>
          </dd>
          <dd className="mt-0.5 text-[10px] text-ink-muted">movement / request</dd>
        </div>
        <div className="border-t border-rule px-4 py-3.5 sm:border-l sm:border-t-0">
          <dt className="text-[11px] font-medium text-ink-muted">Requests</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-ink">{requestQueue.length}</dd>
          <dd className="mt-0.5 text-[10px] text-ink-muted">in the queue</dd>
        </div>
        <div className="border-l border-t border-rule px-4 py-3.5 sm:border-t-0">
          <dt className="text-[11px] font-medium text-ink-muted">Start position</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-ink">{initialHead}</dd>
          <dd className="mt-0.5 text-[10px] text-ink-muted">cylinder 0 to {maxCylinder}</dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-lg border border-rule bg-sheet p-4 lg:col-span-7" aria-labelledby="disk-graph-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="disk-graph-heading" className="text-sm font-semibold text-ink">
                Arm path
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">{result.algorithmName}</p>
            </div>
            <p className="max-w-full break-all text-right font-mono text-[11px] text-ink-muted">
              {result.seekSequence.join(' → ')}
            </p>
          </div>

          <div className="rounded-lg border border-rule bg-well p-4">
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
                    <line key={index} x1="40" y1={y} x2="480" y2={y} stroke="#d7cfbc" strokeWidth="1" strokeDasharray="2,2" />
                  );
                })}

                <line x1="40" y1="10" x2="40" y2="225" stroke="#b9ae97" strokeWidth="1" />
                <line x1="260" y1="10" x2="260" y2="225" stroke="#d7cfbc" strokeWidth="1" />
                <line x1="480" y1="10" x2="480" y2="225" stroke="#b9ae97" strokeWidth="1" />

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
                        stroke="#1f3f66"
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
                              fill={isStart ? '#2f5d3a' : '#1f3f66'}
                              stroke="#fffdf7"
                              strokeWidth="1.5"
                            >
                              <title>{`${isStart ? 'Start' : `Step ${index}`}: cylinder ${value}`}</title>
                            </circle>
                            <text x={x} y={y - 7} fill="#4c463c" fontSize="10" textAnchor="middle" fontFamily="monospace">
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

            <div className="mt-2 flex justify-between px-6 font-mono text-[11px] text-ink-muted">
              <span>Cylinder 0</span>
              <span>Cylinder {Math.round(maxCylinder / 2)}</span>
              <span>Cylinder {maxCylinder}</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-rule bg-sheet p-4 lg:col-span-5" aria-labelledby="disk-steps-heading">
          <div className="mb-3">
            <h2 id="disk-steps-heading" className="text-sm font-semibold text-ink">
              Seek steps
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">Each row is one movement of the arm.</p>
          </div>

          <div className="max-h-72 overflow-y-auto">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead className="sticky top-0 bg-sheet">
                <tr className="border-b border-rule text-ink-muted">
                  <th scope="col" className="px-2 py-2 font-medium">#</th>
                  <th scope="col" className="px-2 py-2 font-medium">From</th>
                  <th scope="col" className="px-2 py-2 font-medium">To</th>
                  <th scope="col" className="px-2 py-2 font-medium text-accent">Seek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {result.steps.map((step) => (
                  <tr key={step.step} className="transition-colors hover:bg-wash">
                    <td className="px-2 py-2 text-ink-muted">{step.step}</td>
                    <td className="px-2 py-2 text-ink-soft">{step.from}</td>
                    <td className="px-2 py-2 font-semibold text-ink">{step.to}</td>
                    <td className="px-2 py-2 font-semibold text-accent">+{step.distance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showComparison && (
        <section className="space-y-4 rounded-lg border border-warn-line/30 bg-sheet p-5" aria-labelledby="disk-comparison-heading">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="disk-comparison-heading" className="text-sm font-semibold text-ink">
                All six policies on this queue
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Same requests and starting cylinder. Lower head movement is better.
              </p>
            </div>
            {bestAlgo && (
              <p className="text-xs text-good">
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
                    isBest ? 'border-good-line/40 bg-good-bg' : 'border-rule bg-well'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink">{name}</span>
                    {isBest && (
                      <span className="rounded bg-good-bg px-1.5 py-0.5 text-[10px] font-semibold text-good">
                        Shortest
                      </span>
                    )}
                  </div>

                  <dl className="mt-2.5 space-y-1 font-mono text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Head movement</dt>
                      <dd className="font-semibold text-ink">{comparison.totalHeadMovement} cyl</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Average seek</dt>
                      <dd className="text-ink-soft">{comparison.avgSeekLength} cyl</dd>
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
          <span>Disk log ({result.executionLogs.length} entries)</span>
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
