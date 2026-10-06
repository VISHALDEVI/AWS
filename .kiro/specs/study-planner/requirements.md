# Requirements Document

## Introduction

A Simple Study Planner is a single-page web application that helps students organise their study sessions. Students enter subjects, topics, exam dates, and available hours; the app stores everything in the browser and generates a prioritised daily schedule. No backend, frameworks, or external APIs are used — only HTML, CSS, and Vanilla JavaScript with LocalStorage.

## Glossary

- **App**: The Study Planner single-page web application.
- **Task**: A study entry consisting of a subject name, topic name, exam date, and available study hours.
- **Study Plan**: An auto-generated daily schedule derived from saved Tasks, sorted by nearest exam date.
- **Dashboard**: The summary section at the top of the page showing task counts.
- **LocalStorage**: The browser's built-in key-value storage used to persist all data.
- **Scheduler**: The part of the App responsible for generating and displaying the Study Plan.
- **Schedule_Block**: A single time-slot entry in the Study Plan (e.g., 09:00–10:00 Java – Arrays).

---

## Requirements

### Requirement 1: Task Input Form

**User Story:** As a student, I want to fill in a form with my subject, topic, exam date, and available hours, so that I can capture what I need to study.

#### Acceptance Criteria

1. THE App SHALL display a form containing four fields: Subject Name (text, maximum 100 characters), Topic Name (text, maximum 100 characters), Exam Date (date), and Available Study Hours (number).
2. WHEN the student submits the form with any field left empty, THE App SHALL display an inline validation message adjacent to each missing field identifying which field is missing and SHALL NOT save the Task.
3. WHEN the student enters a value less than 0.5 or greater than 24 in the Available Study Hours field, THE App SHALL display a validation message stating the allowed range of 0.5 to 24 and SHALL NOT save the Task.
4. WHEN the student enters an Exam Date earlier than today's date, THE App SHALL display a validation message indicating the Exam Date must be today or a future date and SHALL NOT save the Task.
5. WHEN the student submits the form with all fields valid, THE App SHALL save the Task and display a confirmation message indicating the Task was saved successfully.
6. WHEN the student enters more than 100 characters in the Subject Name or Topic Name field, THE App SHALL prevent input beyond 100 characters and display a validation message indicating the maximum character limit.

---

### Requirement 2: Add Task

**User Story:** As a student, I want to save a task by clicking "Add Task", so that it is stored and visible in my task list.

#### Acceptance Criteria

1. WHEN the student clicks the "Add Task" button with all fields valid, THE App SHALL save the Task to LocalStorage and clear all form fields to their default empty state.
2. WHEN a Task is saved, THE App SHALL display the Task in the task list showing: Subject Name, Topic Name, Exam Date formatted as DD/MM/YYYY, and Available Study Hours.
3. THE App SHALL persist all saved Tasks in LocalStorage so that Tasks survive a page refresh, supporting up to 100 saved Tasks.
4. WHEN the page loads, THE App SHALL read all Tasks from LocalStorage and render them in the task list in the order they were originally saved.
5. IF the student clicks the "Add Task" button with one or more fields empty or invalid, THEN THE App SHALL not save the Task and SHALL display an error message indicating which fields require correction.

---

### Requirement 3: Delete Task

**User Story:** As a student, I want to delete a task I no longer need, so that my list stays relevant.

#### Acceptance Criteria

1. THE App SHALL display a "Delete" button for each Task in the task list.
2. WHEN the student clicks the "Delete" button for a Task, THE App SHALL display a confirmation prompt asking the student to confirm the deletion before proceeding.
3. WHEN the student confirms the deletion, THE App SHALL remove that Task from LocalStorage and remove it from the task list immediately.
4. IF the student dismisses the confirmation prompt, THEN THE App SHALL cancel the deletion and leave the Task unchanged in the task list and LocalStorage.
5. WHEN a Task is deleted, THE App SHALL update the Dashboard counts to reflect the removal of that Task immediately.

---

### Requirement 4: Generate Study Plan

**User Story:** As a student, I want to generate a daily study schedule from my saved tasks, so that I know what to study each day.

#### Acceptance Criteria

