import React, { useMemo, useState } from 'react';
import {
  BankersState,
  CpuAlgorithm,
  CpuSchedulingResult,
  DiskAlgorithm,
  DiskDirection,
  PageAlgorithm,
  Process,
  StudentReportInfo,
} from '../types/os';
import { getCpuAlgorithmName, simulateCpuScheduling } from '../algorithms/cpuScheduling';
import { getPageAlgorithmName, simulatePageReplacement } from '../algorithms/pageReplacement';
import { getDiskAlgorithmName, simulateDiskScheduling } from '../algorithms/diskScheduling';
import { runBankersSafety } from '../algorithms/bankersAlgorithm';
import {
  Check,
  Copy,
  Cpu,
  Download,
  Edit3,
  FileText,
  HardDrive,
  Layers,
  Printer,
  ShieldCheck,
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
  roundRobinQuantum: number;
  studentInfo: StudentReportInfo;
  onUpdateStudentInfo: (info: StudentReportInfo) => void;
  onNotify: (message: string) => void;
}

function formatDate(value: string): string {
  if (!value) return 'Not set';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function safeFilename(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'student';
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  wide?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, type = 'text', placeholder, wide }) => (
  <label className={wide ? 'sm:col-span-2' : undefined}>
    <span className="mb-1 block text-xs text-ink-muted">{label}</span>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded border border-rule-strong bg-well px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
    />
  </label>
);

