## Deploy — how it ACTUALLY works (corrected 2026-08-13)

**The instructions here used to say `cd /var/www/verity-web && git pull`. That is wrong and cost
an hour. Read this instead.**

`veritywomen.com` resolves to **158.220.101.25** (the shared Livo/Verity VPS, SSH host
`livoapp-deploy`) and is served by **nginx from `/var/www/veritywomen.com`**. That directory is
**not a git checkout** — there is no `.git` in it. Files are copied in.

**GitHub Pages is a decoy.** `ElveraStrydom/verity-web` has Pages enabled with a `CNAME` of
`veritywomen.com`, and pushing there produces a green "built" deployment — but **DNS does not
point at Pages**, so nothing you push goes live. Pushing to that repo is still worth doing (it is
the version history), it is just **not a deploy**.

To publish a change, both steps:

```bash
# 1. history — from C:\_dev\verity-web
git add <file> && git commit && git push origin main

# 2. the actual deploy — copy to the docroot
ssh livoapp-deploy "cp -p /var/www/veritywomen.com/<file> /var/www/veritywomen.com/<file>.bak-$(date +%Y%m%d-%H%M%S)"
scp <file> livoapp-deploy:/var/www/veritywomen.com/<file>
ssh livoapp-deploy "chown root:root /var/www/veritywomen.com/<file> && chmod 644 /var/www/veritywomen.com/<file>"
```

Then verify against the live URL — `curl -s https://veritywomen.com/<file> | grep <the change>`.
**Always back up first and diff against the backup**, because a whole-file copy from a Windows
checkout can rewrite every line ending and bury the real change.

**No nginx reload is needed for static files** — they are read from disk per request. (And
`systemctl reload nginx` fails on this box: the service unit is not the active one. Do not chase
that; it is not part of the deploy.)

**Cache:** none in front of it — no CDN, no proxy. A change is live the moment the file lands.
Only `styles.css`/`script.js` carry `?v=` cache-busters for browser caches; bump those if you
change either.

`/var/www/veritywomen.com/*.bak-*` files are previous versions. Prune occasionally.

### Optional waitlist backend

```bash
cd web/backend
npm install
ALLOWED_ORIGINS="https://verity.app" PORT=4300 node server.js   # PM2 in prod
```

Emails append to `backend/waitlist.csv`. Endpoints: `POST /signup {email, source}`,
`GET /signup?e=…`, `GET /health`.

## Accessibility

Built to WCAG 2.1 AA: semantic landmarks, skip link, visible keyboard focus, `aria-live` form
status, labelled inputs, 48px+ tap targets, `prefers-reduced-motion` and `prefers-color-scheme`
support, and text/contrast from the app's AA-checked tokens.
