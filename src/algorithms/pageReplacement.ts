/**
 * Page Replacement Algorithms: FIFO, LRU, Optimal (OPT), LFU
 */

import { PageAlgorithm, PageReplacementResult, PageStep } from '../types/os';

const ALGORITHM_NAMES: Record<PageAlgorithm, string> = {
  FIFO: 'First In First Out (FIFO)',
  LRU: 'Least Recently Used (LRU)',
  OPT: 'Optimal Page Replacement (OPT / Belady’s)',
  LFU: 'Least Frequently Used (LFU)',
};

export function getPageAlgorithmName(algo: PageAlgorithm): string {
  return ALGORITHM_NAMES[algo] || algo;
}

export function simulatePageReplacement(
  pages: number[],
  frameCount: number,
  algorithm: PageAlgorithm
): PageReplacementResult {
  const safeFrameCount = Math.max(1, Math.min(10, frameCount));
  const logs: string[] = [];

  logs.push(`Running ${ALGORITHM_NAMES[algorithm]} with ${safeFrameCount} frames on reference string: [${pages.join(', ')}]`);

  switch (algorithm) {
    case 'FIFO':
      return simulateFIFO(pages, safeFrameCount, logs);
    case 'LRU':
      return simulateLRU(pages, safeFrameCount, logs);
    case 'OPT':
      return simulateOPT(pages, safeFrameCount, logs);
    case 'LFU':
      return simulateLFU(pages, safeFrameCount, logs);
  }
}

