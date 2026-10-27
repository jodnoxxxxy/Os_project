import React, { useState } from 'react';
import {
  BankersResult,
  BankersState,
  CpuAlgorithm,
  CpuSchedulingResult,
  DiskAlgorithm,
  DiskDirection,
  DiskSchedulingResult,
  PageAlgorithm,
  PageReplacementResult,
  Process,
  StudentReportInfo,
} from '../types/os';
import { getCpuAlgorithmName, simulateCpuScheduling } from '../algorithms/cpuScheduling';
import { getPageAlgorithmName, simulatePageReplacement } from '../algorithms/pageReplacement';
import { getDiskAlgorithmName, simulateDiskScheduling } from '../algorithms/diskScheduling';
import { runBankersSafety } from '../algorithms/bankersAlgorithm';
import {
  Printer,
  Download,
  Copy,
  Check,
  Edit3,
  FileText,
  Award,
  Layers,
  HardDrive,
  ShieldCheck,
  Cpu,
  GraduationCap,
} from 'lucide-react';

interface ProjectReportViewProps {
  processes: Process[];
  pageReferenceString: number[];
  frameCount: number;
  diskRequests: number[];
  diskInitialHead: number;
  diskMaxCylinder: number;
  diskDirection: DiskDirection;
  bankersState: BankersState;
  studentInfo: StudentReportInfo;
  onUpdateStudentInfo: (info: StudentReportInfo) => void;
}

