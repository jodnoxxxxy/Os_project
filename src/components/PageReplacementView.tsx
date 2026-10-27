import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageAlgorithm, PageReplacementResult } from '../types/os';
import { getPageAlgorithmName, simulatePageReplacement } from '../algorithms/pageReplacement';
import { BarChart3, Info, Layers, RotateCcw, Shuffle } from 'lucide-react';
import { DEFAULT_PAGE_REFERENCE_STRING } from '../utils/defaults';

interface PageReplacementViewProps {
  referenceString: number[];
  frameCount: number;
  onUpdateReferenceString: (pages: number[]) => void;
  onUpdateFrameCount: (count: number) => void;
  onResetDefaults: () => void;
}

const ALGORITHMS: { id: PageAlgorithm; label: string; hint: string }[] = [
  { id: 'FIFO', label: 'FIFO', hint: 'Replaces the page that has been in memory the longest.' },
  { id: 'LRU', label: 'LRU', hint: 'Replaces the page that was used least recently.' },
  {
    id: 'OPT',
    label: 'Optimal',
    hint: 'Replaces the page that will not be needed for the longest time. It uses future knowledge, so it is a benchmark, not a real policy.',
  },
  { id: 'LFU', label: 'LFU', hint: 'Replaces the page that has been used least often.' },
];

const FRAME_OPTIONS = [2, 3, 4, 5, 6];

