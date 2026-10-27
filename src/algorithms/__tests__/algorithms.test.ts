import { describe, expect, it } from 'vitest';
import { Process } from '../../types/os';
import { DEFAULT_BANKERS_STATE } from '../../utils/defaults';
import { simulateCpuScheduling } from '../cpuScheduling';
import { simulateDiskScheduling } from '../diskScheduling';
import { simulatePageReplacement } from '../pageReplacement';
import { evaluateResourceRequest, runBankersSafety } from '../bankersAlgorithm';

const process = (id: string, arrivalTime: number, burstTime: number, priority = 1): Process => ({
  id,
  arrivalTime,
  burstTime,
  priority,
  color: '#33608c',
});

describe('CPU scheduling', () => {
  const processes = [process('P1', 0, 5), process('P2', 1, 3), process('P3', 2, 8)];

  it('computes FCFS times from a known example', () => {
    const result = simulateCpuScheduling(processes, 'FCFS');

    expect(result.processMetrics.map((m) => m.completionTime)).toEqual([5, 8, 16]);
    expect(result.processMetrics.map((m) => m.turnaroundTime)).toEqual([5, 7, 14]);
    expect(result.processMetrics.map((m) => m.waitingTime)).toEqual([0, 4, 6]);
    expect(result.avgWaitingTime).toBe(3.33);
    expect(result.avgTurnaroundTime).toBe(8.67);
    expect(result.cpuUtilization).toBe(100);
  });

  it('lets a shorter job overtake a longer one under SJF', () => {
    const result = simulateCpuScheduling(
      [process('P1', 0, 5), process('P2', 1, 3), process('P3', 2, 1)],
      'SJF_NP'
    );
    const byId = Object.fromEntries(result.processMetrics.map((m) => [m.id, m]));

    expect(byId.P1.completionTime).toBe(5);
    expect(byId.P3.completionTime).toBe(6);
    expect(byId.P2.completionTime).toBe(9);
    expect(byId.P3.waitingTime).toBe(3);
    expect(byId.P2.waitingTime).toBe(5);
  });

  it('preempts the running process under SRTF', () => {
    const result = simulateCpuScheduling(
      [process('P1', 0, 5), process('P2', 1, 3), process('P3', 2, 1)],
      'SRTF'
    );

    const byId = Object.fromEntries(result.processMetrics.map((m) => [m.id, m]));
    expect(byId.P3.completionTime).toBe(3);
    expect(byId.P2.completionTime).toBe(5);
    expect(byId.P1.completionTime).toBe(9);
  });

  it('rotates processes after each quantum in round robin', () => {
    const result = simulateCpuScheduling([process('P1', 0, 4), process('P2', 0, 2)], 'RR', 2);

    expect(result.ganttChart.map((s) => s.processId)).toEqual(['P1', 'P2', 'P1']);
    expect(result.processMetrics.find((m) => m.id === 'P1')?.completionTime).toBe(6);
    expect(result.processMetrics.find((m) => m.id === 'P2')?.completionTime).toBe(4);
  });

  it('keeps idle time out of the busy-time utilisation figure', () => {
    const result = simulateCpuScheduling([process('P1', 5, 5)], 'FCFS');

    expect(result.ganttChart[0]).toMatchObject({ processId: 'IDLE', startTime: 0, endTime: 5 });
    expect(result.cpuUtilization).toBe(50);
  });
});

describe('Page replacement', () => {
  const reference = [1, 2, 3, 1, 4];

  it('counts hits and faults correctly for FIFO', () => {
    const result = simulatePageReplacement(reference, 3, 'FIFO');

    expect(result.totalFaults).toBe(4);
    expect(result.totalHits).toBe(1);
    expect(result.faultRatio).toBe(80);
    expect(result.hitRatio).toBe(20);
    expect(result.steps).toHaveLength(reference.length);
  });

  it('evicts the least recently used page in LRU', () => {
    const result = simulatePageReplacement(reference, 3, 'LRU');

    expect(result.totalFaults).toBe(4);
    expect(result.totalHits).toBe(1);
    expect(result.steps.at(-1)?.frames).toEqual([1, 4, 3]);
  });

  it('never reports more hits and faults than references', () => {
    for (const algorithm of ['FIFO', 'LRU', 'OPT', 'LFU'] as const) {
      const result = simulatePageReplacement(reference, 3, algorithm);
      expect(result.totalHits + result.totalFaults).toBe(reference.length);
    }
  });
});

describe('Disk scheduling', () => {
  const queue = [98, 183, 37, 122, 14, 124, 65, 67];

  it('matches the classic FCFS movement total', () => {
    const result = simulateDiskScheduling(queue, 53, 199, 'right', 'FCFS');

    expect(result.totalHeadMovement).toBe(640);
    expect(result.avgSeekLength).toBe(80);
  });

  it('finds the shorter SSTF path', () => {
    const result = simulateDiskScheduling(queue, 53, 199, 'right', 'SSTF');

    expect(result.seekSequence).toEqual([53, 65, 67, 37, 14, 98, 122, 124, 183]);
    expect(result.totalHeadMovement).toBe(236);
  });

  it('keeps the reported total equal to the sum of the steps', () => {
    for (const algorithm of ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'] as const) {
      const result = simulateDiskScheduling(queue, 53, 199, 'right', algorithm);
      const sum = result.steps.reduce((total, step) => total + step.distance, 0);
      expect(sum).toBe(result.totalHeadMovement);
    }
  });
});

describe("Banker's algorithm", () => {
  it('finds a safe sequence for the textbook state', () => {
    const result = runBankersSafety(DEFAULT_BANKERS_STATE);

    expect(result.isSafe).toBe(true);
    expect(result.safeSequence).toHaveLength(DEFAULT_BANKERS_STATE.processCount);
    expect(result.needMatrix).toEqual([
      [7, 4, 3],
      [1, 2, 2],
      [6, 0, 0],
      [0, 1, 1],
      [4, 3, 1],
    ]);
  });

  it('reports an unsafe state when no process can finish', () => {
    const result = runBankersSafety({
      processCount: 2,
      resourceCount: 1,
      resourceNames: ['A'],
      allocation: [[1], [1]],
      max: [[2], [2]],
      need: [[1], [1]],
      available: [0],
    });

    expect(result.isSafe).toBe(false);
    expect(result.safeSequence).toEqual([]);
  });

  it('refuses a request above the remaining need', () => {
    const evaluation = evaluateResourceRequest(DEFAULT_BANKERS_STATE, 0, [8, 0, 0]);

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.message).toContain('remaining need');
  });

  it('refuses a request larger than what is available', () => {
    const evaluation = evaluateResourceRequest(DEFAULT_BANKERS_STATE, 0, [4, 4, 4]);

    expect(evaluation.allowed).toBe(false);
  });
});