export const ProjectReportView: React.FC<ProjectReportViewProps> = ({
  processes,
  pageReferenceString,
  frameCount,
  diskRequests,
  diskInitialHead,
  diskMaxCylinder,
  diskDirection,
  bankersState,
  studentInfo,
  onUpdateStudentInfo,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Compute all simulations for the report
  const cpuResult: CpuSchedulingResult = simulateCpuScheduling(processes, 'FCFS');
  const cpuAllAlgos: CpuAlgorithm[] = ['FCFS', 'SJF_NP', 'SRTF', 'PRIORITY_NP', 'PRIORITY_P', 'RR'];
  const cpuComparisons = cpuAllAlgos.map((a) => ({
    algo: a,
    name: getCpuAlgorithmName(a),
    result: simulateCpuScheduling(processes, a, 2),
  }));
  const bestCpu = [...cpuComparisons].sort((a, b) => a.result.avgWaitingTime - b.result.avgWaitingTime)[0];

  const pageResult: PageReplacementResult = simulatePageReplacement(pageReferenceString, frameCount, 'FIFO');
  const pageAllAlgos: PageAlgorithm[] = ['FIFO', 'LRU', 'OPT', 'LFU'];
  const pageComparisons = pageAllAlgos.map((a) => ({
    algo: a,
    name: getPageAlgorithmName(a),
    result: simulatePageReplacement(pageReferenceString, frameCount, a),
  }));
  const bestPage = [...pageComparisons].sort((a, b) => a.result.totalFaults - b.result.totalFaults)[0];

  const diskResult: DiskSchedulingResult = simulateDiskScheduling(
    diskRequests,
    diskInitialHead,
    diskMaxCylinder,
    diskDirection,
    'FCFS'
  );
  const diskAllAlgos: DiskAlgorithm[] = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'];
  const diskComparisons = diskAllAlgos.map((a) => ({
    algo: a,
    name: getDiskAlgorithmName(a),
    result: simulateDiskScheduling(diskRequests, diskInitialHead, diskMaxCylinder, diskDirection, a),
  }));
  const bestDisk = [...diskComparisons].sort((a, b) => a.result.totalHeadMovement - b.result.totalHeadMovement)[0];

  const bankersResult: BankersResult = runBankersSafety(bankersState);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Generate full Markdown text
  const generateMarkdownReport = (): string => {
    return `# ${studentInfo.projectTitle}
**${studentInfo.collegeName}**
**${studentInfo.department}**

---
- **Student Name:** ${studentInfo.studentName}
- **Roll / Registration No:** ${studentInfo.rollNumber}
- **Course & Subject:** ${studentInfo.courseCode} - ${studentInfo.courseName}
- **Academic Year:** ${studentInfo.academicYear}
- **Faculty Guide / Mentor:** ${studentInfo.guideName}
- **Date of Submission:** ${studentInfo.submissionDate}
---

## 1. ABSTRACT & PROJECT OBJECTIVES
This mini project implements, benchmarks, and comparatively analyzes core Operating System kernel subsystems:
1. **CPU Process Scheduling:** First-Come First-Served, Shortest Job First (Non-Preemptive & Preemptive/SRTF), Priority Scheduling, and Round Robin.
2. **Virtual Memory Demand Paging:** FIFO, LRU, Optimal (Bélády's), and LFU page replacement algorithms.
3. **Secondary Disk Head Scheduling:** FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK seek trajectory minimization.
4. **Deadlock Avoidance:** Dijkstra's Banker's Algorithm ensuring safety invariants and circular-wait prevention.

---

## 2. MODULE 1: CPU PROCESS SCHEDULING
### 2.1 Theoretical Formulation
- **Turnaround Time (TAT):** $TAT = Completion\\_Time - Arrival\\_Time$
- **Waiting Time (WT):** $WT = Turnaround\\_Time - Burst\\_Time$
- **Response Time (RT):** $RT = First\\_Execution\\_Start - Arrival\\_Time$
- **CPU Utilization:** $(Busy\\_Time / Total\\_Time) \\times 100\\%$

### 2.2 Process Input Table
| Process ID | Arrival Time (AT) | Burst Time (BT) | Priority |
| :--- | :--- | :--- | :--- |
${processes.map((p) => `| ${p.id} | ${p.arrivalTime} | ${p.burstTime} | ${p.priority} |`).join('\n')}

### 2.3 Comparative Algorithm Benchmarking
| Algorithm | Avg Waiting Time (ms) | Avg Turnaround Time (ms) | CPU Utilization (%) |
| :--- | :--- | :--- | :--- |
${cpuComparisons.map((c) => `| ${c.name} | ${c.result.avgWaitingTime} | ${c.result.avgTurnaroundTime} | ${c.result.cpuUtilization}% |`).join('\n')}

**Key Observation:** For this workload, **${bestCpu.name}** provided the minimum average waiting time of **${bestCpu.result.avgWaitingTime} ms**.

---

## 3. MODULE 2: VIRTUAL MEMORY PAGE REPLACEMENT
### 3.1 Input Configuration
- **Reference String:** \`[${pageReferenceString.join(', ')}]\`
- **Allocated Physical Frames:** ${frameCount}

### 3.2 Comparative Performance
| Algorithm | Page Faults (Misses) | Page Hits | Hit Ratio (%) | Fault Ratio (%) |
| :--- | :--- | :--- | :--- | :--- |
${pageComparisons.map((p) => `| ${p.name} | ${p.result.totalFaults} | ${p.result.totalHits} | ${p.result.hitRatio}% | ${p.result.faultRatio}% |`).join('\n')}

**Key Observation:** **${bestPage.name}** achieved the lowest fault count of **${bestPage.result.totalFaults} faults** (${bestPage.result.hitRatio}% hit ratio).

---

## 4. MODULE 3: DISK HEAD SCHEDULING
### 4.1 Input Parameters
- **Disk Request Queue:** \`[${diskRequests.join(', ')}]\`
- **Initial Head Position:** Cylinder ${diskInitialHead}
- **Disk Capacity:** Cylinders 0 to ${diskMaxCylinder}
- **Arm Traversal Direction:** Towards cylinder ${diskDirection === 'right' ? diskMaxCylinder : 0}

### 4.2 Comparative Seek Traversal
| Algorithm | Total Head Movement (Cylinders) | Avg Seek Length (Cyl/Req) |
| :--- | :--- | :--- |
${diskComparisons.map((d) => `| ${d.name} | ${d.result.totalHeadMovement} | ${d.result.avgSeekLength} |`).join('\n')}

**Key Observation:** **${bestDisk.name}** minimized mechanical arm wear with **${bestDisk.result.totalHeadMovement} cylinders** traversed.

---

## 5. MODULE 4: DEADLOCK AVOIDANCE (BANKER'S ALGORITHM)
### 5.1 System State
- **Processes:** ${bankersState.processCount} (P0 to P${bankersState.processCount - 1})
- **Resources:** ${bankersState.resourceNames.join(', ')}
- **Available Vector:** \`[${bankersState.available.join(', ')}]\`

### 5.2 Verification Result
- **System Safe Invariant:** ${bankersResult.isSafe ? 'YES - SAFE STATE' : 'NO - DEADLOCK / UNSAFE STATE'}
- **Safe Execution Sequence:** ${bankersResult.isSafe ? `< ${bankersResult.safeSequence.join(' -> ')} >` : 'None (System in deadlock)'}

---

## 6. CONCLUSION & LEARNING OUTCOMES
1. Preemptive scheduling algorithms like SRTF consistently lower waiting times for heterogeneous burst sets compared to FCFS.
2. Optimal Page Replacement establishes the theoretical minimum page fault baseline, while LRU serves as the most viable practical approximation.
3. Disk scheduling algorithms such as LOOK and SSTF dramatically reduce mechanical seek delays over FCFS.
4. Banker's Algorithm dynamically avoids deadlocks by ensuring that every tentative allocation maintains at least one valid path where all processes can execute to completion.

---
**Student Signature:** ___________________________  
**Faculty / Examiner Signature:** ___________________________  
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = generateMarkdownReport();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OS_Mini_Project_Report_${studentInfo.rollNumber || 'CS'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const data = {
      metadata: studentInfo,
      cpu: { processes, comparisons: cpuComparisons },
      pageReplacement: { referenceString: pageReferenceString, frameCount, comparisons: pageComparisons },
      disk: { requests: diskRequests, initialHead: diskInitialHead, maxCylinder: diskMaxCylinder, comparisons: diskComparisons },
      bankers: { state: bankersState, result: bankersResult },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OS_Mini_Project_Data_${studentInfo.rollNumber || 'CS'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden during print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Academic Lab Mini-Project Report
          </h2>
          <p className="text-xs text-slate-400">
            Formatted to university submission standards with mathematical proofs, Gantt records, and comparison tables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditingInfo(!isEditingInfo)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            {isEditingInfo ? 'Close Editor' : 'Edit Student Details'}
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            {copied ? 'Copied MD' : 'Copy MD'}
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            .md Report
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            JSON
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-bold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* Student & Project Metadata Editor (Collapsible) */}
      {isEditingInfo && (
        <div className="no-print bg-slate-900 border border-indigo-500/30 rounded-lg p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Student & Institution Submission Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Project Title</label>
              <input
                type="text"
                value={studentInfo.projectTitle}
                onChange={(e) => onUpdateStudentInfo({ ...studentInfo, projectTitle: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Student Name</label>
              <input
                type="text"
                value={studentInfo.studentName}
                onChange={(e) => onUpdateStudentInfo({ ...studentInfo, studentName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Roll / PRN Number</label>
              <input
                type="text"
                value={studentInfo.rollNumber}
                onChange={(e) => onUpdateStudentInfo({ ...studentInfo, rollNumber: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Department</label>
              <input
                type="text"
                value={studentInfo.department}
                onChange={(e) => onUpdateStudentInfo({ ...studentInfo, department: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">College / University</label>
              <input
                type="text"
                value={studentInfo.collegeName}
                onChange={(e) => onUpdateStudentInfo({ ...studentInfo, collegeName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Course Code & Subject</label>
              <input
                type="text"
                value={studentInfo.courseCode + ' - ' + studentInfo.courseName}
                onChange={(e) => onUpdateStudentInfo({ ...studentInfo, courseName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Faculty Guide / Mentor</label>
              <input
                type="text"
                value={studentInfo.guideName}
                onChange={(e) => onUpdateStudentInfo({ ...studentInfo, guideName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Academic Year</label>
              <input
                type="text"
                value={studentInfo.academicYear}
                onChange={(e) => onUpdateStudentInfo({ ...studentInfo, academicYear: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Date of Submission</label>
              <input
                type="date"
                value={studentInfo.submissionDate}
                onChange={(e) => onUpdateStudentInfo({ ...studentInfo, submissionDate: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* ACADEMIC REPORT PAPER CONTAINER (Formatted for Print and Screen) */}
      <div className="bg-slate-900 print:bg-white border border-slate-800 print:border-none rounded-xl p-6 sm:p-10 text-slate-200 print:text-slate-900 shadow-xl space-y-8 max-w-5xl mx-auto print-card">
        {/* Cover / Academic Header */}
        <div className="border-b-2 border-slate-700 print:border-slate-800 pb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-indigo-400 print:text-indigo-900 font-bold uppercase tracking-wider text-xs">
            <GraduationCap className="w-5 h-5 inline-block" />
            <span>Academic Mini Project Report · Operating Systems Laboratory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 print:text-black tracking-tight max-w-3xl mx-auto">
            {studentInfo.projectTitle}
          </h1>
          <div className="text-sm font-semibold text-slate-300 print:text-slate-800">
            {studentInfo.department} · {studentInfo.collegeName}
          </div>

          {/* Student & Course Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left text-xs bg-slate-950/70 print:bg-slate-50 p-4 rounded-lg border border-slate-800 print:border-slate-300 mt-4 font-mono">
            <div>
              <span className="text-slate-400 print:text-slate-600 block text-[11px] font-sans">Student Name:</span>
              <strong className="text-slate-100 print:text-slate-900">{studentInfo.studentName}</strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-slate-600 block text-[11px] font-sans">Roll / PRN:</span>
              <strong className="text-slate-100 print:text-slate-900">{studentInfo.rollNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-slate-600 block text-[11px] font-sans">Course:</span>
              <strong className="text-slate-100 print:text-slate-900">{studentInfo.courseCode}</strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-slate-600 block text-[11px] font-sans">Submission Date:</span>
              <strong className="text-slate-100 print:text-slate-900">{studentInfo.submissionDate}</strong>
            </div>
          </div>
        </div>

        {/* Abstract & Objectives */}
        <section className="space-y-3 avoid-break">
          <h2 className="text-base font-bold uppercase tracking-wider text-indigo-400 print:text-indigo-900 border-b border-slate-800 print:border-slate-300 pb-1">
            1. Abstract & Objectives
          </h2>
          <p className="text-xs leading-relaxed text-slate-300 print:text-slate-800">
            Modern multiprogramming Operating Systems face critical optimization challenges: allocating CPU burst periods, mitigating virtual memory thrashing, minimizing secondary storage mechanical arm seek latencies, and avoiding system-wide resource deadlocks. This laboratory project constructs complete simulators for CPU Scheduling, Page Replacement, Disk Head Scheduling, and Dijkstra's Banker's Algorithm. Real-world benchmark workloads are simulated to verify theoretical guarantees against empirical execution metrics.
          </p>
        </section>

        {/* SECTION 2: CPU SCHEDULING */}
        <section className="space-y-4 avoid-break">
          <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
            <h2 className="text-base font-bold uppercase tracking-wider text-indigo-400 print:text-indigo-900 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              2. Module 1: CPU Process Scheduling
            </h2>
            <span className="text-xs font-mono text-emerald-400 print:text-emerald-800">
              Optimal WT: {bestCpu.name} ({bestCpu.result.avgWaitingTime} ms)
            </span>
          </div>

          <div className="text-xs text-slate-300 print:text-slate-800 space-y-1">
            <p>
              <strong>Mathematical Formulations:</strong> Turnaround Time: TAT = CT - AT, Waiting Time: WT = TAT - BT, CPU Utilization: (Busy Time / Total Time) × 100%.
            </p>
          </div>

          {/* Process Input Table */}
          <div>
            <span className="text-xs font-bold text-slate-300 print:text-slate-800 block mb-1">
              Table 2.1: Process Workload Input
            </span>
            <table className="w-full text-left border-collapse text-xs font-mono border border-slate-800 print:border-slate-400">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-slate-400">
                  <th className="py-1.5 px-3">Process ID</th>
                  <th className="py-1.5 px-3">Arrival Time (AT)</th>
                  <th className="py-1.5 px-3">Burst Time (BT)</th>
                  <th className="py-1.5 px-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 print:divide-slate-300">
                {processes.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1 px-3 font-bold">{p.id}</td>
                    <td className="py-1 px-3">{p.arrivalTime} ms</td>
                    <td className="py-1 px-3">{p.burstTime} ms</td>
                    <td className="py-1 px-3">{p.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FCFS Gantt Representation */}
          <div>
            <span className="text-xs font-bold text-slate-300 print:text-slate-800 block mb-1">
              Figure 2.1: Execution Gantt Timeline (Total Schedule Duration: {cpuResult.totalTime} ms)
            </span>
            <div className="flex w-full h-8 rounded border border-slate-700 print:border-black overflow-hidden font-mono text-xs">
              {cpuResult.ganttChart.map((seg, idx) => (
                <div
                  key={idx}
                  style={{ width: `${(seg.duration / cpuResult.totalTime) * 100}%` }}
                  className={`h-full flex items-center justify-center border-r border-slate-900 print:border-black ${
                    seg.processId === 'IDLE'
                      ? 'bg-slate-800 print:bg-slate-300 text-slate-400 print:text-slate-700'
                      : 'bg-indigo-600 print:bg-slate-200 text-white print:text-black font-bold'
                  }`}
                >
                  <span className="truncate">{seg.processId}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 print:text-slate-600 mt-1">
              <span>0</span>
              {cpuResult.ganttChart.map((s, idx) => (
                <span key={idx}>{s.endTime}</span>
              ))}
            </div>
          </div>

          {/* Comparative Table */}
          <div>
            <span className="text-xs font-bold text-slate-300 print:text-slate-800 block mb-1">
              Table 2.2: Benchmark Matrix Across All 6 Schedulers
            </span>
            <table className="w-full text-left border-collapse text-xs font-mono border border-slate-800 print:border-slate-400">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-slate-400">
                  <th className="py-1.5 px-3">Scheduling Policy</th>
                  <th className="py-1.5 px-3">Avg Waiting Time</th>
                  <th className="py-1.5 px-3">Avg Turnaround Time</th>
                  <th className="py-1.5 px-3">CPU Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 print:divide-slate-300">
                {cpuComparisons.map((c) => (
                  <tr key={c.algo} className={c.algo === bestCpu.algo ? 'bg-indigo-950/20 print:bg-slate-200 font-bold' : ''}>
                    <td className="py-1.5 px-3">{c.name}</td>
                    <td className="py-1.5 px-3 text-indigo-400 print:text-indigo-900">{c.result.avgWaitingTime} ms</td>
                    <td className="py-1.5 px-3 text-emerald-400 print:text-emerald-900">{c.result.avgTurnaroundTime} ms</td>
                    <td className="py-1.5 px-3">{c.result.cpuUtilization}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: VIRTUAL MEMORY PAGE REPLACEMENT */}
        <section className="space-y-4 avoid-break page-break">
          <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
            <h2 className="text-base font-bold uppercase tracking-wider text-indigo-400 print:text-indigo-900 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              3. Module 2: Page Replacement Simulation
            </h2>
            <span className="text-xs font-mono text-emerald-400 print:text-emerald-800">
              Minimum Faults: {bestPage.name} ({bestPage.result.totalFaults} Faults)
            </span>
          </div>

          <p className="text-xs text-slate-300 print:text-slate-800">
            <strong>Input Reference Sequence:</strong> [{pageReferenceString.join(', ')}] with <strong>{frameCount} physical frames</strong>.
          </p>

          {/* Comparative Page Table */}
          <div>
            <span className="text-xs font-bold text-slate-300 print:text-slate-800 block mb-1">
              Table 3.1: Page Replacement Comparative Efficiency
            </span>
            <table className="w-full text-left border-collapse text-xs font-mono border border-slate-800 print:border-slate-400">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-slate-400">
                  <th className="py-1.5 px-3">Replacement Algorithm</th>
                  <th className="py-1.5 px-3">Page Faults (Misses)</th>
                  <th className="py-1.5 px-3">Page Hits</th>
                  <th className="py-1.5 px-3">Hit Ratio (%)</th>
                  <th className="py-1.5 px-3">Fault Ratio (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 print:divide-slate-300">
                {pageComparisons.map((p) => (
                  <tr key={p.algo} className={p.algo === bestPage.algo ? 'bg-indigo-950/20 print:bg-slate-200 font-bold' : ''}>
                    <td className="py-1.5 px-3">{p.name}</td>
                    <td className="py-1.5 px-3 text-rose-400 print:text-rose-800">{p.result.totalFaults}</td>
                    <td className="py-1.5 px-3 text-emerald-400 print:text-emerald-800">{p.result.totalHits}</td>
                    <td className="py-1.5 px-3">{p.result.hitRatio}%</td>
                    <td className="py-1.5 px-3">{p.result.faultRatio}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 4: DISK SCHEDULING */}
        <section className="space-y-4 avoid-break">
          <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
            <h2 className="text-base font-bold uppercase tracking-wider text-indigo-400 print:text-indigo-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              4. Module 3: Secondary Disk Scheduling
            </h2>
            <span className="text-xs font-mono text-emerald-400 print:text-emerald-800">
              Minimal Seek: {bestDisk.name} ({bestDisk.result.totalHeadMovement} Cylinders)
            </span>
          </div>

          <p className="text-xs text-slate-300 print:text-slate-800">
            <strong>Parameters:</strong> Request Queue = [{diskRequests.join(', ')}], Head Start = {diskInitialHead}, Boundary = 0 to {diskMaxCylinder}, Direction = {diskDirection}.
          </p>

          {/* Disk Comparative Table */}
          <div>
            <span className="text-xs font-bold text-slate-300 print:text-slate-800 block mb-1">
              Table 4.1: Disk Head Arm Traversal Comparison
            </span>
            <table className="w-full text-left border-collapse text-xs font-mono border border-slate-800 print:border-slate-400">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-slate-400">
                  <th className="py-1.5 px-3">Disk Policy</th>
                  <th className="py-1.5 px-3">Total Head Movement (Cylinders)</th>
                  <th className="py-1.5 px-3">Average Seek Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 print:divide-slate-300">
                {diskComparisons.map((d) => (
                  <tr key={d.algo} className={d.algo === bestDisk.algo ? 'bg-indigo-950/20 print:bg-slate-200 font-bold' : ''}>
                    <td className="py-1.5 px-3">{d.name}</td>
                    <td className="py-1.5 px-3 font-bold text-indigo-400 print:text-indigo-900">{d.result.totalHeadMovement} cyl</td>
                    <td className="py-1.5 px-3">{d.result.avgSeekLength} cyl/req</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 5: DEADLOCK AVOIDANCE (BANKER'S ALGORITHM) */}
        <section className="space-y-4 avoid-break">
          <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
            <h2 className="text-base font-bold uppercase tracking-wider text-indigo-400 print:text-indigo-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              5. Module 4: Deadlock Avoidance (Banker’s Algorithm)
            </h2>
            <span
              className={`text-xs font-mono font-bold ${
                bankersResult.isSafe ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'
              }`}
            >
              {bankersResult.isSafe ? 'SAFE SYSTEM INVARIANT' : 'UNSAFE / DEADLOCK'}
            </span>
          </div>

          <div className="text-xs text-slate-300 print:text-slate-800 space-y-2">
            <p>
              <strong>Initial Available Vector:</strong> [{bankersState.available.join(', ')}] for Resource Types [{bankersState.resourceNames.join(', ')}].
            </p>
            {bankersResult.isSafe ? (
              <p className="bg-emerald-950/30 print:bg-slate-100 p-2.5 rounded border border-emerald-800/40 print:border-slate-300 font-mono">
                <strong>Verified Safe Execution Sequence:</strong> &lt; {bankersResult.safeSequence.join(' → ')} &gt;
              </p>
            ) : (
              <p className="bg-rose-950/30 print:bg-slate-100 p-2.5 rounded border border-rose-800/40 print:border-slate-300 font-mono text-rose-300 print:text-rose-800">
                Warning: No safe sequence exists. A circular wait deadlock is unavoidable under current allocations.
              </p>
            )}
          </div>

          {/* Allocation & Need Matrix Summary */}
          <div>
            <span className="text-xs font-bold text-slate-300 print:text-slate-800 block mb-1">
              Table 5.1: Process Resource Allocation & Computed Need Matrix ($Need = Max - Allocation$)
            </span>
            <table className="w-full text-center border-collapse text-xs font-mono border border-slate-800 print:border-slate-400">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-slate-400">
                  <th className="py-1.5 px-3 text-left">Process</th>
                  <th className="py-1.5 px-3">Allocation [A, B, C]</th>
                  <th className="py-1.5 px-3">Max Demand [A, B, C]</th>
                  <th className="py-1.5 px-3 font-bold text-indigo-400 print:text-indigo-900">Need [A, B, C]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 print:divide-slate-300">
                {Array.from({ length: bankersState.processCount }).map((_, pIdx) => (
                  <tr key={pIdx}>
                    <td className="py-1 px-3 text-left font-bold">P{pIdx}</td>
                    <td className="py-1 px-3">[{bankersState.allocation[pIdx].join(', ')}]</td>
                    <td className="py-1 px-3">[{bankersState.max[pIdx].join(', ')}]</td>
                    <td className="py-1 px-3 font-bold text-indigo-400 print:text-indigo-900">
                      [{bankersResult.needMatrix[pIdx]?.join(', ') || '-'}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 6: CONCLUSIONS & FACULTY SIGN-OFF */}
        <section className="space-y-6 avoid-break pt-4 border-t border-slate-800 print:border-slate-300">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-indigo-400 print:text-indigo-900 mb-2">
              6. Conclusion & Pedagogical Insights
            </h2>
            <ul className="list-disc list-inside text-xs text-slate-300 print:text-slate-800 space-y-1.5 leading-relaxed">
              <li>
                <strong>CPU Scheduling:</strong> SRTF and SJF mathematically achieve the theoretical minimum average waiting time by serving shorter bursts first, but demand prior knowledge of execution durations. Round Robin prevents starvation with predictable response times for interactive processes.
              </li>
              <li>
                <strong>Memory Management:</strong> Optimal Page Replacement establishes the lower bound on page faults. LRU closely approximates this by exploiting temporal locality without requiring prescience.
              </li>
              <li>
                <strong>Disk Storage:</strong> SCAN and LOOK algorithms eliminate the severe arm thrashing of FCFS by sweeping cylinders unidirectionally, amortizing mechanical head seeks.
              </li>
              <li>
                <strong>Deadlock Prevention:</strong> Dijkstra’s Banker’s Algorithm provides safety guarantees by refusing resource allocations that cannot guarantee a hazard-free termination order.
              </li>
            </ul>
          </div>

          {/* Academic Evaluation & Sign-off Block */}
          <div className="pt-6 border-t border-dashed border-slate-700 print:border-slate-400">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
              <div className="space-y-6">
                <div>
                  <span className="text-slate-400 print:text-slate-600 block text-[11px]">Submitted by Student:</span>
                  <div className="mt-8 pt-2 border-t border-slate-600 print:border-black font-semibold">
                    {studentInfo.studentName} ({studentInfo.rollNumber})
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-slate-400 print:text-slate-600 block text-[11px]">Evaluated & Approved by:</span>
                  <div className="mt-8 pt-2 border-t border-slate-600 print:border-black font-semibold flex justify-between">
                    <span>{studentInfo.guideName} (Faculty / Evaluator)</span>
                    <span className="text-slate-400 print:text-slate-600 font-mono font-normal">Marks / Grade: _______</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
