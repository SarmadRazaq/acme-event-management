# Acme Events: Frontend

React + Vite + TypeScript client for the Acme Corp Event Management API.

| Concern | Library |
|---|---|
| Server state (fetching, caching, invalidation) | TanStack Query |
| Client / auth state (JWT + user, persisted) | Zustand |
| Routing + protected routes | React Router |
| Forms + validation | React Hook Form + Zod |
| HTTP | Axios (JWT interceptor) |
| Styling / toasts | Tailwind CSS, Sonner |

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api -> http://127.0.0.1:8000)
npm run build      # production build in dist/
npm run lint && npm run typecheck
```

Set `VITE_API_URL` to change the API base URL (default `/api`).
