import { test, expect } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  chmodSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseAgentEnvelope, runAgent, verificationCommand } from "./run";
import { runCheck } from "./core";

test("driver rejects malformed or unsuccessful AGY output", () => {
  expect(() => parseAgentEnvelope("not json")).toThrow();
  expect(() => parseAgentEnvelope('{"status":"SUCCESS"}')).toThrow();
  expect(() =>
    parseAgentEnvelope('{"status":"ERROR","conversation_id":"x"}'),
  ).toThrow();
});

test("verifier subprocess does not silently load workspace dotenv", async () => {
  const root = mkdtempSync(join(tmpdir(), "agy-env-"));
  try {
    mkdirSync(join(root, "scripts/agent"), { recursive: true });
    writeFileSync(join(root, ".env"), "PB_HARNESS_ENV_SENTINEL=unexpected\n");
    writeFileSync(
      join(root, "scripts/agent/verify.ts"),
      "process.exit(process.env.PB_HARNESS_ENV_SENTINEL ? 9 : 0);",
    );
    const result = await runCheck(
      {
        id: "env",
        command: verificationCommand(root, "test"),
        timeoutMs: 5000,
      },
      root,
      join(root, "logs"),
    );
    expect(result.exitCode).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("CLI SUCCESS and a false test-pass claim cannot make the driver succeed", async () => {
  const directory = mkdtempSync(join(tmpdir(), "agy-driver-"));
  const root = join(directory, "root");
  mkdirSync(root);
  const fake = join(directory, "fake-agy");
  writeFileSync(
    fake,
    '#!/bin/sh\nprintf \'{"status":"SUCCESS","conversation_id":"fake-session","response":"All tests passed, task complete"}\\n\'\n',
  );
  chmodSync(fake, 0o700);
  try {
    const result = await runAgent(
      "Fix missing behavior",
      root,
      "test",
      2,
      fake,
      join(directory, "state"),
    );
    expect(result.status).toBe("BLOCKED");
    expect(result.attempts).toBe(2);
    expect(result.detail).toContain("Task needs");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
