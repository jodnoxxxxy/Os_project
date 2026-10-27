import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlgorithmModule,
  BankersState,
  DiskDirection,
  Process,
  StudentReportInfo,
} from './types/os';
import {
  DEFAULT_BANKERS_STATE,
  DEFAULT_DISK_REQUESTS,
  DEFAULT_FRAME_COUNT,
  DEFAULT_INITIAL_HEAD,
  DEFAULT_MAX_CYLINDER,
  DEFAULT_PAGE_REFERENCE_STRING,
  DEFAULT_PROCESSES,
  DEFAULT_STUDENT_INFO,
} from './utils/defaults';
import { Navbar } from './components/Navbar';
import { HelpPanel } from './components/HelpPanel';
import { CpuSchedulingView } from './components/CpuSchedulingView';
import { PageReplacementView } from './components/PageReplacementView';
import { DiskSchedulingView } from './components/DiskSchedulingView';
import { BankersView } from './components/BankersView';
import { ProjectReportView } from './components/ProjectReportView';

const STORAGE_KEY = 'os-lab:state:v1';

interface SavedState {
  activeModule?: AlgorithmModule;
  processes?: Process[];
  pageReferenceString?: number[];
  frameCount?: number;
  diskRequests?: number[];
  diskInitialHead?: number;
  diskMaxCylinder?: number;
  diskDirection?: DiskDirection;
  bankersState?: BankersState;
  studentInfo?: StudentReportInfo;
  quantum?: number;
}

const MODULES: AlgorithmModule[] = ['cpu', 'page', 'disk', 'banker', 'report'];

