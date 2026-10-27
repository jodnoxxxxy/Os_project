import React, { useEffect, useMemo, useState } from 'react';
import { BankersResult, BankersState } from '../types/os';
import { evaluateResourceRequest, runBankersSafety } from '../algorithms/bankersAlgorithm';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Play,
  RefreshCw,
  Send,
  ShieldAlert,
} from 'lucide-react';

interface BankersViewProps {
  state: BankersState;
  onUpdateState: (newState: BankersState) => void;
  onResetDefaults: () => void;
}

const RESOURCE_NAMES = ['A', 'B', 'C', 'D'];
const PROCESS_OPTIONS = [3, 4, 5, 6];
const RESOURCE_OPTIONS = [2, 3, 4];

function resizeState(state: BankersState, nextProcessCount: number, nextResourceCount: number): BankersState {
  const pick = (matrix: number[][], row: number, column: number) => matrix[row]?.[column] ?? 0;

  return {
    ...state,
    processCount: nextProcessCount,
    resourceCount: nextResourceCount,
    resourceNames: RESOURCE_NAMES.slice(0, nextResourceCount),
    allocation: Array.from({ length: nextProcessCount }, (_, row) =>
      Array.from({ length: nextResourceCount }, (_, column) => pick(state.allocation, row, column))
    ),
    max: Array.from({ length: nextProcessCount }, (_, row) =>
      Array.from({ length: nextResourceCount }, (_, column) => pick(state.max, row, column))
    ),
    need: [],
    available: Array.from({ length: nextResourceCount }, (_, column) => state.available[column] ?? 0),
  };
}

function buildNeedMatrix(state: BankersState): number[][] {
  return Array.from({ length: state.processCount }, (_, row) =>
    Array.from({ length: state.resourceCount }, (_, column) =>
      Math.max(0, (state.max[row]?.[column] ?? 0) - (state.allocation[row]?.[column] ?? 0))
    )
  );
}

