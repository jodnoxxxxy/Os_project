import React from 'react';
import { AlgorithmModule } from '../types/os';
import { Cpu, Layers, HardDrive, ShieldAlert, FileText, HelpCircle, RotateCcw } from 'lucide-react';

interface NavbarProps {
  activeModule: AlgorithmModule;
  onSelectModule: (module: AlgorithmModule) => void;
  onResetDefaults: () => void;
  onOpenHelp: () => void;
}

const NAV_ITEMS: { id: AlgorithmModule; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: 'cpu', label: 'CPU scheduling', shortLabel: 'CPU', icon: <Cpu className="w-4 h-4" /> },
  { id: 'page', label: 'Page replacement', shortLabel: 'Pages', icon: <Layers className="w-4 h-4" /> },
  { id: 'disk', label: 'Disk scheduling', shortLabel: 'Disk', icon: <HardDrive className="w-4 h-4" /> },
  { id: 'banker', label: 'Deadlock avoidance', shortLabel: 'Deadlock', icon: <ShieldAlert className="w-4 h-4" /> },
  { id: 'report', label: 'Project report', shortLabel: 'Report', icon: <FileText className="w-4 h-4" /> },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  onResetDefaults,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onSelectModule('cpu')}
            className="flex items-center gap-3 text-left rounded-md"
            aria-label="OS Lab, go to CPU scheduling"
            title="Go to CPU scheduling"
          >
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-mono text-sm font-bold text-white">
              OS
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight text-slate-100">OS Lab</span>
              <span className="hidden sm:block text-xs text-slate-500">
                CPU, memory, disk and deadlock simulators
              </span>
            </span>
          </button>

          <nav aria-label="Modules" className="hidden lg:flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 p-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeModule === item.id;
              const isReport = item.id === 'report';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectModule(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? isReport
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-100'
                      : isReport
                        ? 'text-indigo-300 hover:bg-slate-800/70 hover:text-indigo-200'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenHelp}
              title="Quick guide"
              aria-label="Open the quick guide"
              className="rounded-md border border-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-100"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onResetDefaults}
              title="Reset every module to the starting examples"
              className="hidden sm:flex items-center gap-1.5 rounded-md border border-slate-800 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset data</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectModule('report')}
              className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Project report</span>
              <span className="sm:hidden">Report</span>
            </button>
          </div>
        </div>

        <nav aria-label="Modules" className="flex lg:hidden gap-1 overflow-x-auto border-t border-slate-900 py-2 scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? item.id === 'report'
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-700 bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
