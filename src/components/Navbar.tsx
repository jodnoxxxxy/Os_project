import React from 'react';
import { AlgorithmModule } from '../types/os';
import { HelpCircle, RotateCcw, FileText } from 'lucide-react';

interface NavbarProps {
  activeModule: AlgorithmModule;
  onSelectModule: (module: AlgorithmModule) => void;
  onResetDefaults: () => void;
  onOpenHelp: () => void;
}

const NAV_ITEMS: { id: AlgorithmModule; label: string; shortLabel: string }[] = [
  { id: 'cpu', label: 'CPU scheduling', shortLabel: 'CPU' },
  { id: 'page', label: 'Page replacement', shortLabel: 'Pages' },
  { id: 'disk', label: 'Disk scheduling', shortLabel: 'Disk' },
  { id: 'banker', label: 'Deadlock avoidance', shortLabel: 'Deadlock' },
  { id: 'report', label: 'Project report', shortLabel: 'Report' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  onResetDefaults,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 no-print">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => onSelectModule('cpu')}
            className="flex items-center gap-3 text-left"
            aria-label="OS Lab, go to CPU scheduling"
            title="Go to CPU scheduling"
          >
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center border border-ink font-serif text-base font-semibold leading-none"
            >
              OS
            </span>
            <span>
              <span className="block font-serif text-lg font-semibold leading-tight">OS Lab</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted sm:block">
                Operating systems laboratory
              </span>
            </span>
          </button>

          <nav aria-label="Modules" className="hidden self-stretch xl:flex xl:gap-6">
            {NAV_ITEMS.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectModule(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center border-b-2 text-[13px] transition-colors ${
                    isActive
                      ? 'border-accent font-medium text-ink'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenHelp}
              title="Quick guide"
              aria-label="Open the quick guide"
              className="flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            <button
              type="button"
              onClick={onResetDefaults}
              title="Reset every module to the starting examples"
              className="hidden items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink sm:flex"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectModule('report')}
              className="flex items-center gap-2 border border-accent bg-accent px-3 py-2 text-xs font-medium text-sheet transition-colors hover:bg-accent-strong"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Project report</span>
              <span className="sm:hidden">Report</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Modules"
          className="flex gap-5 overflow-x-auto border-t border-rule py-2.5 scrollbar-none xl:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 border-b-2 pb-1 text-xs transition-colors ${
                  isActive
                    ? 'border-accent font-medium text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