// 1. FIFO
function simulateFIFO(pages: number[], frameCount: number, logs: string[]): PageReplacementResult {
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const fifoQueue: number[] = []; // indices of frames in order of arrival
  const steps: PageStep[] = [];
  let hits = 0;
  let faults = 0;

  pages.forEach((page, index) => {
    const existingIndex = frames.indexOf(page);
    if (existingIndex !== -1) {
      // Hit
      hits++;
      steps.push({
        step: index + 1,
        page,
        frames: [...frames],
        isHit: true,
        description: `Page ${page} is already in frame ${existingIndex}. (Hit)`,
      });
      logs.push(`Step ${index + 1}: Reference ${page} -> HIT. Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
    } else {
      // Fault
      faults++;
      const emptyIndex = frames.indexOf(null);
      let replacedPage: number | null = null;

      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
        fifoQueue.push(emptyIndex);
        steps.push({
          step: index + 1,
          page,
          frames: [...frames],
          isHit: false,
          replacedPage: null,
          description: `Page ${page} loaded into empty frame ${emptyIndex}. (Page Fault)`,
        });
        logs.push(`Step ${index + 1}: Reference ${page} -> FAULT (Allocated frame ${emptyIndex}). Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
      } else {
        // Replace oldest
        const replaceFrameIndex = fifoQueue.shift()!;
        replacedPage = frames[replaceFrameIndex];
        frames[replaceFrameIndex] = page;
        fifoQueue.push(replaceFrameIndex);
        steps.push({
          step: index + 1,
          page,
          frames: [...frames],
          isHit: false,
          replacedPage,
          description: `Page ${page} replaces page ${replacedPage} in frame ${replaceFrameIndex}. (Page Fault)`,
        });
        logs.push(`Step ${index + 1}: Reference ${page} -> FAULT (Replaced ${replacedPage}). Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
      }
    }
  });

  return finalizeResult('FIFO', pages, frameCount, steps, hits, faults, logs);
}

// 2. LRU (Least Recently Used)
function simulateLRU(pages: number[], frameCount: number, logs: string[]): PageReplacementResult {
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const lastUsedMap = new Map<number, number>(); // page -> last referenced time
  const steps: PageStep[] = [];
  let hits = 0;
  let faults = 0;

  pages.forEach((page, time) => {
    const existingIndex = frames.indexOf(page);
    if (existingIndex !== -1) {
      hits++;
      lastUsedMap.set(page, time);
      steps.push({
        step: time + 1,
        page,
        frames: [...frames],
        isHit: true,
        description: `Page ${page} found in frame ${existingIndex}. Updated last used time. (Hit)`,
      });
      logs.push(`Step ${time + 1}: Reference ${page} -> HIT. Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
    } else {
      faults++;
      const emptyIndex = frames.indexOf(null);
      let replacedPage: number | null = null;

      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
        lastUsedMap.set(page, time);
        steps.push({
          step: time + 1,
          page,
          frames: [...frames],
          isHit: false,
          replacedPage: null,
          description: `Page ${page} placed into free frame ${emptyIndex}. (Page Fault)`,
        });
        logs.push(`Step ${time + 1}: Reference ${page} -> FAULT. Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
      } else {
        // Find frame with page having minimum lastUsed time
        let lruFrameIndex = 0;
        let oldestTime = Infinity;

        frames.forEach((fPage, fIdx) => {
          const uTime = lastUsedMap.get(fPage!) ?? -1;
          if (uTime < oldestTime) {
            oldestTime = uTime;
            lruFrameIndex = fIdx;
          }
        });

        replacedPage = frames[lruFrameIndex];
        frames[lruFrameIndex] = page;
        lastUsedMap.set(page, time);

        steps.push({
          step: time + 1,
          page,
          frames: [...frames],
          isHit: false,
          replacedPage,
          description: `Page ${page} replaces LRU page ${replacedPage} in frame ${lruFrameIndex}. (Page Fault)`,
        });
        logs.push(`Step ${time + 1}: Reference ${page} -> FAULT (Replaced LRU ${replacedPage}). Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
      }
    }
  });

  return finalizeResult('LRU', pages, frameCount, steps, hits, faults, logs);
}

// 3. Optimal (OPT / Belady's)
function simulateOPT(pages: number[], frameCount: number, logs: string[]): PageReplacementResult {
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const steps: PageStep[] = [];
  let hits = 0;
  let faults = 0;

  pages.forEach((page, time) => {
    const existingIndex = frames.indexOf(page);
    if (existingIndex !== -1) {
      hits++;
      steps.push({
        step: time + 1,
        page,
        frames: [...frames],
        isHit: true,
        description: `Page ${page} is already in memory. (Hit)`,
      });
      logs.push(`Step ${time + 1}: Reference ${page} -> HIT. Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
    } else {
      faults++;
      const emptyIndex = frames.indexOf(null);
      let replacedPage: number | null = null;

      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
        steps.push({
          step: time + 1,
          page,
          frames: [...frames],
          isHit: false,
          replacedPage: null,
          description: `Page ${page} placed in empty frame ${emptyIndex}. (Page Fault)`,
        });
        logs.push(`Step ${time + 1}: Reference ${page} -> FAULT. Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
      } else {
        // Look into future references for each page currently in frames
        let optimalFrameIndex = 0;
        let furthestNextUse = -1;

        frames.forEach((fPage, fIdx) => {
          let nextUse = Infinity;
          for (let future = time + 1; future < pages.length; future++) {
            if (pages[future] === fPage) {
              nextUse = future;
              break;
            }
          }

          if (nextUse > furthestNextUse) {
            furthestNextUse = nextUse;
            optimalFrameIndex = fIdx;
          }
        });

        replacedPage = frames[optimalFrameIndex];
        frames[optimalFrameIndex] = page;

        steps.push({
          step: time + 1,
          page,
          frames: [...frames],
          isHit: false,
          replacedPage,
          description: `Page ${page} replaces ${replacedPage} in frame ${optimalFrameIndex} (not needed for longest duration). (Page Fault)`,
        });
        logs.push(`Step ${time + 1}: Reference ${page} -> FAULT (Replaced OPT page ${replacedPage}). Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
      }
    }
  });

  return finalizeResult('OPT', pages, frameCount, steps, hits, faults, logs);
}

// 4. LFU (Least Frequently Used)
function simulateLFU(pages: number[], frameCount: number, logs: string[]): PageReplacementResult {
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const frequencyMap = new Map<number, number>();
  const arrivalTimeMap = new Map<number, number>(); // tie-breaker
  const steps: PageStep[] = [];
  let hits = 0;
  let faults = 0;

  pages.forEach((page, time) => {
    // update overall frequency
    frequencyMap.set(page, (frequencyMap.get(page) || 0) + 1);

    const existingIndex = frames.indexOf(page);
    if (existingIndex !== -1) {
      hits++;
      steps.push({
        step: time + 1,
        page,
        frames: [...frames],
        isHit: true,
        description: `Page ${page} found in memory. Total frequency: ${frequencyMap.get(page)}. (Hit)`,
      });
      logs.push(`Step ${time + 1}: Reference ${page} -> HIT. Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
    } else {
      faults++;
      const emptyIndex = frames.indexOf(null);
      let replacedPage: number | null = null;

      if (emptyIndex !== -1) {
        frames[emptyIndex] = page;
        arrivalTimeMap.set(page, time);
        steps.push({
          step: time + 1,
          page,
          frames: [...frames],
          isHit: false,
          replacedPage: null,
          description: `Page ${page} stored in vacant frame ${emptyIndex}. (Page Fault)`,
        });
        logs.push(`Step ${time + 1}: Reference ${page} -> FAULT. Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
      } else {
        // Find page with minimum frequency, tie-break by earliest arrival time
        let minFreq = Infinity;
        let lfuFrameIndex = 0;
        let earliestArrival = Infinity;

        frames.forEach((fPage, fIdx) => {
          const freq = frequencyMap.get(fPage!) || 0;
          const arr = arrivalTimeMap.get(fPage!) || 0;
          if (freq < minFreq) {
            minFreq = freq;
            earliestArrival = arr;
            lfuFrameIndex = fIdx;
          } else if (freq === minFreq) {
            if (arr < earliestArrival) {
              earliestArrival = arr;
              lfuFrameIndex = fIdx;
            }
          }
        });

        replacedPage = frames[lfuFrameIndex];
        frames[lfuFrameIndex] = page;
        arrivalTimeMap.set(page, time);

        steps.push({
          step: time + 1,
          page,
          frames: [...frames],
          isHit: false,
          replacedPage,
          description: `Page ${page} replaces LFU page ${replacedPage} (Freq: ${minFreq}). (Page Fault)`,
        });
        logs.push(`Step ${time + 1}: Reference ${page} -> FAULT (Replaced LFU ${replacedPage}). Frames: [${frames.map(f => f ?? '-').join(', ')}]`);
      }
    }
  });

  return finalizeResult('LFU', pages, frameCount, steps, hits, faults, logs);
}

function finalizeResult(
  algorithm: PageAlgorithm,
  referenceString: number[],
  frameCount: number,
  steps: PageStep[],
  hits: number,
  faults: number,
  logs: string[]
): PageReplacementResult {
  const total = referenceString.length || 1;
  const hitRatio = Number(((hits / total) * 100).toFixed(2));
  const faultRatio = Number(((faults / total) * 100).toFixed(2));

  logs.push(`--- SUMMARY METRICS ---`);
  logs.push(`Total References: ${referenceString.length}`);
  logs.push(`Total Hits: ${hits} (${hitRatio}%)`);
  logs.push(`Total Faults / Misses: ${faults} (${faultRatio}%)`);

  return {
    algorithm,
    algorithmName: ALGORITHM_NAMES[algorithm],
    referenceString,
    frameCount,
    steps,
    totalHits: hits,
    totalFaults: faults,
    hitRatio,
    faultRatio,
    executionLogs: logs,
  };
}
