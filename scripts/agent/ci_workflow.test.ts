import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dir, "../..");
const workflowPath = resolve(root, ".github/workflows/release.yml");
const electronBuilderConfigPath = resolve(root, "electron-builder.json");

describe("GitHub Actions Multi-Platform CI/CD Workflow", () => {
  test("workflow file exists", () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  test("workflow YAML is syntax-valid and parseable", () => {
    const res = spawnSync("python3", [
      "-c",
      "import yaml, sys; yaml.safe_load(open(sys.argv[1]))",
      workflowPath,
    ]);
    expect(res.status).toBe(0);
  });

  test("workflow defines expected triggers (tags and manual dispatch)", () => {
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("tags:");
    expect(content).toMatch(/['"]v\*['"]/);
    expect(content).toContain("workflow_dispatch:");
  });

  test("workflow sets write permissions for GitHub releases", () => {
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("contents: write");
  });

  test("workflow covers all 3 platforms in matrix: macOS, Linux, Windows", () => {
    const content = readFileSync(workflowPath, "utf-8");
    // macOS
    expect(content).toContain("macos-latest");
    expect(content).toContain("aarch64-apple-darwin"); // Apple Silicon
    expect(content).toContain("x86_64-apple-darwin"); // Intel Mac
    // Linux
    expect(content).toContain("ubuntu-22.04");
    expect(content).toContain("x86_64-unknown-linux-gnu");
    // Windows
    expect(content).toContain("windows-latest");
    expect(content).toContain("x86_64-pc-windows-msvc");
  });

  test("workflow configures Bun runtime and Rust toolchain", () => {
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("oven-sh/setup-bun");
    expect(content).toContain("dtolnay/rust-toolchain");
    expect(content).toContain("bun install");
  });

  test("workflow installs Linux dependencies including WebKitGTK and mold linker", () => {
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("libwebkit2gtk-4.1-dev");
    expect(content).toContain("mold");
    expect(content).toContain("clang");
  });

  test("workflow uses electron-builder and uploads artifacts", () => {
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toContain("electron-builder");
    expect(content).toContain("actions/upload-artifact");
  });

  test("electron-builder.json is configured to produce all popular user formats", () => {
    expect(existsSync(electronBuilderConfigPath)).toBe(true);
    const config = JSON.parse(readFileSync(electronBuilderConfigPath, "utf-8"));
    expect(config.linux?.target).toContain("AppImage");
    expect(config.mac?.target).toContain("dmg");
    expect(config.win?.target).toContain("nsis");
    expect(config.productName).toBe("PHIMBOP");
  });

  test("release description lists popular user-facing formats", () => {
    const content = readFileSync(workflowPath, "utf-8");
    // Windows popular format (.exe NSIS)
    expect(content).toContain(".exe");
    // macOS popular format (.dmg)
    expect(content).toContain(".dmg");
    // Linux popular formats (.AppImage & .deb)
    expect(content).toContain(".AppImage");
    expect(content).toContain(".deb");
  });
});
