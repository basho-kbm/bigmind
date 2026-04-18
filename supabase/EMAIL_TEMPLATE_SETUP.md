# Supabase auth email template update

This switches BigMind away from `{{ .ConfirmationURL }}` and onto the working server-side `token_hash` flow.

## What this changes

- Confirm signup email button URL:
  - `https://knowbigmind.com/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app`
- Magic link email button URL:
  - `https://knowbigmind.com/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/app`

## Files

- `supabase/email-templates/confirm-signup.html`
- `supabase/email-templates/magic-link.html`
- `scripts/update-supabase-auth-email-templates.mjs`

## Apply via API

```bash
cd /Users/jamiebucciarelli/Documents/bigmind
export SUPABASE_PROJECT_REF=janxbbeeouchgsyivqfw
export SUPABASE_ACCESS_TOKEN="..."
node scripts/update-supabase-auth-email-templates.mjs
```

The script will:

1. Fetch the current auth config
2. Save a local backup in `tmp/`
3. Patch the confirm signup and magic link template HTML

## Manual dashboard fallback

If you prefer to paste manually in Supabase Studio:

- Confirm signup template -> paste `supabase/email-templates/confirm-signup.html`
- Magic link template -> paste `supabase/email-templates/magic-link.html`
