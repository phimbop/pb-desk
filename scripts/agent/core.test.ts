import { test, expect } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  snapshot,
  validateTask,
  evaluateEvidence,
  runCheck,
  type Evidence,
  type Check,
} from "./core";

test("content changes, additions and deletions invalidate the source snapshot", async () => {
  const root = mkdtempSync(join(tmpdir(), "agy-eval-"));
  try {
    writeFileSync(join(root, "code.ts"), "one");
    const first = await snapshot(root);
    writeFileSync(join(root, "code.ts"), "two");
    expect(await snapshot(root)).not.toBe(first);
    writeFileSync(join(root, "code.ts"), "one");
    expect(await snapshot(root)).toBe(first);
    writeFileSync(join(root, "extra.ts"), "new");
    expect(await snapshot(root)).not.toBe(first);
    rmSync(join(root, "extra.ts"));
    mkdirSync(join(root, "target"));
    writeFileSync(join(root, "target", "build.log"), "generated");
    expect(await snapshot(root)).toBe(first);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("missing task and uncovered requirements are rejected", () => {
  expect(() => validateTask(null)).toThrow();
  expect(() =>
    validateTask({
      title: "fix",
      requirements: [{ id: "R1", description: "works", checks: [] }],
      checks: [],
    }),
  ).toThrow();
});

test("missing and model-authored pass statements are not evidence", () => {
  expect(evaluateEvidence(null, "snapshot", "task", []).status).toBe("NOT_RUN");
  expect(
    evaluateEvidence({ status: "PASS" } as never, "snapshot", "task", [])
      .status,
  ).not.toBe("PASS");
});

test("runner records real failure even when stdout claims success", async () => {
  const root = mkdtempSync(join(tmpdir(), "agy-process-"));
  try {
    const result = await runCheck(
      {
        id: "failure",
        command: [
          process.execPath,
          "-e",
          'console.log("all tests passed");process.exit(7)',
        ],
        timeoutMs: 5000,
      },
      root,
      root,
    );
    expect(result.exitCode).toBe(7);
    expect(result.status).toBe("FAIL");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("PASS needs every real result, fresh source, matching contract and intact logs", async () => {
  const root = mkdtempSync(join(tmpdir(), "agy-receipt-"));
  try {
    const check: Check = {
      id: "acceptance",
      command: [process.execPath, "-e", 'console.log("executed")'],
      timeoutMs: 5000,
    };
    const result = await runCheck(check, root, root);
    const evidence: Evidence = {
      version: 1,
      sessionId: "test",
      root,
      snapshot: "source",
      afterSnapshot: "source",
      taskHash: "task",
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      status: "PASS",
      results: [result],
    };
    expect(evaluateEvidence(evidence, "source", "task", [check]).status).toBe(
      "PASS",
    );
    expect(evaluateEvidence(evidence, "edited", "task", [check]).status).toBe(
      "STALE",
    );
    expect(
      evaluateEvidence(evidence, "source", "different-task", [check]).status,
    ).toBe("STALE");
    expect(
      evaluateEvidence(
        { ...evidence, afterSnapshot: "edited-during-test" },
        "source",
        "task",
        [check],
      ).status,
    ).toBe("STALE");
    expect(
      evaluateEvidence({ ...evidence, status: "RUNNING" }, "source", "task", [
        check,
      ]).status,
    ).toBe("RUNNING");
    expect(
      evaluateEvidence({ ...evidence, results: [] }, "source", "task", [check])
        .status,
    ).toBe("NOT_RUN");
    expect(
      evaluateEvidence(
        evidence,
        "source",
        "task",
        [check],
        Date.now() + 7 * 3600000,
      ).status,
    ).toBe("STALE");
    expect(
      evaluateEvidence(evidence, "source", "task", [
        { ...check, command: ["different"] },
      ]).status,
    ).toBe("FAIL");
    writeFileSync(result.stdout, "forged log");
    expect(evaluateEvidence(evidence, "source", "task", [check]).status).toBe(
      "BLOCKED",
    );
    rmSync(result.stdout);
    expect(evaluateEvidence(evidence, "source", "task", [check]).status).toBe(
      "BLOCKED",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("runner waits for process completion, not the first stdout chunk", async () => {
  const root = mkdtempSync(join(tmpdir(), "agy-async-"));
  try {
    const started = Date.now();
    const result = await runCheck(
      {
        id: "async",
        command: [
          process.execPath,
          "-e",
          'console.log("started");setTimeout(()=>process.exit(9),150)',
        ],
        timeoutMs: 5000,
      },
      root,
      root,
    );
    expect(Date.now() - started).toBeGreaterThanOrEqual(150);
    expect(result.status).toBe("FAIL");
    expect(result.exitCode).toBe(9);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("timeout and missing executable are BLOCKED", async () => {
  const root = mkdtempSync(join(tmpdir(), "agy-timeout-"));
  try {
    expect(
      (
        await runCheck(
          {
            id: "timeout",
            command: [process.execPath, "-e", "setInterval(()=>{},1000)"],
            timeoutMs: 40,
          },
          root,
          root,
        )
      ).status,
    ).toBe("BLOCKED");
    expect(
      (
        await runCheck(
          {
            id: "missing",
            command: ["/definitely/missing/executable"],
            timeoutMs: 1000,
          },
          root,
          root,
        )
      ).status,
    ).toBe("BLOCKED");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("zero discovered tests and skipped tests do not pass", async () => {
  const root = mkdtempSync(join(tmpdir(), "agy-empty-"));
  try {
    const check: Check = {
      id: "empty",
      command: [process.execPath, "-e", 'console.log("0 pass")'],
      timeoutMs: 5000,
      testFormat: "bun",
    };
    expect((await runCheck(check, root, root)).status).toBe("FAIL");
    writeFileSync(
      join(root, "skipped.test.ts"),
      'import {test} from "bun:test";test.skip("not executed",()=>{});',
    );
    expect(
      (
        await runCheck(
          { ...check, command: [process.execPath, "test", "skipped.test.ts"] },
          root,
          root,
        )
      ).status,
    ).toBe("FAIL");
    writeFileSync(
      join(root, "real.test.ts"),
      'import {test,expect} from "bun:test";test("real assertion",()=>expect(2+2).toBe(4));',
    );
    const actual = await runCheck(
      { ...check, command: [process.execPath, "test", "real.test.ts"] },
      root,
      root,
    );
    expect(actual.status).toBe("PASS");
    expect(actual.passed).toBe(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("task contract cannot replace base checks or leave requirements uncovered", () => {
  const task = {
    sessionId: "s",
    title: "fix",
    checks: [
      {
        id: "behavior",
        command: ["bun", "test", "test.ts"],
        testFormat: "bun",
        timeoutMs: 5000,
      },
    ],
    requirements: [{ id: "R1", description: "behavior", checks: ["behavior"] }],
  };
  expect(validateTask(task).title).toBe("fix");
  expect(() =>
    validateTask({
      ...task,
      checks: [{ ...task.checks[0], id: "rust-clippy" }],
    }),
  ).toThrow();
  expect(() =>
    validateTask({
      ...task,
      requirements: [{ ...task.requirements[0], checks: ["nonexistent"] }],
    }),
  ).toThrow();
  expect(() =>
    validateTask({
      ...task,
      checks: [{ ...task.checks[0], testFormat: undefined }],
    }),
  ).toThrow();
});
