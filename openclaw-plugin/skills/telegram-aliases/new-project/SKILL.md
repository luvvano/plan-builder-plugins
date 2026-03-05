---
name: gsd_new_project
description: Initialize a new GSD spec-driven development project. Researches the domain, synthesizes findings, and produces a complete roadmap.
user-invocable: true
os: ["darwin", "linux"]
---

# /gsd:new-project

Initialize a new GSD spec-driven development project.

## Step 1: Initialize

Run init to get project context:

```bash
INIT=$(node "$GSD_TOOLS_PATH" init new-project)
```

Parse JSON output for: `researcher_model`, `synthesizer_model`, `roadmapper_model`, `commit_docs`, `project_exists`, `has_codebase_map`, `planning_exists`, `has_existing_code`, `has_package_file`, `is_brownfield`, `needs_codebase_map`, `has_git`, `project_path`.

If `project_exists` is true: inform the user that a project already exists and stop. Do NOT overwrite an existing project.

If `has_git` is false: initialize git with `git init`.

## Step 2: Gather Project Idea

Read the user's input from the current conversation. The user should have provided a project description, idea document, or pasted text explaining what they want to build.

If no idea is provided in the conversation, ask the user to describe their project. Do NOT use AskUserQuestion — simply state what you need in the chat and wait for the user's next message.

**Auto mode detection:**

Check if `--auto` flag is present in the arguments.

If auto mode:
- An idea document is required (file reference or pasted text). If missing, error with usage instructions.
- Skip deep questioning — extract project context from the provided document.
- Config: YOLO mode is implicit. Ask depth/git/agents settings upfront.
- Run all subsequent steps automatically with smart defaults.

If interactive mode:
- Open the conversation with "What do you want to build?"
- Follow threads, probe for specifics, challenge vagueness.
- Use the deep questioning approach to fully understand the project before proceeding.
- When ready, confirm with the user before creating PROJECT.md.

## Step 3: Research & Synthesize

Follow the research and synthesis stage:
@./stage-setup.md

Pass the project idea text and init context to the stage. This stage:
1. Executes 4 research passes (STACK, FEATURES, ARCHITECTURE, PITFALLS) using the embedded researcher role
2. Synthesizes all research into a unified SUMMARY.md using the embedded synthesizer role
3. Writes PROJECT.md and REQUIREMENTS.md from the synthesized findings

**Auto mode:** Research always runs. Skip research decision question.
**Interactive mode:** Ask the user whether to research first or skip to requirements.

## Step 4: Build Roadmap

Follow the roadmap stage:
@./stage-roadmap.md

Pass the synthesized research output and project context to the stage. This stage:
1. Reads PROJECT.md and REQUIREMENTS.md from Stage 3
2. Derives phases from requirements (not imposed structure)
3. Maps every v1 requirement to exactly one phase
4. Derives 2-5 success criteria per phase (observable user behaviors)
5. Writes ROADMAP.md, STATE.md, and config.json
6. Updates REQUIREMENTS.md traceability section

**Auto mode:** Auto-approve the roadmap.
**Interactive mode:** Present the roadmap for user approval. Loop on revisions until approved.

## Step 5: Commit

If `commit_docs` is true:
```bash
node "$GSD_TOOLS_PATH" commit "docs: initialize GSD project with roadmap and requirements" --files ".planning/"
```

## Step 5.5: Register Project

Register the project in the global GSD project registry (`~/.gsd/projects.json`):

```bash
node "$GSD_TOOLS_PATH" project-list add .
```

This allows `/gsd:project-list` to track all projects the user has initialized with GSD.

## Step 6: Summary

Report to the user:
- Project initialized at `.planning/`
- Key decisions from research
- Phase count and roadmap overview
- Next step: `/gsd:plan-phase 1` to start planning Phase 1

**Auto mode:** After summary, auto-advance to `/gsd:discuss-phase 1 --auto`.
**Interactive mode:** Present next steps and available commands.
