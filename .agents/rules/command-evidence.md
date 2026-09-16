---
trigger: always_on
---

# Verify work in the current AGY session

For a coding task or an explicit verification request, read
`docs/agent-harness/README.md` for the task contract schema before proceeding.

1. Before implementation, create or update `.agents/task.json` for the actual
   requested task. Map every requirement to executable acceptance checks.
   Use the session ID supplied by the driver or hook. In a direct AGY session,
   use the conversation ID if available; otherwise generate a unique task-run ID
   and keep it for this task. A generated ID identifies the task, not an AGY
   conversation. A verification-only request may reuse the existing contract
   after confirming its title and requirements match the requested work.
2. After the final edit, execute in this workspace:
   `bun --no-env-file run agent:verify <sessionId>`
   Set the shell tool's working directory explicitly to
   `/home/arch/Project/test/pb-desk`; its default can differ from the AGY
   workspace. If the tool has no working-directory argument, use
   `cd /home/arch/Project/test/pb-desk && bun --no-env-file run agent:verify <sessionId>`.
   Replace `<sessionId>` with the exact value in `.agents/task.json`.
   This command runs checks directly; it does not launch another coding agent.
   If a driver explicitly manages verification, let that driver run this step.
3. Wait for the process to finish, including polling any background command.
   Inspect its exit code, JSON status and evidence logs. Fix relevant failures
   and rerun verification after further edits. If blocked, report the failed
   command, observed error and remaining work.
4. Report the task scope, actual verification status and evidence path.
   Claim passing checks only after exit 0 and a PASS result for the current
   source. State any requirement or runtime behavior the checks do not cover.

Use `agent:verify` for checks inside the current session. `agent:run "task"`
is the separate coding driver and must not be used as a verification command
inside AGY. Preserve test strength and generated evidence; a missing contract,
unfinished command or previous PASS is not evidence for the current task.

Questions without implementation or a verification request need no checks.
This is an agent instruction, not an enforced native Stop hook.