export const BankersView: React.FC<BankersViewProps> = ({ state, onUpdateState, onResetDefaults }) => {
  const [requestProc, setRequestProc] = useState<number>(0);
  const [requestVector, setRequestVector] = useState<number[]>(Array(state.resourceCount).fill(0));
  const [requestResult, setRequestResult] = useState<{ allowed: boolean; message: string } | null>(null);
  const [requestApplied, setRequestApplied] = useState(false);

  const safetyResult: BankersResult = useMemo(() => runBankersSafety(state), [state]);
  const needMatrix = useMemo(() => buildNeedMatrix(state), [state]);

  const invalidCells = useMemo(() => {
    const cells: string[] = [];
    for (let row = 0; row < state.processCount; row += 1) {
      for (let column = 0; column < state.resourceCount; column += 1) {
        if ((state.allocation[row]?.[column] ?? 0) > (state.max[row]?.[column] ?? 0)) {
          cells.push(`P${row} / ${state.resourceNames[column] ?? column}`);
        }
      }
    }
    return cells;
  }, [state]);

  const blockedProcesses = useMemo(() => {
    const finished = new Set(safetyResult.safeSequence);
    return Array.from({ length: state.processCount }, (_, index) => `P${index}`).filter((id) => !finished.has(id));
  }, [safetyResult, state.processCount]);

  useEffect(() => {
    setRequestProc((current) => Math.min(current, Math.max(0, state.processCount - 1)));
  }, [state.processCount]);

  useEffect(() => {
    setRequestVector((current) =>
      Array.from({ length: state.resourceCount }, (_, index) => current[index] ?? 0)
    );
    setRequestResult(null);
    setRequestApplied(false);
  }, [state.resourceCount]);

  const updateCell = (
    matrix: 'allocation' | 'max',
    processIndex: number,
    resourceIndex: number,
    value: number
  ) => {
    const nextMatrix = state[matrix].map((row, rowIndex) =>
      rowIndex === processIndex
        ? row.map((cell, columnIndex) => (columnIndex === resourceIndex ? Math.max(0, value) : cell))
        : [...row]
    );

    onUpdateState({ ...state, [matrix]: nextMatrix });
    setRequestResult(null);
    setRequestApplied(false);
  };

  const handleUpdateAvailable = (resourceIndex: number, value: number) => {
    const nextAvailable = state.available.map((cell, index) =>
      index === resourceIndex ? Math.max(0, value) : cell
    );
    onUpdateState({ ...state, available: nextAvailable });
    setRequestResult(null);
    setRequestApplied(false);
  };

  const handleProcessCount = (count: number) => {
    onUpdateState(resizeState(state, count, state.resourceCount));
    setRequestResult(null);
    setRequestApplied(false);
  };

  const handleResourceCount = (count: number) => {
    onUpdateState(resizeState(state, state.processCount, count));
    setRequestResult(null);
    setRequestApplied(false);
  };

  const handleEvaluateRequest = () => {
    const vector = Array.from({ length: state.resourceCount }, (_, index) => requestVector[index] ?? 0);
    const evaluation = evaluateResourceRequest(state, requestProc, vector);
    setRequestResult({ allowed: evaluation.allowed, message: evaluation.message });
    setRequestApplied(false);
  };

  const handleApplyRequest = () => {
    const vector = Array.from({ length: state.resourceCount }, (_, index) => requestVector[index] ?? 0);

    onUpdateState({
      ...state,
      allocation: state.allocation.map((row, rowIndex) =>
        rowIndex === requestProc ? row.map((cell, columnIndex) => cell + vector[columnIndex]) : [...row]
      ),
      available: state.available.map((cell, columnIndex) => Math.max(0, cell - vector[columnIndex])),
    });

    setRequestResult({
      allowed: true,
      message: `The request for P${requestProc} [${vector.join(', ')}] was applied. The matrices above now include the new allocation.`,
    });
    setRequestApplied(true);
  };

  const loadUnsafePreset = () => {
    const allocation = [
      [0, 1, 0],
      [3, 0, 2],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ];
    const max = [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [4, 2, 2],
      [5, 3, 3],
    ];

    onUpdateState({
      processCount: 5,
      resourceCount: 3,
      resourceNames: ['A', 'B', 'C'],
      allocation,
      max,
      need: allocation.map((row, index) => row.map((value, column) => Math.max(0, max[index][column] - value))),
      available: [0, 0, 0],
    });
    setRequestProc(0);
    setRequestVector([0, 0, 0]);
    setRequestResult(null);
    setRequestApplied(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-indigo-400">Module 4</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-100">
            <ShieldAlert className="h-5 w-5 text-indigo-400" aria-hidden="true" />
            Deadlock avoidance
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
            Banker's algorithm checks whether the current allocation still leaves at least one order in
            which every process can finish. Edit the matrices and the check runs again immediately.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Safe example
          </button>
          <button
            type="button"
            onClick={loadUnsafePreset}
            className="flex items-center gap-1.5 rounded-md border border-rose-800/60 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-900/50"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
            Unsafe example
          </button>
        </div>
      </header>

      <section
        className={`rounded-lg border p-4 ${
          safetyResult.isSafe ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-rose-500/40 bg-rose-950/20'
        }`}
        aria-labelledby="safety-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            {safetyResult.isSafe ? (
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-rose-400" aria-hidden="true" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="safety-heading" className="text-sm font-semibold text-slate-100">
                  {safetyResult.isSafe ? 'This state is safe' : 'This state is unsafe'}
                </h2>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    safetyResult.isSafe ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
                  }`}
                >
                  {safetyResult.isSafe ? 'Safe' : 'Unsafe'}
                </span>
              </div>

              {safetyResult.isSafe ? (
                <p className="mt-1 text-sm text-slate-300">
                  A safe completion order exists:{' '}
                  <span className="font-mono font-semibold text-emerald-300">
                    {safetyResult.safeSequence.join(' → ')}
                  </span>
                </p>
              ) : (
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-300">
                  No process can finish with the resources currently available. An unsafe state is not a
                  deadlock by itself, but it can become one if processes ask for everything they declared.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-md border border-slate-700/80 bg-slate-900/90 px-3 py-2">
            <span className="text-[11px] font-medium text-slate-400">Available now</span>
            <div className="mt-1 flex items-center gap-2">
              {state.resourceNames.map((resourceName, index) => (
                <label key={resourceName} className="flex items-center gap-1 font-mono text-xs">
                  <span className="font-semibold text-slate-400">{resourceName}</span>
                  <input
                    type="number"
                    min={0}
                    value={state.available[index] ?? 0}
                    onChange={(event) =>
                      handleUpdateAvailable(index, Number.parseInt(event.target.value, 10) || 0)
                    }
                    aria-label={`Available instances of resource ${resourceName}`}
                    className="w-12 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-center font-semibold text-indigo-300 focus:border-indigo-500 focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {invalidCells.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Allocation is larger than Max for {invalidCells.slice(0, 4).join(', ')}
            {invalidCells.length > 4 ? ` and ${invalidCells.length - 4} more` : ''}. Max should be at least
            as large as Allocation, otherwise the Need calculation is not meaningful.
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Processes
          <select
            value={state.processCount}
            onChange={(event) => handleProcessCount(Number(event.target.value))}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            {PROCESS_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-400">
          Resource types
          <select
            value={state.resourceCount}
            onChange={(event) => handleResourceCount(Number(event.target.value))}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            {RESOURCE_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <p className="text-[11px] text-slate-500">
          Need = Max − Allocation. It is shown read-only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MatrixCard
          title="Allocated"
          description="Resources each process is holding right now."
          resourceNames={state.resourceNames}
          rows={Array.from({ length: state.processCount }, (_, processIndex) =>
            state.resourceNames.map((_, resourceIndex) => (
              <input
                key={resourceIndex}
                type="number"
                min={0}
                value={state.allocation[processIndex]?.[resourceIndex] ?? 0}
                onChange={(event) =>
                  updateCell(
                    'allocation',
                    processIndex,
                    resourceIndex,
                    Number.parseInt(event.target.value, 10) || 0
                  )
                }
                aria-label={`Allocation for P${processIndex}, resource ${state.resourceNames[resourceIndex]}`}
                className="w-10 rounded border border-slate-800 bg-slate-950 px-1 py-0.5 text-center text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            ))
          )}
        />

        <MatrixCard
          title="Max"
          description="The most each process may ever request."
          resourceNames={state.resourceNames}
          rows={Array.from({ length: state.processCount }, (_, processIndex) =>
            state.resourceNames.map((_, resourceIndex) => (
              <input
                key={resourceIndex}
                type="number"
                min={0}
                value={state.max[processIndex]?.[resourceIndex] ?? 0}
                onChange={(event) =>
                  updateCell('max', processIndex, resourceIndex, Number.parseInt(event.target.value, 10) || 0)
                }
                aria-label={`Maximum claim for P${processIndex}, resource ${state.resourceNames[resourceIndex]}`}
                className="w-10 rounded border border-slate-800 bg-slate-950 px-1 py-0.5 text-center text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            ))
          )}
        />

        <MatrixCard
          title="Need"
          description="Still needed before each process can finish."
          resourceNames={state.resourceNames}
          tone="indigo"
          rows={Array.from({ length: state.processCount }, (_, processIndex) =>
            state.resourceNames.map((_, resourceIndex) => (
              <span key={resourceIndex} className="inline-block w-10 py-0.5 font-semibold text-indigo-300">
                {needMatrix[processIndex]?.[resourceIndex] ?? 0}
              </span>
            ))
          )}
        />
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4" aria-labelledby="safety-steps-heading">
        <div className="mb-3">
          <h2 id="safety-steps-heading" className="text-sm font-semibold text-slate-200">
            Safety check
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Each step finds a process whose need fits in the current available resources, lets it finish,
            and adds its allocation back to the pool.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th scope="col" className="px-3 py-2 font-medium">Step</th>
                <th scope="col" className="px-3 py-2 font-medium">Process</th>
                <th scope="col" className="px-3 py-2 font-medium">Work before</th>
                <th scope="col" className="px-3 py-2 font-medium">Need</th>
                <th scope="col" className="px-3 py-2 font-medium">Allocation</th>
                <th scope="col" className="px-3 py-2 font-medium text-emerald-400">Work after</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {safetyResult.steps.map((step) => (
                <tr key={step.step} className="transition-colors hover:bg-slate-800/40">
                  <td className="px-3 py-2 text-slate-500">{step.step}</td>
                  <td className="px-3 py-2 font-semibold text-indigo-300">{step.processId}</td>
                  <td className="px-3 py-2 text-slate-300">[{step.workBefore.join(', ')}]</td>
                  <td className="px-3 py-2 text-amber-300">[{step.need.join(', ')}]</td>
                  <td className="px-3 py-2 text-slate-400">[{step.allocation.join(', ')}]</td>
                  <td className="px-3 py-2 font-semibold text-emerald-400">[{step.workAfter.join(', ')}]</td>
                </tr>
              ))}
              {safetyResult.steps.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-rose-300">
                    No process has a need that fits in the available resources, so the check cannot start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!safetyResult.isSafe && (
          <p className="mt-3 flex items-start gap-2 rounded border border-rose-500/30 bg-rose-950/20 p-3 text-xs leading-relaxed text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Still waiting: <strong className="font-semibold">{blockedProcesses.join(', ') || 'none'}</strong>. None of
              them can finish with the current available vector, which is why no complete safe order exists.
            </span>
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-indigo-500/30 bg-slate-900 p-5" aria-labelledby="request-heading">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          <h2 id="request-heading" className="text-sm font-semibold text-slate-100">
            Test a resource request
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          Pick a process and enter what it asks for. The request is tested against its remaining need and the
          available resources before the safety check is repeated on the temporary state.
        </p>

        <div className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950 p-3 lg:flex-row lg:items-center">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Process
            <select
              value={requestProc}
              onChange={(event) => {
                setRequestProc(Number(event.target.value));
                setRequestResult(null);
                setRequestApplied(false);
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              {Array.from({ length: state.processCount }, (_, index) => (
                <option key={index} value={index}>
                  P{index}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Request</span>
            {state.resourceNames.map((resourceName, index) => (
              <label key={resourceName} className="flex items-center gap-1 font-mono text-xs">
                <span className="text-slate-400">{resourceName}</span>
                <input
                  type="number"
                  min={0}
                  value={requestVector[index] ?? 0}
                  onChange={(event) => {
                    const value = Math.max(0, Number.parseInt(event.target.value, 10) || 0);
                    setRequestVector((current) =>
                      current.map((cell, cellIndex) => (cellIndex === index ? value : cell))
                    );
                    setRequestResult(null);
                    setRequestApplied(false);
                  }}
                  aria-label={`Requested instances of resource ${resourceName}`}
                  className="w-12 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-center text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleEvaluateRequest}
            className="flex items-center justify-center gap-1.5 rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 lg:ml-auto"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Evaluate
          </button>
        </div>

        {requestResult && (
          <div
            role="status"
            className={`rounded-lg border p-3.5 text-xs leading-relaxed ${
              requestResult.allowed
                ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
                : 'border-rose-500/50 bg-rose-950/30 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {requestResult.allowed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <div>
                <p className="font-semibold">{requestResult.allowed ? 'Request can be granted' : 'Request must wait'}</p>
                <p className="mt-1">{requestResult.message}</p>
                {requestResult.allowed && !requestApplied && (
                  <button
                    type="button"
                    onClick={handleApplyRequest}
                    className="mt-2 flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-900/30 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-900/50"
                  >
                    <Check className="h-3 w-3" aria-hidden="true" />
                    Apply this request
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-medium text-slate-400 hover:text-slate-200">
            <span>Detailed safety log ({safetyResult.executionLogs.length} entries)</span>
            <span className="text-indigo-400 group-open:hidden">Show</span>
            <span className="hidden text-indigo-400 group-open:inline">Hide</span>
          </summary>
          <div className="max-h-56 space-y-1 overflow-y-auto border-t border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
            {safetyResult.executionLogs.map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
};

interface MatrixCardProps {
  title: string;
  description: string;
  resourceNames: string[];
  rows: React.ReactNode[];
  tone?: 'default' | 'indigo';
}

const MatrixCard: React.FC<MatrixCardProps> = ({ title, description, resourceNames, rows, tone = 'default' }) => (
  <section className="rounded-lg border border-slate-800 bg-slate-900 p-4" aria-label={title}>
    <div className="mb-2 flex items-start justify-between gap-2">
      <div>
        <h2 className={`text-sm font-semibold ${tone === 'indigo' ? 'text-indigo-300' : 'text-slate-200'}`}>{title}</h2>
        <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
      </div>
    </div>

    <table className="w-full border-collapse text-center text-xs font-mono">
      <thead>
        <tr className="border-b border-slate-800 text-slate-400">
          <th scope="col" className="px-2 py-1.5 text-left font-medium">Proc</th>
          {resourceNames.map((name) => (
            <th key={name} scope="col" className="px-2 py-1.5 font-medium">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800">
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            <th scope="row" className="px-2 py-1.5 text-left font-semibold text-slate-300">
              P{rowIndex}
            </th>
            {resourceNames.map((name, columnIndex) => (
              <td key={name} className="px-1 py-1">
                {Array.isArray(row) ? row[columnIndex] : row}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);
