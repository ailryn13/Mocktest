---
description: "Use when changing backend Java services, frontend app behavior, Docker/compose setup, or project scripts in Mocktest-main. Enforces safe, minimal, reproducible edits and verification steps for this repository."
name: "Mocktest Workflow Guardrails"
---
# Mocktest Workflow Guardrails

- Keep changes minimal and task-focused. Avoid broad refactors unless explicitly requested.
- Prefer fixing root causes over adding temporary workarounds.
- Preserve existing API contracts and request/response shapes unless a contract change is explicitly requested.
- For backend Java changes, keep compatibility with Spring Boot 3.2 and existing service/repository patterns.
- For operational commands and scripts in this repo, prefer PowerShell-compatible commands and existing project scripts.
- Prefer project scripts for local orchestration when relevant:
  - `./start-app.ps1`
  - `./stop-app.ps1`
  - `backend/start-backend.ps1`
- For infra/runtime changes, keep Docker Compose behavior consistent with existing files (`docker-compose.yml`, `backend/docker-compose.yml`, `docker-compose.prod.yml`).
- Add or update tests only where behavior changed. Do not add unrelated test churn.
- Validate the smallest meaningful scope after edits:
  - Backend: run targeted build/test commands first, then broader checks if needed.
  - Frontend: run targeted lint/test/build relevant to changed area.
- When blocked by missing environment/services, state what was attempted, what failed, and the exact next command to continue.
- Do not commit secrets, tokens, passwords, or environment-specific credentials.
