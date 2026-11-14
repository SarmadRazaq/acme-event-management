# Acme Events: Frontend

React + Vite + TypeScript client for the Acme Corp Event Management API.

| Concern | Library |
|---|---|
| Server state (fetching, caching, invalidation) | TanStack Query |
| Client / auth state (JWT + user, persisted) | Zustand |
| Routing + protected routes | React Router |
| Forms + validation | React Hook Form + Zod |
| HTTP | Axios (JWT interceptor) |
| UI components | shadcn/ui (Radix primitives) + lucide icons |
| Styling / toasts | Tailwind CSS v4 (semantic tokens, light/dark), Sonner |
| Theme preference | Zustand (persisted), applied before first paint |

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api -> http://127.0.0.1:8000)
npm run build      # production build in dist/
npm run lint && npm run typecheck
```

Add more shadcn components with `npx shadcn@latest add <name>`; they land in `src/components/ui/`
(vendored source, excluded from lint).

Accessibility and UX follow the Vercel Web Interface Guidelines: skip link, visible focus rings,
accessible confirmation dialogs for destructive actions, reduced-motion support, correct
`autocomplete`/`spellcheck` on inputs, tabular numbers, and a warning about unsaved form changes.

Set `VITE_API_URL` to change the API base URL (default `/api`).
