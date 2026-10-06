# Implementation Plan: Study Planner

## Overview

Build a single-page web application using only HTML, CSS, and Vanilla JavaScript. The entire app lives in exactly three files — `index.html`, `style.css`, and `script.js` — with all data persisted in the browser's `localStorage`. Tasks are ordered so each step builds directly on the previous one, ending with all pieces wired together.

---

## Tasks

- [x] 1. Create the three project files with skeleton content
  - Create `index.html` with a valid HTML5 boilerplate that links `style.css` (in `<head>`) and `script.js` (before `</body>`)
  - Create an empty `style.css` file
  - Create an empty `script.js` file
  - _Requirements: 7.1, 7.2_

- [x] 2. Build the HTML structure
  - [x] 2.1 Add the page header and Dashboard section
    - Inside `<body>`, add a `<header id="header">` containing an `<h1>Study Planner</h1>`
    - Below the header add `<section id="dashboard">` with three `<span>` elements for the counters: `id="total-count"`, `id="completed-count"`, `id="remaining-count"`, each labelled Total Tasks, Completed Tasks, Remaining Tasks
    - _Requirements: 6.1, 7.3, 7.6_

  - [x] 2.2 Add the Task Input Form section
    - Add `<section id="task-form-section">` containing a `<form id="task-form">`
    - Inside the form add four labelled inputs: Subject Name (`type="text"` `maxlength="100"`), Topic Name (`type="text"` `maxlength="100"`), Exam Date (`type="date"`), Available Study Hours (`type="number"` `step="0.5"` `min="0.5"` `max="24"`)
    - Add a submit button with text "Add Task" and `id="add-task-btn"`
    - Add an empty `<span class="error-msg">` adjacent to each input field for inline validation messages
    - _Requirements: 1.1, 1.6, 7.3_

  - [x] 2.3 Add the Task List and Study Plan sections
    - Add `<section id="task-list">` (empty, will be populated by JS)
    - Add a `<button id="generate-btn">Generate Study Plan</button>`
    - Add `<section id="study-plan">` (empty, will be populated by JS)
    - _Requirements: 4.1, 7.3_

- [x] 3. Write the CSS styles
  - [x] 3.1 Write base layout styles
    - Style the `<body>` with a readable font, comfortable padding, and a max-width centred on wide screens
    - Style `#header`, `#dashboard`, `#task-form-section`, `#task-list`, and `#study-plan` as stacked vertical sections in the correct top-to-bottom order
    - Style the dashboard counters to display side-by-side within `#dashboard`
    - _Requirements: 7.3, 7.6_

  - [x] 3.2 Write responsive layout styles
    - Add a `@media (max-width: 600px)` block that forces a single-column layout (no horizontal scroll, no clipped content)
    - Add a `@media (min-width: 601px)` block that switches the content areas (form + task list, or form + study plan) into at least a two-column grid or flex layout
    - _Requirements: 7.4, 7.5_

  - [x] 3.3 Write component and state styles
    - Style task cards in `#task-list` (border, padding, delete button placement)
    - Style schedule blocks in `#study-plan` (border, padding, complete button placement)
    - Add `.completed` class styles: `text-decoration: strikethrough` and a muted foreground/background colour distinct from the default state
    - Style inline `.error-msg` elements (red colour, small font, hidden by default via `display:none`, shown when non-empty)
    - _Requirements: 5.2, 5.3_