function parseSequence(raw: string, maxValue: number): { values: number[]; ignored: number } {
  const tokens = raw.split(/[\s,]+/).filter((token) => token.length > 0);
  const values: number[] = [];
  let ignored = 0;

  for (const token of tokens) {
    const value = Number(token);
    if (Number.isInteger(value) && value >= 0 && value <= maxValue) {
      values.push(value);
    } else {
      ignored += 1;
    }
  }

  return { values, ignored };
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
  const [inputMessage, setInputMessage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const inputFocused = useRef(false);

  // Presets and the global reset change the value from outside this input.
  useEffect(() => {
    if (!inputFocused.current) {
      setInputString(referenceString.join(', '));
      setInputMessage(null);
    }
  }, [referenceString]);

  const activeHint = ALGORITHMS.find((algo) => algo.id === selectedAlgo)?.hint;

  const handleStringChange = (raw: string) => {
    setInputString(raw);
    const { values, ignored } = parseSequence(raw, 99);

    if (values.length > 0) {
      onUpdateReferenceString(values);
    }

    if (ignored > 0) {
      setInputMessage(
        `Ignored ${ignored} ${ignored === 1 ? 'entry' : 'entries'}. Use whole numbers from 0 to 99.`
      );
    } else if (values.length === 0) {
      setInputMessage('Enter at least one page number, separated by commas or spaces.');
    } else {
      setInputMessage(null);
    }
  };

  const loadPreset = (preset: number[]) => {
    onUpdateReferenceString(preset);
    setInputString(preset.join(', '));
    setInputMessage(null);
  };

  const result: PageReplacementResult = useMemo(
    () => simulatePageReplacement(referenceString, frameCount, selectedAlgo),
    [referenceString, frameCount, selectedAlgo]
  );

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
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-indigo-400">Module 2</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-100">
            <Layers className="h-5 w-5 text-indigo-400" aria-hidden="true" />
            Page replacement
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
            A reference string is the list of pages the CPU asks for, in order. A hit means the page is
            already in a frame; a fault means it has to be loaded, and sometimes another page is evicted.
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

      <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4" aria-labelledby="page-input-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="page-input-heading" className="text-sm font-semibold text-slate-200">
            Inputs
          </h2>
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-300">{getPageAlgorithmName(selectedAlgo)}</span>
            <span className="mx-1.5">·</span>
            {activeHint}
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="page-reference" className="mb-1 block text-xs font-medium text-slate-300">
              Page reference string
            </label>
            <input
              id="page-reference"
              type="text"
              value={inputString}
              onFocus={() => {
                inputFocused.current = true;
              }}
              onBlur={() => {
                inputFocused.current = false;
              }}
              onChange={(event) => handleStringChange(event.target.value)}
              aria-describedby="page-reference-help"
              aria-invalid={inputMessage ? true : undefined}
              className={`w-full rounded border bg-slate-950 px-3 py-1.5 font-mono text-xs text-indigo-200 focus:outline-none ${
                inputMessage ? 'border-rose-500/60 focus:border-rose-400' : 'border-slate-700 focus:border-indigo-500'
              }`}
              placeholder="7, 0, 1, 2, 0, 3, 0, 4"
            />
            <p
              id="page-reference-help"
              className={`mt-1 text-[11px] ${inputMessage ? 'text-rose-300' : 'text-slate-500'}`}
            >
              {inputMessage ?? `${referenceString.length} references loaded. Separate numbers with commas or spaces.`}
            </p>
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-slate-300">Frames available</span>
            <div className="flex items-center gap-1" role="group" aria-label="Number of page frames">
              {FRAME_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => onUpdateFrameCount(count)}
                  aria-pressed={frameCount === count}
                  title={`${count} physical frames`}
                  className={`h-8 w-8 rounded font-mono text-xs font-semibold transition-colors ${
                    frameCount === count
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
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

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3 text-xs">
          <span className="text-slate-500">Examples:</span>
          <button
            type="button"
            onClick={() => loadPreset(DEFAULT_PAGE_REFERENCE_STRING)}
            title="The 20-reference string used in most operating systems textbooks"
            className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 transition-colors hover:bg-slate-700"
          >
            Textbook trace (20 pages)
          </button>
          <button
            type="button"
            onClick={() => loadPreset([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5])}
            title="With FIFO, more frames can sometimes cause more faults"
            className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 transition-colors hover:bg-slate-700"
          >
            Belady's anomaly
          </button>
          <button
            type="button"
            onClick={() => loadPreset([1, 2, 3, 2, 1, 5, 2, 1, 6, 2, 5, 6, 3, 1, 3, 6, 1, 2, 4, 3])}
            title="Repeated nearby pages, which favours LRU"
            className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 transition-colors hover:bg-slate-700"
          >
            High locality
          </button>
          <button
            type="button"
            onClick={() => loadPreset(Array.from({ length: 16 }, () => Math.floor(Math.random() * 8)))}
            className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 transition-colors hover:bg-slate-700"
          >
            <Shuffle className="h-3 w-3 text-amber-400" aria-hidden="true" />
            Random 16
          </button>
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <dt className="text-[11px] font-medium text-slate-400">Page faults</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-rose-400">{result.totalFaults}</dd>
          <dd className="mt-0.5 text-[10px] text-slate-500">pages that had to be loaded</dd>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <dt className="text-[11px] font-medium text-slate-400">Page hits</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-emerald-400">{result.totalHits}</dd>
          <dd className="mt-0.5 text-[10px] text-slate-500">pages already in memory</dd>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <dt className="text-[11px] font-medium text-slate-400">Hit rate</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-indigo-400">{result.hitRatio}%</dd>
          <dd className="mt-0.5 text-[10px] text-slate-500">hits / references</dd>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <dt className="text-[11px] font-medium text-slate-400">Fault rate</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-amber-400">{result.faultRatio}%</dd>
          <dd className="mt-0.5 text-[10px] text-slate-500">faults / references</dd>
        </div>
      </dl>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4" aria-labelledby="frames-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="frames-heading" className="text-sm font-semibold text-slate-200">
              Frame contents, step by step
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{result.algorithmName} with {frameCount} frames</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Hit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true" />
              Fault
            </span>
          </div>
        </div>

        <p className="mb-2 text-[11px] text-slate-500 sm:hidden">Scroll sideways to see every step.</p>

        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-full">
            <table className="border-collapse text-center text-xs font-mono">
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 border-b border-slate-800 bg-slate-950 px-3 py-2 text-left font-sans font-medium text-slate-400">
                    Step
                  </th>
                  {result.steps.map((step) => (
                    <th key={step.step} scope="col" className="min-w-[42px] border-b border-slate-800 px-2 py-2 font-medium text-slate-400">
                      {step.step}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-950/50">
                  <th scope="col" className="sticky left-0 z-10 border-b border-slate-800 bg-slate-950 px-3 py-2 text-left font-sans font-medium text-indigo-300">
                    Page
                  </th>
                  {result.steps.map((step) => (
                    <th key={step.step} scope="col" className="border-b border-slate-800 px-2 py-2 text-sm font-semibold text-indigo-300">
                      {step.page}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: frameCount }).map((_, frameIndex) => (
                  <tr key={frameIndex} className="border-b border-slate-800 transition-colors hover:bg-slate-800/30">
                    <th scope="row" className="sticky left-0 z-10 border-r border-slate-800 bg-slate-950 px-3 py-2 text-left font-sans font-medium text-slate-400">
                      Frame {frameIndex + 1}
                    </th>
                    {result.steps.map((step) => {
                      const pageInFrame = step.frames[frameIndex];
                      const isTargetPage = pageInFrame === step.page;

                      return (
                        <td
                          key={step.step}
                          className={`border-r border-slate-800 px-2 py-2 ${
                            isTargetPage
                              ? step.isHit
                                ? 'bg-emerald-950/40 font-semibold text-emerald-300'
                                : 'bg-rose-950/30 font-semibold text-rose-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {pageInFrame !== null ? pageInFrame : <span className="text-slate-600">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr className="border-t-2 border-slate-700 bg-slate-950 font-semibold">
                  <th scope="row" className="sticky left-0 z-10 border-r border-slate-800 bg-slate-950 px-3 py-2 text-left font-sans font-medium text-slate-300">
                    Status
                  </th>
                  {result.steps.map((step) => (
                    <td
                      key={step.step}
                      className={`px-1 py-2 text-[10px] ${
                        step.isHit ? 'bg-emerald-950/30 text-emerald-400' : 'bg-rose-950/30 text-rose-400'
                      }`}
                    >
                      {step.isHit ? 'HIT' : 'FAULT'}
                    </td>
                  ))}
                </tr>

                <tr className="bg-slate-950/60">
                  <th scope="row" className="sticky left-0 z-10 border-r border-slate-800 bg-slate-950 px-3 py-2 text-left font-sans text-[11px] font-medium text-slate-500">
                    Evicted
                  </th>
                  {result.steps.map((step) => (
                    <td key={step.step} className="px-1 py-2 text-[11px] text-amber-300/80">
                      {step.replacedPage !== null && step.replacedPage !== undefined ? step.replacedPage : ''}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showComparison && (
        <section className="space-y-4 rounded-lg border border-amber-500/30 bg-slate-900 p-5" aria-labelledby="page-comparison-heading">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="page-comparison-heading" className="text-sm font-semibold text-slate-100">
                All four policies on this trace
              </h2>
              <p className="mt-1 text-xs text-slate-400">Lower fault counts are better.</p>
            </div>
            {bestAlgo && (
              <p className="text-xs text-emerald-300">
                Fewest faults: <strong className="font-semibold">{bestAlgo.name}</strong> ({bestAlgo.result.totalFaults})
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                        Fewest
                      </span>
                    )}
                  </div>

                  <dl className="mt-2.5 space-y-1 font-mono text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Faults</dt>
                      <dd className="font-semibold text-rose-300">{comparison.totalFaults}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Hits</dt>
                      <dd className="text-emerald-300">{comparison.totalHits}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Hit rate</dt>
                      <dd className="text-indigo-300">{comparison.hitRatio}%</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>

          <p className="flex items-start gap-2 rounded border border-slate-800 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" aria-hidden="true" />
            <span>
              Optimal replacement is the best result possible for this trace because it can see future
              references. Real systems cannot, so LRU uses recent history as an approximation.
            </span>
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
        <button
          type="button"
          onClick={() => setShowLogs((value) => !value)}
          aria-expanded={showLogs}
          className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
        >
          <span>Replacement log ({result.executionLogs.length} entries)</span>
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
