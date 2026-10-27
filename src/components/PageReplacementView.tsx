import React, { useState, useMemo } from 'react';
import { PageAlgorithm, PageReplacementResult } from '../types/os';
import { getPageAlgorithmName, simulatePageReplacement } from '../algorithms/pageReplacement';
import { Layers, RotateCcw, Shuffle, BarChart3, CheckCircle2, XCircle, Info, Sparkles } from 'lucide-react';
import { DEFAULT_PAGE_REFERENCE_STRING } from '../utils/defaults';

interface PageReplacementViewProps {
  referenceString: number[];
  frameCount: number;
  onUpdateReferenceString: (pages: number[]) => void;
  onUpdateFrameCount: (count: number) => void;
  onResetDefaults: () => void;
}

export const PageReplacementView: React.FC<PageReplacementViewProps> = ({
  referenceString,
  frameCount,
  onUpdateReferenceString,
  onUpdateFrameCount,
  onResetDefaults,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<PageAlgorithm>('FIFO');
  const [inputString, setInputString] = useState<string>(referenceString.join(', '));
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  // Sync string input if external referenceString changes
  const handleStringChange = (val: string) => {
    setInputString(val);
    const parsed = val
      .split(/[, ]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 99);
    if (parsed.length > 0) {
      onUpdateReferenceString(parsed);
    }
  };

  const loadPreset = (preset: number[]) => {
    onUpdateReferenceString(preset);
    setInputString(preset.join(', '));
  };

  // Run simulation
  const result: PageReplacementResult = useMemo(() => {
    return simulatePageReplacement(referenceString, frameCount, selectedAlgo);
  }, [referenceString, frameCount, selectedAlgo]);

  // Run comparison across all 4 algorithms
  const comparisonResults = useMemo(() => {
    if (!showComparison) return [];
    const algos: PageAlgorithm[] = ['FIFO', 'LRU', 'OPT', 'LFU'];
    return algos.map((algo) => ({
      algo,
      name: getPageAlgorithmName(algo),
      result: simulatePageReplacement(referenceString, frameCount, algo),
    }));
  }, [referenceString, frameCount, showComparison]);

  const bestAlgo = useMemo(() => {
    if (comparisonResults.length === 0) return null;
    return [...comparisonResults].sort((a, b) => a.result.totalFaults - b.result.totalFaults)[0];
  }, [comparisonResults]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Virtual Memory Page Replacement Simulation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate how the Operating System memory management unit (MMU) handles page faults and frame evictions.
          </p>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {(
            [
              ['FIFO', 'FIFO'],
              ['LRU', 'LRU'],
              ['OPT', 'Optimal (OPT)'],
              ['LFU', 'LFU'],
            ] as [PageAlgorithm, string][]
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

      {/* Inputs & Presets Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Page Reference Sequence (comma-separated integers):
            </label>
            <input
              type="text"
              value={inputString}
              onChange={(e) => handleStringChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1"
            />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Allocated Frames:
              </label>
              <div className="flex items-center gap-1">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => onUpdateFrameCount(num)}
                    className={`w-8 h-8 rounded text-xs font-mono font-bold transition-all ${
                      frameCount === num
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="self-end">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  showComparison
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                {showComparison ? 'Hide Comparison' : 'Compare 4 Algos'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Load Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium">Classroom Presets:</span>
          <button
            onClick={() => loadPreset(DEFAULT_PAGE_REFERENCE_STRING)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            Silberschatz Standard (20 pages)
          </button>
          <button
            onClick={() => loadPreset([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5])}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            Bélády’s Anomaly Demonstration
          </button>
          <button
            onClick={() => loadPreset([1, 2, 3, 2, 1, 5, 2, 1, 6, 2, 5, 6, 3, 1, 3, 6, 1, 2, 4, 3])}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            High Locality Pattern
          </button>
          <button
            onClick={() => {
              const rand = Array.from({ length: 16 }, () => Math.floor(Math.random() * 8));
              loadPreset(rand);
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            <Shuffle className="w-3 h-3 text-amber-400" />
            Random 16 Pages
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Total Page Faults (Misses)</span>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
            {result.totalFaults}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Requires disk fetch</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Total Page Hits</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {result.totalHits}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Found already in RAM</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Hit Ratio (%)</span>
          <span className="text-2xl font-bold font-mono text-indigo-400 mt-1 block">
            {result.hitRatio}%
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Hits / Total References</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Fault Ratio (%)</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {result.faultRatio}%
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Faults / Total References</span>
        </div>
      </div>

      {/* Visual Memory Frame Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Memory Frame Allocation Grid ({result.algorithmName})
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hit
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Page Fault
            </span>
          </div>
        </div>

        {/* Scrollable Frame Table */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-full">
            <table className="border-collapse text-xs font-mono text-center">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-left text-slate-400 border-b border-slate-800 bg-slate-950 font-sans font-semibold sticky left-0 z-10">
                    Step
                  </th>
                  {result.steps.map((st) => (
                    <th key={st.step} className="py-2 px-2 text-slate-400 border-b border-slate-800 min-w-[42px]">
                      {st.step}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-950/50">
                  <th className="py-2 px-3 text-left text-indigo-300 border-b border-slate-800 font-sans font-semibold sticky left-0 z-10 bg-slate-950">
                    Reference
                  </th>
                  {result.steps.map((st) => (
                    <th key={st.step} className="py-2 px-2 text-indigo-300 font-bold border-b border-slate-800 text-sm">
                      {st.page}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: frameCount }).map((_, frameIdx) => (
                  <tr key={frameIdx} className="border-b border-slate-850 hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-left font-sans font-medium text-slate-400 sticky left-0 bg-slate-950 border-r border-slate-800 z-10">
                      Frame {frameIdx + 1}
                    </td>
                    {result.steps.map((st) => {
                      const pageInFrame = st.frames[frameIdx];
                      const isTargetPage = pageInFrame === st.page;
                      return (
                        <td
                          key={st.step}
                          className={`py-2 px-2 border-r border-slate-850 ${
                            isTargetPage
                              ? st.isHit
                                ? 'bg-emerald-950/40 text-emerald-300 font-bold'
                                : 'bg-rose-950/30 text-rose-300 font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          {pageInFrame !== null ? pageInFrame : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Result Indicator Row */}
                <tr className="border-t-2 border-slate-700 bg-slate-950 font-bold">
                  <td className="py-2 px-3 text-left text-slate-300 font-sans sticky left-0 bg-slate-950 border-r border-slate-800 z-10">
                    Status
                  </td>
                  {result.steps.map((st) => (
                    <td
                      key={st.step}
                      className={`py-2 px-1 text-[11px] ${
                        st.isHit ? 'text-emerald-400 bg-emerald-950/30' : 'text-rose-400 bg-rose-950/30'
                      }`}
                    >
                      {st.isHit ? 'HIT' : 'FAULT'}
                    </td>
                  ))}
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
              Comparative Performance across 4 Page Replacement Algorithms
            </h3>
            {bestAlgo && (
              <span className="text-xs text-emerald-400 font-mono">
                Optimal / Fewest Faults: <strong className="underline">{bestAlgo.name}</strong> ({bestAlgo.result.totalFaults} faults)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                        Top
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Page Faults:</span>
                      <span className="font-bold text-rose-400">{r.totalFaults}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Page Hits:</span>
                      <span className="font-bold text-emerald-400">{r.totalHits}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Hit Ratio:</span>
                      <span className="font-bold text-indigo-400">{r.hitRatio}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded border border-slate-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Academic Note:</strong> Optimal (OPT) algorithm replaces the page that will not be used for the longest period in future. While unrealizable in practical operating systems without future knowledge, it serves as the theoretical benchmark against which practical heuristics like LRU and FIFO are graded.
            </span>
          </div>
        </div>
      )}

      {/* Collapsible Execution Logs */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>Step-by-Step Replacement Logs ({result.executionLogs.length} entries)</span>
          <span className="text-indigo-400">{showLogs ? 'Collapse' : 'Expand Replacement Logs'}</span>
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
