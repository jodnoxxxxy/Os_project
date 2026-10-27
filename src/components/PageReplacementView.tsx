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
      <header className="pb-0">
        <div className="max-w-2xl">
          <p className="eyebrow">Module 2</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-ink">
            <Layers className="h-5 w-5 text-accent" aria-hidden="true" />
            Page replacement
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            A reference string is the list of pages the CPU asks for, in order. A hit means the page is
            already in a frame; a fault means it has to be loaded, and sometimes another page is evicted.
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

      <section className="space-y-4 rounded-lg border border-rule bg-sheet p-4" aria-labelledby="page-input-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="page-input-heading" className="text-sm font-semibold text-ink">
            Inputs
          </h2>
          <p className="text-xs text-ink-muted">
            <span className="font-medium text-ink-soft">{getPageAlgorithmName(selectedAlgo)}</span>
            <span className="mx-1.5">·</span>
            {activeHint}
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="page-reference" className="mb-1 block text-xs font-medium text-ink-soft">
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
              className={`w-full rounded border bg-well px-3 py-1.5 font-mono text-xs text-accent focus:outline-none ${
                inputMessage ? 'border-bad-line/60 focus:border-bad-line' : 'border-rule-strong focus:border-accent'
              }`}
              placeholder="7, 0, 1, 2, 0, 3, 0, 4"
            />
            <p
              id="page-reference-help"
              className={`mt-1 text-[11px] ${inputMessage ? 'text-bad' : 'text-ink-muted'}`}
            >
              {inputMessage ?? `${referenceString.length} references loaded. Separate numbers with commas or spaces.`}
            </p>
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-ink-soft">Frames available</span>
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
                      ? 'bg-accent text-white'
                      : 'border border-rule-strong bg-wash text-ink-muted hover:text-ink'
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

        <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-3 text-xs">
          <span className="text-ink-muted">Examples:</span>
          <button
            type="button"
            onClick={() => loadPreset(DEFAULT_PAGE_REFERENCE_STRING)}
            title="The 20-reference string used in most operating systems textbooks"
            className="rounded border border-rule-strong bg-wash px-2.5 py-1 text-ink-soft transition-colors hover:bg-rule"
          >
            Textbook trace (20 pages)
          </button>
          <button
            type="button"
            onClick={() => loadPreset([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5])}
            title="With FIFO, more frames can sometimes cause more faults"
            className="rounded border border-rule-strong bg-wash px-2.5 py-1 text-ink-soft transition-colors hover:bg-rule"
          >
            Belady's anomaly
          </button>
          <button
            type="button"
            onClick={() => loadPreset([1, 2, 3, 2, 1, 5, 2, 1, 6, 2, 5, 6, 3, 1, 3, 6, 1, 2, 4, 3])}
            title="Repeated nearby pages, which favours LRU"
            className="rounded border border-rule-strong bg-wash px-2.5 py-1 text-ink-soft transition-colors hover:bg-rule"
          >
            High locality
          </button>
          <button
            type="button"
            onClick={() => loadPreset(Array.from({ length: 16 }, () => Math.floor(Math.random() * 8)))}
            className="flex items-center gap-1 rounded border border-rule-strong bg-wash px-2.5 py-1 text-ink-soft transition-colors hover:bg-rule"
          >
            <Shuffle className="h-3 w-3 text-warn" aria-hidden="true" />
            Random 16
          </button>
        </div>
      </section>

      <dl className="grid grid-cols-2 border-y border-rule sm:grid-cols-4">
        <div className="px-4 py-3.5">
          <dt className="text-[11px] font-medium text-ink-muted">Page faults</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-ink">{result.totalFaults}</dd>
          <dd className="mt-0.5 text-[10px] text-ink-muted">pages that had to be loaded</dd>
        </div>
        <div className="border-l border-rule px-4 py-3.5">
          <dt className="text-[11px] font-medium text-ink-muted">Page hits</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-ink">{result.totalHits}</dd>
          <dd className="mt-0.5 text-[10px] text-ink-muted">pages already in memory</dd>
        </div>
        <div className="border-t border-rule px-4 py-3.5 sm:border-l sm:border-t-0">
          <dt className="text-[11px] font-medium text-ink-muted">Hit rate</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-ink">{result.hitRatio}%</dd>
          <dd className="mt-0.5 text-[10px] text-ink-muted">hits / references</dd>
        </div>
        <div className="border-l border-t border-rule px-4 py-3.5 sm:border-t-0">
          <dt className="text-[11px] font-medium text-ink-muted">Fault rate</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-ink">{result.faultRatio}%</dd>
          <dd className="mt-0.5 text-[10px] text-ink-muted">faults / references</dd>
        </div>
      </dl>

      <section className="rounded-lg border border-rule bg-sheet p-4" aria-labelledby="frames-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="frames-heading" className="text-sm font-semibold text-ink">
              Frame contents, step by step
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">{result.algorithmName} with {frameCount} frames</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-good" aria-hidden="true" />
              Hit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-bad" aria-hidden="true" />
              Fault
            </span>
          </div>
        </div>

        <p className="mb-2 text-[11px] text-ink-muted sm:hidden">Scroll sideways to see every step.</p>

        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-full">
            <table className="border-collapse text-center text-xs font-mono">
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 border-b border-rule bg-well px-3 py-2 text-left font-sans font-medium text-ink-muted">
                    Step
                  </th>
                  {result.steps.map((step) => (
                    <th key={step.step} scope="col" className="min-w-[42px] border-b border-rule px-2 py-2 font-medium text-ink-muted">
                      {step.step}
                    </th>
                  ))}
                </tr>
                <tr className="bg-well">
                  <th scope="col" className="sticky left-0 z-10 border-b border-rule bg-well px-3 py-2 text-left font-sans font-medium text-accent">
                    Page
                  </th>
                  {result.steps.map((step) => (
                    <th key={step.step} scope="col" className="border-b border-rule px-2 py-2 text-sm font-semibold text-accent">
                      {step.page}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: frameCount }).map((_, frameIndex) => (
                  <tr key={frameIndex} className="border-b border-rule transition-colors hover:bg-wash">
                    <th scope="row" className="sticky left-0 z-10 border-r border-rule bg-well px-3 py-2 text-left font-sans font-medium text-ink-muted">
                      Frame {frameIndex + 1}
                    </th>
                    {result.steps.map((step) => {
                      const pageInFrame = step.frames[frameIndex];
                      const isTargetPage = pageInFrame === step.page;

                      return (
                        <td
                          key={step.step}
                          className={`border-r border-rule px-2 py-2 ${
                            isTargetPage
                              ? step.isHit
                                ? 'bg-good-bg font-semibold text-good'
                                : 'bg-bad-bg font-semibold text-bad'
                              : 'text-ink-soft'
                          }`}
                        >
                          {pageInFrame !== null ? pageInFrame : <span className="text-ink-muted">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr className="border-t-2 border-rule-strong bg-well font-semibold">
                  <th scope="row" className="sticky left-0 z-10 border-r border-rule bg-well px-3 py-2 text-left font-sans font-medium text-ink-soft">
                    Status
                  </th>
                  {result.steps.map((step) => (
                    <td
                      key={step.step}
                      className={`px-1 py-2 text-[10px] ${
                        step.isHit ? 'bg-good-bg text-good' : 'bg-bad-bg text-bad'
                      }`}
                    >
                      {step.isHit ? 'HIT' : 'FAULT'}
                    </td>
                  ))}
                </tr>

                <tr className="bg-well">
                  <th scope="row" className="sticky left-0 z-10 border-r border-rule bg-well px-3 py-2 text-left font-sans text-[11px] font-medium text-ink-muted">
                    Evicted
                  </th>
                  {result.steps.map((step) => (
                    <td key={step.step} className="px-1 py-2 text-[11px] text-warn/80">
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
        <section className="space-y-4 rounded-lg border border-warn-line/30 bg-sheet p-5" aria-labelledby="page-comparison-heading">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="page-comparison-heading" className="text-sm font-semibold text-ink">
                All four policies on this trace
              </h2>
              <p className="mt-1 text-xs text-ink-muted">Lower fault counts are better.</p>
            </div>
            {bestAlgo && (
              <p className="text-xs text-good">
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
                    isBest ? 'border-good-line/40 bg-good-bg' : 'border-rule bg-well'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink">{name}</span>
                    {isBest && (
                      <span className="rounded bg-good-bg px-1.5 py-0.5 text-[10px] font-semibold text-good">
                        Fewest
                      </span>
                    )}
                  </div>

                  <dl className="mt-2.5 space-y-1 font-mono text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Faults</dt>
                      <dd className="font-semibold text-bad">{comparison.totalFaults}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Hits</dt>
                      <dd className="text-good">{comparison.totalHits}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Hit rate</dt>
                      <dd className="text-accent">{comparison.hitRatio}%</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>

          <p className="flex items-start gap-2 rounded border border-rule bg-well p-3 text-[11px] leading-relaxed text-ink-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>
              Optimal replacement is the best result possible for this trace because it can see future
              references. Real systems cannot, so LRU uses recent history as an approximation.
            </span>
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-rule bg-sheet">
        <button
          type="button"
          onClick={() => setShowLogs((value) => !value)}
          aria-expanded={showLogs}
          className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <span>Replacement log ({result.executionLogs.length} entries)</span>
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
