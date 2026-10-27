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
      <header className="flex flex-col gap-4 border-b border-rule pb-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Module 4</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-ink">
            <ShieldAlert className="h-5 w-5 text-accent" aria-hidden="true" />
            Deadlock avoidance
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Banker's algorithm checks whether the current allocation still leaves at least one order in
            which every process can finish. Edit the matrices and the check runs again immediately.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 rounded-md border border-rule-strong bg-wash px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-rule"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Safe example
          </button>
          <button
            type="button"
            onClick={loadUnsafePreset}
            className="flex items-center gap-1.5 rounded-md border border-bad-line/60 bg-bad-bg px-3 py-1.5 text-xs font-medium text-bad transition-colors hover:bg-bad-bg"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-bad" aria-hidden="true" />
            Unsafe example
          </button>
        </div>
      </header>

      <section
        className={`rounded-lg border p-4 ${
          safetyResult.isSafe ? 'border-good-line/40 bg-good-bg' : 'border-bad-line/40 bg-bad-bg'
        }`}
        aria-labelledby="safety-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            {safetyResult.isSafe ? (
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-good" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-bad" aria-hidden="true" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="safety-heading" className="text-sm font-semibold text-ink">
                  {safetyResult.isSafe ? 'This state is safe' : 'This state is unsafe'}
                </h2>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    safetyResult.isSafe ? 'bg-good-bg text-good' : 'bg-bad-bg text-bad'
                  }`}
                >
                  {safetyResult.isSafe ? 'Safe' : 'Unsafe'}
                </span>
              </div>

              {safetyResult.isSafe ? (
                <p className="mt-1 text-sm text-ink-soft">
                  A safe completion order exists:{' '}
                  <span className="font-mono font-semibold text-good">
                    {safetyResult.safeSequence.join(' → ')}
                  </span>
                </p>
              ) : (
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
                  No process can finish with the resources currently available. An unsafe state is not a
                  deadlock by itself, but it can become one if processes ask for everything they declared.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-md border border-rule-strong/80 bg-sheet px-3 py-2">
            <span className="text-[11px] font-medium text-ink-muted">Available now</span>
            <div className="mt-1 flex items-center gap-2">
              {state.resourceNames.map((resourceName, index) => (
                <label key={resourceName} className="flex items-center gap-1 font-mono text-xs">
                  <span className="font-semibold text-ink-muted">{resourceName}</span>
                  <input
                    type="number"
                    min={0}
                    value={state.available[index] ?? 0}
                    onChange={(event) =>
                      handleUpdateAvailable(index, Number.parseInt(event.target.value, 10) || 0)
                    }
                    aria-label={`Available instances of resource ${resourceName}`}
                    className="w-12 rounded border border-rule-strong bg-well px-1 py-0.5 text-center font-semibold text-accent focus:border-accent focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {invalidCells.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-warn-line/40 bg-warn-bg p-3 text-xs text-warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Allocation is larger than Max for {invalidCells.slice(0, 4).join(', ')}
            {invalidCells.length > 4 ? ` and ${invalidCells.length - 4} more` : ''}. Max should be at least
            as large as Allocation, otherwise the Need calculation is not meaningful.
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-rule bg-sheet p-3">
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          Processes
          <select
            value={state.processCount}
            onChange={(event) => handleProcessCount(Number(event.target.value))}
            className="rounded border border-rule-strong bg-well px-2 py-1 font-mono text-xs text-ink focus:border-accent focus:outline-none"
          >
            {PROCESS_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-ink-muted">
          Resource types
          <select
            value={state.resourceCount}
            onChange={(event) => handleResourceCount(Number(event.target.value))}
            className="rounded border border-rule-strong bg-well px-2 py-1 font-mono text-xs text-ink focus:border-accent focus:outline-none"
          >
            {RESOURCE_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <p className="text-[11px] text-ink-muted">
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
                className="w-10 rounded border border-rule bg-well px-1 py-0.5 text-center text-ink focus:border-accent focus:outline-none"
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
                className="w-10 rounded border border-rule bg-well px-1 py-0.5 text-center text-ink focus:border-accent focus:outline-none"
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
              <span key={resourceIndex} className="inline-block w-10 py-0.5 font-semibold text-accent">
                {needMatrix[processIndex]?.[resourceIndex] ?? 0}
              </span>
            ))
          )}
        />
      </div>

      <section className="rounded-lg border border-rule bg-sheet p-4" aria-labelledby="safety-steps-heading">
        <div className="mb-3">
          <h2 id="safety-steps-heading" className="text-sm font-semibold text-ink">
            Safety check
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Each step finds a process whose need fits in the current available resources, lets it finish,
            and adds its allocation back to the pool.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-rule text-ink-muted">
                <th scope="col" className="px-3 py-2 font-medium">Step</th>
                <th scope="col" className="px-3 py-2 font-medium">Process</th>
                <th scope="col" className="px-3 py-2 font-medium">Work before</th>
                <th scope="col" className="px-3 py-2 font-medium">Need</th>
                <th scope="col" className="px-3 py-2 font-medium">Allocation</th>
                <th scope="col" className="px-3 py-2 font-medium text-good">Work after</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {safetyResult.steps.map((step) => (
                <tr key={step.step} className="transition-colors hover:bg-wash">
                  <td className="px-3 py-2 text-ink-muted">{step.step}</td>
                  <td className="px-3 py-2 font-semibold text-accent">{step.processId}</td>
                  <td className="px-3 py-2 text-ink-soft">[{step.workBefore.join(', ')}]</td>
                  <td className="px-3 py-2 text-warn">[{step.need.join(', ')}]</td>
                  <td className="px-3 py-2 text-ink-muted">[{step.allocation.join(', ')}]</td>
                  <td className="px-3 py-2 font-semibold text-good">[{step.workAfter.join(', ')}]</td>
                </tr>
              ))}
              {safetyResult.steps.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-bad">
                    No process has a need that fits in the available resources, so the check cannot start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!safetyResult.isSafe && (
          <p className="mt-3 flex items-start gap-2 rounded border border-bad-line/30 bg-bad-bg p-3 text-xs leading-relaxed text-bad">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Still waiting: <strong className="font-semibold">{blockedProcesses.join(', ') || 'none'}</strong>. None of
              them can finish with the current available vector, which is why no complete safe order exists.
            </span>
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-accent/30 bg-sheet p-5" aria-labelledby="request-heading">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-accent" aria-hidden="true" />
          <h2 id="request-heading" className="text-sm font-semibold text-ink">
            Test a resource request
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-ink-muted">
          Pick a process and enter what it asks for. The request is tested against its remaining need and the
          available resources before the safety check is repeated on the temporary state.
        </p>

        <div className="flex flex-col gap-4 rounded-lg border border-rule bg-well p-3 lg:flex-row lg:items-center">
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            Process
            <select
              value={requestProc}
              onChange={(event) => {
                setRequestProc(Number(event.target.value));
                setRequestResult(null);
                setRequestApplied(false);
              }}
              className="rounded border border-rule-strong bg-sheet px-2.5 py-1 font-mono text-xs text-ink focus:border-accent focus:outline-none"
            >
              {Array.from({ length: state.processCount }, (_, index) => (
                <option key={index} value={index}>
                  P{index}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-muted">Request</span>
            {state.resourceNames.map((resourceName, index) => (
              <label key={resourceName} className="flex items-center gap-1 font-mono text-xs">
                <span className="text-ink-muted">{resourceName}</span>
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
                  className="w-12 rounded border border-rule-strong bg-sheet px-1.5 py-0.5 text-center text-ink focus:border-accent focus:outline-none"
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleEvaluateRequest}
            className="flex items-center justify-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-strong lg:ml-auto"
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
                ? 'border-good-line/50 bg-good-bg text-good'
                : 'border-bad-line/50 bg-bad-bg text-bad'
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
                    className="mt-2 flex items-center gap-1 rounded border border-good-line/40 bg-good-bg px-2 py-1 text-[11px] font-semibold text-good hover:bg-good-bg"
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

      <section className="overflow-hidden rounded-lg border border-rule bg-sheet">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-medium text-ink-muted hover:text-ink">
            <span>Detailed safety log ({safetyResult.executionLogs.length} entries)</span>
            <span className="text-accent group-open:hidden">Show</span>
            <span className="hidden text-accent group-open:inline">Hide</span>
          </summary>
          <div className="max-h-56 space-y-1 overflow-y-auto border-t border-rule bg-well p-4 font-mono text-xs leading-relaxed text-ink-soft">
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
  <section className="rounded-lg border border-rule bg-sheet p-4" aria-label={title}>
    <div className="mb-2 flex items-start justify-between gap-2">
      <div>
        <h2 className={`text-sm font-semibold ${tone === 'indigo' ? 'text-accent' : 'text-ink'}`}>{title}</h2>
        <p className="mt-0.5 text-[11px] text-ink-muted">{description}</p>
      </div>
    </div>

    <table className="w-full border-collapse text-center text-xs font-mono">
      <thead>
        <tr className="border-b border-rule text-ink-muted">
          <th scope="col" className="px-2 py-1.5 text-left font-medium">Proc</th>
          {resourceNames.map((name) => (
            <th key={name} scope="col" className="px-2 py-1.5 font-medium">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-rule">
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            <th scope="row" className="px-2 py-1.5 text-left font-semibold text-ink-soft">
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
