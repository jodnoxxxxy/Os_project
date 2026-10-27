/**
 * CPU Process Scheduling Algorithms Implementation
 * FCFS, SJF (Non-Preemptive), SRTF (SJF Preemptive), Priority (NP), Priority (Preemptive), Round Robin
 */

import { CpuAlgorithm, CpuSchedulingResult, GanttSegment, Process, ProcessMetric } from '../types/os';

const ALGORITHM_NAMES: Record<CpuAlgorithm, string> = {
  FCFS: 'First-Come, First-Served (FCFS)',
  SJF_NP: 'Shortest Job First (SJF Non-Preemptive)',
  SRTF: 'Shortest Remaining Time First (SRTF / SJF Preemptive)',
  PRIORITY_NP: 'Priority Scheduling (Non-Preemptive)',
  PRIORITY_P: 'Priority Scheduling (Preemptive)',
  RR: 'Round Robin (RR)',
};

export function getCpuAlgorithmName(algo: CpuAlgorithm): string {
  return ALGORITHM_NAMES[algo] || algo;
}

export function simulateCpuScheduling(
  processes: Process[],
  algorithm: CpuAlgorithm,
  quantum: number = 2
): CpuSchedulingResult {
  if (processes.length === 0) {
    return {
      algorithm,
      algorithmName: ALGORITHM_NAMES[algorithm],
      ganttChart: [],
      processMetrics: [],
      avgTurnaroundTime: 0,
      avgWaitingTime: 0,
      avgResponseTime: 0,
      totalTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      executionLogs: ['No processes provided.'],
    };
  }

  switch (algorithm) {
    case 'FCFS':
      return simulateFCFS(processes);
    case 'SJF_NP':
      return simulateSJFNonPreemptive(processes);
    case 'SRTF':
      return simulateSRTF(processes);
    case 'PRIORITY_NP':
      return simulatePriorityNonPreemptive(processes);
    case 'PRIORITY_P':
      return simulatePriorityPreemptive(processes);
    case 'RR':
      return simulateRoundRobin(processes, Math.max(1, quantum));
  }
}

// 1. First-Come, First-Served (FCFS)
function simulateFCFS(processes: Process[]): CpuSchedulingResult {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
  const gantt: GanttSegment[] = [];
  const metrics: ProcessMetric[] = [];
  const logs: string[] = [];

  let currentTime = 0;
  let totalBusyTime = 0;

  logs.push(`Initial Queue sorted by Arrival Time: ${sorted.map(p => `${p.id}(AT:${p.arrivalTime}, BT:${p.burstTime})`).join(', ')}`);

  for (const p of sorted) {
    if (currentTime < p.arrivalTime) {
      logs.push(`[Time ${currentTime} -> ${p.arrivalTime}] CPU Idle (Waiting for ${p.id})`);
      gantt.push({
        processId: 'IDLE',
        startTime: currentTime,
        endTime: p.arrivalTime,
        duration: p.arrivalTime - currentTime,
      });
      currentTime = p.arrivalTime;
    }

    const startTime = currentTime;
    const endTime = startTime + p.burstTime;
    currentTime = endTime;
    totalBusyTime += p.burstTime;

    gantt.push({
      processId: p.id,
      startTime,
      endTime,
      duration: p.burstTime,
      color: p.color,
    });

    const completionTime = endTime;
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    const responseTime = startTime - p.arrivalTime;

    metrics.push({
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    });

    logs.push(`[Time ${startTime} -> ${endTime}] Process ${p.id} executed to completion. CT=${completionTime}, TAT=${turnaroundTime}, WT=${waitingTime}`);
  }

  return computeFinalResult('FCFS', gantt, metrics, currentTime, totalBusyTime, logs);
}

