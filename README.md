# OSI Inventory — production frontend

This package contains the complete frontend and does not modify the database.

## Before deployment

Set these globals before `js/app.js` loads:

```html
<script>
  window.SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
  window.SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
</script>
<script type="module" src="js/dashboard.js"></script>
```

Add the same two values to every HTML page, immediately before its module script.

Do NOT put a Supabase service-role key in the frontend.

## Important database compatibility

The frontend expects the database schema/functions already established for this project, including:
- `set_user_role(uuid, uuid)`
- `approve_borrow_request(uuid)`
- `return_borrowing(uuid, text, text, uuid)`

`approve_borrow_request` is called with the named argument `p_request_id`.

Password changes use Supabase Auth:
`supabase.auth.updateUser({ password })`.

## Deployment

Serve the folder from a real web server (Vercel, Netlify, Cloudflare Pages, nginx, etc.).
Do not open HTML files with `file://`.

All pages use the same `js/app.js`, so navigation, authentication, roles, permissions, modals, toast messages and CSV exports stay consistent.
