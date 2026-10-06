#!/usr/bin/env node
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const fs = require("fs");
const path = require("path");

// -- Data file path ------------------------------------------------------------
const DATA_FILE = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.join(__dirname, "..", "data", "tasks.json");

// Ensure the data directory and file exist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks: [], completions: {} }, null, 2));
  }
}

function readData() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { tasks: [], completions: {} };
  }
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// -- MCP Server ----------------------------------------------------------------
const server = new McpServer({
  name: "study-planner",
  version: "1.0.0",
});

// Tool: get_tasks
server.tool(
  "get_tasks",
  "Get all saved study tasks",
  {},
  async () => {
    const data = readData();
    return {
      content: [{ type: "text", text: JSON.stringify(data.tasks, null, 2) }],
    };
  }
);

// Tool: add_task
server.tool(
  "add_task",
  "Add a new study task",
  {
    subject: z.string().min(1).max(100).describe("Subject name"),
    topic: z.string().min(1).max(100).describe("Topic name"),
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Exam date in YYYY-MM-DD format"),
    hours: z.number().min(0.5).max(24).describe("Available study hours"),
  },
  async ({ subject, topic, examDate, hours }) => {
    const data = readData();
    const task = {
      id: Date.now().toString(),
      subject,
      topic,
      examDate,
      hours,
    };
    data.tasks.push(task);
    writeData(data);
    return {
      content: [{ type: "text", text: `Task added: ${JSON.stringify(task, null, 2)}` }],
    };
  }
);

// Tool: delete_task
server.tool(
  "delete_task",
  "Delete a study task by ID",
  {
    id: z.string().describe("The task ID to delete"),
  },
  async ({ id }) => {
    const data = readData();
    const before = data.tasks.length;
    data.tasks = data.tasks.filter((t) => t.id !== id);
    if (data.tasks.length === before) {
      return { content: [{ type: "text", text: `No task found with id: ${id}` }] };
    }
    // Remove completions for this task
    Object.keys(data.completions).forEach((key) => {
      if (key.startsWith(id + "-")) delete data.completions[key];
    });
    writeData(data);
    return { content: [{ type: "text", text: `Task ${id} deleted.` }] };
  }
);

// Tool: update_completion
server.tool(
  "update_completion",
  "Mark or unmark a schedule block as completed",
  {
    blockKey: z.string().describe("The block key in format taskId-index"),
    completed: z.boolean().describe("true to mark completed, false to unmark"),
  },
  async ({ blockKey, completed }) => {
    const data = readData();
    data.completions[blockKey] = completed;
    writeData(data);
    return {
      content: [{ type: "text", text: `Block ${blockKey} marked as ${completed ? "completed" : "incomplete"}.` }],
    };
  }
);

// Tool: get_study_plan
server.tool(
  "get_study_plan",
  "Generate a sorted study plan from saved tasks",
  {},
  async () => {
    const data = readData();
    if (data.tasks.length === 0) {
      return { content: [{ type: "text", text: "No tasks available to generate a plan." }] };
    }

    // Sort by examDate ASC, ties by insertion order
    const sorted = data.tasks
      .map((t, i) => ({ task: t, index: i }))
      .sort((a, b) => {
        if (a.task.examDate < b.task.examDate) return -1;
        if (a.task.examDate > b.task.examDate) return 1;
        return a.index - b.index;
      })
      .map((x) => x.task);

    // Build schedule blocks starting at 09:00
    let cursorMinutes = 9 * 60;
    const today = new Date().toISOString().slice(0, 10);
    let cursorDate = today;

    const blocks = [];
    sorted.forEach((task, index) => {
      if (task.hours === 0) return;
      const duration = task.hours * 60;
      let start = cursorMinutes;
      let end = start + duration;
      if (end > 23 * 60 + 59) {
        const d = new Date(cursorDate + "T12:00:00");
        d.setDate(d.getDate() + 1);
        cursorDate = d.toISOString().slice(0, 10);
        cursorMinutes = 9 * 60;
        start = cursorMinutes;
        end = start + duration;
      }
      const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      blocks.push({
        blockKey: `${task.id}-${index}`,
        date: cursorDate,
        startTime: fmt(start),
        endTime: fmt(end),
        subject: task.subject,
        topic: task.topic,
        completed: data.completions[`${task.id}-${index}`] === true,
      });
      cursorMinutes = end;
    });

    return {
      content: [{ type: "text", text: JSON.stringify(blocks, null, 2) }],
    };
  }
);

// -- Start ---------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
