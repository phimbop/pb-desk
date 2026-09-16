import { appendFileSync, mkdirSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  atomicJson,
  BASE_CHECKS,
  evaluateEvidence,
  now,
  readJson,
  snapshot,
  stateDirectory,
  taskHash,
  validateTask,
  type Evidence,
  type Status,
} from "./core";

export interface HookInput {
  conversationId?: string;
  workspacePaths?: string[];
  fullyIdle?: boolean;
  terminationReason?: string;
  invocationNum?: number;
}
interface Session {
  baseline: string;
  retries: number;
  status: Status | "READ_ONLY";
  detail: string;
}
export async function handleHook(
  event: string,
  input: HookInput,
  root: string,
  stateBase?: string,
): Promise<object> {
  const active = input.workspacePaths?.some((path) => {
    try {
      return realpathSync(path) === realpathSync(root);
    } catch {
      return false;
    }
  });
  if (!active) return {};
  if (!input.conversationId)
    throw new Error("Hook payload is missing conversationId");
  const directory = stateDirectory(root, input.conversationId, stateBase);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const sessionPath = join(directory, "session.json");
  const statusPath = join(directory, "status.json");
  const session = readJson<Session>(sessionPath);
  const current = await snapshot(root);
  const log = (status: string, detail: string) => {
    const entry = {
      at: now(),
      event,
      sessionId: input.conversationId,
      status,
      detail,
    };
    atomicJson(statusPath, entry);
    appendFileSync(
      join(directory, "hooks.jsonl"),
      JSON.stringify(entry) + "\n",
      { mode: 0o600 },
    );
  };
  if (event === "pre") {
    if (!session)
      atomicJson(sessionPath, {
        baseline: current,
        retries: 0,
        status: "NOT_RUN",
        detail: "Session baseline captured",
      });
    log("OBSERVED", "Native PreInvocation hook fired");
    return {
      injectSteps: [
        {
          ephemeralMessage: `PB_DESK_EVIDENCE_GATE: For implementation tasks, read docs/agent-harness/README.md and write .agents/task.json BEFORE edits. sessionId=${input.conversationId}. Include every requested requirement and executable acceptance checks. After the last edit run: bun --no-env-file run agent:verify ${input.conversationId}. Evidence is in ${directory}. Never edit evidence or hooks to bypass verification. PASS proves configured checks only. Questions without edits need no tests.`,
        },
      ],
    };
  }
  if (event !== "stop") throw new Error("Unknown hook event");
  const state: Session = session ?? {
    baseline: "",
    retries: 0,
    status: "BLOCKED",
    detail: "Missing PreInvocation baseline",
  };
  const block = (status: Status, detail: string) => {
    state.status = status;
    state.detail = detail;
    const interrupted = input.terminationReason !== "model_stop";
    if (interrupted || state.retries >= 4) {
      state.status = "BLOCKED";
      atomicJson(sessionPath, state);
      log("BLOCKED", detail);
      return { decision: "allow", reason: `Verification BLOCKED: ${detail}` };
    }
    state.retries += 1;
    atomicJson(sessionPath, state);
    log(status, detail);
    const final = state.retries === 4;
    return {
      decision: "continue",
      reason: final
        ? `PB_DESK_EVIDENCE_GATE: Retry budget exhausted. Do not claim completion. Report BLOCKED, the missing/failed checks, and evidence path ${directory}. Stop after this report. ${detail}`
        : `PB_DESK_EVIDENCE_GATE: ${status}: ${detail}. Attempt ${state.retries}/3. Read docs/agent-harness/README.md. Repair the task/code or run bun --no-env-file run agent:verify ${input.conversationId}, then inspect its actual result. Do not claim tests passed. Evidence: ${directory}`,
    };
  };
  if (!session)
    return block(
      "BLOCKED",
      "PreInvocation baseline was not recorded; start a fresh session after fixing hook installation",
    );
  if (input.fullyIdle !== true)
    return block("RUNNING", "Background work has not been confirmed idle");
  try {
    const rawTask = readJson<{ sessionId?: string }>(
      join(root, ".agents/task.json"),
    );
    if (
      current === state.baseline &&
      rawTask?.sessionId !== input.conversationId
    ) {
      state.status = "READ_ONLY";
      state.detail = "No source edits or task declared for this session";
      atomicJson(sessionPath, state);
      log("READ_ONLY", state.detail);
      return { decision: "allow" };
    }
    const task = validateTask(rawTask);
    if (task.sessionId !== input.conversationId)
      return block("NOT_RUN", "Task contract belongs to another conversation");
    const evidence = readJson<Evidence>(join(directory, "evidence.json"));
    if (
      evidence &&
      (evidence.sessionId !== input.conversationId || evidence.root !== root)
    )
      return block(
        "BLOCKED",
        "Evidence belongs to another conversation or workspace",
      );
    const result = evaluateEvidence(evidence, current, taskHash(task), [
      ...BASE_CHECKS,
      ...task.checks,
    ]);
    if (result.status !== "PASS") return block(result.status, result.detail);
    state.status = "PASS";
    state.detail = result.detail;
    state.retries = 0;
    atomicJson(sessionPath, state);
    log("PASS", result.detail);
    return { decision: "allow", reason: result.detail };
  } catch (error) {
    return block(
      "BLOCKED",
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function dispatchHook(
  event: string,
  input: HookInput,
  root: string,
  stateBase?: string,
): Promise<object> {
  try {
    return await handleHook(event, input, root, stateBase);
  } catch (error) {
    const reason = `PB_DESK_EVIDENCE_GATE BLOCKED: ${error instanceof Error ? error.message : String(error)}. Do not claim completion.`;
    console.error(reason);
    if (!input.conversationId) return { decision: "allow", reason };
    const directory = stateDirectory(root, input.conversationId, stateBase);
    let attempts = 4;
    try {
      const path = join(directory, "hook-errors.json");
      attempts = (readJson<{ attempts: number }>(path)?.attempts ?? 0) + 1;
      atomicJson(path, { attempts, reason, at: now() });
      atomicJson(join(directory, "status.json"), {
        status: "BLOCKED",
        detail: reason,
        at: now(),
      });
    } catch {
      /* Storage is unavailable; stderr is the remaining diagnostic. */
    }
    if (event === "pre") return { injectSteps: [{ ephemeralMessage: reason }] };
    return {
      decision:
        input.terminationReason === "model_stop" && attempts <= 3
          ? "continue"
          : "allow",
      reason,
    };
  }
}

if (import.meta.main) {
  try {
    const input = JSON.parse(await Bun.stdin.text());
    console.log(
      JSON.stringify(
        await dispatchHook(
          process.argv[2],
          input,
          resolve(import.meta.dir, "../.."),
        ),
      ),
    );
  } catch (error) {
    console.error(
      `PB_DESK_EVIDENCE_GATE BLOCKED: invalid hook input: ${String(error)}`,
    );
    process.exitCode = 1;
  }
}
