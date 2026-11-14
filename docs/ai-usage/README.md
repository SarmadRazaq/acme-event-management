# AI Usage Documentation

The assignment allows AI tools as long as their use is disclosed. This page lists everything the
AI usage policy asks for.

## Tools & models

| Item | Value |
|---|---|
| Tool | Claude Code (Anthropic), VS Code extension on Windows 11 |
| Model | Claude Opus 5.5 (`claude-opus-5-5`) |
| Mode | Agentic coding session: the assistant read the brief and rubric, wrote the spec and code, ran commands (tests, Docker, Playwright) and pushed to GitHub, with my approval at each step |
| Other AI tools | None |

## Configuration / settings

- Default Claude Code settings. Plan mode was used for the first step, so the plan could be reviewed before any code was written.
- The assistant could use the shell (git, `gh`, Docker, Python, npm) on my machine.
- No custom system prompts, fine-tuning or extra plugins were used for the code.

## Prompts

1. **Original prompt** (my own words):
   > Write an improved prompt Look up to Assignment-03-Corporate-Event-Management-FastAPI.pdf and
   > Assignment-03-Grading-Rubric-FastAPI (1).xlsx. You have to go through it thoroughly then Write the
   > specs for it and then start development. Tools are mentioned there but you have to use state
   > management etc at frontend and all the production environment setup. And the tools for backend
   > are mentioned there too. You have to do incremntal pushed to github so create a repo and do it

2. **Improved prompt**: the assistant rewrote the request into a structured prompt, which then
   guided the work: [improved-prompt.md](improved-prompt.md).

3. **Clarifying answers** the assistant asked for during planning:
   - Repository name → `acme-event-management` (public, `main` as the stable branch)
   - Frontend stack → React + Vite + TypeScript, TanStack Query + Zustand
   - Merge strategy → one GitHub pull request per feature branch

## Chat history

The complete conversation is exported from Claude Code with the `/export` command and submitted
alongside this repository, as the policy requires. (The raw session log also lives under
`~/.claude/projects/` on the machine where the work was done.)

## What I verified and understand

- All 89 backend tests and the end-to-end browser test were run and pass. CI runs them again on
  every pull request.
- I reviewed every file. The design decisions are explained in the
  [README](../../README.md#design-decisions), and the request flow is described under
  "How the files work together".
- The AI found and fixed real problems during development, such as a URL race in the
  frontend filters and a gunicorn permission issue in Docker. The commits record these fixes.
