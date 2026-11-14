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
- No custom system prompts or fine-tuning. For the frontend UI work, these agent skills were installed:
  `find-skills`, `web-design-guidelines` (Vercel) and `shadcn`. They provide design and component guidance only.

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

4. **Follow-up prompts** after the backend, frontend, Docker and CI were finished, in order
   (my wording, typos kept):
   1. > give me the commands to run it
   2. > /find-skills for UI improvements

      The assistant suggested two design skills (`web-design-guidelines`, `shadcn`).
   3. > yes

      This installed them, audited the frontend against the Web Interface Guidelines and moved
      it to shadcn/ui (PR #12).
   4. > make something like this design wise

      I attached a screenshot of an event-website template. The assistant adapted its layout
      without copying its branding or images (PR #13).
   5. > Change the color scheme of the website. Suggest me color schemes. you can check the
      > websites of this niche online and then tell me

      The assistant researched event-site colour guidance (Cvent, Toptal, Event Planner Expo) and
      offered four palettes. I picked **Indigo & Apricot** (PR #14).
   6. > remove this purple color use some bright color from references

      Indigo was replaced with bright blue, keeping the apricot buttons (PR #15).
   7. > I want it to be light. Check reference websites like these and then tell me

      The assistant screenshotted Luma, Eventbrite, Meetup, Bizzabo, Eventzilla and Partiful and
      offered three light styles. I picked **Soft wash, like Luma** (PR #16).
   8. > improve this calendar too

      I attached a screenshot of the browser's native date popup. It was replaced with a styled
      shadcn calendar (PR #17).
   9. > does everything aligns with the documents?

      The assistant re-checked the brief and rubric against the repo. It updated this prompt
      list, the README's Git workflow table and the outdated frontend screenshots (PR #18).

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
