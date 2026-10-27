# OS Lab

A small browser app for the four operating systems topics that usually come up in a lab course: CPU
scheduling, page replacement, disk scheduling and deadlock avoidance. Each module is interactive, and
the report page turns the current inputs into a printable write-up.

It is a front-end only project. There is no server, account or database, and the inputs stay in the
browser's local storage.

## Modules

| Module | What it does |
| --- | --- |
| CPU scheduling | Runs FCFS, SJF, SRTF, priority (preemptive and non-preemptive) and round robin on the same process table. Shows a Gantt chart, per-process metrics and a side-by-side comparison. |
| Page replacement | Runs FIFO, LRU, OPT and LFU on a reference string. The frame grid shows every step, including evictions, and there are presets for Belady's anomaly and a high-locality trace. |
| Disk scheduling | Runs FCFS, SSTF, SCAN, C-SCAN, LOOK and C-LOOK. Plots the arm path and lists the seek distance for each movement. |
| Deadlock avoidance | Banker's safety algorithm with editable process count, resource types, allocation and max matrices. The request tester can apply a safe request. |
| Report | Cover details, policy comparison tables, formulas, safety table and a conclusion. Print to PDF, or export Markdown/JSON. |

## Running locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Other scripts:

```bash
npm run lint     # TypeScript check
npm test         # algorithm and validation tests
npm run build    # type check + production build into dist/
npm run preview  # serve the production build
```

## Notes on the data

- The starting values are the usual textbook examples (five processes, the 20-reference page string,
  the 8-request disk queue at head 53, and the standard safe Banker's state). They are only examples.
- Every module updates as you type; there is no "run" button to forget to press.
- Inputs are saved in `localStorage` under `os-lab:state:v1`. "Reset data" in the header restores the
  examples and shows an undo action.
- The report is generated from whatever is currently loaded. Fill in the cover details before
  printing.

## Project layout

```
src/
  algorithms/     pure simulation code, no React
  algorithms/__tests__/  unit tests for the four engines
  components/     one view per module plus the navbar and quick guide
  types/          shared TypeScript types
  utils/          example inputs
  App.tsx         module switching, persistence and reset handling
  index.css       base styles and print styles
```

The algorithms are deliberately separate from the UI. If you want to check a result by hand, the
functions in `src/algorithms/` take plain arrays and return plain objects.

## Browser support

Works in current versions of Chrome, Edge, Firefox and Safari. The report uses the browser's own print
dialog, so "Save as PDF" is used instead of a bundled PDF library.
