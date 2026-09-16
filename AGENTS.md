# AGENTS.md — Engineering Standards & Agent Operational Protocol

This document governs all agent operations in `pb-desk`. Every agent must strictly adhere to these protocols, tool workflows, and architectural patterns on every task.

## AGY command evidence protocol

For implementation tasks, read `docs/agent-harness/README.md` before edits.
The verified entry point is `bun --no-env-file run agent:run "task"`: its driver supplies a
session ID and runs verification independently after each response. In driver
mode, write the task contract and implement; let the driver invoke verification.
Native AGY hooks are experimental on this machine; direct `agy` has not been
confirmed to enforce this gate.
When the AGY hook supplies a session ID, create `.agents/task.json` for that
session with every requested requirement mapped to executable acceptance checks.
After the final edit, run `bun --no-env-file run agent:verify <sessionId>` and inspect its actual
exit status and logs. Report PASS, FAIL, NOT_RUN, STALE, RUNNING or BLOCKED accurately.
Never treat AGY's SUCCESS envelope, your own summary, a pending command, or a prior
source snapshot as proof that tests passed. Do not edit evidence, weaken tests,
or disable hooks to bypass a failure. At the retry limit report BLOCKED and the
remaining work. Passing configured checks does not establish complete requirement
coverage or UI/backend integration; use task-specific behavior tests and review.
Question-only sessions without edits do not need the implementation gates.

---

## 1. Project Architecture & Rust Backend (Zed-Style Multi-Crate)

To ensure **ultra-fast incremental compilation**, high maintainability, and clean separation of concerns, the backend is strictly modeled after the **Zed Editor modular architecture** (`zeditor` multi-crate Cargo workspace pattern).

### 1.1 The Zed Compilation Acceleration Strategy
- **Fine-Grained Crates**: Divide code into small, focused, independently-compilable crates. Touching a leaf crate re-links only that crate, avoiding massive whole-project recompiles.
- **Core Decoupled from Tauri & UI**: Pure domain logic, business rules, and state management live in crates that **never import `tauri`**. Crate tests run in fractions of a second without compiling Tauri dependencies or WebViews.
- **Thin Tauri Adapter**: `src-tauri` acts only as a thin coordination shell for window management, capability wiring, and forwarding IPC commands to inner crates.
- **Centralized Workspace Dependencies**: All third-party dependencies are declared in the root `[workspace.dependencies]`. Child crates inherit via `{ workspace = true }`, guaranteeing unified crate versions across the compilation graph.
- **Fast Linker (`mold`)**: Configured in `.cargo/config.toml` using `clang` and `-fuse-ld=mold` with `split-debuginfo=unpacked` on Linux x86_64, reducing link latency by up to 10x.

### 1.2 Target Directory Hierarchy
```text
pb-desk/
├── .cargo/
│   └── config.toml                  # Fast linker (mold) & compiler optimizations
├── .codegraph/                      # CodeGraph local SQLite index (do not edit directly)
├── crates/                          # Zed-style modular Rust crates
│   ├── pb_core/                     # Pure domain entities, traits, error types (NO tauri dependency)
│   ├── pb_storage/                  # Persistence layer (SQLite, migrations, local key-value storage)
│   ├── pb_service/                  # Business logic, background worker actors, async job processing
│   └── pb_ipc/                      # Shared DTOs, request/response models, serialization schemas
├── src-tauri/                       # Thin Tauri v2 Desktop Wrapper
│   ├── capabilities/                # Granular permissions (no wildcards)
│   ├── src/
│   │   ├── lib.rs                   # App builder & plugin registration
│   │   └── main.rs                  # Desktop entry point
│   ├── tauri.conf.json              # Window config, security policy, removeUnusedCommands
│   └── Cargo.toml                   # Crate referencing workspace crates
├── src/                             # Svelte 5 / SvelteKit Frontend
│   ├── lib/                         # Reusable UI components & stores
│   └── routes/                      # Application routes and views
├── Cargo.toml                       # Root Cargo Workspace definition
├── package.json                     # Frontend dependencies & package manager scripts
└── AGENTS.md                        # This operational specification
```

### 1.3 Mandatory Runtime & Package Manager: Bun & Bunx Only
All agents must strictly use `bun` and `bunx` for all JavaScript/TypeScript execution, package management, CLI tool invocations, and script runs:
- **Package Management**: Always use `bun install`, `bun add`, `bun remove` (NEVER `npm`, `pnpm`, or `yarn`).
- **Script Execution**: Always use `bun run <script>` (e.g. `bun run dev`, `bun run build`, `bun run check`).
- **One-off / CLI Invocations**: Always use `bunx <package>` (e.g. `bunx @tauri-apps/cli dev`, `bunx @tauri-apps/cli icon`) or `bun run tauri <command>` (NEVER `npx`).
- **Runtime Execution**: Always execute TS/JS scripts using `bun run <script.ts>` or `bun <file.ts>` (NEVER `node`).
- **Complete Prohibition**: `node`, `npm`, `pnpm`, and `npx` are strictly banned across all workflows, commands, and documentation.


