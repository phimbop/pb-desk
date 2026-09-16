import { createHash, randomUUID } from "node:crypto";
import {
  createReadStream,
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";

export type Status =
  "PASS" | "FAIL" | "NOT_RUN" | "RUNNING" | "STALE" | "BLOCKED";
export interface Check {
  id: string;
  command: string[];
  timeoutMs: number;
  testFormat?: "bun" | "cargo";
}
export interface Task {
  sessionId: string;
  title: string;
  requirements: { id: string; description: string; checks: string[] }[];
  checks: Check[];
}
export interface Result extends Check {
  cwd: string;
  startedAt: string;
  finishedAt: string;
  exitCode: number | null;
  signal: string | null;
  status: Status;
  detail: string;
  stdout: string;
  stderr: string;
  stdoutHash: string;
  stderrHash: string;
  passed: number | null;
  skipped: number | null;
}
export interface Evidence {
  version: 1;
  sessionId: string;
  root: string;
  snapshot: string;
  afterSnapshot: string;
  taskHash: string;
  startedAt: string;
  finishedAt?: string;
  status: Status;
  results: Result[];
  detail?: string;
}
export const BASE_CHECKS: Check[] = [
  {
    id: "rust-clippy",
    command: ["cargo", "clippy", "--workspace", "--", "-D", "warnings"],
    timeoutMs: 900000,
  },
  {
    id: "rust-tests",
    command: ["cargo", "test", "--workspace"],
    timeoutMs: 900000,
    testFormat: "cargo",
  },
  { id: "frontend-check", command: ["bun", "run", "check"], timeoutMs: 300000 },
  { id: "frontend-build", command: ["bun", "run", "build"], timeoutMs: 300000 },
  {
    id: "harness-types",
    command: ["bun", "run", "agent:typecheck"],
    timeoutMs: 120000,
  },
  {
    id: "harness-evals",
    command: ["bun", "test", "scripts/agent"],
    timeoutMs: 120000,
    testFormat: "bun",
  },
];
const SKIP_DIRS = new Set([
  "node_modules",
  "target",
  ".git",
  ".codegraph",
  ".svelte-kit",
  "build",
  "dist",
  ".agent-evidence",
]);
export const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export const now = () => new Date().toISOString();
export function atomicJson(path: string, value: unknown) {
  mkdirSync(resolve(path, ".."), { recursive: true, mode: 0o700 });
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  renameSync(temp, path);
}
export function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}
export function stateDirectory(
  root: string,
  sessionId: string,
  base = join(homedir(), ".local/state/pb-desk-agent"),
) {
  return join(
    base,
    hash(realpathSync(root)).slice(0, 20),
    hash(sessionId).slice(0, 24),
  );
}
export async function fileHash(path: string): Promise<string> {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest("hex");
}
export async function snapshot(root: string): Promise<string> {
  const digest = createHash("sha256");
  async function visit(directory: string, prefix: string) {
    for (const name of readdirSync(directory).sort()) {
      const relative = prefix ? `${prefix}/${name}` : name;
      if (relative === "docs/agent-harness/EXECUTION-LEDGER.md") continue;
      const path = join(directory, name);
      const info = lstatSync(path);
      if (info.isDirectory()) {
        if (!SKIP_DIRS.has(name)) await visit(path, relative);
      } else if (info.isSymbolicLink()) {
        throw new Error(`Cannot verify symlink in source scope: ${relative}`);
      } else if (info.isFile()) {
        digest.update(
          JSON.stringify([relative, info.mode & 0o777, await fileHash(path)]),
        );
      } else throw new Error(`Unsupported source entry: ${relative}`);
    }
  }
  await visit(root, "");
  return digest.digest("hex");
}
export function validateTask(input: unknown): Task {
  const task = input as Task;
  if (
    !task ||
    typeof task.title !== "string" ||
    !task.title.trim() ||
    typeof task.sessionId !== "string" ||
    !task.sessionId.trim()
  )
    throw new Error("Task needs title and sessionId");
  if (
    !Array.isArray(task.requirements) ||
    !task.requirements.length ||
    !Array.isArray(task.checks) ||
    !task.checks.length
  )
    throw new Error("Task needs requirements and acceptance checks");
  const ids = new Set(BASE_CHECKS.map((c) => c.id));
  for (const check of task.checks) {
    if (
      !check ||
      typeof check.id !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(check.id) ||
      ids.has(check.id)
    )
      throw new Error(
        "Check IDs must be unique and cannot replace base checks",
      );
    ids.add(check.id);
    if (
      !Array.isArray(check.command) ||
      !check.command.length ||
      check.command.some((a) => typeof a !== "string" || !a || a.includes("\0"))
    )
      throw new Error("Commands must be nonempty argument arrays");
    if (!["bun", "bunx", "cargo"].includes(basename(check.command[0])))
      throw new Error("Acceptance checks must use Bun, Bunx or Cargo");
    if (
      !Number.isInteger(check.timeoutMs) ||
      check.timeoutMs < 1 ||
      check.timeoutMs > 900000
    )
      throw new Error("Check timeoutMs must be 1..900000");
    if (
      check.testFormat !== undefined &&
      !["bun", "cargo"].includes(check.testFormat)
    )
      throw new Error("Unknown test format");
    if (
      check.command[1] === "test" &&
      ["bun", "cargo"].includes(basename(check.command[0])) &&
      check.testFormat !== basename(check.command[0])
    )
      throw new Error(
        "Test commands need matching testFormat to detect empty runs",
      );
  }
  const acceptanceIds = new Set(task.checks.map((c) => c.id));
  const requirements = new Set<string>();
  for (const r of task.requirements) {
    if (
      !r ||
      typeof r.id !== "string" ||
      !r.id.trim() ||
      requirements.has(r.id) ||
      typeof r.description !== "string" ||
      !r.description.trim()
    )
      throw new Error("Requirements need unique IDs and descriptions");
    requirements.add(r.id);
    if (
      !Array.isArray(r.checks) ||
      !r.checks.length ||
      r.checks.some((id) => !acceptanceIds.has(id))
    )
      throw new Error("Each requirement must reference an acceptance check");
  }
  return task;
}
export const taskHash = (task: Task) =>
  hash(JSON.stringify({ task, baseChecks: BASE_CHECKS }));