// 2. SJF Non-Preemptive
function simulateSJFNonPreemptive(processes: Process[]): CpuSchedulingResult {
  const remaining = processes.map(p => ({ ...p }));
  const gantt: GanttSegment[] = [];
  const metrics: ProcessMetric[] = [];
  const logs: string[] = [];

  let currentTime = 0;
  let totalBusyTime = 0;

  logs.push(`Running Shortest Job First (Non-Preemptive) with ${processes.length} processes`);

  while (remaining.length > 0) {
    // Check available processes at currentTime
    const available = remaining.filter(p => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      // Find the next arriving process
      const nextArrival = Math.min(...remaining.map(p => p.arrivalTime));
      logs.push(`[Time ${currentTime} -> ${nextArrival}] CPU Idle`);
      gantt.push({
        processId: 'IDLE',
        startTime: currentTime,
        endTime: nextArrival,
        duration: nextArrival - currentTime,
      });
      currentTime = nextArrival;
      continue;
    }

    // Pick process with shortest burst time; tie break: arrival time then id
    available.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
    const selected = available[0];

    const startTime = currentTime;
    const endTime = startTime + selected.burstTime;
    currentTime = endTime;
    totalBusyTime += selected.burstTime;

    gantt.push({
      processId: selected.id,
      startTime,
      endTime,
      duration: selected.burstTime,
      color: selected.color,
    });

    const completionTime = endTime;
    const turnaroundTime = completionTime - selected.arrivalTime;
    const waitingTime = turnaroundTime - selected.burstTime;
    const responseTime = startTime - selected.arrivalTime;

    metrics.push({
      id: selected.id,
      arrivalTime: selected.arrivalTime,
      burstTime: selected.burstTime,
      priority: selected.priority,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    });

    logs.push(`[Time ${startTime} -> ${endTime}] Process ${selected.id} (Burst: ${selected.burstTime}) scheduled. Completed at ${completionTime}`);

    // Remove from remaining
    const idx = remaining.findIndex(p => p.id === selected.id);
    remaining.splice(idx, 1);
  }

  return computeFinalResult('SJF_NP', gantt, metrics, currentTime, totalBusyTime, logs);
}

