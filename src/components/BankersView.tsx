import React, { useState, useMemo } from 'react';
import { BankersResult, BankersState } from '../types/os';
import { evaluateResourceRequest, runBankersSafety } from '../algorithms/bankersAlgorithm';
import { ShieldAlert, CheckCircle2, AlertTriangle, Play, RefreshCw, Send, HelpCircle } from 'lucide-react';
import { DEFAULT_BANKERS_STATE } from '../utils/defaults';

interface BankersViewProps {
  state: BankersState;
  onUpdateState: (newState: BankersState) => void;
  onResetDefaults: () => void;
}

export const BankersView: React.FC<BankersViewProps> = ({
  state,
  onUpdateState,
  onResetDefaults,
}) => {
  // Request evaluation state
  const [requestProc, setRequestProc] = useState<number>(1);
  const [requestVector, setRequestVector] = useState<number[]>([1, 0, 2]);
  const [requestResult, setRequestResult] = useState<{ allowed: boolean; message: string } | null>(null);

  // Compute live safety check
  const safetyResult: BankersResult = useMemo(() => {
    return runBankersSafety(state);
  }, [state]);

  const handleUpdateAllocation = (procIdx: number, resIdx: number, val: number) => {
    const newAlloc = state.allocation.map((row, rIdx) => {
      if (rIdx === procIdx) {
        const newRow = [...row];
        newRow[resIdx] = Math.max(0, val);
        return newRow;
      }
      return [...row];
    });

    onUpdateState({
      ...state,
      allocation: newAlloc,
    });
  };

  const handleUpdateMax = (procIdx: number, resIdx: number, val: number) => {
    const newMax = state.max.map((row, rIdx) => {
      if (rIdx === procIdx) {
        const newRow = [...row];
        newRow[resIdx] = Math.max(0, val);
        return newRow;
      }
      return [...row];
    });

    onUpdateState({
      ...state,
      max: newMax,
    });
  };

  const handleUpdateAvailable = (resIdx: number, val: number) => {
    const newAvail = [...state.available];
    newAvail[resIdx] = Math.max(0, val);
    onUpdateState({
      ...state,
      available: newAvail,
    });
  };

  const handleEvaluateRequest = () => {
    const evalRes = evaluateResourceRequest(state, requestProc, requestVector);
    setRequestResult({
      allowed: evalRes.allowed,
      message: evalRes.message,
    });
  };

  const loadUnsafePreset = () => {
    onUpdateState({
      processCount: 5,
      resourceCount: 3,
      resourceNames: ['A', 'B', 'C'],
      allocation: [
        [0, 1, 0],
        [3, 0, 2],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [4, 2, 2],
        [5, 3, 3],
      ],
      need: [],
      available: [0, 0, 0], // Starved available
    });
    setRequestResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            Banker’s Algorithm for Deadlock Avoidance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tests safety invariants (Need ≤ Work) to prevent circular-wait conditions and deadlocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Standard Safe Benchmark
          </button>
          <button
            onClick={loadUnsafePreset}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 rounded-md transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Load Unsafe State
          </button>
        </div>
      </div>

      {/* Safety State Status Banner */}
      <div
        className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          safetyResult.isSafe
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : 'bg-rose-950/20 border-rose-500/40'
        }`}
      >
        <div className="flex items-start gap-3">
          {safetyResult.isSafe ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                {safetyResult.isSafe ? 'System is in a SAFE STATE' : 'DEADLOCK DETECTED / UNSAFE STATE'}
              </h3>
              <span
                className={`text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${
                  safetyResult.isSafe
                    ? 'bg-emerald-900/60 text-emerald-300'
                    : 'bg-rose-900/60 text-rose-300'
                }`}
              >
                {safetyResult.isSafe ? 'No Deadlock' : 'Unsafe Invariant'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {safetyResult.isSafe ? (
                <>
                  Execution order guaranteeing deadlock avoidance:{' '}
                  <span className="font-mono font-bold text-emerald-300">
                    &lt; {safetyResult.safeSequence.join(' → ')} &gt;
                  </span>
                </>
              ) : (
                'No safe sequence exists! Available resources cannot satisfy the remaining need of any uncompleted process.'
              )}
            </p>
          </div>
        </div>

        {/* Current Available Vector Display */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-md px-3 py-2 flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Available:</span>
          <div className="flex items-center gap-1.5">
            {state.resourceNames.map((rName, rIdx) => (
              <div key={rName} className="flex items-center gap-1 text-xs font-mono">
                <span className="text-slate-400 font-semibold">{rName}:</span>
                <input
                  type="number"
                  min="0"
                  value={state.available[rIdx]}
                  onChange={(e) => handleUpdateAvailable(rIdx, parseInt(e.target.value) || 0)}
                  className="w-12 px-1 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-indigo-300 font-bold"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matrices Layout: Allocation, Max, and Live Need */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Allocation Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Allocation Matrix
            </h3>
            <span className="text-[10px] text-slate-500">Currently held</span>
          </div>
          <table className="w-full text-center border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1.5 px-2 text-left">Proc</th>
                {state.resourceNames.map((r) => (
                  <th key={r} className="py-1.5 px-2">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {Array.from({ length: state.processCount }).map((_, pIdx) => (
                <tr key={pIdx}>
                  <td className="py-1.5 px-2 text-left font-bold text-slate-300">P{pIdx}</td>
                  {state.resourceNames.map((_, rIdx) => (
                    <td key={rIdx} className="py-1 px-1">
                      <input
                        type="number"
                        min="0"
                        value={state.allocation[pIdx][rIdx]}
                        onChange={(e) => handleUpdateAllocation(pIdx, rIdx, parseInt(e.target.value) || 0)}
                        className="w-10 px-1 py-0.5 bg-slate-950 border border-slate-800 rounded text-center text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Max Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Max Matrix
            </h3>
            <span className="text-[10px] text-slate-500">Maximum demand</span>
          </div>
          <table className="w-full text-center border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1.5 px-2 text-left">Proc</th>
                {state.resourceNames.map((r) => (
                  <th key={r} className="py-1.5 px-2">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {Array.from({ length: state.processCount }).map((_, pIdx) => (
                <tr key={pIdx}>
                  <td className="py-1.5 px-2 text-left font-bold text-slate-300">P{pIdx}</td>
                  {state.resourceNames.map((_, rIdx) => (
                    <td key={rIdx} className="py-1 px-1">
                      <input
                        type="number"
                        min="0"
                        value={state.max[pIdx][rIdx]}
                        onChange={(e) => handleUpdateMax(pIdx, rIdx, parseInt(e.target.value) || 0)}
                        className="w-10 px-1 py-0.5 bg-slate-950 border border-slate-800 rounded text-center text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Need Matrix (Automatically Computed: Need = Max - Allocation) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Computed Need Matrix
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Need = Max - Alloc</span>
          </div>
          <table className="w-full text-center border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1.5 px-2 text-left">Proc</th>
                {state.resourceNames.map((r) => (
                  <th key={r} className="py-1.5 px-2">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {safetyResult.needMatrix.map((row, pIdx) => (
                <tr key={pIdx} className="hover:bg-slate-800/40">
                  <td className="py-1.5 px-2 text-left font-bold text-slate-300">P{pIdx}</td>
                  {row.map((val, rIdx) => (
                    <td key={rIdx} className="py-1.5 px-1 font-bold text-indigo-300">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Safety Algorithm Execution Trace */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Step-by-Step Safety Algorithm Execution Log
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3">Step</th>
                <th className="py-2 px-3">Process</th>
                <th className="py-2 px-3">Work (Available Before)</th>
                <th className="py-2 px-3">Need</th>
                <th className="py-2 px-3">Allocation</th>
                <th className="py-2 px-3 font-semibold text-emerald-400">New Work (Work + Alloc)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {safetyResult.steps.map((st) => (
                <tr key={st.step} className="hover:bg-slate-800/40">
                  <td className="py-2 px-3 text-slate-400">Step {st.step}</td>
                  <td className="py-2 px-3 font-bold text-indigo-400">{st.processId}</td>
                  <td className="py-2 px-3 text-slate-300">[{st.workBefore.join(', ')}]</td>
                  <td className="py-2 px-3 text-amber-300">[{st.need.join(', ')}]</td>
                  <td className="py-2 px-3 text-slate-400">[{st.allocation.join(', ')}]</td>
                  <td className="py-2 px-3 font-bold text-emerald-400">[{st.workAfter.join(', ')}]</td>
                </tr>
              ))}
              {safetyResult.steps.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-rose-400">
                    No process satisfies the safety condition (Need ≤ Available).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Resource Request Algorithm Tester */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100">
            Interactive Resource-Request Algorithm Tester
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Simulate what happens when process $P_i$ suddenly requests an additional resource vector. Tests whether the request can be granted safely or must wait to avoid deadlock.
        </p>

        <div className="flex flex-wrap items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Requesting Process:</label>
            <select
              value={requestProc}
              onChange={(e) => setRequestProc(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-indigo-500"
            >
              {Array.from({ length: state.processCount }).map((_, idx) => (
                <option key={idx} value={idx}>
                  P{idx}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Request Vector:</span>
            {state.resourceNames.map((rName, rIdx) => (
              <div key={rName} className="flex items-center gap-1 text-xs font-mono">
                <span className="text-slate-400">{rName}:</span>
                <input
                  type="number"
                  min="0"
                  value={requestVector[rIdx] ?? 0}
                  onChange={(e) => {
                    const next = [...requestVector];
                    next[rIdx] = Math.max(0, parseInt(e.target.value) || 0);
                    setRequestVector(next);
                  }}
                  className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-center text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleEvaluateRequest}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition-colors shadow-sm ml-auto"
          >
            <Send className="w-3.5 h-3.5" />
            Evaluate Request
          </button>
        </div>

        {requestResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs font-mono ${
              requestResult.allowed
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
            }`}
          >
            <strong>{requestResult.allowed ? '✓ APPROVAL RESULT: ' : '✗ REJECTION RESULT: '}</strong>
            {requestResult.message}
          </div>
        )}
      </div>
    </div>
  );
};
