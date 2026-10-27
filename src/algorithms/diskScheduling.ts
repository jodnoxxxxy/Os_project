/**
 * Disk Head Scheduling Algorithms
 * FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK
 */

import { DiskAlgorithm, DiskDirection, DiskSchedulingResult, DiskStep } from '../types/os';

const ALGORITHM_NAMES: Record<DiskAlgorithm, string> = {
  FCFS: 'First-Come, First-Served (FCFS)',
  SSTF: 'Shortest Seek Time First (SSTF)',
  SCAN: 'SCAN (Elevator Algorithm)',
  'C-SCAN': 'Circular SCAN (C-SCAN)',
  LOOK: 'LOOK Algorithm',
  'C-LOOK': 'Circular LOOK (C-LOOK)',
};

export function getDiskAlgorithmName(algo: DiskAlgorithm): string {
  return ALGORITHM_NAMES[algo] || algo;
}

export function simulateDiskScheduling(
  requestSequence: number[],
  initialHead: number,
  maxCylinder: number = 199,
  direction: DiskDirection = 'right',
  algorithm: DiskAlgorithm = 'FCFS'
): DiskSchedulingResult {
  const requests = [...requestSequence];
  const logs: string[] = [];

  logs.push(`Running ${ALGORITHM_NAMES[algorithm]} starting at Head: ${initialHead}, Max Cylinder: ${maxCylinder}, Direction: ${direction}`);
  logs.push(`Request Queue: [${requests.join(', ')}]`);

  let seekSequence: number[] = [];

  switch (algorithm) {
    case 'FCFS':
      seekSequence = runFCFS(requests, initialHead);
      break;
    case 'SSTF':
      seekSequence = runSSTF(requests, initialHead);
      break;
    case 'SCAN':
      seekSequence = runSCAN(requests, initialHead, maxCylinder, direction);
      break;
    case 'C-SCAN':
      seekSequence = runCSCAN(requests, initialHead, maxCylinder, direction);
      break;
    case 'LOOK':
      seekSequence = runLOOK(requests, initialHead, direction);
      break;
    case 'C-LOOK':
      seekSequence = runCLOOK(requests, initialHead, direction);
      break;
  }

  // Calculate step-by-step distances and total head movement
  const steps: DiskStep[] = [];
  let totalHeadMovement = 0;

  for (let i = 0; i < seekSequence.length - 1; i++) {
    const from = seekSequence[i];
    const to = seekSequence[i + 1];
    const dist = Math.abs(to - from);
    totalHeadMovement += dist;
    steps.push({
      step: i + 1,
      from,
      to,
      distance: dist,
    });
    logs.push(`Step ${i + 1}: Move from ${from} to ${to} (Seek: ${dist} cylinders)`);
  }

  const avgSeekLength = requests.length > 0 ? Number((totalHeadMovement / requests.length).toFixed(2)) : 0;

  logs.push(`--- SUMMARY METRICS ---`);
  logs.push(`Total Head Movement: ${totalHeadMovement} cylinders`);
  logs.push(`Average Seek Length: ${avgSeekLength} cylinders/request`);

  return {
    algorithm,
    algorithmName: ALGORITHM_NAMES[algorithm],
    requestSequence,
    initialHead,
    maxCylinder,
    direction,
    seekSequence,
    steps,
    totalHeadMovement,
    avgSeekLength,
    executionLogs: logs,
  };
}

// 1. FCFS
function runFCFS(requests: number[], initialHead: number): number[] {
  return [initialHead, ...requests];
}

// 2. SSTF
function runSSTF(requests: number[], initialHead: number): number[] {
  const result: number[] = [initialHead];
  const pending = [...requests];
  let current = initialHead;

  while (pending.length > 0) {
    let closestIndex = 0;
    let minDistance = Math.abs(pending[0] - current);

    for (let i = 1; i < pending.length; i++) {
      const dist = Math.abs(pending[i] - current);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    current = pending[closestIndex];
    result.push(current);
    pending.splice(closestIndex, 1);
  }

  return result;
}

// 3. SCAN
function runSCAN(requests: number[], initialHead: number, maxCylinder: number, direction: DiskDirection): number[] {
  const left = requests.filter(r => r < initialHead).sort((a, b) => b - a); // descending
  const right = requests.filter(r => r >= initialHead).sort((a, b) => a - b); // ascending

  const sequence: number[] = [initialHead];

  if (direction === 'right') {
    sequence.push(...right);
    if (left.length > 0) {
      // Reaches physical end if turning back
      if (!sequence.includes(maxCylinder)) sequence.push(maxCylinder);
      sequence.push(...left);
    }
  } else {
    // left direction
    sequence.push(...left);
    if (right.length > 0) {
      if (!sequence.includes(0)) sequence.push(0);
      sequence.push(...right);
    }
  }

  return sequence;
}

// 4. C-SCAN
function runCSCAN(requests: number[], initialHead: number, maxCylinder: number, direction: DiskDirection): number[] {
  const left = requests.filter(r => r < initialHead).sort((a, b) => a - b); // ascending
  const right = requests.filter(r => r >= initialHead).sort((a, b) => a - b); // ascending

  const sequence: number[] = [initialHead];

  if (direction === 'right') {
    sequence.push(...right);
    if (left.length > 0) {
      if (!sequence.includes(maxCylinder)) sequence.push(maxCylinder);
      sequence.push(0);
      sequence.push(...left);
    }
  } else {
    // left direction
    const leftDesc = [...left].reverse();
    const rightDesc = [...right].reverse();
    sequence.push(...leftDesc);
    if (right.length > 0) {
      if (!sequence.includes(0)) sequence.push(0);
      sequence.push(maxCylinder);
      sequence.push(...rightDesc);
    }
  }

  return sequence;
}

// 5. LOOK
function runLOOK(requests: number[], initialHead: number, direction: DiskDirection): number[] {
  const left = requests.filter(r => r < initialHead).sort((a, b) => b - a); // descending
  const right = requests.filter(r => r >= initialHead).sort((a, b) => a - b); // ascending

  const sequence: number[] = [initialHead];

  if (direction === 'right') {
    sequence.push(...right);
    sequence.push(...left);
  } else {
    sequence.push(...left);
    sequence.push(...right);
  }

  return sequence;
}

// 6. C-LOOK
function runCLOOK(requests: number[], initialHead: number, direction: DiskDirection): number[] {
  const left = requests.filter(r => r < initialHead).sort((a, b) => a - b); // ascending
  const right = requests.filter(r => r >= initialHead).sort((a, b) => a - b); // ascending

  const sequence: number[] = [initialHead];

  if (direction === 'right') {
    sequence.push(...right);
    sequence.push(...left);
  } else {
    const leftDesc = [...left].reverse();
    const rightDesc = [...right].reverse();
    sequence.push(...leftDesc);
    sequence.push(...rightDesc);
  }

  return sequence;
}