- [x] 4. Implement core state variables and LocalStorage helpers in `script.js`
  - [x] 4.1 Declare module-level state and implement `loadFromStorage`
    - Declare `let tasks = [];` and `let completions = {};` at the top of `script.js`
    - Write `loadFromStorage()`: reads `sp_tasks` and `sp_completions` from `localStorage`, parses JSON, populates both variables; wrap in `try/catch` — on failure set both to empty and display an error banner in the DOM
    - _Requirements: 2.3, 2.4, 5.4, 5.6, 6.4, 6.5_

  - [x] 4.2 Implement `saveTasksToStorage` and `saveCompletionsToStorage`
    - Write `saveTasksToStorage()`: serialises `tasks` to JSON and writes to `sp_tasks` with a `try/catch`; on failure display a non-blocking error toast
    - Write `saveCompletionsToStorage()`: serialises `completions` to JSON and writes to `sp_completions` with the same error handling
    - _Requirements: 2.1, 2.3, 5.2_

  - [ ]* 4.3 Write property test for LocalStorage round-trip (Property 1)
    - Set up a `tests/` directory with a `package.json` that installs `jest` and `fast-check` as dev dependencies
    - Write `tests/property1.test.js`: generate random valid task arrays and completion maps with `fast-check`, serialise both to JSON strings, parse them back, and assert deep equality
    - Tag comment: `// Feature: study-planner, Property 1: LocalStorage round-trip preserves all data`
    - Run a minimum of 100 iterations
    - **Property 1: LocalStorage round-trip preserves all data**
    - **Validates: Requirements 2.1, 2.3, 2.4, 5.4**

- [x] 5. Implement form validation helpers
  - [x] 5.1 Implement `validateForm` and `showValidationErrors`
    - Write `validateForm()`: reads the four form fields and returns `{ valid: boolean, errors: object }` where `errors` maps field names to messages; enforce all rules from the Validation Rules table (required, max 100 chars, hours 0.5–24, exam date ≥ today)
    - Write `showValidationErrors(errors)`: sets the `textContent` of each field's adjacent `.error-msg` span and toggles `display:none` / `display:inline`; clears all error spans if `errors` is empty
    - _Requirements: 1.2, 1.3, 1.4, 1.6_

  - [x] 5.2 Implement `clearForm`
    - Write `clearForm()`: resets all four form inputs to their default empty/placeholder state and calls `showValidationErrors({})` to clear any displayed messages
    - _Requirements: 2.1_

  - [ ]* 5.3 Write property test for form validation (Property 2)
    - Write `tests/property2.test.js`: generate combinations of form values where at least one field is empty, whitespace-only, >100 chars, hours outside [0.5, 24], or an exam date earlier than today; call `validateForm` with each generated set and assert `valid === false`; also assert `tasks` array is unchanged after a failed submission
    - Tag comment: `// Feature: study-planner, Property 2: validateForm rejects any invalid input`
    - **Property 2: validateForm rejects any invalid input**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.6, 2.5**

- [x] 6. Implement Add Task and render the Task List
  - [x] 6.1 Implement `renderTaskList`
    - Write `renderTaskList()`: rebuilds `#task-list` `innerHTML` from `tasks[]`; each card shows Subject Name, Topic Name, Exam Date formatted as DD/MM/YYYY, and Available Study Hours, plus a `<button class="delete-btn" data-id="...">Delete</button>`; if `tasks` is empty render a placeholder message
    - _Requirements: 2.2, 3.1_

  - [x] 6.2 Implement `addTask` and wire the form submit event
    - Write `addTask(event)`: prevents default, calls `validateForm()`, calls `showValidationErrors`, returns early on invalid input; on valid input creates a Task object with `id` (use `Date.now().toString()` fallback if `crypto.randomUUID` is unavailable), pushes to `tasks[]`, calls `saveTasksToStorage`, `renderTaskList`, `clearForm`, `updateDashboard`, and displays a success confirmation message
    - Bind `addTask` to the `#task-form` `submit` event inside a `DOMContentLoaded` listener
    - _Requirements: 1.5, 2.1, 2.2, 2.3_

  - [ ]* 6.3 Write property test for Task card rendering (Property 3)
    - Write `tests/property3.test.js`: generate 1–20 valid tasks, call `renderTaskList`, query the resulting HTML and assert each task's subject, topic, DD/MM/YYYY-formatted exam date, and hours appear in the rendered output
    - Tag comment: `// Feature: study-planner, Property 3: Every task's rendered card contains all four fields`
    - **Property 3: Every task's rendered card contains all four fields**
    - **Validates: Requirements 2.2**

  - [ ]* 6.4 Write property test for insertion order preservation (Property 4)
    - Write `tests/property4.test.js`: generate ordered task arrays, call `saveTasksToStorage`, reset `tasks` to `[]`, call `loadFromStorage`, and assert the restored array is in the same order as the original
    - Tag comment: `// Feature: study-planner, Property 4: Task insertion order is preserved across saves and loads`
    - **Property 4: Task insertion order is preserved across saves and loads**
    - **Validates: Requirements 2.4**

