import { BankersState, Process, StudentReportInfo } from '../types/os';

export const DEFAULT_PROCESSES: Process[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 3, color: '#33608c' },
  { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, color: '#3c6b50' },
  { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4, color: '#a8762a' },
  { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 2, color: '#6a4575' },
  { id: 'P5', arrivalTime: 4, burstTime: 4, priority: 5, color: '#9b4a3d' },
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
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  max: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
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
  projectTitle: 'Operating System Algorithms: Simulator and Lab Report',
  studentName: 'Shreyash Dalvi',
  rollNumber: 'Add your roll number',
  department: 'Computer Engineering',
  collegeName: 'Add your college name',
  courseCode: 'CS-304',
  courseName: 'Operating Systems Laboratory',
  academicYear: '2026 - 2027',
  guideName: "Add your guide's name",
  submissionDate: new Date().toISOString().split('T')[0],
  additionalNotes: 'Submitted as part of the Operating Systems laboratory course.',
};
