# NHN AI Game Competition — Requirements & Rules

> Source of truth for what we must submit. Derived from the official competition notice.
> **Deadline: ~2026-08-10 (3 weeks from project start, 2026-07-20). Verify exact date/time on the official page.**

## Competition theme

"Many people use AI. We're looking for **directors of AI** — people who design AI's next step."
→ How we orchestrate AI tools/agents is judged alongside the game itself.

## Required deliverables (5)

### 1. Playable build + full source code (GitHub)
Judges must be able to play directly. Provide at least one of:
- **Web build** (our chosen path): deployed via GitHub Pages etc. — playable in-browser from a single link click.
- Mobile app: APK or test-distribution link (TestFlight, Play internal testing, etc.).

Rules:
- Must run **without any paid license** on the judge's side.
- **No PC executables** (.exe etc.) — rejected for security reasons.
- **Full source code in the same repository, with commit history preserved.**
- Public repo recommended. If private, invite the review account: `dl_gameai_reviewer@nhn.com`.

### 2. Gameplay video (YouTube)
- **30–60 seconds**, centered on actual gameplay footage.
- **No AI manipulation/synthesis** of the video, no use of others' footage — raw real play only.
- Uploaded as public or unlisted (link-shareable).

### 3. Game intro & guide document (PDF)
Must include:
- Game title + one-line description
- How to play: goal, controls, end condition
- How to run: install/launch instructions
- Play link or install method (web URL / APK / test link)
- Gameplay video link

### 4. AI utilization technical document (PDF)
Must include:
- Technical explanation of AI usage (e.g., architecture, key prompts and instructions given to AI)
- **External asset / open-source attributions** (sources)

### 5. Team roles document (PDF)
Required only for teams of 2+ (applies to us).
- Each member's name / role (planning, dev, art, AI utilization, etc.)
- What each member **actually implemented**
- Collaboration / division-of-labor method (if applicable)

## General rules & cautions

- Plagiarism of others' work/ideas: full responsibility on the submitter; selection can be revoked.
- **External assets (images, sound, etc.): source AND license must be declared in the AI utilization doc.** (Mandatory.)
- AI tool use is allowed and encouraged, but **tools used and how they were used must be documented.**
- Submission links (GitHub, YouTube) must remain accessible **until judging ends**.
- **No changes after the submission deadline.**
- Submission includes consent to personal-data collection/use and copyright terms.

## Implications for this repo (our working notes)

- `main` history is a deliverable — never rewrite/force-push it.
- The GitHub Pages URL and YouTube link go into deliverable #3; keep them stable.
- `assets-manifest.json` (tool, prompt, license per asset) feeds deliverable #4's attribution section.
- Agent-attributed commits/PRs (`[AGENT: ...]`) are evidence for deliverable #4.
- Week 3 is reserved for deliverables #2–#5 + polish; the game must be feature-complete by then.