- [x] 7. Checkpoint — Verify form, add, and render work end-to-end
  - Ensure all tests written so far pass, ask the user if questions arise.

- [x] 8. Implement Delete Task
  - [x] 8.1 Implement `deleteTask` and wire the delegated click event
    - Write `deleteTask(taskId)`: uses `window.confirm` to show a confirmation prompt; on confirm, filters `tasks[]` to remove the matching task, calls `saveTasksToStorage`, `renderTaskList`, `updateDashboard`; on dismiss, does nothing
    - Add a delegated `click` listener on `#task-list` that reads `event.target.dataset.id` when the target has class `delete-btn` and calls `deleteTask`
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ]* 8.2 Write property test for delete removing from all storage (Property 8)
    - Write `tests/property8.test.js`: generate a task array with at least one task, pick a random index, call `deleteTask` (simulate confirm = true), then assert the deleted task's `id` is absent from `tasks[]`, from the parsed `sp_tasks` in localStorage, and from the rendered `#task-list` HTML
    - Tag comment: `// Feature: study-planner, Property 8: Deleting a task removes it from all storage and rendering`
    - **Property 8: Deleting a task removes it from all storage and rendering**
    - **Validates: Requirements 3.3, 3.5**

- [x] 9. Implement Generate Study Plan
  - [x] 9.1 Implement `buildScheduleBlocks`
    - Write the pure helper `buildScheduleBlocks(sortedTasks)`: implement the scheduling algorithm from the design — cursor starts at today 09:00; iterate tasks in order; skip tasks with `hours === 0`; if a block would end past 23:59 advance `cursor.date` to the next day and reset to 09:00; emit a `Schedule_Block` object per task; return the array
    - Helper functions needed: `minutesToHHMM(minutes)` and `nextDay(dateStr)`
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [ ]* 9.2 Write property test for scheduling algorithm correctness (Property 5)
    - Write `tests/property5.test.js`: generate 1–20 valid tasks (none with `hours = 0`), call `buildScheduleBlocks`, and assert all five conditions from Property 5 hold: first block starts at `09:00`; consecutive same-day blocks are contiguous; no block ends past `23:59`; each block duration equals `hours × 60` minutes; tasks are processed in ascending `examDate` order (ties by insertion order)
    - Tag comment: `// Feature: study-planner, Property 5: Scheduling algorithm produces correct, contiguous time blocks`
    - **Property 5: Scheduling algorithm produces correct, contiguous time blocks**
    - **Validates: Requirements 4.3, 4.4, 4.6**

  - [x] 9.3 Implement `renderStudyPlan` and `generateStudyPlan`
    - Write `renderStudyPlan(blocks)`: rebuilds `#study-plan` `innerHTML`; each block shows start time, end time, subject, and topic (e.g. "09:00–10:00 Java – Arrays") plus a `<button class="complete-btn" data-key="...">Completed</button>`; after rendering, re-apply `.completed` CSS class to any block whose key exists in `completions`
    - Write `generateStudyPlan()`: if `tasks[]` is empty, display "No tasks available to generate a plan." in `#study-plan` and return; otherwise sort a copy of `tasks` by `examDate` ASC then insertion order ASC, call `buildScheduleBlocks`, call `renderStudyPlan`, call `updateDashboard`
    - Bind `generateStudyPlan` to `#generate-btn` `click` inside the `DOMContentLoaded` listener
    - _Requirements: 4.2, 4.3, 4.7, 4.8_

