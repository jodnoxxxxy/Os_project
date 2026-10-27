import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

const GUIDE = [
  {
    title: 'CPU scheduling',
    body: 'Edit arrival, burst and priority values in the table. The Gantt chart and the results table update as you type. "Compare algorithms" runs the same workload through all six schedulers so you can see the difference.',
  },
  {
    title: 'Page replacement',
    body: 'Enter the pages the CPU asks for, separated by commas, then pick how many frames are available. The grid shows the frame contents after every reference. A hit means the page was already loaded; a fault means it had to be fetched.',
  },
  {
    title: 'Disk scheduling',
    body: 'Enter the cylinders the arm has to visit and the cylinder it starts on. SCAN, C-SCAN, LOOK and C-LOOK also need a direction. The graph plots the arm path and the table lists every seek.',
  },
  {
    title: 'Deadlock avoidance',
    body: 'Edit the Allocation and Max matrices. Need is calculated for you. The banner says whether the current state is safe, and if it is, shows one order in which the processes can finish.',
  },
  {
    title: 'Project report',
    body: 'The report pulls in whatever is loaded in the four simulators. Fill in your details, then print it, save it as a PDF, or download the Markdown or JSON.',
  },
];

export const HelpPanel: React.FC<HelpPanelProps> = ({ open, onClose }) => {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6 no-print"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-guide-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-rule bg-sheet p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="quick-guide-title" className="text-lg font-semibold text-ink">
              Quick guide
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Pick a module, change the numbers, and watch the results update. Nothing is sent to a server.
            </p>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close quick guide"
            className="rounded-md p-1.5 text-ink-muted hover:bg-wash hover:text-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {GUIDE.map((item) => (
            <section key={item.title}>
              <h3 className="text-sm font-semibold text-accent">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-5 rounded-lg border border-rule bg-well p-3 text-xs leading-relaxed text-ink-muted">
          Inputs are saved in this browser, so a refresh keeps your setup. <strong className="font-semibold text-ink-soft">Reset data</strong> in
          the header puts the examples back, and the message that appears lets you undo it.
        </p>
      </div>
    </div>
  );
};