export const ProjectReportView: React.FC<ProjectReportViewProps> = ({
  processes,
  pageReferenceString,
  frameCount,
  diskRequests,
  diskInitialHead,
  diskMaxCylinder,
  diskDirection,
  bankersState,
  roundRobinQuantum,
  studentInfo,
  onUpdateStudentInfo,
  onNotify,
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const cpuResult: CpuSchedulingResult = useMemo(
    () => simulateCpuScheduling(processes, 'FCFS'),
    [processes]
  );
  const cpuComparisons = useMemo(() => {
    const algos: CpuAlgorithm[] = ['FCFS', 'SJF_NP', 'SRTF', 'PRIORITY_NP', 'PRIORITY_P', 'RR'];
    return algos.map((algo) => ({
      algo,
      name: getCpuAlgorithmName(algo),
      result: simulateCpuScheduling(processes, algo, roundRobinQuantum),
    }));
  }, [processes, roundRobinQuantum]);
  const bestCpu = useMemo(
    () => [...cpuComparisons].sort((a, b) => a.result.avgWaitingTime - b.result.avgWaitingTime)[0],
    [cpuComparisons]
  );

  const pageComparisons = useMemo(() => {
    const algos: PageAlgorithm[] = ['FIFO', 'LRU', 'OPT', 'LFU'];
    return algos.map((algo) => ({
      algo,
      name: getPageAlgorithmName(algo),
      result: simulatePageReplacement(pageReferenceString, frameCount, algo),
    }));
  }, [pageReferenceString, frameCount]);
  const bestPage = useMemo(
    () => [...pageComparisons].sort((a, b) => a.result.totalFaults - b.result.totalFaults)[0],
    [pageComparisons]
  );

  const diskComparisons = useMemo(() => {
    const algos: DiskAlgorithm[] = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'];
    return algos.map((algo) => ({
      algo,
      name: getDiskAlgorithmName(algo),
      result: simulateDiskScheduling(diskRequests, diskInitialHead, diskMaxCylinder, diskDirection, algo),
    }));
  }, [diskRequests, diskInitialHead, diskMaxCylinder, diskDirection]);
  const bestDisk = useMemo(
    () => [...diskComparisons].sort((a, b) => a.result.totalHeadMovement - b.result.totalHeadMovement)[0],
    [diskComparisons]
  );

  const bankersResult = useMemo(() => runBankersSafety(bankersState), [bankersState]);
  const reportDate = formatDate(studentInfo.submissionDate);

  const generateMarkdownReport = (): string => {
    const cpuRows = cpuComparisons
      .map((item) => `| ${item.name} | ${item.result.avgWaitingTime} ms | ${item.result.avgTurnaroundTime} ms | ${item.result.cpuUtilization}% |`)
      .join('\n');
    const pageRows = pageComparisons
      .map((item) => `| ${item.name} | ${item.result.totalFaults} | ${item.result.totalHits} | ${item.result.hitRatio}% |`)
      .join('\n');
    const diskRows = diskComparisons
      .map((item) => `| ${item.name} | ${item.result.totalHeadMovement} | ${item.result.avgSeekLength} |`)
      .join('\n');

    return `# ${studentInfo.projectTitle}

${studentInfo.studentName} · ${studentInfo.rollNumber}
${studentInfo.department}, ${studentInfo.collegeName}

- Course: ${studentInfo.courseCode} - ${studentInfo.courseName}
- Academic year: ${studentInfo.academicYear}
- Guide: ${studentInfo.guideName}
- Submitted: ${reportDate}

## 1. Abstract

This report covers four classic operating system decisions: CPU scheduling, page replacement, disk scheduling and deadlock avoidance. Each section uses the workload entered in the simulator, compares the available policies, and records the result. The numbers below are generated from the current inputs, so they can be reproduced by opening the app again.

## 2. CPU scheduling

Six policies are compared on ${processes.length} processes. Waiting time is the time a process spends ready but not running. Turnaround time is completion minus arrival.

| Policy | Average waiting time | Average turnaround time | CPU utilisation |
| :--- | ---: | ---: | ---: |
${cpuRows}

Lowest average waiting time: **${bestCpu.name}** (${bestCpu.result.avgWaitingTime} ms).

Input workload:

| Process | Arrival | Burst | Priority |
| :--- | ---: | ---: | ---: |
${processes.map((process) => `| ${process.id} | ${process.arrivalTime} | ${process.burstTime} | ${process.priority} |`).join('\n')}

## 3. Page replacement

Reference string: \`[${pageReferenceString.join(', ')}]\` with ${frameCount} physical frames. A fault means the page was not in memory and had to be loaded.

| Policy | Page faults | Page hits | Hit rate |
| :--- | ---: | ---: | ---: |
${pageRows}

Fewest faults: **${bestPage.name}** (${bestPage.result.totalFaults}). Optimal replacement is a theoretical lower bound because it uses future references.

## 4. Disk scheduling

Requests: \`[${diskRequests.join(', ')}]\`, starting at cylinder ${diskInitialHead}, disk range 0 to ${diskMaxCylinder}, direction ${diskDirection === 'right' ? 'towards the last cylinder' : 'towards cylinder 0'}.

| Policy | Total head movement | Average seek |
| :--- | ---: | ---: |
${diskRows}

Shortest path: **${bestDisk.name}** (${bestDisk.result.totalHeadMovement} cylinders).

## 5. Deadlock avoidance

The system has ${bankersState.processCount} processes and resource types ${bankersState.resourceNames.join(', ')}. Available vector: \`[${bankersState.available.join(', ')}]\`.

- State: **${bankersResult.isSafe ? 'safe' : 'unsafe'}**
- Safe order: ${bankersResult.isSafe ? bankersResult.safeSequence.join(' -> ') : 'No complete safe order exists.'}

Allocation and need:

| Process | Allocation | Max | Need |
| :--- | :--- | :--- | :--- |
${Array.from({ length: bankersState.processCount }, (_, index) =>
  `| P${index} | [${(bankersState.allocation[index] ?? []).join(', ')}] | [${(bankersState.max[index] ?? []).join(', ')}] | [${(bankersResult.needMatrix[index] ?? []).join(', ')}] |`
).join('\n')}

## 6. Conclusion

- FCFS is easy to implement but a long job near the front can delay everything behind it. SJF and SRTF reduce average waiting time when burst times are known. Round robin gives up some throughput for predictable response time.
- Optimal page replacement is a benchmark rather than a real policy. LRU is a practical approximation, and FIFO can occasionally produce more faults with more frames (Belady's anomaly).
- SSTF shortens each seek but can starve far-away requests. SCAN and LOOK spread the arm movement more fairly.
- Banker's algorithm prevents unsafe allocations as long as every process declares its maximum need honestly. An unsafe state is not a deadlock yet; it is a state that could become one.

${studentInfo.additionalNotes ? `## Notes\n\n${studentInfo.additionalNotes}\n` : ''}
---

Submitted by: ${studentInfo.studentName} (${studentInfo.rollNumber})
Guide: ${studentInfo.guideName}
Date: ${reportDate}
`;
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdownReport());
      setCopyState('copied');
      onNotify('Report copied as Markdown.');
    } catch {
      setCopyState('error');
      onNotify('The browser blocked clipboard access. Use Download Markdown instead.');
    }
    window.setTimeout(() => setCopyState('idle'), 2500);
  };

  const downloadFile = (contents: string, type: string, filename: string) => {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadMarkdown = () => {
    downloadFile(
      generateMarkdownReport(),
      'text/markdown;charset=utf-8',
      `os-lab-report-${safeFilename(studentInfo.rollNumber)}.md`
    );
    onNotify('Markdown report downloaded.');
  };

  const handleDownloadJson = () => {
    const data = {
      metadata: studentInfo,
      cpu: { processes, comparisons: cpuComparisons },
      pageReplacement: { referenceString: pageReferenceString, frameCount, comparisons: pageComparisons },
      disk: {
        requests: diskRequests,
        initialHead: diskInitialHead,
        maxCylinder: diskMaxCylinder,
        direction: diskDirection,
        comparisons: diskComparisons,
      },
      bankers: { state: bankersState, result: bankersResult },
    };

    downloadFile(
      JSON.stringify(data, null, 2),
      'application/json',
      `os-lab-data-${safeFilename(studentInfo.rollNumber)}.json`
    );
    onNotify('Raw results downloaded as JSON.');
  };

  return (
    <div className="space-y-6">
      <div className="no-print rounded-lg border border-rule bg-sheet p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium text-accent">Report</p>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-ink">
              <FileText className="h-5 w-5 text-accent" aria-hidden="true" />
              Project report
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Built from the inputs currently loaded in the four simulators. Add your details, then print or export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingInfo((value) => !value)}
              aria-expanded={isEditingInfo}
              className="flex items-center gap-1.5 rounded-md border border-rule-strong bg-wash px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-rule"
            >
              <Edit3 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {isEditingInfo ? 'Close details' : 'Edit details'}
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 rounded-md border border-rule-strong bg-wash px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-rule"
            >
              {copyState === 'copied' ? (
                <Check className="h-3.5 w-3.5 text-good" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
              )}
              {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy Markdown'}
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 rounded-md border border-rule-strong bg-wash px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-rule"
            >
              <Download className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
              Markdown
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 rounded-md border border-rule-strong bg-wash px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-rule"
            >
              <Download className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
              JSON
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-strong"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print / PDF
            </button>
          </div>
        </div>
      </div>

      {isEditingInfo && (
        <section className="no-print space-y-4 rounded-lg border border-accent/30 bg-sheet p-5">
          <div>
            <h2 className="text-sm font-semibold text-accent">Cover details</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              These values only change the report. They are saved in this browser.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Project title"
              value={studentInfo.projectTitle}
              onChange={(value) => onUpdateStudentInfo({ ...studentInfo, projectTitle: value })}
              wide
            />
            <Field
              label="Student name"
              value={studentInfo.studentName}
              onChange={(value) => onUpdateStudentInfo({ ...studentInfo, studentName: value })}
            />
            <Field
              label="Roll / PRN"
              value={studentInfo.rollNumber}
              placeholder="e.g. 12345"
              onChange={(value) => onUpdateStudentInfo({ ...studentInfo, rollNumber: value })}
            />
            <Field
              label="Department"
              value={studentInfo.department}
              onChange={(value) => onUpdateStudentInfo({ ...studentInfo, department: value })}
            />
            <Field
              label="College / university"
              value={studentInfo.collegeName}
              onChange={(value) => onUpdateStudentInfo({ ...studentInfo, collegeName: value })}
              wide
            />
            <Field
              label="Course code"
              value={studentInfo.courseCode}
              onChange={(value) => onUpdateStudentInfo({ ...studentInfo, courseCode: value })}
            />
            <Field
              label="Course name"
              value={studentInfo.courseName}
              onChange={(value) => onUpdateStudentInfo({ ...studentInfo, courseName: value })}
            />
            <Field
              label="Academic year"
              value={studentInfo.academicYear}
              onChange={(value) => onUpdateStudentInfo({ ...studentInfo, academicYear: value })}
            />
            <Field
              label="Guide / faculty"
              value={studentInfo.guideName}
              onChange={(value) => onUpdateStudentInfo({ ...studentInfo, guideName: value })}
            />
            <Field
              label="Submission date"
              type="date"
              value={studentInfo.submissionDate}
              onChange={(value) => onUpdateStudentInfo({ ...studentInfo, submissionDate: value })}
            />
          </div>

          <label>
            <span className="mb-1 block text-xs text-ink-muted">Additional notes (optional)</span>
            <textarea
              rows={3}
              value={studentInfo.additionalNotes}
              onChange={(event) => onUpdateStudentInfo({ ...studentInfo, additionalNotes: event.target.value })}
              className="w-full rounded border border-rule-strong bg-well px-2.5 py-1.5 text-xs leading-relaxed text-ink focus:border-accent focus:outline-none"
            />
          </label>
        </section>
      )}

      <article className="print-card mx-auto max-w-5xl space-y-8 rounded-xl border border-rule bg-sheet p-6 text-ink shadow-xl sm:p-10 print:text-ink">
        <header className="space-y-3 border-b-2 border-rule-strong pb-6 text-center print:border-rule">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent print:text-accent">
            Operating Systems Laboratory · Mini Project
          </p>
          <h2 className="mx-auto max-w-3xl text-2xl font-bold tracking-tight text-ink print:text-black sm:text-3xl">
            {studentInfo.projectTitle}
          </h2>
          <p className="text-sm text-ink-soft print:text-ink-soft">
            {studentInfo.department}, {studentInfo.collegeName}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-rule bg-well p-4 text-left text-xs print:border-rule print:bg-sheet sm:grid-cols-4">
            <div>
              <dt className="text-[11px] text-ink-muted print:text-ink-muted">Student</dt>
              <dd className="mt-0.5 font-semibold text-ink print:text-ink">{studentInfo.studentName}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-ink-muted print:text-ink-muted">Roll / PRN</dt>
              <dd className="mt-0.5 font-semibold text-ink print:text-ink">{studentInfo.rollNumber}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-ink-muted print:text-ink-muted">Course</dt>
              <dd className="mt-0.5 font-semibold text-ink print:text-ink">
                {studentInfo.courseCode} · {studentInfo.courseName}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-ink-muted print:text-ink-muted">Submitted</dt>
              <dd className="mt-0.5 font-semibold text-ink print:text-ink">{reportDate}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-ink-muted print:text-ink-muted">Guide</dt>
              <dd className="mt-0.5 font-semibold text-ink print:text-ink">{studentInfo.guideName}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-ink-muted print:text-ink-muted">Academic year</dt>
              <dd className="mt-0.5 font-semibold text-ink print:text-ink">{studentInfo.academicYear}</dd>
            </div>
          </dl>
        </header>

        <section className="space-y-3 avoid-break">
          <h3 className="border-b border-rule pb-1 text-base font-semibold text-accent print:border-rule print:text-accent">
            1. Abstract
          </h3>
          <p className="text-xs leading-relaxed text-ink-soft print:text-ink-soft">
            This report covers four classic operating system decisions: CPU scheduling, page replacement,
            disk scheduling and deadlock avoidance. Each section uses the workload entered in the simulator,
            compares the available policies, and records the result. The numbers below are generated from the
            current inputs, so they can be reproduced by opening the app again.
          </p>
          {studentInfo.additionalNotes && (
            <p className="rounded border border-rule bg-well p-3 text-xs leading-relaxed text-ink-soft print:border-rule print:bg-sheet print:text-ink-soft">
              {studentInfo.additionalNotes}
            </p>
          )}
        </section>

        <section className="space-y-4 avoid-break">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-1 print:border-rule">
            <h3 className="flex items-center gap-2 text-base font-semibold text-accent print:text-accent">
              <Cpu className="h-4 w-4" aria-hidden="true" />
              2. CPU scheduling
            </h3>
            <span className="font-mono text-xs text-good print:text-good">
              Lowest average waiting time: {bestCpu.name} ({bestCpu.result.avgWaitingTime} ms)
            </span>
          </div>

          <p className="text-xs leading-relaxed text-ink-soft print:text-ink-soft">
            Waiting time is the time a process spends ready but not running (TAT − burst). Turnaround time is
            completion minus arrival (CT − AT). Lower is better for both.
          </p>

          <div>
            <p className="mb-1 text-xs font-semibold text-ink-soft print:text-ink-soft">
              Table 2.1: Process workload
            </p>
            <table className="w-full border-collapse border border-rule text-left text-xs font-mono print:border-rule-strong">
              <thead>
                <tr className="border-b border-rule bg-well print:border-rule-strong print:bg-well">
                  <th scope="col" className="px-3 py-1.5 font-medium">Process</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">Arrival</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">Burst</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule print:divide-rule">
                {processes.map((process) => (
                  <tr key={process.id}>
                    <td className="px-3 py-1 font-semibold">{process.id}</td>
                    <td className="px-3 py-1">{process.arrivalTime} ms</td>
                    <td className="px-3 py-1">{process.burstTime} ms</td>
                    <td className="px-3 py-1">{process.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-ink-soft print:text-ink-soft">
              Figure 2.1: FCFS timeline ({cpuResult.totalTime} ms)
            </p>
            <div className="flex h-8 w-full overflow-hidden rounded border border-rule-strong font-mono text-xs print:border-black">
              {cpuResult.ganttChart.map((segment, index) => (
                <div
                  key={index}
                  style={{
                    flexGrow: Math.max(segment.duration, 0.25),
                    flexBasis: 0,
                    minWidth: 14,
                  }}
                  className={`flex h-full items-center justify-center border-r border-rule print:border-black ${
                    segment.processId === 'IDLE'
                      ? 'bg-wash text-ink-muted print:bg-rule print:text-ink-soft'
                      : 'bg-accent font-semibold text-white print:bg-wash print:text-black'
                  }`}
                  title={`${segment.processId}: ${segment.startTime} to ${segment.endTime} ms`}
                >
                  <span className="truncate px-1">{segment.processId === 'IDLE' ? 'idle' : segment.processId}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-muted print:text-ink-muted">
              <span>0</span>
              <span>{cpuResult.totalTime} ms</span>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-ink-soft print:text-ink-soft">
              Table 2.2: Policy comparison
            </p>
            <table className="w-full border-collapse border border-rule text-left text-xs font-mono print:border-rule-strong">
              <thead>
                <tr className="border-b border-rule bg-well print:border-rule-strong print:bg-well">
                  <th scope="col" className="px-3 py-1.5 font-medium">Policy</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">Average waiting</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">Average turnaround</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">CPU utilisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule print:divide-rule">
                {cpuComparisons.map((item) => (
                  <tr key={item.algo} className={item.algo === bestCpu.algo ? 'bg-accent-wash font-semibold print:bg-wash' : ''}>
                    <td className="px-3 py-1.5">{item.name}</td>
                    <td className="px-3 py-1.5 text-accent print:text-accent">{item.result.avgWaitingTime} ms</td>
                    <td className="px-3 py-1.5 text-good print:text-good">{item.result.avgTurnaroundTime} ms</td>
                    <td className="px-3 py-1.5">{item.result.cpuUtilization}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-ink-soft print:text-ink-soft">
            On this workload, <strong>{bestCpu.name}</strong> gives the lowest average waiting time
            ({bestCpu.result.avgWaitingTime} ms). This result depends on the arrival and burst values above;
            changing them can change which policy wins.
          </p>
        </section>

        <section className="space-y-4 avoid-break page-break">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-1 print:border-rule">
            <h3 className="flex items-center gap-2 text-base font-semibold text-accent print:text-accent">
              <Layers className="h-4 w-4" aria-hidden="true" />
              3. Page replacement
            </h3>
            <span className="font-mono text-xs text-good print:text-good">
              Fewest faults: {bestPage.name} ({bestPage.result.totalFaults})
            </span>
          </div>

          <p className="text-xs leading-relaxed text-ink-soft print:text-ink-soft">
            Reference string: [{pageReferenceString.join(', ')}] with {frameCount} physical frames. A fault
            means the page was not in memory and had to be loaded.
          </p>

          <table className="w-full border-collapse border border-rule text-left text-xs font-mono print:border-rule-strong">
            <caption className="mb-1 text-left text-xs font-semibold text-ink-soft print:text-ink-soft">
              Table 3.1: Policy comparison
            </caption>
            <thead>
              <tr className="border-b border-rule bg-well print:border-rule-strong print:bg-well">
                <th scope="col" className="px-3 py-1.5 font-medium">Policy</th>
                <th scope="col" className="px-3 py-1.5 font-medium">Faults</th>
                <th scope="col" className="px-3 py-1.5 font-medium">Hits</th>
                <th scope="col" className="px-3 py-1.5 font-medium">Hit rate</th>
                <th scope="col" className="px-3 py-1.5 font-medium">Fault rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule print:divide-rule">
              {pageComparisons.map((item) => (
                <tr key={item.algo} className={item.algo === bestPage.algo ? 'bg-accent-wash font-semibold print:bg-wash' : ''}>
                  <td className="px-3 py-1.5">{item.name}</td>
                  <td className="px-3 py-1.5 text-bad print:text-bad">{item.result.totalFaults}</td>
                  <td className="px-3 py-1.5 text-good print:text-good">{item.result.totalHits}</td>
                  <td className="px-3 py-1.5">{item.result.hitRatio}%</td>
                  <td className="px-3 py-1.5">{item.result.faultRatio}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs leading-relaxed text-ink-soft print:text-ink-soft">
            FIFO is compared above using the full step-by-step grid in the simulator. Optimal replacement is
            a theoretical lower bound because it uses future references; LRU is the practical approximation
            used by most systems. LFU breaks frequency ties by evicting the page that has been in memory longest.
          </p>
        </section>

        <section className="space-y-4 avoid-break">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-1 print:border-rule">
            <h3 className="flex items-center gap-2 text-base font-semibold text-accent print:text-accent">
              <HardDrive className="h-4 w-4" aria-hidden="true" />
              4. Disk scheduling
            </h3>
            <span className="font-mono text-xs text-good print:text-good">
              Shortest path: {bestDisk.name} ({bestDisk.result.totalHeadMovement} cylinders)
            </span>
          </div>

          <p className="text-xs leading-relaxed text-ink-soft print:text-ink-soft">
            Requests: [{diskRequests.join(', ')}]. The arm starts at cylinder {diskInitialHead} on a disk
            numbered 0 to {diskMaxCylinder}, moving {diskDirection === 'right' ? 'towards the last cylinder' : 'towards cylinder 0'}.
          </p>

          <table className="w-full border-collapse border border-rule text-left text-xs font-mono print:border-rule-strong">
            <caption className="mb-1 text-left text-xs font-semibold text-ink-soft print:text-ink-soft">
              Table 4.1: Policy comparison
            </caption>
            <thead>
              <tr className="border-b border-rule bg-well print:border-rule-strong print:bg-well">
                <th scope="col" className="px-3 py-1.5 font-medium">Policy</th>
                <th scope="col" className="px-3 py-1.5 font-medium">Total head movement</th>
                <th scope="col" className="px-3 py-1.5 font-medium">Average seek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule print:divide-rule">
              {diskComparisons.map((item) => (
                <tr key={item.algo} className={item.algo === bestDisk.algo ? 'bg-accent-wash font-semibold print:bg-wash' : ''}>
                  <td className="px-3 py-1.5">{item.name}</td>
                  <td className="px-3 py-1.5 text-accent print:text-accent">{item.result.totalHeadMovement} cyl</td>
                  <td className="px-3 py-1.5">{item.result.avgSeekLength} cyl/request</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs leading-relaxed text-ink-soft print:text-ink-soft">
            <strong>{bestDisk.name}</strong> covers the shortest total distance for this queue
            ({bestDisk.result.totalHeadMovement} cylinders). SCAN and C-SCAN count travel to the disk edge;
            LOOK and C-LOOK turn at the last pending request. The step-by-step path is available in the disk
            module.
          </p>
        </section>

        <section className="space-y-4 avoid-break">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-1 print:border-rule">
            <h3 className="flex items-center gap-2 text-base font-semibold text-accent print:text-accent">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              5. Deadlock avoidance
            </h3>
            <span className={`font-mono text-xs font-semibold ${bankersResult.isSafe ? 'text-good print:text-good' : 'text-bad print:text-bad'}`}>
              {bankersResult.isSafe ? 'Safe state' : 'Unsafe state'}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-ink-soft print:text-ink-soft">
            {bankersState.processCount} processes, resource types {bankersState.resourceNames.join(', ')},
            available vector [{bankersState.available.join(', ')}].
            {bankersResult.isSafe
              ? ` A safe completion order is ${bankersResult.safeSequence.join(' → ')}.`
              : ' No process can finish with the resources currently available, so no safe order exists.'}
          </p>

          <table className="w-full border-collapse border border-rule text-center text-xs font-mono print:border-rule-strong">
            <caption className="mb-1 text-left text-xs font-semibold text-ink-soft print:text-ink-soft">
              Table 5.1: Allocation, maximum claim and remaining need
            </caption>
            <thead>
              <tr className="border-b border-rule bg-well print:border-rule-strong print:bg-well">
                <th scope="col" className="px-3 py-1.5 text-left font-medium">Process</th>
                <th scope="col" className="px-3 py-1.5 font-medium">Allocation [{bankersState.resourceNames.join(', ')}]</th>
                <th scope="col" className="px-3 py-1.5 font-medium">Max [{bankersState.resourceNames.join(', ')}]</th>
                <th scope="col" className="px-3 py-1.5 font-medium text-accent print:text-accent">Need [{bankersState.resourceNames.join(', ')}]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule print:divide-rule">
              {Array.from({ length: bankersState.processCount }).map((_, processIndex) => (
                <tr key={processIndex}>
                  <td className="px-3 py-1 text-left font-semibold">P{processIndex}</td>
                  <td className="px-3 py-1">[{(bankersState.allocation[processIndex] ?? []).join(', ')}]</td>
                  <td className="px-3 py-1">[{(bankersState.max[processIndex] ?? []).join(', ')}]</td>
                  <td className="px-3 py-1 font-semibold text-accent print:text-accent">
                    [{(bankersResult.needMatrix[processIndex] ?? []).join(', ')}]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {bankersResult.isSafe && bankersResult.steps.length > 0 && (
            <table className="w-full border-collapse border border-rule text-left text-xs font-mono print:border-rule-strong">
              <caption className="mb-1 text-left text-xs font-semibold text-ink-soft print:text-ink-soft">
                Table 5.2: Safety check
              </caption>
              <thead>
                <tr className="border-b border-rule bg-well print:border-rule-strong print:bg-well">
                  <th scope="col" className="px-3 py-1.5 font-medium">Step</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">Process</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">Work before</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">Need</th>
                  <th scope="col" className="px-3 py-1.5 font-medium">Work after</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule print:divide-rule">
                {bankersResult.steps.map((step) => (
                  <tr key={step.step}>
                    <td className="px-3 py-1.5">{step.step}</td>
                    <td className="px-3 py-1.5 font-semibold text-accent print:text-accent">{step.processId}</td>
                    <td className="px-3 py-1.5">[{step.workBefore.join(', ')}]</td>
                    <td className="px-3 py-1.5">[{step.need.join(', ')}]</td>
                    <td className="px-3 py-1.5 text-good print:text-good">[{step.workAfter.join(', ')}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="space-y-3 avoid-break">
          <h3 className="border-b border-rule pb-1 text-base font-semibold text-accent print:border-rule print:text-accent">
            6. Conclusion
          </h3>
          <ul className="list-inside list-disc space-y-1.5 text-xs leading-relaxed text-ink-soft print:text-ink-soft">
            <li>
              FCFS is easy to implement, but a long job near the front can delay everything behind it. SJF and
              SRTF lower average waiting time when burst times are known in advance, and round robin trades
              throughput for predictable response time.
            </li>
            <li>
              Optimal page replacement is a benchmark rather than a real policy. LRU approximates it using
              recent history, while FIFO can occasionally produce more faults with more frames.
            </li>
            <li>
              SSTF shortens each seek but can starve requests far from the arm. SCAN and LOOK spread the
              movement more fairly across the disk.
            </li>
            <li>
              Banker's algorithm prevents unsafe allocations as long as every process declares its maximum
              need honestly. An unsafe state is not a deadlock yet; it is a state that could become one.
            </li>
          </ul>
        </section>

      </article>
    </div>
  );
};
