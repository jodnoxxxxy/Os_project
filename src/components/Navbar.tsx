import React from 'react';
import { AlgorithmModule } from '../types/os';
import { Cpu, Layers, HardDrive, ShieldAlert, FileText, Sparkles, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeModule: AlgorithmModule;
  onSelectModule: (module: AlgorithmModule) => void;
  onResetDefaults: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  onResetDefaults,
}) => {
  const navItems: { id: AlgorithmModule; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'cpu', label: 'CPU Scheduling', icon: <Cpu className="w-4 h-4" /> },
    { id: 'page', label: 'Page Replacement', icon: <Layers className="w-4 h-4" /> },
    { id: 'disk', label: 'Disk Scheduling', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'banker', label: "Banker's Deadlock", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'report', label: 'Academic Project Report', icon: <FileText className="w-4 h-4" />, badge: 'Ready' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-mono font-bold shadow-sm shadow-indigo-500/20">
              OS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 tracking-tight text-base">OSLab Suite</span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">v2.4 · Mini Project</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Kernel Simulators</span>
                <span aria-hidden="true">·</span>
                <span>Automated Report Generator</span>
              </div>
            </div>
          </div>

          {/* Nav Segmented Tabs */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {navItems.map((item) => {
              const isActive = activeModule === item.id;
              const isReport = item.id === 'report';
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? isReport
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-100 shadow-sm'
                      : isReport
                      ? 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetDefaults}
              title="Reset all inputs to standard university lab benchmark values"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={() => onSelectModule('report')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Get Report</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-850 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