export async function runCheck(
  check: Check,
  cwd: string,
  outputDirectory: string,
): Promise<Result> {
  mkdirSync(outputDirectory, { recursive: true, mode: 0o700 });
  const stdout = join(outputDirectory, `${check.id}.stdout.log`);
  const stderr = join(outputDirectory, `${check.id}.stderr.log`);
  const out = openSync(stdout, "w", 0o600),
    err = openSync(stderr, "w", 0o600);
  const startedAt = now();
  let timedOut = false,
    detail = "",
    exitCode: number | null = null,
    signal: string | null = null;
  try {
    const child = spawn(check.command[0], check.command.slice(1), {
      cwd,
      stdio: ["ignore", out, err],
      detached: process.platform !== "win32",
    });
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        if (process.platform !== "win32" && child.pid)
          process.kill(-child.pid, "SIGKILL");
        else child.kill("SIGKILL");
      } catch {
        /* Process already exited. */
      }
    }, check.timeoutMs);
    await new Promise<void>((done) => {
      child.once("error", (error) => {
        detail = error.message;
      });
      child.once("close", (code, sig) => {
        exitCode = code;
        signal = sig;
        clearTimeout(timer);
        done();
      });
    });
  } finally {
    closeSync(out);
    closeSync(err);
  }
  let status: Status =
    timedOut || detail || exitCode === null
      ? "BLOCKED"
      : exitCode === 0
        ? "PASS"
        : "FAIL";
  if (timedOut) detail = "Command timed out; process group was terminated";
  let passed: number | null = null,
    skipped: number | null = null;
  if (check.testFormat && status === "PASS") {
    if (statSync(stdout).size + statSync(stderr).size > 20 * 1024 * 1024) {
      status = "BLOCKED";
      detail = "Test output exceeds parser limit";
    } else {
      const output =
        readFileSync(stdout, "utf8") + "\n" + readFileSync(stderr, "utf8");
      const counts = [
        ...output.matchAll(
          check.testFormat === "cargo"
            ? /test result: ok\. (\d+) passed; \d+ failed; (\d+) ignored/g
            : /^\s*(\d+) pass\s*$/gm,
        ),
      ];
      passed = counts.reduce((n, m) => n + Number(m[1]), 0);
      skipped =
        check.testFormat === "cargo"
          ? counts.reduce((n, m) => n + Number(m[2]), 0)
          : [...output.matchAll(/^\s*(\d+) (?:skip|todo)\s*$/gm)].reduce(
              (n, m) => n + Number(m[1]),
              0,
            );
      if (!passed || skipped > 0) {
        status = "FAIL";
        detail = !passed
          ? "No passing tests were observed"
          : "Skipped/ignored tests require review";
      }
    }
  }
  return {
    ...check,
    cwd,
    startedAt,
    finishedAt: now(),
    exitCode,
    signal,
    status,
    detail,
    stdout,
    stderr,
    stdoutHash: await fileHash(stdout),
    stderrHash: await fileHash(stderr),
    passed,
    skipped,
  };
}

