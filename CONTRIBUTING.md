# Contributing

## 0. Check your git identity first (every machine, every time)

This project must be attributed to **personal** GitHub accounts, never corporate ones. Before your
first commit on any machine, set your identity **locally in this repo** (do not touch global config):

```bash
git config user.name  "<your name>"
git config user.email "<the email tied to your personal github.com account>"
git config user.email   # verify before committing
```

After your first push, open the commit on github.com and confirm it's attributed to your personal
account. If it shows a corporate account or "unknown", fix the local `user.email` and amend before
continuing.

## Branching & PRs

- **Trunk-based.** `main` is always deployable — every push to `main` deploys to GitHub Pages.
- Do work on **feature branches** and merge via **pull request**.
- The super-pipeline harness will later drive its own worktree/branch/PR flow with automated
  squash-merges, so `main` is kept unprotected (or only minimally protected) for now.

## Commit history is a competition deliverable

The commit history is graded. Therefore:

- **Never force-push `main`.** Never rewrite, rebase, or reset published `main` history.
- Keep commits meaningful and attributed to the correct personal account.

## Before opening a PR

```bash
npm run build   # must pass (type-check + build) before requesting review
```
