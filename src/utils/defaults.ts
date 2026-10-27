import { BankersState, Process, StudentReportInfo } from '../types/os';

export const DEFAULT_PROCESSES: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 3, color: '#3b82f6' }, // blue
  { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, color: '#10b981' }, // emerald
  { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4, color: '#f59e0b' }, // amber
  { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 2, color: '#8b5cf6' }, // purple
  { id: 'P5', arrivalTime: 4, burstTime: 4, priority: 5, color: '#ec4899' }, // pink
];

export const DEFAULT_PAGE_REFERENCE_STRING: number[] = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
export const DEFAULT_FRAME_COUNT = 3;

export const DEFAULT_DISK_REQUESTS: number[] = [98, 183, 37, 122, 14, 124, 65, 67];
export const DEFAULT_INITIAL_HEAD = 53;
export const DEFAULT_MAX_CYLINDER = 199;

export const DEFAULT_BANKERS_STATE: BankersState = {
  processCount: 5,
  resourceCount: 3,
  resourceNames: ['A', 'B', 'C'],
  allocation: [
    [0, 1, 0], // P0
    [2, 0, 0], // P1
    [3, 0, 2], // P2
    [2, 1, 1], // P3
    [0, 0, 2], // P4
  ],
  max: [
    [7, 5, 3], // P0
    [3, 2, 2], // P1
    [9, 0, 2], // P2
    [2, 2, 2], // P3
    [4, 3, 3], // P4
  ],
  need: [
    [7, 4, 3],
    [1, 2, 2],
    [6, 0, 0],
    [0, 1, 1],
    [4, 3, 1],
  ],
  available: [3, 3, 2],
};

export const DEFAULT_STUDENT_INFO: StudentReportInfo = {
  projectTitle: 'Simulation, Comparative Analysis, and Benchmarking of Core Operating System Algorithms',
  studentName: 'Shreyash Dalvi',
  rollNumber: 'CS-2024-042',
  department: 'Department of Computer Science & Engineering',
  collegeName: 'National Institute of Engineering & Technology',
  courseCode: 'CS-304',
  courseName: 'Operating Systems Laboratory',
  academicYear: '2025 - 2026',
  guideName: 'Prof. Anjali Sharma',
  submissionDate: new Date().toISOString().split('T')[0],
  additionalNotes: 'Mini project submitted towards partial fulfillment for bachelor’s degree in Computer Engineering.',
};
