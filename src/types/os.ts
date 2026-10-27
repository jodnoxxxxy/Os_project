/**
 * Operating System Mini Project - Data Types & Interfaces
 */

export type AlgorithmModule = 'cpu' | 'page' | 'disk' | 'banker' | 'report';

// CPU Scheduling Types
export type CpuAlgorithm = 'FCFS' | 'SJF_NP' | 'SRTF' | 'PRIORITY_NP' | 'PRIORITY_P' | 'RR';

export interface Process {
  id: string; // e.g., 'P1'
  arrivalTime: number;
  burstTime: number;
  priority: number; // lower number = higher priority
  color: string;
}

export interface GanttSegment {
  processId: string | 'IDLE';
  startTime: number;
  endTime: number;
  duration: number;
  color?: string;
}

export interface ProcessMetric {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  completionTime: number;
  turnaroundTime: number; // CT - AT
  waitingTime: number; // TAT - BT
  responseTime: number; // First execution start - AT
}

export interface CpuSchedulingResult {
  algorithm: CpuAlgorithm;
  algorithmName: string;
  ganttChart: GanttSegment[];
  processMetrics: ProcessMetric[];
  avgTurnaroundTime: number;
  avgWaitingTime: number;
  avgResponseTime: number;
  totalTime: number;
  cpuUtilization: number; // percentage
  throughput: number; // processes per unit time
  executionLogs: string[];
}

// Page Replacement Types
export type PageAlgorithm = 'FIFO' | 'LRU' | 'OPT' | 'LFU';

export interface PageStep {
  step: number;
  page: number;
  frames: (number | null)[];
  isHit: boolean;
  replacedPage?: number | null;
  description: string;
}

export interface PageReplacementResult {
  algorithm: PageAlgorithm;
  algorithmName: string;
  referenceString: number[];
  frameCount: number;
  steps: PageStep[];
  totalHits: number;
  totalFaults: number;
  hitRatio: number;
  faultRatio: number;
  executionLogs: string[];
}

// Disk Scheduling Types
export type DiskAlgorithm = 'FCFS' | 'SSTF' | 'SCAN' | 'C-SCAN' | 'LOOK' | 'C-LOOK';
export type DiskDirection = 'left' | 'right';

export interface DiskStep {
  step: number;
  from: number;
  to: number;
  distance: number;
}

export interface DiskSchedulingResult {
  algorithm: DiskAlgorithm;
  algorithmName: string;
  requestSequence: number[];
  initialHead: number;
  maxCylinder: number;
  direction: DiskDirection;
  seekSequence: number[];
  steps: DiskStep[];
  totalHeadMovement: number;
  avgSeekLength: number;
  executionLogs: string[];
}

// Banker's Algorithm Types
export interface BankersState {
  processCount: number;
  resourceCount: number;
  resourceNames: string[];
  allocation: number[][]; // [process][resource]
  max: number[][]; // [process][resource]
  need: number[][]; // max - allocation
  available: number[]; // [resource]
}

export interface BankersSafetyStep {
  step: number;
  processIndex: number;
  processId: string;
  workBefore: number[];
  need: number[];
  allocation: number[];
  workAfter: number[];
  canExecute: boolean;
  reason: string;
}

export interface BankersResult {
  isSafe: boolean;
  safeSequence: string[];
  steps: BankersSafetyStep[];
  needMatrix: number[][];
  executionLogs: string[];
}

// Academic Report Metadata
export interface StudentReportInfo {
  projectTitle: string;
  studentName: string;
  rollNumber: string;
  department: string;
  collegeName: string;
  courseCode: string;
  courseName: string;
  academicYear: string;
  guideName: string;
  submissionDate: string;
  additionalNotes: string;
}
