# Errors

Command failures and integration errors.

---
## [ERR-20260331-001] nextjs-use-server-exports

**Logged**: 2026-03-31T08:06:00-04:00
**Priority**: medium
**Status**: pending
**Area**: frontend

### Summary
Next.js 16 build failed because a `"use server"` file exported a non-async object constant.

### Error
```text
A "use server" file can only export async functions, found object.
```

### Context
- Attempted to export `initialLoginActionState` from `src/app/login/actions.ts`
- Build failed while collecting page data for protected app routes

### Suggested Fix
Keep `"use server"` modules limited to async function exports only. Move shared constants/types to a separate non-server module when needed.

### Metadata
- Reproducible: yes
- Related Files: src/app/login/actions.ts, src/app/login/login-form.tsx

---
