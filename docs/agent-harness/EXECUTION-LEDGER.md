# AGY verification harness execution ledger

## Final outcome

**VERIFIED: independent AGY driver and command evidence runner.**
**Native hooks: NOT ENABLED; execution could not be confirmed on AGY 1.2.3.**

User authorized an implementation to prevent unsupported completion claims. The
native hook probes did not execute despite discovery, so the shipped entry point
is `bun --no-env-file run agent:run "task"`. It runs AGY and verification as separate
processes and derives its final status from command evidence. Direct `agy` is not
claimed to be protected. Documentation explains the fallback and its limits.

Workspace has no Git. Existing application files were not part of this change.
Other application changes occurred between sessions; final checks use current files.
Original instruction/package files were backed up in `/tmp/pb-desk-harness-original`.

## Requirements and coverage

| ID | Requirement | Implementation / evidence | Result |
|---|---|---|---|
| R1 | Real command outcomes; missing, stale, altered, failed and empty-test evidence cannot pass | core.ts, verify.ts; process and receipt evals | PASS |
| R2 | Requirements map to executable checks; base gates cannot be replaced | validateTask; contract evals | PASS |
| R3 | Enforce verification independently of model prose | run.ts; fake AGY and live Gemini negative probe | PASS via driver |
| R3a | Native Stop lifecycle and scoping | hook.ts; protocol evals pass; CLI execution probes not observed | NOT ENABLED |
| R4 | Preserve unrelated configuration, support removal | install.ts; idempotence/removal eval; trial plugin removed; superpowers restored | PASS |
| R5 | Fresh release checks, instructions, audit and graph sync | Records below; README; AGENTS.md; CodeGraph sync | PASS with existing frontend warnings |

## Baseline and recovery

- Initial RED: missing core module, exit 1, before implementation.
- Subprocess missing-executable eval exposed FAIL vs BLOCKED classification; fixed.
- First full run failed SurrealDB integration under the naive Bun wrapper.
- Cause: Bun imported the web `.env` DB_ENDPOINT (WebSocket) into the HTTP Rust client.
- Fix: disable automatic dotenv loading at outer harness entry and nested verifier;
  preserve already exported shell variables. Frontend commands keep their own env loading.
- Added a real subprocess dotenv regression test. No application test was weakened or skipped.
- Native workspace/global/plugin probes and interactive probe produced AGY responses,
  but no hook ingress. `/hooks` discovery alone was not accepted as success.
- Temporarily disabling malformed superpowers hooks did not fix native execution;
  superpowers was restored. All temporary hook registrations were removed.

## Final command evidence

Evidence: `/home/arch/.local/state/pb-desk-agent/09666fd18a889207ab7b/c84d34bfdaa5807abb996f89/evidence.json`
Finished: `2026-09-16T00:21:43.313Z`
Source snapshot: `7630c7e969e9824d6f274f179e4b2819ad2ffa3aac495a7dab1cad89537f29b1`

| Check | Command | Exit | Outcome |
|---|---|---:|---|
| rust-clippy | `cargo clippy --workspace -- -D warnings` | 0 | PASS |
| rust-tests | `cargo test --workspace` | 0 | PASS (9 tests, 0 skipped) |
| frontend-check | `bun run check` | 0 | PASS |
| frontend-build | `bun run build` | 0 | PASS |
| harness-types | `bun run agent:typecheck` | 0 | PASS |
| harness-evals | `bun test scripts/agent` | 0 | PASS (20 tests, 0 skipped) |
| harness-acceptance | `bun test scripts/agent` | 0 | PASS (20 tests, 0 skipped) |

Frontend check: 0 errors, 66 existing warnings. Build emits existing framework warnings.
Receipt validation independently confirmed every command, log hash, task hash and current
source snapshot. No skipped/ignored tests. Graph sync completed successfully.

## Live probe and audit

Persistent audit directory:
`/home/arch/.local/state/pb-desk-agent/install-audit-2026-09-16/`

Live Gemini 3.8 Flash probe: AGY returned SUCCESS with PROBE_RESPONSE and no task
contract. The independent driver returned BLOCKED, exit semantics verified by the
probe script. Synthetic eval also checks an explicit false “all tests passed” response.
This is an integration smoke test, not a model reliability benchmark.

## Limits

PASS covers configured checks. Completeness of requirements and strength of acceptance
tests still need review. Local shell access is not a security boundary against deliberate
harness/evidence tampering. Native hooks remain optional experimental files, unregistered.
Use one editing session per workspace. See README for operating instructions and environment.

This operational ledger is explicitly excluded from source hashing so final audit recording
does not invalidate the code verification it describes.
