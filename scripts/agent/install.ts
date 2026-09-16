import { existsSync, mkdirSync, readFileSync, copyFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { atomicJson, hash } from "./core";

export const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
export function install(root: string, config: string, remove = false) {
  const key = `pb-desk-evidence-${hash(root).slice(0, 12)}`;
  const existing = existsSync(config)
    ? JSON.parse(readFileSync(config, "utf8"))
    : {};
  if (!existing || typeof existing !== "object" || Array.isArray(existing))
    throw new Error("Existing hooks configuration is not an object");
  if (existsSync(config))
    copyFileSync(config, `${config}.backup-${Date.now()}`);
  if (remove) delete existing[key];
  else {
    const command = `${quote(process.execPath)} --no-env-file run ${quote(join(root, "scripts/agent/hook.ts"))}`;
    existing[key] = {
      PreInvocation: [
        { type: "command", command: `${command} pre`, timeout: 30 },
      ],
      Stop: [{ type: "command", command: `${command} stop`, timeout: 30 }],
    };
  }
  mkdirSync(resolve(config, ".."), { recursive: true });
  atomicJson(config, existing);
  return key;
}
if (import.meta.main) {
  const root = resolve(import.meta.dir, "../..");
  const global = process.argv.includes("--global");
  const config = global
    ? join(homedir(), ".gemini/config/hooks.json")
    : join(root, ".agents/hooks.json");
  const key = install(root, config, process.argv.includes("--remove"));
  console.log(
    JSON.stringify({
      config,
      key,
      action: process.argv.includes("--remove") ? "removed" : "installed",
      scope: root,
    }),
  );
}
