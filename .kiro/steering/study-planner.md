---
inclusion: always
---

# Study Planner — Project Steering Document

## Project Purpose

Study Planner is a beginner-friendly, single-page web application that helps students organise their revision. Students enter subjects, topics, exam dates, and available hours; the app stores data in the browser and generates a prioritised daily timetable on demand.

---

## Hard Technology Constraints

These constraints are non-negotiable. Violating them breaks the core design.

| Rule | Detail |
|---|---|
| **Three files only** | `index.html`, `style.css`, `script.js` — no extra source files in the project root |
| **No frameworks** | Zero React, Vue, Angular, jQuery, or any external JS/CSS library |
| **No backend** | No Node server, no database, no REST API calls from the frontend |
| **No build step** | No webpack, Vite, Babel, or TypeScript — the HTML file must open directly in a browser |
| **Vanilla JS only** | All logic in plain ES5-compatible JavaScript (no ES modules, no classes) |
| **LocalStorage only** | All frontend persistence uses `localStorage` keys `sp_tasks` and `sp_completions` |

The MCP server (`mcp-server/index.js`) is a **Kiro-side tool only** — it is never called by the browser and never imported into `script.js`.

---

## File Map

```
project root/
├── index.html          ← Page structure and all HTML IDs
├── style.css           ← All styles including responsive breakpoints
├── script.js           ← All app logic (state, validation, rendering, storage)
├── data/
│   └── tasks.json      ← MCP server data store (not used by the browser)
├── mcp-server/
│   ├── index.js        ← MCP server (Kiro tool — not part of the web app)
│   └── package.json
└── .kiro/
    ├── hooks/
    │   └── study-planner.json   ← Project hooks
    ├── steering/
    │   └── study-planner.md     ← This file
    └── specs/study-planner/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

---

## Key HTML IDs (never rename these)

| ID | Element | Used by |
|---|---|---|
| `total-count` | `<span>` | `updateDashboard()` |
| `completed-count` | `<span>` | `updateDashboard()` |
| `remaining-count` | `<span>` | `updateDashboard()` |
| `task-form` | `<form>` | `addTask()` submit listener |
| `subject` | `<input>` | `validateForm()`, `addTask()` |
| `topic` | `<input>` | `validateForm()`, `addTask()` |
| `exam-date` | `<input>` | `validateForm()`, `addTask()` |
| `study-hours` | `<input>` | `validateForm()`, `addTask()` |
| `subject-error` | `<span>` | `showValidationErrors()` |
| `topic-error` | `<span>` | `showValidationErrors()` |
| `exam-date-error` | `<span>` | `showValidationErrors()` |
| `study-hours-error` | `<span>` | `showValidationErrors()` |
| `form-success` | `<div>` | `addTask()` success message |
| `add-task-btn` | `<button>` | Form submit |
| `task-list` | `<div>` | `renderTaskList()` |
| `generate-btn` | `<button>` | `generateStudyPlan()` |
| `study-plan` | `<div>` | `renderStudyPlan()` |

---

## JavaScript Function Catalogue

Every function in `script.js` has a single responsibility. Do not merge responsibilities.

| Function | Responsibility |
|---|---|
| `loadFromStorage()` | Read `sp_tasks` + `sp_completions` from localStorage on page load |
| `saveTasksToStorage()` | Write `tasks[]` to `sp_tasks` (with error toast on failure) |
| `saveCompletionsToStorage()` | Write `completions{}` to `sp_completions` (with error toast on failure) |
| `validateForm()` | Pure — read four form fields, return `{ valid, errors }` |
| `showValidationErrors(errors)` | Set textContent on all four error spans |
| `clearForm()` | Reset all four inputs and clear error/success messages |
| `formatDate(isoStr)` | Pure — convert `YYYY-MM-DD` → `DD/MM/YYYY` via string slice |
| `escapeHtml(str)` | Pure — sanitise user strings before innerHTML insertion |
| `renderTaskList()` | Rebuild `#task-list` innerHTML from `tasks[]` |
| `addTask(event)` | Form submit handler — validate → create task → save → render → dashboard |
| `deleteTask(taskId)` | Confirm → filter tasks → save → render → dashboard |
| `minutesToHHMM(minutes)` | Pure — convert minute offset to `HH:MM` string |
| `nextDay(dateStr)` | Pure — advance ISO date by one day (noon-anchored for DST safety) |
| `buildScheduleBlocks(sortedTasks)` | Pure — apply scheduling algorithm, return `Schedule_Block[]` |
| `markCompleted(blockKey)` | Toggle `completions[blockKey]` → save → update DOM classes → dashboard |
| `updateDashboard()` | Recalculate Total / Completed / Remaining and update the three spans |
| `renderStudyPlan(blocks)` | Rebuild `#study-plan` innerHTML, group by date, restore completed styles |
| `generateStudyPlan()` | Sort tasks → build blocks → render → dashboard |
| `showStorageErrorBanner(message)` | Create/update the fixed red error banner at the top of the page |
| `showStorageToast(message)` | Show a 3-second orange toast for non-critical storage write failures |

