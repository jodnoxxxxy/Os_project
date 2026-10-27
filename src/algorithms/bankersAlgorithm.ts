/**
 * Banker's Algorithm for Deadlock Avoidance
 * Includes Safety Algorithm and Resource-Request Algorithm
 */

import { BankersResult, BankersSafetyStep, BankersState } from '../types/os';

export function runBankersSafety(state: BankersState): BankersResult {
  const { processCount, resourceCount, allocation, max, available, resourceNames } = state;

  // Compute Need matrix: Need[i][j] = Max[i][j] - Allocation[i][j]
  const needMatrix: number[][] = [];
  for (let i = 0; i < processCount; i++) {
    const row: number[] = [];
    for (let j = 0; j < resourceCount; j++) {
      row.push(Math.max(0, max[i][j] - allocation[i][j]));
    }
    needMatrix.push(row);
  }

  const work = [...available];
  const finish = Array(processCount).fill(false);
  const safeSequence: string[] = [];
  const steps: BankersSafetyStep[] = [];
  const logs: string[] = [];

  logs.push(`Starting Banker's Safety Algorithm.`);
  logs.push(`Initial Available: [${work.join(', ')}] for resources: [${resourceNames.join(', ')}]`);

  let count = 0;
  let stepNumber = 1;

  while (count < processCount) {
    let found = false;

    for (let i = 0; i < processCount; i++) {
      if (!finish[i]) {
        const processId = `P${i}`;
        const procNeed = needMatrix[i];
        const procAlloc = allocation[i];

        // Check if Need_i <= Work
        let canAllocate = true;
        for (let j = 0; j < resourceCount; j++) {
          if (procNeed[j] > work[j]) {
            canAllocate = false;
            break;
          }
        }

        if (canAllocate) {
          const workBefore = [...work];
          for (let j = 0; j < resourceCount; j++) {
            work[j] += procAlloc[j];
          }
          const workAfter = [...work];

          finish[i] = true;
          safeSequence.push(processId);
          found = true;
          count++;

          const desc = `${processId} can execute! Need [${procNeed.join(', ')}] <= Available [${workBefore.join(', ')}]. Releases Allocation [${procAlloc.join(', ')}] -> New Available [${workAfter.join(', ')}]`;
          logs.push(desc);

          steps.push({
            step: stepNumber++,
            processIndex: i,
            processId,
            workBefore,
            need: [...procNeed],
            allocation: [...procAlloc],
            workAfter,
            canExecute: true,
            reason: desc,
          });

          break; // restart check with updated work
        }
      }
    }

    if (!found) {
      logs.push(`Deadlock Warning: No remaining unallocated process has Need <= Current Available. System is in an UNSAFE state!`);
      break;
    }
  }

  const isSafe = count === processCount;

  if (isSafe) {
    logs.push(`System is in a SAFE STATE. Safe Sequence: < ${safeSequence.join(' -> ')} >`);
  } else {
    logs.push(`System is NOT in a safe state. Potential deadlock detected.`);
  }

  return {
    isSafe,
    safeSequence,
    steps,
    needMatrix,
    executionLogs: logs,
  };
}

export interface ResourceRequestEvaluation {
  allowed: boolean;
  message: string;
  tentativeResult?: BankersResult;
}

export function evaluateResourceRequest(
  state: BankersState,
  processIndex: number,
  request: number[]
): ResourceRequestEvaluation {
  const { resourceCount, allocation, max, available } = state;
  const pId = `P${processIndex}`;

  const need = Array.from(
    { length: resourceCount },
    (_, j) => max[processIndex][j] - allocation[processIndex][j]
  );

  // 1. Check if Request <= Need
  for (let j = 0; j < resourceCount; j++) {
    if (request[j] > need[j]) {
      return {
        allowed: false,
        message: `${pId} asks for [${request.join(', ')}], but its remaining need is only [${need.join(', ')}]. A process cannot request more than it declared in Max.`,
      };
    }
  }

  // 2. Check if Request <= Available
  for (let j = 0; j < resourceCount; j++) {
    if (request[j] > available[j]) {
      return {
        allowed: false,
        message: `The request [${request.join(', ')}] is larger than the resources available right now [${available.join(', ')}]. ${pId} has to wait until other processes release some.`,
      };
    }
  }

  // 3. Pretend to allocate
  const tentativeAllocation = state.allocation.map(row => [...row]);
  const tentativeAvailable = [...available];

  for (let j = 0; j < resourceCount; j++) {
    tentativeAvailable[j] -= request[j];
    tentativeAllocation[processIndex][j] += request[j];
  }

  const tentativeState: BankersState = {
    ...state,
    allocation: tentativeAllocation,
    available: tentativeAvailable,
  };

  const safetyResult = runBankersSafety(tentativeState);

  if (safetyResult.isSafe) {
    return {
      allowed: true,
      message: `Granting [${request.join(', ')}] to ${pId} leaves a safe order: ${safetyResult.safeSequence.join(' -> ')}.`,
      tentativeResult: safetyResult,
    };
  } else {
    return {
      allowed: false,
      message: `Granting [${request.join(', ')}] to ${pId} would leave no safe order, so the request is refused and the process waits.`,
      tentativeResult: safetyResult,
    };
  }
}