---

## 2. Mandatory Tooling Protocol for Every New Task

Every agent assigned a task must execute the following **5-Phase Lifecycle**:

```text
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  Phase 1: RECALL│ ──► │ Phase 2: EXPLORE │ ──► │ Phase 3: IMPLEMENT   │
│  (agentmemory)  │     │   (codegraph)    │     │ (Zed Rust + Svelte5) │
└─────────────────┘     └──────────────────┘     └──────────────────────┘
                                                            │
┌─────────────────┐     ┌──────────────────┐               │
│  Phase 5: RETAIN│ ◄── │  Phase 4: VERIFY │ ◄─────────────┘
│ (mem_save/sync) │     │ (clippy/checks)  │
└─────────────────┘     └──────────────────┘
```

---

### Phase 1: Context & Lesson Recall (`agentmemory`)
Before writing or modifying any code, query past decisions, bugs, and established patterns to avoid regressions.

- **MCP Tool**: `agentmemory -> memory_recall` or `memory_smart_search`
- **CLI Alternative**: `agentmemory status` / REST endpoint at `http://localhost:3111`
- **Action**:
  ```json
  // Call agentmemory -> memory_recall
  {
    "query": "<task-keywords-or-domain-area>",
    "limit": 10,
    "format": "compact"
  }
  ```
- **Completion Criterion**: Review relevant past observations, architectural decisions, and known pitfalls before designing changes.

---

### Phase 2: Codebase Graph Exploration (`codegraph`)
Never blindly grep or read raw files across the workspace. Use CodeGraph for AST-aware symbol tracing, call hierarchy navigation, and impact analysis.

- **MCP Tool**: `codegraph -> codegraph_explore`
- **Shell Alternative**: `codegraph explore "<symbol or concept>"`
- **Essential Commands**:
  - Search symbols: `codegraph query "<name>"`
  - Explore call graph: `codegraph explore "<symbol>"`
  - Analyze callers/callees: `codegraph callers "<symbol>"` / `codegraph callees "<symbol>"`
  - Impact check before refactoring: `codegraph impact "<symbol>"`
- **Completion Criterion**: Locate precise definitions and dependent call sites through the graph before touching any file.

---

### Phase 3: Production Implementation Standards

#### A. Rust Backend & Tauri v2 Architecture (`tauri` Skill)
1. **Mandatory Tauri Skill Usage**:
   - Always consult the `tauri` skill (`~/.gemini/config/skills/tauri/SKILL.md`) and its specialized references before modifying capabilities, IPC, runtime state, or build profiles.
2. **Capability Boundary**:
   - Every Tauri v2 command and plugin permission must be declared with granular scopes in `src-tauri/capabilities/default.json`.
   - Never use wildcard permissions in production.
3. **Non-Blocking Async**:
   - Heavy synchronous compute or blocking filesystem I/O must run in `tauri::async_runtime::spawn_blocking`.
   - Never block the Tokio worker thread inside an async command.
4. **Lock & State Management**:
   - Always drop `MutexGuard` / `RwLockGuard` before encountering `.await`. Holding locks across await points causes deadlocks and pauses execution.
   - Do not wrap `tauri::State` in redundant `Arc`.
5. **IPC Selection**:
   - **JSON invoke**: For standard control commands and lightweight DTOs (< 100 KB).
   - **Channel (`tauri::ipc::Channel`)**: For progress streaming, real-time events, and chunked updates.
   - **Custom Asset Protocol / Binary Response**: For media, images, or large binary payloads.
6. **Dead-Code Elimination**:
   - Ensure `"removeUnusedCommands": true` is enabled in `src-tauri/tauri.conf.json`.

#### B. Frontend Standards & Svelte MCP (`svelte` MCP)
1. **Mandatory Svelte MCP Usage**:
   - Whenever working on or diagnosing `.svelte` components or `.svelte.ts` files, **always use the `svelte` MCP tools**:
     - `svelte -> get-documentation` / `list-sections`: Look up official Svelte 5 APIs, syntax, and lifecycle semantics.
     - `svelte -> svelte-autofixer`: Run before and after editing Svelte files to catch rune misuse, reactivity bugs, and syntax errors.