---

## Validation Rules (must stay consistent across frontend and MCP server)

| Field | Rule |
|---|---|
| Subject Name | Required, not whitespace-only, max 100 characters |
| Topic Name | Required, not whitespace-only, max 100 characters |
| Exam Date | Required, must be today or a future date (ISO string comparison) |
| Available Study Hours | Required, numeric, 0.5 ≤ value ≤ 24 |

These same rules are enforced in `validateForm()` (frontend) and the `add_task` tool schema in `mcp-server/index.js`. If you change a rule in one place, change it in both.

---

## Scheduling Algorithm Rules

The scheduling algorithm lives in `buildScheduleBlocks()` and the MCP `get_study_plan` tool. Both must follow the same rules:

1. Sort tasks by `examDate` ASC — nearest exam first.
2. Tie-break by insertion order (stable sort using index decoration).
3. Schedule cursor starts at **09:00** on today's date.
4. Each task occupies one contiguous block: duration = `hours × 60` minutes.
5. Tasks with `hours === 0` are **skipped** (excluded from the plan).
6. If a block would end past **23:59**, advance the cursor to the next day at 09:00 and place the block there.
7. Consecutive blocks on the same day are **contiguous** — no gaps between subjects.

---

## LocalStorage Schema

```
sp_tasks       → JSON string of Task[]
sp_completions → JSON string of Record<string, boolean>
```

**Task object:**
```js
{
  id:       string,   // crypto.randomUUID() or Date.now().toString()
  subject:  string,   // max 100 chars
  topic:    string,   // max 100 chars
  examDate: string,   // "YYYY-MM-DD"
  hours:    number    // 0.5 – 24
}
```

**Completions map key format:** `"<taskId>-<blockIndex>"` — e.g. `"1234567890-0"`.

The MCP server mirrors this schema in `data/tasks.json`:
```json
{ "tasks": [...], "completions": { "key": true } }
```

---

## MCP Server Tools

The MCP server at `mcp-server/index.js` exposes these tools to Kiro only. They are never called from the browser.

| Tool | Description |
|---|---|
| `get_tasks` | Return all saved tasks as JSON |
| `add_task` | Add a task (subject, topic, examDate, hours) |
| `delete_task` | Remove a task by id |
| `update_completion` | Set a blockKey's completion state (true/false) |
| `get_study_plan` | Return the generated schedule blocks sorted by exam date |

---

## CSS Structure

```
style.css sections (in order):
1. Base reset              — box-sizing, margin, padding zero
2. Body & page wrapper     — font, background, max-width 900px centred
3. Header                  — #header blue background
4. Dashboard               — #dashboard flex counters
5. Content sections        — #task-form-section, #task-list-section, #study-plan-section
6. Generate button wrapper — .generate-btn-wrapper centred
7. Responsive layout       — @media ≤600px (single column) + @media ≥601px (.two-col grid)
8. Form groups             — .form-group label/input/focus styles
9. Buttons                 — base, #add-task-btn (blue), #generate-btn (green)
10. Task cards             — .task-card, .task-card-info, .delete-btn
11. Schedule blocks        — .schedule-block, .time-range, .block-subject, .complete-btn
12. Completed state        — .schedule-block.completed (strikethrough + muted colour)
13. Messages               — .error-msg (red), .success-msg (green), .empty-msg (grey)
14. Plan date header       — .plan-date-header
```

**Responsive breakpoints:**
- `@media (max-width: 600px)` → single column, stacked dashboard items
- `@media (min-width: 601px)` → `.two-col` becomes a 2-column CSS grid

---

## What Kiro Should Never Do in This Project

- Do **not** introduce `import`/`export` or ES module syntax into `script.js`
- Do **not** add `<script type="module">` to `index.html`
- Do **not** add a `package.json` to the project root (only `mcp-server/` has one)
- Do **not** install npm packages for the frontend
- Do **not** create additional `.js` or `.css` files in the project root
- Do **not** call MCP server tools from `script.js`
- Do **not** change `sp_tasks` or `sp_completions` key names in localStorage
- Do **not** rename any HTML element IDs listed in the Key HTML IDs table above