1. THE App SHALL display a "Generate Study Plan" button.
2. WHEN the student clicks "Generate Study Plan", IF no Tasks are saved, THEN THE App SHALL display a message stating "No tasks available to generate a plan."
3. WHEN the student clicks "Generate Study Plan", IF at least one Task is saved, THEN THE Scheduler SHALL sort Tasks by Exam Date in ascending order (nearest date first), with Tasks sharing the same Exam Date ordered by the sequence in which they were added (earliest-added first).
4. WHEN the Scheduler sorts Tasks, THE Scheduler SHALL assign Schedule_Blocks starting at 09:00, with each block duration equal to the Task's Available Study Hours, where Available Study Hours must be between 0.5 and 12 hours inclusive.
5. IF a Task has Available Study Hours of 0, THEN THE Scheduler SHALL exclude that Task from the Study Plan and continue scheduling the remaining Tasks.
6. IF the cumulative Schedule_Blocks starting from 09:00 extend past 23:59 on a given day, THEN THE Scheduler SHALL continue assigning remaining Schedule_Blocks starting at 09:00 on the next calendar day.
7. WHEN the Scheduler generates Schedule_Blocks, THE App SHALL display each Schedule_Block showing the start time, end time, Subject Name, and Topic Name (e.g., "09:00–10:00 Java – Arrays").
8. WHEN a new Study Plan is generated, THE App SHALL replace any previously displayed Study Plan with the new one.

---

### Requirement 5: Task Completion

**User Story:** As a student, I want to mark a scheduled task as completed, so that I can track my progress.

#### Acceptance Criteria

1. THE App SHALL display a "Completed" button for each Schedule_Block in the Study Plan.
2. WHEN the student clicks the "Completed" button for a Schedule_Block, THE App SHALL mark that block as completed, apply a distinct visual style (strikethrough text and a muted colour distinct from the default style), and save the completed status to LocalStorage under a key unique to that Schedule_Block.
3. WHEN the student clicks the "Completed" button for a Schedule_Block that is already marked as completed, THE App SHALL toggle that block back to incomplete, remove the completed visual style, and update the stored status in LocalStorage.
4. WHEN the page loads, THE App SHALL restore the completed status of all Schedule_Blocks from LocalStorage and apply the completed visual style to each previously completed block.
5. WHEN a Schedule_Block is marked completed or toggled back to incomplete, THE App SHALL update the Dashboard counts immediately without requiring a page reload.
6. IF LocalStorage is unavailable or read fails during page load, THEN THE App SHALL render all Schedule_Blocks in the default incomplete state and display an error message indicating that progress could not be restored.

---

### Requirement 6: Dashboard

**User Story:** As a student, I want to see a summary of my tasks at the top of the page, so that I know my overall progress at a glance.

#### Acceptance Criteria

1. THE App SHALL display a Dashboard above all other page content showing three counters: Total Tasks, Completed Tasks, and Remaining Tasks.
2. THE App SHALL define Completed Tasks as the count of tasks with at least one Schedule_Block marked completed, and Remaining Tasks as Total Tasks minus Completed Tasks.
3. WHEN a Task is added, deleted, or a Schedule_Block is marked completed or toggled back to incomplete, THE App SHALL update all three Dashboard counters within 500ms without a page reload.
4. WHEN the page loads and valid LocalStorage data exists, THE App SHALL initialise all Dashboard counters from data stored in LocalStorage.
5. IF LocalStorage is absent or unreadable on page load, THEN THE App SHALL default all three Dashboard counters to zero.

---

### Requirement 7: Responsive Layout and UI

**User Story:** As a student, I want a clean, readable interface on any device, so that I can use the planner on my phone or laptop.

#### Acceptance Criteria

1. THE App SHALL be implemented in exactly three files: `index.html`, `style.css`, and `script.js`.
2. THE App SHALL use only HTML, CSS, and Vanilla JavaScript with no external libraries, frameworks, or backend services.
3. THE App SHALL display the following sections in order from top to bottom: Dashboard, Input Form, Task List, Study Plan.
4. WHILE the viewport width is 600 px or less, THE App SHALL render content in a single vertical column with no horizontal scrollbar and no clipped content.
5. WHILE the viewport width is greater than 600 px, THE App SHALL render content in a multi-column layout with at least two columns visible simultaneously.
6. THE App SHALL include a header element at the top of the page displaying the text "Study Planner" with non-zero dimensions and not hidden or obscured by other elements.
