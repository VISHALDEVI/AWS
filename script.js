// ============================================================
// Module-level state
// ============================================================

let tasks = [];        // Array of Task objects
let completions = {};  // Record<string, boolean> — blockKey → completed

// ============================================================
// LocalStorage helpers
// ============================================================

/**
 * loadFromStorage
 *
 * Reads 'sp_tasks' and 'sp_completions' from localStorage, parses the JSON,
 * and populates the module-level `tasks` and `completions` variables.
 *
 * - If a key is absent (null) the variable defaults to [] / {} without throwing.
 * - Any parse failure or localStorage unavailability is caught; both variables
 *   are reset to their empty defaults and an error banner is displayed in the DOM.
 *
 * Requirements: 2.3, 2.4, 5.4, 5.6, 6.4, 6.5
 */
function loadFromStorage() {
  try {
    var rawTasks       = localStorage.getItem('sp_tasks');
    var rawCompletions = localStorage.getItem('sp_completions');

    tasks       = rawTasks       !== null ? JSON.parse(rawTasks)       : [];
    completions = rawCompletions !== null ? JSON.parse(rawCompletions) : {};
  } catch (err) {
    // Restore safe defaults so the rest of the app can still function.
    tasks       = [];
    completions = {};

    // Show a persistent error banner so the student knows data could not be restored.
    showStorageErrorBanner('Could not restore your data. Storage may be unavailable.');
  }
}

/**
 * showStorageErrorBanner
 *
 * Finds (or creates) a <div id="storage-error-banner"> inside <body> and sets
 * its text. The banner uses inline styles so it is visible even when style.css
 * has not fully loaded or an existing rule hides it.
 *
 * @param {string} message - Human-readable error text to display.
 */
function showStorageErrorBanner(message) {
  var banner = document.getElementById('storage-error-banner');

  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'storage-error-banner';
    // Position at the very top so it is always visible regardless of scroll.
    banner.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100%',
      'background: #c0392b',
      'color: #fff',
      'padding: 10px 16px',
      'font-size: 14px',
      'font-weight: bold',
      'z-index: 9999',
      'box-sizing: border-box',
      'text-align: center'
    ].join(';');

    // Insert as the first child of <body> so it sits above all page content.
    document.body.insertBefore(banner, document.body.firstChild);
  }

  banner.textContent = message;
}

/**
 * showStorageToast
 *
 * Creates (or reuses) a <div id="storage-toast"> and displays `message`
 * for 3 seconds, then hides it. Uses inline styles so the toast is
 * visible even before style.css has loaded.
 *
 * @param {string} message - Warning text shown to the student.
 */
