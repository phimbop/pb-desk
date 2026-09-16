import { mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  atomicJson,
  BASE_CHECKS,
  now,
  readJson,
  runCheck,
  snapshot,
  stateDirectory,
  taskHash,
  validateTask,
  type Evidence,
} from "./core";

const root = resolve(import.meta.dir, "../..");
const sessionId = process.argv[2];
if (!sessionId) {
  console.error("Usage: bun --no-env-file run agent:verify <sessionId>");
  process.exit(2);
}
const directory = stateDirectory(root, sessionId);
mkdirSync(directory, { recursive: true, mode: 0o700 });
const lock = join(directory, "verify.lock");
try {
  mkdirSync(lock);
} catch {
  const owner = readJson<{ pid: number }>(join(lock, "owner.json"));
  let alive = true;
  if (owner) {
    try {
      process.kill(owner.pid, 0);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ESRCH") alive = false;
    }
  }
  if (alive) {
    console.error(
      "Verification is already running (or lock owner is unknown). Inspect verify.lock before recovery.",
    );
    process.exit(2);
  }
  rmSync(lock, { recursive: true });
  mkdirSync(lock);
}
atomicJson(join(lock, "owner.json"), { pid: process.pid });
let evidence: Evidence | undefined;
try {
  const task = validateTask(readJson(join(root, ".agents/task.json")));
  if (task.sessionId !== sessionId)
    throw new Error("Task sessionId does not match this conversation");
  const before = await snapshot(root);
  evidence = {
    version: 1,
    sessionId,
    root,
    snapshot: before,
    afterSnapshot: "",
    taskHash: taskHash(task),
    startedAt: now(),
    status: "RUNNING",
    results: [],
  };
  atomicJson(join(directory, "evidence.json"), evidence);
  const runDirectory = join(directory, `run-${Date.now()}`);
  for (const check of [...BASE_CHECKS, ...task.checks]) {
    console.error(`Checking ${check.id}: ${check.command.join(" ")}`);
    const result = await runCheck(check, root, runDirectory);
    evidence.results.push(result);
    atomicJson(join(directory, "evidence.json"), evidence);
    console.error(
      `${result.status}: ${check.id} (exit ${result.exitCode}) ${result.detail}`,
    );
  }
  evidence.afterSnapshot = await snapshot(root);
  evidence.finishedAt = now();
  evidence.status =
    evidence.afterSnapshot !== before
      ? "STALE"
      : evidence.results.every((r) => r.status === "PASS")
        ? "PASS"
        : "FAIL";
  evidence.detail = evidence.results
    .filter((r) => r.status !== "PASS")
    .map((r) => `${r.id}: ${r.status} ${r.detail}`)
    .join("; ");
  atomicJson(join(directory, "evidence.json"), evidence);
  console.log(
    JSON.stringify({
      status: evidence.status,
      evidence: join(directory, "evidence.json"),
      detail: evidence.detail,
    }),
  );
  process.exitCode = evidence.status === "PASS" ? 0 : 1;
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  atomicJson(join(directory, "evidence.json"), {
    ...evidence,
    version: 1,
    sessionId,
    root,
    status: "BLOCKED",
    finishedAt: now(),
    results: evidence?.results ?? [],
    detail,
  });
  console.error(detail);
  process.exitCode = 2;
} finally {
  rmSync(lock, { recursive: true, force: true });
}