function readSavedState(): SavedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as SavedState) : {};
  } catch {
    // A stale or corrupted entry should never stop the app from opening.
    return {};
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export default function App() {
  const [saved] = useState(readSavedState);

  const [activeModule, setActiveModule] = useState<AlgorithmModule>(
    saved.activeModule && MODULES.includes(saved.activeModule) ? saved.activeModule : 'cpu'
  );
  const [processes, setProcesses] = useState<Process[]>(
    Array.isArray(saved.processes) && saved.processes.length > 0 ? saved.processes : DEFAULT_PROCESSES
  );
  const [pageReferenceString, setPageReferenceString] = useState<number[]>(
    Array.isArray(saved.pageReferenceString) && saved.pageReferenceString.length > 0
      ? saved.pageReferenceString
      : DEFAULT_PAGE_REFERENCE_STRING
  );
  const [frameCount, setFrameCount] = useState<number>(
    isFiniteNumber(saved.frameCount) ? saved.frameCount : DEFAULT_FRAME_COUNT
  );
  const [diskRequests, setDiskRequests] = useState<number[]>(
    Array.isArray(saved.diskRequests) && saved.diskRequests.length > 0
      ? saved.diskRequests
      : DEFAULT_DISK_REQUESTS
  );
  const [diskInitialHead, setDiskInitialHead] = useState<number>(
    isFiniteNumber(saved.diskInitialHead) ? saved.diskInitialHead : DEFAULT_INITIAL_HEAD
  );
  const [diskMaxCylinder, setDiskMaxCylinder] = useState<number>(
    isFiniteNumber(saved.diskMaxCylinder) ? saved.diskMaxCylinder : DEFAULT_MAX_CYLINDER
  );
  const [diskDirection, setDiskDirection] = useState<DiskDirection>(
    saved.diskDirection === 'left' || saved.diskDirection === 'right' ? saved.diskDirection : 'right'
  );
  const [bankersState, setBankersState] = useState<BankersState>(
    saved.bankersState ?? DEFAULT_BANKERS_STATE
  );
  const [studentInfo, setStudentInfo] = useState<StudentReportInfo>({
    ...DEFAULT_STUDENT_INFO,
    ...saved.studentInfo,
  });
  const [quantum, setQuantum] = useState<number>(
    isFiniteNumber(saved.quantum) ? Math.max(1, saved.quantum) : 2
  );

  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const toastTimer = useRef<number | null>(null);

  const closeHelp = useCallback(() => setHelpOpen(false), []);

  const showToast = useCallback((message: string, undo?: () => void) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), 8000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  // Persist the current lab so a refresh does not throw away the setup.
  useEffect(() => {
    const payload: SavedState = {
      activeModule,
      processes,
      pageReferenceString,
      frameCount,
      diskRequests,
      diskInitialHead,
      diskMaxCylinder,
      diskDirection,
      bankersState,
      studentInfo,
      quantum,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage can be full or blocked; the simulator still works without it.
    }
  }, [
    activeModule,
    processes,
    pageReferenceString,
    frameCount,
    diskRequests,
    diskInitialHead,
    diskMaxCylinder,
    diskDirection,
    bankersState,
    studentInfo,
    quantum,
  ]);

  const handleResetDefaults = () => {
    const previous = {
      processes,
      pageReferenceString,
      frameCount,
      diskRequests,
      diskInitialHead,
      diskMaxCylinder,
      diskDirection,
      bankersState,
      quantum,
    };

    setProcesses(DEFAULT_PROCESSES);
    setPageReferenceString(DEFAULT_PAGE_REFERENCE_STRING);
    setFrameCount(DEFAULT_FRAME_COUNT);
    setDiskRequests(DEFAULT_DISK_REQUESTS);
    setDiskInitialHead(DEFAULT_INITIAL_HEAD);
    setDiskMaxCylinder(DEFAULT_MAX_CYLINDER);
    setDiskDirection('right');
    setBankersState(DEFAULT_BANKERS_STATE);
    setQuantum(2);

    showToast('All simulator inputs are back to the starting examples.', () => {
      setProcesses(previous.processes);
      setPageReferenceString(previous.pageReferenceString);
      setFrameCount(previous.frameCount);
      setDiskRequests(previous.diskRequests);
      setDiskInitialHead(previous.diskInitialHead);
      setDiskMaxCylinder(previous.diskMaxCylinder);
      setDiskDirection(previous.diskDirection);
      setBankersState(previous.bankersState);
      setQuantum(previous.quantum);
      showToast('Previous inputs restored.');
    });
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onResetDefaults={handleResetDefaults}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="toast-in fixed bottom-5 right-4 left-4 sm:left-auto z-50 flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 shadow-2xl shadow-black/40 no-print"
          >
            <span className="flex-1">{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={() => {
                  toast.undo?.();
                  if (toastTimer.current) window.clearTimeout(toastTimer.current);
                  setToast(null);
                }}
                className="rounded-md border border-indigo-500/40 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/10"
              >
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss message"
              className="text-slate-500 hover:text-slate-200"
            >
              &times;
            </button>
          </div>
        )}

        {activeModule === 'cpu' && (
          <CpuSchedulingView
            processes={processes}
            quantum={quantum}
            onUpdateQuantum={setQuantum}
            onUpdateProcesses={setProcesses}
            onResetDefaults={() => {
              const previous = processes;
              setProcesses(DEFAULT_PROCESSES);
              showToast('Process table reset to the example workload.', () => {
                setProcesses(previous);
              });
            }}
          />
        )}

        {activeModule === 'page' && (
          <PageReplacementView
            referenceString={pageReferenceString}
            frameCount={frameCount}
            onUpdateReferenceString={setPageReferenceString}
            onUpdateFrameCount={setFrameCount}
            onResetDefaults={() => {
              const previousString = pageReferenceString;
              const previousFrames = frameCount;
              setPageReferenceString(DEFAULT_PAGE_REFERENCE_STRING);
              setFrameCount(DEFAULT_FRAME_COUNT);
              showToast('Page replacement reset to the example trace.', () => {
                setPageReferenceString(previousString);
                setFrameCount(previousFrames);
              });
            }}
          />
        )}

        {activeModule === 'disk' && (
          <DiskSchedulingView
            requestQueue={diskRequests}
            initialHead={diskInitialHead}
            maxCylinder={diskMaxCylinder}
            direction={diskDirection}
            onUpdateRequestQueue={setDiskRequests}
            onUpdateInitialHead={setDiskInitialHead}
            onUpdateMaxCylinder={setDiskMaxCylinder}
            onUpdateDirection={setDiskDirection}
            onResetDefaults={() => {
              const previous = { diskRequests, diskInitialHead, diskMaxCylinder, diskDirection };
              setDiskRequests(DEFAULT_DISK_REQUESTS);
              setDiskInitialHead(DEFAULT_INITIAL_HEAD);
              setDiskMaxCylinder(DEFAULT_MAX_CYLINDER);
              setDiskDirection('right');
              showToast('Disk queue reset to the example requests.', () => {
                setDiskRequests(previous.diskRequests);
                setDiskInitialHead(previous.diskInitialHead);
                setDiskMaxCylinder(previous.diskMaxCylinder);
                setDiskDirection(previous.diskDirection);
              });
            }}
          />
        )}

        {activeModule === 'banker' && (
          <BankersView
            state={bankersState}
            onUpdateState={setBankersState}
            onResetDefaults={() => {
              const previous = bankersState;
              setBankersState(DEFAULT_BANKERS_STATE);
              showToast('Deadlock state reset to the safe example.', () => {
                setBankersState(previous);
              });
            }}
          />
        )}

        {activeModule === 'report' && (
          <ProjectReportView
            processes={processes}
            pageReferenceString={pageReferenceString}
            frameCount={frameCount}
            diskRequests={diskRequests}
            diskInitialHead={diskInitialHead}
            diskMaxCylinder={diskMaxCylinder}
            diskDirection={diskDirection}
            bankersState={bankersState}
            studentInfo={studentInfo}
            roundRobinQuantum={quantum}
            onUpdateStudentInfo={setStudentInfo}
            onNotify={showToast}
          />
        )}
      </main>

      <footer className="border-t border-slate-900 py-4 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>OS Lab. Everything runs in your browser, and your inputs are saved on this device.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="hover:text-slate-300"
            >
              Quick guide
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('report')}
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Open project report
            </button>
          </div>
        </div>
      </footer>

      <HelpPanel open={helpOpen} onClose={closeHelp} />
    </div>
  );
}