// 3. SRTF (SJF Preemptive)
function simulateSRTF(processes: Process[]): CpuSchedulingResult {
  const pMap = new Map<string, {
    proc: Process;
    remainingBurst: number;
    firstStartTime: number | null;
    completionTime: number;
  }>();

  processes.forEach(p => {
    pMap.set(p.id, {
      proc: p,
      remainingBurst: p.burstTime,
      firstStartTime: null,
      completionTime: 0,
    });
  });

  const rawSegments: { processId: string | 'IDLE'; time: number; color?: string }[] = [];
  const logs: string[] = [];
  let currentTime = 0;
  let completedCount = 0;
  let totalBusyTime = 0;

  const totalProcesses = processes.length;

  while (completedCount < totalProcesses) {
    // Get all arrived and incomplete processes
    const candidates: { id: string; remainingBurst: number; arrivalTime: number; priority: number; color: string }[] = [];
    pMap.forEach((val, id) => {
      if (val.proc.arrivalTime <= currentTime && val.remainingBurst > 0) {
        candidates.push({
          id,
          remainingBurst: val.remainingBurst,
          arrivalTime: val.proc.arrivalTime,
          priority: val.proc.priority,
          color: val.proc.color,
        });
      }
    });

    if (candidates.length === 0) {
      rawSegments.push({ processId: 'IDLE', time: currentTime });
      currentTime++;
      continue;
    }

    // Pick candidate with shortest remaining burst
    candidates.sort((a, b) => a.remainingBurst - b.remainingBurst || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
    const currentProc = candidates[0];
    const tracking = pMap.get(currentProc.id)!;

    if (tracking.firstStartTime === null) {
      tracking.firstStartTime = currentTime;
    }

    rawSegments.push({ processId: currentProc.id, time: currentTime, color: currentProc.color });
    tracking.remainingBurst--;
    totalBusyTime++;
    currentTime++;

    if (tracking.remainingBurst === 0) {
      tracking.completionTime = currentTime;
      completedCount++;
      logs.push(`[Time ${currentTime}] Process ${currentProc.id} finished execution.`);
    }
  }

  // Compress consecutive time units into Gantt segments
  const gantt = compressRawSegments(rawSegments);

  const metrics: ProcessMetric[] = [];
  pMap.forEach(({ proc, firstStartTime, completionTime }) => {
    const tat = completionTime - proc.arrivalTime;
    const wt = tat - proc.burstTime;
    const rt = (firstStartTime ?? proc.arrivalTime) - proc.arrivalTime;
    metrics.push({
      id: proc.id,
      arrivalTime: proc.arrivalTime,
      burstTime: proc.burstTime,
      priority: proc.priority,
      completionTime,
      turnaroundTime: tat,
      waitingTime: wt,
      responseTime: rt,
    });
  });

  return computeFinalResult('SRTF', gantt, metrics, currentTime, totalBusyTime, logs);
}

// 4. Priority Non-Preemptive (Lower number = Higher priority)
function simulatePriorityNonPreemptive(processes: Process[]): CpuSchedulingResult {
  const remaining = processes.map(p => ({ ...p }));
  const gantt: GanttSegment[] = [];
  const metrics: ProcessMetric[] = [];
  const logs: string[] = [];

  let currentTime = 0;
  let totalBusyTime = 0;

  logs.push(`Running Priority Scheduling (Non-Preemptive). Lower priority value indicates higher urgency.`);

  while (remaining.length > 0) {
    const available = remaining.filter(p => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      const nextArrival = Math.min(...remaining.map(p => p.arrivalTime));
      logs.push(`[Time ${currentTime} -> ${nextArrival}] CPU Idle`);
      gantt.push({
        processId: 'IDLE',
        startTime: currentTime,
        endTime: nextArrival,
        duration: nextArrival - currentTime,
      });
      currentTime = nextArrival;
      continue;
    }

    // Pick process with lowest priority value (highest priority)
    available.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
    const selected = available[0];

    const startTime = currentTime;
    const endTime = startTime + selected.burstTime;
    currentTime = endTime;
    totalBusyTime += selected.burstTime;

    gantt.push({
      processId: selected.id,
      startTime,
      endTime,
      duration: selected.burstTime,
      color: selected.color,
    });

    const completionTime = endTime;
    const turnaroundTime = completionTime - selected.arrivalTime;
    const waitingTime = turnaroundTime - selected.burstTime;
    const responseTime = startTime - selected.arrivalTime;

    metrics.push({
      id: selected.id,
      arrivalTime: selected.arrivalTime,
      burstTime: selected.burstTime,
      priority: selected.priority,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    });

    logs.push(`[Time ${startTime} -> ${endTime}] Process ${selected.id} (Priority: ${selected.priority}) finished.`);

    const idx = remaining.findIndex(p => p.id === selected.id);
    remaining.splice(idx, 1);
  }

  return computeFinalResult('PRIORITY_NP', gantt, metrics, currentTime, totalBusyTime, logs);
}

// 5. Priority Preemptive
function simulatePriorityPreemptive(processes: Process[]): CpuSchedulingResult {
  const pMap = new Map<string, {
    proc: Process;
    remainingBurst: number;
    firstStartTime: number | null;
    completionTime: number;
  }>();

  processes.forEach(p => {
    pMap.set(p.id, {
      proc: p,
      remainingBurst: p.burstTime,
      firstStartTime: null,
      completionTime: 0,
    });
  });

  const rawSegments: { processId: string | 'IDLE'; time: number; color?: string }[] = [];
  const logs: string[] = [];
  let currentTime = 0;
  let completedCount = 0;
  let totalBusyTime = 0;
  const totalProcesses = processes.length;

  while (completedCount < totalProcesses) {
    const candidates: { id: string; priority: number; arrivalTime: number; remainingBurst: number; color: string }[] = [];
    pMap.forEach((val, id) => {
      if (val.proc.arrivalTime <= currentTime && val.remainingBurst > 0) {
        candidates.push({
          id,
          priority: val.proc.priority,
          arrivalTime: val.proc.arrivalTime,
          remainingBurst: val.remainingBurst,
          color: val.proc.color,
        });
      }
    });

    if (candidates.length === 0) {
      rawSegments.push({ processId: 'IDLE', time: currentTime });
      currentTime++;
      continue;
    }

    // Pick highest priority (lowest numerical value)
    candidates.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
    const currentProc = candidates[0];
    const tracking = pMap.get(currentProc.id)!;

    if (tracking.firstStartTime === null) {
      tracking.firstStartTime = currentTime;
    }

    rawSegments.push({ processId: currentProc.id, time: currentTime, color: currentProc.color });
    tracking.remainingBurst--;
    totalBusyTime++;
    currentTime++;

    if (tracking.remainingBurst === 0) {
      tracking.completionTime = currentTime;
      completedCount++;
      logs.push(`[Time ${currentTime}] Process ${currentProc.id} finished execution.`);
    }
  }

  const gantt = compressRawSegments(rawSegments);

  const metrics: ProcessMetric[] = [];
  pMap.forEach(({ proc, firstStartTime, completionTime }) => {
    const tat = completionTime - proc.arrivalTime;
    const wt = tat - proc.burstTime;
    const rt = (firstStartTime ?? proc.arrivalTime) - proc.arrivalTime;
    metrics.push({
      id: proc.id,
      arrivalTime: proc.arrivalTime,
      burstTime: proc.burstTime,
      priority: proc.priority,
      completionTime,
      turnaroundTime: tat,
      waitingTime: wt,
      responseTime: rt,
    });
  });

  return computeFinalResult('PRIORITY_P', gantt, metrics, currentTime, totalBusyTime, logs);
}

// 6. Round Robin (RR)
function simulateRoundRobin(processes: Process[], quantum: number): CpuSchedulingResult {
  const pMap = new Map<string, {
    proc: Process;
    remainingBurst: number;
    firstStartTime: number | null;
    completionTime: number;
  }>();

  processes.forEach(p => {
    pMap.set(p.id, {
      proc: p,
      remainingBurst: p.burstTime,
      firstStartTime: null,
      completionTime: 0,
    });
  });

  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
  const readyQueue: string[] = [];
  const inQueueOrCompleted = new Set<string>();

  const gantt: GanttSegment[] = [];
  const logs: string[] = [];
  let currentTime = 0;
  let totalBusyTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;

  logs.push(`Starting Round Robin Scheduling with Time Quantum = ${quantum}`);

  // Helper to push arriving processes to ready queue
  const checkArrivals = (time: number) => {
    for (const p of sorted) {
      if (p.arrivalTime <= time && !inQueueOrCompleted.has(p.id)) {
        readyQueue.push(p.id);
        inQueueOrCompleted.add(p.id);
        logs.push(`[Time ${time}] Process ${p.id} arrived and added to ready queue.`);
      }
    }
  };

  checkArrivals(currentTime);

  while (completedCount < totalProcesses) {
    if (readyQueue.length === 0) {
      // Find next arriving
      const unarrived = sorted.filter(p => !inQueueOrCompleted.has(p.id));
      if (unarrived.length > 0) {
        const nextArrival = Math.min(...unarrived.map(p => p.arrivalTime));
        logs.push(`[Time ${currentTime} -> ${nextArrival}] CPU Idle (Waiting for new arrivals)`);
        gantt.push({
          processId: 'IDLE',
          startTime: currentTime,
          endTime: nextArrival,
          duration: nextArrival - currentTime,
        });
        currentTime = nextArrival;
        checkArrivals(currentTime);
        continue;
      } else {
        break;
      }
    }

    const currentId = readyQueue.shift()!;
    const tracking = pMap.get(currentId)!;

    if (tracking.firstStartTime === null) {
      tracking.firstStartTime = currentTime;
    }

    const executeTime = Math.min(tracking.remainingBurst, quantum);
    const startTime = currentTime;
    const endTime = startTime + executeTime;

    gantt.push({
      processId: currentId,
      startTime,
      endTime,
      duration: executeTime,
      color: tracking.proc.color,
    });

    tracking.remainingBurst -= executeTime;
    currentTime = endTime;
    totalBusyTime += executeTime;

    logs.push(`[Time ${startTime} -> ${endTime}] Process ${currentId} executed for ${executeTime} units (Remaining: ${tracking.remainingBurst})`);

    // Check new arrivals that arrived while this process was executing
    checkArrivals(currentTime);

    if (tracking.remainingBurst === 0) {
      tracking.completionTime = currentTime;
      completedCount++;
      logs.push(`[Time ${currentTime}] Process ${currentId} finished execution.`);
    } else {
      // Re-queue
      readyQueue.push(currentId);
      logs.push(`[Time ${currentTime}] Process ${currentId} re-added to tail of ready queue.`);
    }
  }

  const metrics: ProcessMetric[] = [];
  pMap.forEach(({ proc, firstStartTime, completionTime }) => {
    const tat = completionTime - proc.arrivalTime;
    const wt = tat - proc.burstTime;
    const rt = (firstStartTime ?? proc.arrivalTime) - proc.arrivalTime;
    metrics.push({
      id: proc.id,
      arrivalTime: proc.arrivalTime,
      burstTime: proc.burstTime,
      priority: proc.priority,
      completionTime,
      turnaroundTime: tat,
      waitingTime: wt,
      responseTime: rt,
    });
  });

  return computeFinalResult('RR', gantt, metrics, currentTime, totalBusyTime, logs);
}

// Compress sequential 1-unit blocks into contiguous Gantt segments
function compressRawSegments(raw: { processId: string | 'IDLE'; time: number; color?: string }[]): GanttSegment[] {
  if (raw.length === 0) return [];
  const segments: GanttSegment[] = [];
  let currentSegment: GanttSegment = {
    processId: raw[0].processId,
    startTime: raw[0].time,
    endTime: raw[0].time + 1,
    duration: 1,
    color: raw[0].color,
  };

  for (let i = 1; i < raw.length; i++) {
    const item = raw[i];
    if (item.processId === currentSegment.processId) {
      currentSegment.endTime = item.time + 1;
      currentSegment.duration = currentSegment.endTime - currentSegment.startTime;
    } else {
      segments.push(currentSegment);
      currentSegment = {
        processId: item.processId,
        startTime: item.time,
        endTime: item.time + 1,
        duration: 1,
        color: item.color,
      };
    }
  }
  segments.push(currentSegment);
  return segments;
}

// Helper to compute overall metrics
function computeFinalResult(
  algorithm: CpuAlgorithm,
  ganttChart: GanttSegment[],
  metrics: ProcessMetric[],
  totalTime: number,
  totalBusyTime: number,
  logs: string[]
): CpuSchedulingResult {
  metrics.sort((a, b) => a.id.localeCompare(b.id));

  const totalTat = metrics.reduce((sum, m) => sum + m.turnaroundTime, 0);
  const totalWt = metrics.reduce((sum, m) => sum + m.waitingTime, 0);
  const totalRt = metrics.reduce((sum, m) => sum + m.responseTime, 0);
  const count = metrics.length || 1;

  const avgTurnaroundTime = Number((totalTat / count).toFixed(2));
  const avgWaitingTime = Number((totalWt / count).toFixed(2));
  const avgResponseTime = Number((totalRt / count).toFixed(2));
  const cpuUtilization = totalTime > 0 ? Number(((totalBusyTime / totalTime) * 100).toFixed(2)) : 0;
  const throughput = totalTime > 0 ? Number((metrics.length / totalTime).toFixed(4)) : 0;

  logs.push(`--- SUMMARY METRICS ---`);
  logs.push(`Average Turnaround Time: ${avgTurnaroundTime} ms`);
  logs.push(`Average Waiting Time: ${avgWaitingTime} ms`);
  logs.push(`Average Response Time: ${avgResponseTime} ms`);
  logs.push(`CPU Utilization: ${cpuUtilization}%`);
  logs.push(`Throughput: ${throughput} processes/unit time`);

  return {
    algorithm,
    algorithmName: ALGORITHM_NAMES[algorithm],
    ganttChart,
    processMetrics: metrics,
    avgTurnaroundTime,
    avgWaitingTime,
    avgResponseTime,
    totalTime,
    cpuUtilization,
    throughput,
    executionLogs: logs,
  };
}
