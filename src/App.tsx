/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlgorithmModule, BankersState, DiskDirection, Process, StudentReportInfo } from './types/os';
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
import { CpuSchedulingView } from './components/CpuSchedulingView';
import { PageReplacementView } from './components/PageReplacementView';
import { DiskSchedulingView } from './components/DiskSchedulingView';
import { BankersView } from './components/BankersView';
import { ProjectReportView } from './components/ProjectReportView';

export default function App() {
  const [activeModule, setActiveModule] = useState<AlgorithmModule>('cpu');

  // Core Simulation States
  const [processes, setProcesses] = useState<Process[]>(DEFAULT_PROCESSES);
  const [pageReferenceString, setPageReferenceString] = useState<number[]>(DEFAULT_PAGE_REFERENCE_STRING);
  const [frameCount, setFrameCount] = useState<number>(DEFAULT_FRAME_COUNT);
  const [diskRequests, setDiskRequests] = useState<number[]>(DEFAULT_DISK_REQUESTS);
  const [diskInitialHead, setDiskInitialHead] = useState<number>(DEFAULT_INITIAL_HEAD);
  const [diskMaxCylinder, setDiskMaxCylinder] = useState<number>(DEFAULT_MAX_CYLINDER);
  const [diskDirection, setDiskDirection] = useState<DiskDirection>('right');
  const [bankersState, setBankersState] = useState<BankersState>(DEFAULT_BANKERS_STATE);
  const [studentInfo, setStudentInfo] = useState<StudentReportInfo>(DEFAULT_STUDENT_INFO);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetDefaults = () => {
    setProcesses(DEFAULT_PROCESSES);
    setPageReferenceString(DEFAULT_PAGE_REFERENCE_STRING);
    setFrameCount(DEFAULT_FRAME_COUNT);
    setDiskRequests(DEFAULT_DISK_REQUESTS);
    setDiskInitialHead(DEFAULT_INITIAL_HEAD);
    setDiskMaxCylinder(DEFAULT_MAX_CYLINDER);
    setDiskDirection('right');
    setBankersState(DEFAULT_BANKERS_STATE);
    showToast('Reset all modules to standard university laboratory benchmarks');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onResetDefaults={handleResetDefaults}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/50 text-indigo-200 text-xs px-4 py-2.5 rounded-lg shadow-xl font-medium animate-in fade-in slide-in-from-bottom-2">
            {toastMessage}
          </div>
        )}

        {/* View Switcher */}
        {activeModule === 'cpu' && (
          <CpuSchedulingView
            processes={processes}
            onUpdateProcesses={setProcesses}
            onResetDefaults={() => {
              setProcesses(DEFAULT_PROCESSES);
              showToast('Reset CPU process table to default workload');
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
              setPageReferenceString(DEFAULT_PAGE_REFERENCE_STRING);
              setFrameCount(DEFAULT_FRAME_COUNT);
              showToast('Reset page replacement string to standard 20-page benchmark');
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
              setDiskRequests(DEFAULT_DISK_REQUESTS);
              setDiskInitialHead(DEFAULT_INITIAL_HEAD);
              setDiskMaxCylinder(DEFAULT_MAX_CYLINDER);
              setDiskDirection('right');
              showToast('Reset disk requests to Silberschatz standard benchmark');
            }}
          />
        )}

        {activeModule === 'banker' && (
          <BankersView
            state={bankersState}
            onUpdateState={setBankersState}
            onResetDefaults={() => {
              setBankersState(DEFAULT_BANKERS_STATE);
              showToast("Reset Banker's algorithm to standard 5-process benchmark");
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
            onUpdateStudentInfo={setStudentInfo}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Operating System Mini Project Suite</span>
            <span aria-hidden="true">·</span>
            <span>Computer Science & Engineering</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveModule('report')}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Generate Printable Project Report →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