- [x] 10. Implement Task Completion Toggle
  - [x] 10.1 Implement `markCompleted` and wire the delegated click event
    - Write `markCompleted(blockKey)`: toggles `completions[blockKey]` boolean (set to `true` if absent or `false`, delete or set `false` if already `true`); calls `saveCompletionsToStorage`; finds the block element by `data-key` and toggles the `.completed` CSS class; calls `updateDashboard`
    - Add a delegated `click` listener on `#study-plan` that reads `event.target.dataset.key` when the target has class `complete-btn` and calls `markCompleted`
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 10.2 Write property test for completion toggle as involution (Property 7)
    - Write `tests/property7.test.js`: generate a `blockKey` string and an initial `completions` map; call `markCompleted` twice on the same key; assert `completions` is deeply equal to its original value and no other keys in the map were changed
    - Tag comment: `// Feature: study-planner, Property 7: Completion toggle is an involution`
    - **Property 7: Completion toggle is an involution**
    - **Validates: Requirements 5.2, 5.3**

- [x] 11. Implement the Dashboard counter updates
  - [x] 11.1 Implement `updateDashboard`
    - Write `updateDashboard()`: compute `total = tasks.length`; compute `completed` as the count of tasks that have at least one block key in `completions` (a task is "completed" if `Object.keys(completions).some(k => k.startsWith(task.id + '-') && completions[k])`); compute `remaining = total - completed`; set `textContent` on `#total-count`, `#completed-count`, and `#remaining-count`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 11.2 Write property test for Dashboard counter consistency (Property 6)
    - Write `tests/property6.test.js`: use `fast-check` model-based testing (`fc.commands`) with three command types — AddTask, DeleteTask, ToggleCompletion; after every command assert `remaining = total − completed` where `total = tasks.length` and `completed` = tasks with at least one completed block key
    - Tag comment: `// Feature: study-planner, Property 6: Dashboard counters are always consistent with state`
    - **Property 6: Dashboard counters are always consistent with state**
    - **Validates: Requirements 6.2, 6.3**

- [x] 12. Wire `loadFromStorage` on page load and complete the `DOMContentLoaded` handler
  - Ensure the `DOMContentLoaded` listener in `script.js` calls `loadFromStorage`, then `renderTaskList`, then (if a previously generated plan's completion state exists) `generateStudyPlan` to restore the study plan view, then `updateDashboard`
  - Bind all remaining event listeners (form submit, `#generate-btn` click, delegated delete and complete listeners) inside this single `DOMContentLoaded` callback
  - _Requirements: 2.4, 5.4, 6.4_

- [x] 13. Final checkpoint — Ensure all tests pass and the app runs correctly
  - Ensure all property tests and unit tests pass
  - Open `index.html` in a browser and verify: form validation, add/delete tasks, generate plan, completion toggle, dashboard updates, page-refresh persistence, and responsive layout at 375 px and 1280 px widths
  - Ask the user if any questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- All tests live in a `tests/` directory alongside the three app files; they run in Node via Jest and do not require a browser
- Each task references specific requirements clauses for traceability
- Property tests use `fast-check` and must run a minimum of 100 iterations each
- Unit tests validate specific examples and edge cases; property tests validate universal correctness across random inputs
- Checkpoints (tasks 7 and 13) are integration pauses — verify tests pass before continuing

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "4.1", "4.2"] },
    { "id": 3, "tasks": ["4.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["6.4", "8.1", "9.1"] },
    { "id": 7, "tasks": ["8.2", "9.2", "9.3", "11.1"] },
    { "id": 8, "tasks": ["10.1", "11.2"] },
    { "id": 9, "tasks": ["10.2", "12"] }
  ]
}
```