function showStorageToast(message) {
  var toast = document.getElementById('storage-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'storage-toast';
    toast.style.cssText = [
      'position: fixed',
      'bottom: 20px',
      'left: 50%',
      'transform: translateX(-50%)',
      'background: #e67e22',
      'color: #fff',
      'padding: 10px 20px',
      'border-radius: 4px',
      'font-size: 14px',
      'font-weight: bold',
      'z-index: 9999',
      'box-shadow: 0 2px 8px rgba(0,0,0,0.25)',
      'text-align: center',
      'max-width: 90vw'
    ].join(';');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = 'block';
  // Clear any previous auto-hide timer so overlapping calls reset the countdown.
  if (toast._hideTimer) {
    clearTimeout(toast._hideTimer);
  }
  toast._hideTimer = setTimeout(function () {
    toast.style.display = 'none';
  }, 3000);
}

/**
 * saveTasksToStorage
 *
 * Serialises the module-level `tasks` array to JSON and writes it to
 * localStorage under the key 'sp_tasks'. If the write fails (e.g. quota
 * exceeded or storage unavailable) a non-blocking toast is shown for 3 s.
 *
 * Requirements: 2.1, 2.3
 */
function saveTasksToStorage() {
  try {
    localStorage.setItem('sp_tasks', JSON.stringify(tasks));
  } catch (err) {
    showStorageToast('Warning: Could not save tasks. Storage may be full.');
  }
}

/**
 * saveCompletionsToStorage
 *
 * Serialises the module-level `completions` map to JSON and writes it to
 * localStorage under the key 'sp_completions'. If the write fails a
 * non-blocking toast is shown for 3 s.
 *
 * Requirements: 2.3, 5.2
 */
function saveCompletionsToStorage() {
  try {
    localStorage.setItem('sp_completions', JSON.stringify(completions));
  } catch (err) {
    showStorageToast('Warning: Could not save completion status.');
  }
}

// ============================================================
// Form Validation
// ============================================================

/**
 * validateForm
 *
 * Reads the four form fields from the DOM, applies all validation rules,
 * and returns a result object describing whether the form is valid and
 * what (if any) error messages should be shown for each field.
 *
 * Validation rules enforced:
 *  - Subject Name : required, not whitespace-only, max 100 chars
 *  - Topic Name   : required, not whitespace-only, max 100 chars
 *  - Exam Date    : required, must be today or a future date
 *  - Study Hours  : required, must be a number, 0.5 ≤ value ≤ 24
 *
 * @returns {{ valid: boolean, errors: Object.<string, string> }}
 *   `valid`  — true only when all four fields pass every rule.
 *   `errors` — maps each field's error-span ID to its message string.
 *              A field with no error maps to an empty string "".
 *
 * Requirements: 1.2, 1.3, 1.4, 1.6
 */
function validateForm() {
  var errors = {
    'subject-error'    : '',
    'topic-error'      : '',
    'exam-date-error'  : '',
    'study-hours-error': ''
  };

  // ── Subject Name ──────────────────────────────────────────
  var subjectEl = document.getElementById('subject');
  var subjectVal = subjectEl ? subjectEl.value : '';

  if (subjectVal.trim() === '') {
    errors['subject-error'] = 'Subject Name is required.';
  } else if (subjectVal.length > 100) {
    // The maxlength attribute caps input, but validate defensively too.
    errors['subject-error'] = 'Subject Name must be 100 characters or fewer.';
  }

  // ── Topic Name ────────────────────────────────────────────
  var topicEl = document.getElementById('topic');
  var topicVal = topicEl ? topicEl.value : '';

  if (topicVal.trim() === '') {
    errors['topic-error'] = 'Topic Name is required.';
  } else if (topicVal.length > 100) {
    errors['topic-error'] = 'Topic Name must be 100 characters or fewer.';
  }

  // ── Exam Date ─────────────────────────────────────────────
  var examDateEl = document.getElementById('exam-date');
  var examDateVal = examDateEl ? examDateEl.value : '';

  if (examDateVal === '') {
    errors['exam-date-error'] = 'Exam Date is required.';
  } else {
    // Compare ISO date strings (YYYY-MM-DD) lexicographically — valid because
    // the format is zero-padded and always the same length.
    var todayISO = new Date().toISOString().slice(0, 10);
    if (examDateVal < todayISO) {
      errors['exam-date-error'] = 'Exam Date must be today or a future date.';
    }
  }

  // ── Available Study Hours ─────────────────────────────────
  var hoursEl = document.getElementById('study-hours');
  var hoursRaw = hoursEl ? hoursEl.value : '';

  if (hoursRaw.trim() === '') {
    errors['study-hours-error'] = 'Available Study Hours is required.';
  } else {
    var hoursNum = Number(hoursRaw);
    if (isNaN(hoursNum)) {
      errors['study-hours-error'] = 'Available Study Hours must be a number.';
    } else if (hoursNum < 0.5 || hoursNum > 24) {
      errors['study-hours-error'] = 'Available Study Hours must be between 0.5 and 24.';
    }
  }

  // ── Aggregate result ──────────────────────────────────────
  var valid = Object.keys(errors).every(function (key) {
    return errors[key] === '';
  });

  return { valid: valid, errors: errors };
}

/**
 * showValidationErrors
 *
 * Accepts the `errors` map returned by `validateForm` and updates each
 * error-span element's `textContent` accordingly. An empty string clears
 * any previously shown message for that field.
 *
 * The `.error-msg` CSS class keeps each span in the layout at all times
 * (display:block with min-height), so toggling text content is enough —
 * no style manipulation is needed here.
 *
 * @param {Object.<string, string>} errors
 *   Maps error-span IDs to their message strings (or "" for no error).
 *
 * Requirements: 1.2, 1.3, 1.4, 1.6
 */
function showValidationErrors(errors) {
  var spanIds = [
    'subject-error',
    'topic-error',
    'exam-date-error',
    'study-hours-error'
  ];

  spanIds.forEach(function (spanId) {
    var el = document.getElementById(spanId);
    if (el) {
      el.textContent = errors[spanId] || '';
    }
  });
}

// ============================================================
// Form Helpers
// ============================================================

/**
 * clearForm
 *
 * Resets all four form inputs to their empty default state and clears any
 * displayed validation messages and the success confirmation message.
 *
 * Called after a Task is successfully saved so the form is ready for the
 * next entry.
 *
 * Requirements: 2.1
 */
function clearForm() {
  // Clear all four input fields.
  document.getElementById('subject').value     = '';
  document.getElementById('topic').value       = '';
  document.getElementById('exam-date').value   = '';
  document.getElementById('study-hours').value = '';

  // Clear all validation error spans.
  showValidationErrors({
    'subject-error'    : '',
    'topic-error'      : '',
    'exam-date-error'  : '',
    'study-hours-error': ''
  });

  // Clear the success confirmation message.
  var successEl = document.getElementById('form-success');
  if (successEl) {
    successEl.textContent = '';
  }
}

// ============================================================
// Rendering — Task List
// ============================================================

/**
 * formatDate
 *
 * Converts an ISO-8601 date string ("YYYY-MM-DD") to the display format
 * "DD/MM/YYYY" used throughout the task list.
 *
 * The conversion is done via simple string slicing — no Date constructor is
 * used to avoid timezone-offset issues that can shift the displayed day when
 * the local timezone is behind UTC.
 *
 * @param {string} isoStr - Date string in "YYYY-MM-DD" format.
 * @returns {string} Date string in "DD/MM/YYYY" format.
 */
function formatDate(isoStr) {
  // isoStr = "YYYY-MM-DD"
  //           0123456789
  var year  = isoStr.slice(0, 4);
  var month = isoStr.slice(5, 7);
  var day   = isoStr.slice(8, 10);
  return day + '/' + month + '/' + year;
}

/**
 * renderTaskList
 *
 * Rebuilds the `#task-list` section's innerHTML from the module-level
 * `tasks[]` array.
 *
 * Empty state:
 *   Displays a placeholder paragraph so the section is never visually blank.
 *
 * Non-empty state:
 *   One `.task-card` div per task, each containing:
 *   - `.task-card-info` div
 *       • <strong> — "Subject – Topic"
 *       • <p>      — "Exam date: DD/MM/YYYY"
 *       • <p>      — "Study hours: N"
 *   - <button class="delete-btn" data-id="TASK_ID">Delete</button>
 *
 * The delete button carries the task's id in a `data-id` attribute so the
 * delegated click handler on `#task-list` can identify which task to remove.
 *
 * Requirements: 2.2, 3.1
 */
function renderTaskList() {
  var container = document.getElementById('task-list');
  if (!container) { return; }

  if (tasks.length === 0) {
    container.innerHTML = '<p class="empty-msg">No tasks yet. Add your first task above!</p>';
    return;
  }

  var html = '';

  tasks.forEach(function (task) {
    // Escape user-supplied strings to prevent XSS via innerHTML assignment.
    var safeSubject = escapeHtml(task.subject);
    var safeTopic   = escapeHtml(task.topic);

    html += '<div class="task-card">';
    html +=   '<div class="task-card-info">';
    html +=     '<strong>' + safeSubject + ' \u2013 ' + safeTopic + '</strong>';
    html +=     '<p>Exam date: ' + formatDate(task.examDate) + '</p>';
    html +=     '<p>Study hours: ' + task.hours + '</p>';
    html +=   '</div>';
    html +=   '<button class="delete-btn" data-id="' + task.id + '">Delete</button>';
    html += '</div>';
  });

  container.innerHTML = html;
}

/**
 * escapeHtml
 *
 * Replaces the five characters that have special meaning in HTML
 * (&, <, >, ", ') with their entity equivalents, making arbitrary
 * strings safe to embed in innerHTML.
 *
 * @param {string} str - Raw user input.
 * @returns {string} HTML-safe string.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// Add Task
// ============================================================

/**
 * addTask
 *
 * Form submit handler. Validates all four fields via `validateForm`,
 * displays any inline errors via `showValidationErrors`, and returns
 * early without saving if the input is invalid.
 *
 * When every field is valid:
 *  1. Builds a Task object with a UUID (falls back to Date.now() string).
 *  2. Appends it to the module-level `tasks[]` array.
 *  3. Persists the updated array to LocalStorage.
 *  4. Re-renders the task list and clears the form.
 *  5. Updates the Dashboard counters.
 *  6. Shows a success confirmation that auto-clears after 3 seconds.
 *
 * @param {Event} event - The form's `submit` event.
 *
 * Requirements: 1.5, 2.1, 2.2, 2.3
 */
function addTask(event) {
  event.preventDefault();

  var result = validateForm();
  showValidationErrors(result.errors);

  if (!result.valid) {
    return;
  }

  // Build the Task object.
  var task = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : Date.now().toString(),
    subject:  document.getElementById('subject').value.trim(),
    topic:    document.getElementById('topic').value.trim(),
    examDate: document.getElementById('exam-date').value,
    hours:    Number(document.getElementById('study-hours').value)
  };

  // Persist and re-render.
  tasks.push(task);
  saveTasksToStorage();
  renderTaskList();
  clearForm();
  updateDashboard();

  // Show a success confirmation and auto-clear it after 3 seconds.
  var successEl = document.getElementById('form-success');
  if (successEl) {
    successEl.textContent = 'Task added successfully!';
    setTimeout(function () {
      successEl.textContent = '';
    }, 3000);
  }
}

