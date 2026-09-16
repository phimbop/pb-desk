import { test, expect } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { handleHook, dispatchHook } from "./hook";
import { install } from "./install";
import { stateDirectory } from "./core";

async function fixture(run: (root: string, state: string) => Promise<void>) {
  const directory = mkdtempSync(join(tmpdir(), "agy-hook-"));
  const root = join(directory, "workspace");
  mkdirSync(root);
  try {
    await run(root, join(directory, "state"));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
test("question-only session bypasses verification and produces native hook trace", () =>
  fixture(async (root, state) => {
    const input = {
      workspacePaths: [root],
      conversationId: "read-only",
      fullyIdle: true,
      terminationReason: "model_stop",
    };
    expect(await handleHook("pre", input, root, state)).toHaveProperty(
      "injectSteps",
    );
    expect(await handleHook("stop", input, root, state)).toEqual({
      decision: "allow",
    });
    const status = JSON.parse(
      readFileSync(
        join(stateDirectory(root, "read-only", state), "status.json"),
        "utf8",
      ),
    );
    expect(status.status).toBe("READ_ONLY");
  }));
test("edited code with no contract is blocked; retries end with honest BLOCKED status", () =>
  fixture(async (root, state) => {
    const input = {
      workspacePaths: [root],
      conversationId: "missing-task",
      fullyIdle: true,
      terminationReason: "model_stop",
    };
    await handleHook("pre", input, root, state);
    writeFileSync(join(root, "code.ts"), "export const changed = true;");
    for (let i = 0; i < 4; i++)
      expect(await handleHook("stop", input, root, state)).toHaveProperty(
        "decision",
        "continue",
      );
    expect(await handleHook("stop", input, root, state)).toHaveProperty(
      "decision",
      "allow",
    );
    const status = JSON.parse(
      readFileSync(
        join(stateDirectory(root, "missing-task", state), "status.json"),
        "utf8",
      ),
    );
    expect(status.status).toBe("BLOCKED");
  }));
test("declared implementation with zero edits still requires command evidence", () =>
  fixture(async (root, state) => {
    mkdirSync(join(root, ".agents"));
    writeFileSync(
      join(root, ".agents/task.json"),
      JSON.stringify({
        sessionId: "declared",
        title: "fix",
        requirements: [
          { id: "R1", description: "behavior", checks: ["behavior"] },
        ],
        checks: [
          {
            id: "behavior",
            command: ["bun", "test", "behavior.test.ts"],
            testFormat: "bun",
            timeoutMs: 5000,
          },
        ],
      }),
    );
    const input = {
      workspacePaths: [root],
      conversationId: "declared",
      fullyIdle: true,
      terminationReason: "model_stop",
    };
    await handleHook("pre", input, root, state);
    expect(await handleHook("stop", input, root, state)).toHaveProperty(
      "decision",
      "continue",
    );
  }));
test("background work and missing baseline cannot pass", () =>
  fixture(async (root, state) => {
    const input = {
      workspacePaths: [root],
      conversationId: "background",
      fullyIdle: false,
      terminationReason: "model_stop",
    };
    expect(await handleHook("stop", input, root, state)).toHaveProperty(
      "decision",
      "continue",
    );
    await handleHook("pre", input, root, state);
    expect(await handleHook("stop", input, root, state)).toHaveProperty(
      "decision",
      "continue",
    );
  }));
test("unrelated workspaces are untouched by globally registered hook", () =>
  fixture(async (root, state) => {
    expect(
      await handleHook(
        "stop",
        { workspacePaths: [tmpdir()], conversationId: "other" },
        root,
        state,
      ),
    ).toEqual({});
  }));
test("runtime errors stop without restarting agent", () =>
  fixture(async (root, state) => {
    const input = {
      workspacePaths: [root],
      conversationId: "error",
      fullyIdle: false,
      terminationReason: "error",
    };
    await handleHook("pre", input, root, state);
    expect(await handleHook("stop", input, root, state)).toHaveProperty(
      "decision",
      "allow",
    );
  }));
test("installer preserves unrelated hooks, is idempotent, and removes only its own entry", () =>
  fixture(async (root) => {
    const config = join(root, "hooks.json");
    const previous = { existing: { Stop: [{ command: "true" }] } };
    writeFileSync(config, JSON.stringify(previous));
    const key = install(root, config);
    install(root, config);
    const value = JSON.parse(readFileSync(config, "utf8"));
    expect(value.existing).toEqual(previous.existing);
    expect(Object.keys(value)).toHaveLength(2);
    expect(value[key].Stop[0].command).toContain("hook.ts");
    install(root, config, true);
    expect(JSON.parse(readFileSync(config, "utf8"))).toEqual(previous);
  }));

test("corrupt session state cannot create an infinite continuation loop", () =>
  fixture(async (root, state) => {
    const input = {
      workspacePaths: [root],
      conversationId: "corrupt",
      fullyIdle: true,
      terminationReason: "model_stop",
    };
    const directory = stateDirectory(root, "corrupt", state);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, "session.json"), "invalid json");
    for (let i = 0; i < 3; i++)
      expect(await dispatchHook("stop", input, root, state)).toHaveProperty(
        "decision",
        "continue",
      );
    expect(await dispatchHook("stop", input, root, state)).toHaveProperty(
      "decision",
      "allow",
    );
    expect(
      JSON.parse(readFileSync(join(directory, "status.json"), "utf8")).status,
    ).toBe("BLOCKED");
  }));