export function evaluateEvidence(
  e: Evidence | null,
  current: string,
  contract: string,
  checks: Check[],
  time = Date.now(),
): { status: Status; detail: string } {
  if (!e) return { status: "NOT_RUN", detail: "No command evidence exists" };
  if (e.version !== 1 || !Array.isArray(e.results))
    return { status: "BLOCKED", detail: "Invalid evidence format" };
  if (e.snapshot !== current || e.taskHash !== contract)
    return {
      status: "STALE",
      detail: "Source or task changed since verification",
    };
  if (e.status === "RUNNING")
    return { status: "RUNNING", detail: "Verification has not finished" };
  if (e.afterSnapshot !== current)
    return { status: "STALE", detail: "Source changed during verification" };
  const finished = Date.parse(e.finishedAt ?? "");
  if (
    !Number.isFinite(finished) ||
    finished > time + 60000 ||
    time - finished > 6 * 3600000
  )
    return {
      status: "STALE",
      detail:
        "Evidence is missing a valid finish time or is over six hours old",
    };
  if (e.status !== "PASS")
    return {
      status: e.status === "FAIL" ? "FAIL" : "BLOCKED",
      detail: e.detail || "Verification did not pass",
    };
  if (!checks.length || e.results.length !== checks.length)
    return { status: "NOT_RUN", detail: "Required checks are missing" };
  for (const c of checks) {
    const matches = e.results.filter((r) => r.id === c.id);
    const r = matches[0];
    if (
      matches.length !== 1 ||
      !r ||
      r.status !== "PASS" ||
      r.exitCode !== 0 ||
      r.signal ||
      r.cwd !== e.root ||
      JSON.stringify(r.command) !== JSON.stringify(c.command) ||
      r.timeoutMs !== c.timeoutMs ||
      r.testFormat !== c.testFormat ||
      (c.testFormat && (!(Number(r.passed) > 0) || r.skipped !== 0))
    )
      return {
        status: "FAIL",
        detail: `Missing or invalid successful result for ${c.id}`,
      };
    for (const [path, expected] of [
      [r.stdout, r.stdoutHash],
      [r.stderr, r.stderrHash],
    ]) {
      if (
        typeof path !== "string" ||
        typeof expected !== "string" ||
        !existsSync(path) ||
        hash(readFileSync(path)) !== expected
      )
        return {
          status: "BLOCKED",
          detail: `Missing or modified log for ${c.id}`,
        };
    }
  }
  return {
    status: "PASS",
    detail:
      "All configured command checks passed on the current source snapshot; task completeness still requires review",
  };
}
