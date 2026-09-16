import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  atomicJson,
  BASE_CHECKS,
  evaluateEvidence,
  now,
  readJson,
  runCheck,
  snapshot,
  stateDirectory,
  taskHash,
  validateTask,
  type Evidence,
} from "./core";

export interface AgentEnvelope {
  status: string;
  conversation_id?: string;
  response?: string;
}
export function parseAgentEnvelope(text: string): AgentEnvelope {
  const value = JSON.parse(text);
  if (
    !value ||
    value.status !== "SUCCESS" ||
    typeof value.conversation_id !== "string" ||
    !value.conversation_id
  )
    throw new Error("AGY did not produce a successful conversation response");
  return value;
}

export function verificationCommand(root: string, sessionId: string): string[] {
  return [
    process.execPath,
    "--no-env-file",
    "run",
    join(root, "scripts/agent/verify.ts"),
    sessionId,
  ];
}

// CLI SUCCESS means that AGY returned a response, never that the work passed.
export async function runAgent(
  prompt: string,
  root: string,
  model: string,
  maxAttempts = 3,
  agy = "agy",
  stateBase?: string,
) {
  const sessionId = `driver-${randomUUID()}`;
  const directory = stateDirectory(root, sessionId, stateBase);
  let conversationId: string | undefined;
  let feedback = "";
  const summary = {
    status: "BLOCKED",
    sessionId,
    conversationId,
    attempts: 0,
    detail: "",
    evidence: directory,
    startedAt: now(),
    finishedAt: "",
  };
  atomicJson(join(directory, "driver.json"), summary);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    summary.attempts = attempt;
    console.error(`AGY attempt ${attempt}/${maxAttempts}; logs: ${directory}`);
    const instruction =
      attempt === 1
        ? `${prompt}\n\nEXECUTION CONTRACT: This is an implementation task run by the pb-desk evidence driver. Read AGENTS.md and docs/agent-harness/README.md. Before editing, create .agents/task.json with sessionId=${sessionId}, all requested requirements and executable acceptance checks. The driver runs verification after your response. Do not run agent:verify yourself; do not edit the harness, hooks, or evidence to bypass failures. If work cannot be completed, state BLOCKED. Never treat your summary as test evidence.`
        : `Independent verification has not passed: ${feedback}. Continue the original task. Fix the actual problem within scope; preserve requirements and tests. Task sessionId=${sessionId}. Do not run agent:verify; the driver does that. Do not claim completion without evidence.`;
    const command = [
      agy,
      "-p",
      instruction,
      "--model",
      model,
      "--output-format",
      "json",
      "--print-timeout",
      "10m",
    ];
    if (conversationId) command.push("--conversation", conversationId);
    const output = join(directory, `attempt-${attempt}`);
    const agent = await runCheck(
      { id: "agent", command, timeoutMs: 660000 },
      root,
      output,
    );
    if (agent.status !== "PASS") {
      summary.detail = `AGY ${agent.status}: ${agent.detail}; inspect ${agent.stderr}`;
      break;
    }
    try {
      conversationId = parseAgentEnvelope(
        readFileSync(agent.stdout, "utf8"),
      ).conversation_id;
      summary.conversationId = conversationId;
      const task = validateTask(readJson(join(root, ".agents/task.json")));
      if (task.sessionId !== sessionId)
        throw new Error("Missing task contract for this driver session");
      const verification = await runCheck(
        {
          id: "verification",
          command: verificationCommand(root, sessionId),
          timeoutMs: 3600000,
        },
        root,
        output,
      );
      const evidence = readJson<Evidence>(join(directory, "evidence.json"));
      const result = evaluateEvidence(
        evidence,
        await snapshot(root),
        taskHash(task),
        [...BASE_CHECKS, ...task.checks],
      );
      if (
        verification.status === "PASS" &&
        result.status === "PASS" &&
        evidence?.sessionId === sessionId &&
        evidence.root === root
      ) {
        summary.status = "PASS";
        summary.detail = result.detail;
        break;
      }
      feedback = `${result.status}: ${result.detail}. Logs: ${output}; evidence: ${join(directory, "evidence.json")}`;
    } catch (error) {
      feedback = error instanceof Error ? error.message : String(error);
    }
    summary.detail = feedback;
    atomicJson(join(directory, "driver.json"), summary);
  }
  summary.finishedAt = now();
  atomicJson(join(directory, "driver.json"), summary);
  return summary;
}

if (import.meta.main) {
  const prompt = process.argv[2];
  if (!prompt) {
    console.error(
      'Usage: bun --no-env-file run agent:run "implementation task" [model-id]',
    );
    process.exit(2);
  }
  try {
    const result = await runAgent(
      prompt,
      resolve(import.meta.dir, "../.."),
      process.argv[3] ?? "gemini-3.8-flash-high",
    );
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === "PASS" ? 0 : 1;
  } catch (error) {
    console.error(`BLOCKED: ${String(error)}`);
    process.exitCode = 2;
  }
}