// ============================================================
// Delete Task
// ============================================================

/**
 * deleteTask
 *
 * Prompts the student for confirmation before removing a task. If confirmed,
 * filters the matching task out of `tasks[]`, persists the updated array,
 * re-renders the task list, and refreshes the Dashboard counters.
 * If the student dismisses the prompt nothing is changed.
 *
 * @param {string} taskId - The `id` property of the task to remove.
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
function deleteTask(taskId) {
  var confirmed = window.confirm('Are you sure you want to delete this task?');
  if (!confirmed) {
    return;
  }

  tasks = tasks.filter(function (t) { return t.id !== taskId; });
  saveTasksToStorage();
  renderTaskList();
  updateDashboard();
}

// ============================================================
// Scheduling Helpers
// ============================================================

/**
 * minutesToHHMM
 *
 * Converts a raw minute offset (e.g. 570 for 09:30) into a zero-padded
 * 24-hour time string "HH:MM".  The modulo-24 ensures values that roll
 * over midnight (used in next-day calculations) are displayed correctly,
 * though the scheduling algorithm prevents blocks from exceeding 23:59.
 *
 * @param {number} minutes - Total minutes from midnight (0–1439).
 * @returns {string} Zero-padded time string "HH:MM".
 */
function minutesToHHMM(minutes) {
  var h = Math.floor(minutes / 60) % 24;
  var m = minutes % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

/**
 * nextDay
 *
 * Returns the ISO-8601 date string for the calendar day after `dateStr`.
 * Constructing the Date at noon avoids DST-boundary issues that can cause
 * `setDate(d + 1)` to produce the same day when the clock shifts at midnight.
 *
 * @param {string} dateStr - Date string in "YYYY-MM-DD" format.
 * @returns {string} The following day in "YYYY-MM-DD" format.
 */
function nextDay(dateStr) {
  var d = new Date(dateStr + 'T12:00:00'); // noon avoids DST shift
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ============================================================
// Scheduling Algorithm
// ============================================================

/**
 * buildScheduleBlocks
 *
 * Pure helper — no DOM side-effects.
 *
 * Accepts an array of Task objects already sorted by examDate ASC (ties
 * broken by insertion order ASC) and produces an array of Schedule_Block
 * objects following the algorithm from the design document:
 *
 *  - Cursor starts at today's date, 09:00.
 *  - Each task occupies one contiguous block whose duration = hours × 60 min.
 *  - Tasks with hours === 0 are skipped entirely (Req 4.5).
 *  - If a block would end past 23:59, the cursor advances to the next
 *    calendar day and the block is placed starting at 09:00 there.
 *  - Consecutive blocks on the same day are contiguous (no gaps).
 *  - Re-running on the same input always produces the same output
 *    (deterministic — today's date is the only external dependency).
 *
 * @param {Array<{id:string, subject:string, topic:string, examDate:string, hours:number}>} sortedTasks
 *   Task array sorted ascending by examDate, then by insertion order.
 * @returns {Array<{blockKey:string, taskId:string, subject:string, topic:string,
 *                  startTime:string, endTime:string, date:string}>}
 *
 * Requirements: 4.3, 4.4, 4.5, 4.6
 */
function buildScheduleBlocks(sortedTasks) {
  var blocks = [];
  var today = new Date().toISOString().slice(0, 10);
  var cursorDate = today;
  var cursorMinutes = 9 * 60; // 09:00

  sortedTasks.forEach(function (task, index) {
    if (task.hours === 0) { return; } // skip zero-hour tasks (Req 4.5)

    var durationMinutes = task.hours * 60;
    var startMinutes = cursorMinutes;
    var endMinutes = startMinutes + durationMinutes;

    // If the block would end past 23:59, roll the cursor to the next day.
    if (endMinutes > 23 * 60 + 59) {
      cursorDate = nextDay(cursorDate);
      cursorMinutes = 9 * 60;
      startMinutes = cursorMinutes;
      endMinutes = startMinutes + durationMinutes;
    }

    blocks.push({
      blockKey:  task.id + '-' + index,
      taskId:    task.id,
      subject:   task.subject,
      topic:     task.topic,
      startTime: minutesToHHMM(startMinutes),
      endTime:   minutesToHHMM(endMinutes),
      date:      cursorDate
    });

    cursorMinutes = endMinutes; // next block follows immediately
  });

  return blocks;
}

// ============================================================
// Task Completion Toggle
// ============================================================

/**
 * markCompleted
 *
 * Toggles the completion state of a Schedule_Block identified by `blockKey`.
 *
 *  - If the block is currently marked true, set it to false (incomplete).
 *  - Otherwise, set it to true (completed).
 *
 * After updating the in-memory `completions` map the new state is persisted
 * to LocalStorage. The matching `.schedule-block` DOM element is then updated
 * to reflect the new state: the `.completed` CSS class (strikethrough / muted
 * colour) and the `.done` class on the inner `.complete-btn` are toggled in
 * sync with `completions[blockKey]`. Finally, Dashboard counters are refreshed.
 *
 * @param {string} blockKey - The `data-key` value of the Schedule_Block to toggle.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */
function markCompleted(blockKey) {
  // Toggle: true → false, absent/false → true
  completions[blockKey] = completions[blockKey] === true ? false : true;

  saveCompletionsToStorage();

  // Locate the Schedule_Block element in the DOM.
  var blockEl = document.querySelector('[data-key="' + blockKey + '"]');
  if (blockEl) {
    var btn = blockEl.querySelector('.complete-btn');
    if (completions[blockKey] === true) {
      blockEl.classList.add('completed');
      if (btn) { btn.classList.add('done'); }
    } else {
      blockEl.classList.remove('completed');
      if (btn) { btn.classList.remove('done'); }
    }
  }

  updateDashboard();
}

// ============================================================
// Dashboard — stub (full implementation in task 11)
// ============================================================

/**
 * updateDashboard
 *
 * Stub that keeps addTask from throwing a ReferenceError before the
 * real implementation (task 11) is in place. The real implementation
 * will replace this function and populate #total-count, #completed-count,
 * and #remaining-count.
 *
 * Requirements: 6.1, 6.2, 6.3
 */
function updateDashboard() {
  var total = tasks.length;

  // A task is "completed" if at least one of its schedule block keys
  // exists in completions with a value of true.
  var completedCount = tasks.filter(function(task) {
    return Object.keys(completions).some(function(key) {
      return key.startsWith(task.id + '-') && completions[key] === true;
    });
  }).length;

  var remaining = total - completedCount;

  var totalEl     = document.getElementById('total-count');
  var completedEl = document.getElementById('completed-count');
  var remainingEl = document.getElementById('remaining-count');

  if (totalEl)     totalEl.textContent     = total;
  if (completedEl) completedEl.textContent = completedCount;
  if (remainingEl) remainingEl.textContent = remaining;
}

// ============================================================
// Rendering — Study Plan
// ============================================================

/**
 * renderStudyPlan
 *
 * Rebuilds the `#study-plan` section's innerHTML from the provided
 * Schedule_Block array.
 *
 * Empty state:
 *   Displays a placeholder paragraph so the section is never visually blank.
 *
 * Non-empty state:
 *   Blocks are grouped by their `date` field. For each group a
 *   `.plan-date-header` paragraph is emitted (date formatted DD/MM/YYYY),
 *   followed by one `.schedule-block` div per block:
 *
 *   <div class="schedule-block" data-key="BLOCK_KEY">
 *     <span class="time-range">HH:MM – HH:MM</span>
 *     <span class="block-subject">Subject – Topic</span>
 *     <button class="complete-btn" data-key="BLOCK_KEY">Completed</button>
 *   </div>
 *
 * After building innerHTML, the function re-applies the `.completed` and
 * `.done` classes to any blocks whose key is present in `completions` with
 * a value of `true`, restoring visual state without requiring a page reload.
 *
 * @param {Array<{blockKey:string, taskId:string, subject:string, topic:string,
 *                startTime:string, endTime:string, date:string}>} blocks
 *
 * Requirements: 4.7, 5.4
 */
function renderStudyPlan(blocks) {
  var container = document.getElementById('study-plan');
  if (!container) { return; }

  if (!blocks || blocks.length === 0) {
    container.innerHTML = '<p class="empty-msg">No study plan generated yet.</p>';
    return;
  }

  // ── Group blocks by date (preserving order) ───────────────
  var groups = [];          // Array of { date: string, blocks: Block[] }
  var dateIndex = {};       // date string → index in groups[]

  blocks.forEach(function (block) {
    if (dateIndex[block.date] === undefined) {
      dateIndex[block.date] = groups.length;
      groups.push({ date: block.date, blocks: [] });
    }
    groups[dateIndex[block.date]].blocks.push(block);
  });

  // ── Build HTML ─────────────────────────────────────────────
  var html = '';

  groups.forEach(function (group) {
    // Date header — format ISO "YYYY-MM-DD" → "DD/MM/YYYY"
    html += '<p class="plan-date-header">' + formatDate(group.date) + '</p>';

    group.blocks.forEach(function (block) {
      var safeSubject = escapeHtml(block.subject);
      var safeTopic   = escapeHtml(block.topic);
      var safeKey     = escapeHtml(block.blockKey);

      html += '<div class="schedule-block" data-key="' + safeKey + '">';
      html +=   '<span class="time-range">' + block.startTime + ' \u2013 ' + block.endTime + '</span>';
      html +=   '<span class="block-subject">' + safeSubject + ' \u2013 ' + safeTopic + '</span>';
      html +=   '<button class="complete-btn" data-key="' + safeKey + '">Completed</button>';
      html += '</div>';
    });
  });

  container.innerHTML = html;

  // ── Restore completed visual state ────────────────────────
  // Re-apply .completed / .done for blocks already marked in completions{}.
  blocks.forEach(function (block) {
    if (completions[block.blockKey] === true) {
      var blockEl = container.querySelector('[data-key="' + block.blockKey + '"].schedule-block');
      if (blockEl) {
        blockEl.classList.add('completed');
        var btn = blockEl.querySelector('.complete-btn');
        if (btn) { btn.classList.add('done'); }
      }
    }
  });
}

// ============================================================
// Generate Study Plan
// ============================================================

/**
 * generateStudyPlan
 *
 * Click handler for `#generate-btn`. Validates that at least one task
 * exists, sorts a shallow copy of `tasks[]` by examDate ASC (ties
 * preserve insertion order via an index-based stable sort), delegates
 * block creation to `buildScheduleBlocks`, renders the result, and
 * refreshes the Dashboard counters.
 *
 * If no tasks exist, a "No tasks available" message is placed directly
 * into `#study-plan` and the function returns early.
 *
 * Requirements: 4.2, 4.3, 4.8
 */
function generateStudyPlan() {
  var container = document.getElementById('study-plan');

  // Req 4.2 — empty state message
  if (tasks.length === 0) {
    if (container) {
      container.innerHTML = '<p class="empty-msg">No tasks available to generate a plan.</p>';
    }
    return;
  }

  // Req 4.3 — stable sort by examDate ASC; ties keep original insertion order.
  // Array.prototype.sort is not guaranteed to be stable in all engines, so we
  // decorate each element with its original index before sorting.
  var indexedTasks = tasks.map(function (task, i) {
    return { task: task, index: i };
  });

  indexedTasks.sort(function (a, b) {
    if (a.task.examDate < b.task.examDate) { return -1; }
    if (a.task.examDate > b.task.examDate) { return  1; }
    return a.index - b.index;   // stable: preserve insertion order on tie
  });

  var sortedTasks = indexedTasks.map(function (item) { return item.task; });

  // Build, render, refresh.
  var blocks = buildScheduleBlocks(sortedTasks);
  renderStudyPlan(blocks);
  updateDashboard();
}

// ============================================================
// DOMContentLoaded — wire event listeners
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  // Restore persisted state then draw the initial UI.
  loadFromStorage();
  renderTaskList();

  // Req 2.4, 5.4: If tasks were persisted, auto-generate the study plan so
  // that Schedule_Blocks are rendered and any previously completed blocks have
  // their visual state restored from LocalStorage.  Without this step a page
  // refresh would clear the study plan section even though completions{} was
  // successfully loaded, causing completed-state indicators to disappear.
  if (tasks.length > 0) {
    generateStudyPlan();
  }

  updateDashboard();

  document.getElementById('task-form').addEventListener('submit', addTask);

  // Delegated click handler for delete buttons inside #task-list.
  document.getElementById('task-list').addEventListener('click', function (e) {
    if (e.target.classList.contains('delete-btn')) {
      deleteTask(e.target.dataset.id);
    }
  });

  // Generate Study Plan button (Req 4.1, 4.2).
  var generateBtn = document.getElementById('generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateStudyPlan);
  }

  // Delegated click handler for complete buttons inside #study-plan.
  document.getElementById('study-plan').addEventListener('click', function(e) {
    if (e.target.classList.contains('complete-btn')) {
      markCompleted(e.target.dataset.key);
    }
  });
});
