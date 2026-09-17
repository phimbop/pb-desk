import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dir, "../..");
const installScriptPath = resolve(root, "install.sh");

describe("Universal Cross-Platform Install Script (install.sh)", () => {
  test("install.sh exists and is executable", () => {
    expect(existsSync(installScriptPath)).toBe(true);
    const res = spawnSync("test", ["-x", installScriptPath]);
    expect(res.status).toBe(0);
  });

  test("install.sh passes bash syntax validation without errors", () => {
    const res = spawnSync("bash", ["-n", installScriptPath]);
    expect(res.status).toBe(0);
  });

  test("install.sh supports --help flag and prints usage guidelines", () => {
    const res = spawnSync("bash", [installScriptPath, "--help"]);
    expect(res.status).toBe(0);
    const output = res.stdout.toString();
    expect(output).toContain("Desktop App Installer");
    expect(output).toContain("--version");
    expect(output).toContain("--deb");
    expect(output).toContain("--appimage");
    expect(output).toContain("--dry-run");
    expect(output).toContain("--uninstall");
  });

  test("install.sh supports --dry-run on Linux with default AppImage", () => {
    const res = spawnSync("bash", [installScriptPath, "--dry-run"]);
    expect(res.status).toBe(0);
    const output = res.stdout.toString();
    expect(output).toContain("[INFO] Phát hiện hệ thống");
    expect(output).toContain("[DRY-RUN]");
  });

  test("install.sh supports --dry-run with --deb flag", () => {
    const res = spawnSync("bash", [installScriptPath, "--dry-run", "--deb"]);
    expect(res.status).toBe(0);
    const output = res.stdout.toString();
    expect(output).toContain("DEB");
  });

  test("install.sh supports --dry-run with --uninstall", () => {
    const res = spawnSync("bash", [installScriptPath, "--dry-run", "--uninstall"]);
    expect(res.status).toBe(0);
    const output = res.stdout.toString();
    expect(output).toContain("gỡ cài đặt PHIMBOP");
  });

  test("install.sh includes macOS handling (hdiutil, /Applications, xattr quarantine)", () => {
    const content = readFileSync(installScriptPath, "utf-8");
    expect(content).toContain("install_macos");
    expect(content).toContain("hdiutil attach");
    expect(content).toContain("hdiutil detach");
    expect(content).toContain("/Applications");
    expect(content).toContain("com.apple.quarantine");
  });

  test("install.sh includes Linux desktop entry generation with icon and metadata", () => {
    const content = readFileSync(installScriptPath, "utf-8");
    expect(content).toContain("install_linux");
    expect(content).toContain("[Desktop Entry]");
    expect(content).toContain("Name=${APP_NAME}");
    expect(content).toContain(".local/share/applications");
  });
});
