# Commit Note - Add CI and v0.3 Voice Plan

- **Timestamp:** 2026-06-16 11:22:59 CST
- **Branch:** main
- **Commit message:** Add CI and v0.3 voice plan
- **Commit hash:** Pending until commit is created
- **Scope:** Add GitHub Actions quality checks and document the v0.3 real-run voice capability roadmap.

## Summary

- Added a GitHub Actions CI workflow for push and pull request checks on `main`.
- Documented the v0.3 product plan for hardening real running voice interactions.
- Added a v0.3 development task list with milestones, acceptance criteria, and testing scope.
- Updated the README with a CI badge, quality gate details, and v0.3 planning document links.

## Changed Files

| File | Change | Notes |
|---|---|---|
| `.github/workflows/ci.yml` | Added | Runs install, typecheck, and unit tests in GitHub Actions. |
| `README.md` | Changed | Adds CI badge, quality gate commands, and v0.3 planning entry points. |
| `prd/P001-跑步聊天/09-MVP-v0.3语音实跑能力规划.md` | Added | Defines v0.3 positioning, goals, scope, metrics, product flow, and multi-role review. |
| `prd/P001-跑步聊天/10-MVP-v0.3开发任务清单.md` | Added | Splits v0.3 into milestones and actionable engineering/QA tasks. |
| `commit-notes/2026-06-16_11-22-59_add-ci-and-v03-voice-plan.md` | Added | Records this commit scope and validation. |

## Behavior / User Impact

- Future pushes and pull requests can automatically verify TypeScript type checks and unit tests.
- Product and engineering now have a concrete v0.3 plan focused on real-run voice reliability rather than expanding into unrelated social features.
- GitHub readers can find the CI workflow and v0.3 docs from the repository README.

## Validation

- `npm run typecheck` passed across API, mobile, and shared workspaces.
- `npm test` passed across API and mobile workspaces: 11 tests passed, 0 failed.
- `git diff --check` passed.

## Follow-ups

- After pushing, verify the GitHub Actions run on `main`.
- Decide whether to add a separate manual or scheduled Playwright E2E workflow.