2. **Svelte 5 Runes Only**:
   - State: Use `$state(...)` instead of `let x = ...`.
   - Derived values: Use `$derived(...)` or `$derived.by(...)` instead of `$: x = ...`.
   - Component props: Use `$props()` instead of `export let ...`.
   - Side effects: Use `$effect(...)` sparingly for DOM synchronization.
3. **Strictly Bun & Bunx Runtime**:
   - Always run and manage frontend code using `bun` and `bunx` exclusively (`bun install`, `bun run dev`, `bun run build`, `bunx @tauri-apps/cli`).
   - Completely avoid and never execute `node`, `npm`, `pnpm`, or `npx`.

#### C. Authoritative Library Research (`context7` MCP)
1. **Mandatory Documentation Lookup**:
   - Whenever dealing with framework configurations (e.g. Vite, Tailwind CSS v4, Vidstack, adapter-static) or troubleshooting build/CSS/runtime issues, **always use `context7`**:
     - `context7 -> resolve-library-id`: Resolve the package name (e.g. `tailwindcss`, `vite`, `tauri`).
     - `context7 -> query-docs`: Query official, version-matched documentation and best practices to ensure production-grade configuration and avoid trial-and-error guessing.

#### D. UI Parity Mandate (`pbv5`)
1. **Always Copy UI Directly From `/home/arch/Project/test/pbv5`**:
   - All UI layouts, components, card designs, themes, responsive classes, and visual interactions must be copied 1:1 from `pbv5`.
   - Do not invent divergent designs, substitute Tailwind utilities, or alter established visual contracts. Adapt only client-side data binding and desktop IPC while keeping 100% visual parity.

---

### Phase 4: Verification & Quality Gates
Assertions without verification are prohibited. Run all relevant checks before marking any task complete:

```bash
# 1. Rust code check and clippy warnings
cargo clippy --workspace -- -D warnings

# 2. Workspace unit and integration tests
cargo test --workspace

# 3. Frontend type and rune checks (strictly bun)
bun run check

# 4. Frontend static build verification (strictly bun)
bun run build
```

---

### Phase 5: Knowledge Retention & Graph Synchronization
Once implementation passes all verification gates:

1. **Save New Learnings (`agentmemory`)**:
   - If an architectural decision, tricky bug, or reusable pattern was discovered, record it:
   ```json
   // agentmemory -> memory_save
   {
     "content": "<Detailed insight, decision, or architectural reason>",
     "type": "architecture | pattern | bug | workflow",
     "concepts": "pb-desk, rust, tauri, svelte5",
     "files": "path/to/modified/file.rs"
   }
   ```
   - For hard-won bug fixes: use `memory_lesson_save` (problem, root cause, fix, prevention).

2. **Sync CodeGraph Index (`codegraph`)**:
   - Run `codegraph sync .` in the project root to ensure the local graph reflects newly added or edited symbols.

---

## 3. Quick Reference: Agent Command Cheat Sheet

| Intent | Primary Tool | Fallback / Shell Command |
|---|---|---|
| **Recall past context** | `agentmemory: memory_recall` | `curl -s http://localhost:3111/api/v1/memories` |
| **Search codebase graph** | `codegraph: codegraph_explore` | `codegraph explore "<query>"` |
| **Symbol impact check** | `codegraph: impact` | `codegraph impact "<symbol>"` |
| **Svelte documentation** | `svelte: get-documentation` | Svelte MCP schema |
| **Fix Svelte runes/syntax**| `svelte: svelte-autofixer` | Svelte MCP schema |
| **Tauri best practices** | `tauri` skill instructions | Read `~/.gemini/config/skills/tauri/SKILL.md` |
| **Library & ecosystem docs**| `context7: query-docs` | `context7: resolve-library-id` |
| **Reference UI 1:1 Parity** | Local clone from `pbv5` | Direct copy from `/home/arch/Project/test/pbv5` |
| **Install packages (Strictly Bun)** | Shell `bun install` | `bun install` (Never npm/pnpm/yarn) |
| **Run scripts / dev (Strictly Bun)** | Shell `bun run` | `bun run dev` / `bun run build` |
| **Check frontend (Strictly Bun)** | Shell `bun run check` | `bun run check` (Never npx) |
| **CLI / Tauri tools (Strictly Bunx)** | Shell `bunx` | `bunx @tauri-apps/cli <cmd>` (Never npx) |
| **Check compilation** | Shell `cargo check` | `cargo check --workspace` |
| **Lint Rust** | Shell `cargo clippy` | `cargo clippy --workspace -- -D warnings` |
| **Sync CodeGraph index** | Shell `codegraph sync` | `codegraph sync .` |
| **Save permanent memory**| `agentmemory: memory_save` | `agentmemory` MCP tool |
