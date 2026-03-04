---
description: "Show current plan status. Reads .planning/PROJECT.md and ROADMAP.md if they exist."
---

Check whether `.planning/PROJECT.md` and `.planning/ROADMAP.md` exist in the current directory.

**If neither file exists**, respond with:

```
No plan found. Run /plan <task> to generate one.
```

**If one or both files exist**, read them and produce a formatted status report:

---

## Status report format

```
## Plan Status

**Project:** <project name from PROJECT.md h1>
**Goal:** <one-sentence summary of the Goal section>

**Tech Stack:**
<bullet list from Tech Stack section>

**Roadmap:** <N> phases total

<For each phase, one line:>
  Phase 1 — <Name>: <✅ complete | 🔄 in progress | ⬜ not started>
    Deliverables: X/3 complete

**Next up:**
<List the first incomplete deliverable(s) from the earliest incomplete phase>
```

Rules for determining phase status:
- A deliverable is **complete** if it contains ✅ anywhere in the line
- A phase is **complete** if all its deliverables are complete
- A phase is **in progress** if some (but not all) deliverables are complete
- A phase is **not started** if no deliverables are complete

If the files are malformed or can't be parsed, say so and show what you found.
