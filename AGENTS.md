# Agent Instructions

## Deployment Source Of Truth
- Hetzner is now the primary runtime/source of truth for this portfolio and related migrated apps.
- Use Hetzner/Coolify for deployment, runtime checks, logs, routing, Docker, and production debugging.
- Do not deploy new work to AWS unless explicitly asked.
- AWS at `3.99.70.5` is legacy/reference only. Use it only when comparing old behavior, env files, uploads, PM2 state, nginx routes, or migration leftovers.
- Do not decommission or delete AWS apps/data unless explicitly asked.

## Hetzner / Coolify
- Hetzner target: `95.217.6.255` (`ubuntu-4gb-hel1-1`, CX23, Helsinki).
- Project work SSH: `ssh -i C:\Users\phili\.ssh\hetzner_ed25519 phil@95.217.6.255`
- Root/system SSH: `ssh -i C:\Users\phili\.ssh\hetzner_ed25519 root@95.217.6.255`
- Use `phil` for project work; use `root`/`sudo` for Docker, Coolify, and system tasks.
- Coolify UI: `https://coolify.philippeho.dev`
- Coolify wildcard domain: `https://philippeho.dev`
- Prefer Git-backed Coolify Dockerfile/static apps under the `PhilHo-Projects` GitHub org.
- Portfolio Coolify app:
  - Name: `portfolio`
  - Resource UUID: `vm871iggnjyzcufbzyvxbssq`
  - Repo: `PhilHo-Projects/portfolio`
  - Branch: `main`
  - Build pack: Dockerfile
  - Domains: `https://philippeho.dev`, `https://www.philippeho.dev`
- To manually deploy the portfolio, load `C:\Users\phili\.config\coolify\env.ps1` and call:
  `GET $COOLIFY_URL/api/v1/deploy?uuid=vm871iggnjyzcufbzyvxbssq&force=true`
- Public ports `8000`, `6001`, `6002`, and `8080` should stay closed; use SSH tunnel fallback only if needed.
- Nginx is disabled on Hetzner so Coolify/Traefik owns ports `80` and `443`.
- DNS is on Cloudflare: `philippeho.dev` apex A -> `95.217.6.255` proxied; `coolify.philippeho.dev` and `*.philippeho.dev` A -> `95.217.6.255` DNS-only.

## Activity section (TokenTracker)

The Activity section on the home page renders a summary written by the
TokenTracker container on the same host. There is no HTTP call and no shared
secret between the two apps — they share one directory:

- Portfolio Coolify storage: host `/home/phil/app-data/tokentracker-public` →
  container `/srv/activity`, **read-only**, with `ACTIVITY_DIR=/srv/activity`.
- TokenTracker writes that same host directory and is the only writer.

`GET /api/activity` reads exactly one filename from it and is deliberately not
`express.static` on the directory. A missing or corrupt file is a 404 and the
section hides itself, so the page never breaks when the tracker is down.

Never point `ACTIVITY_DIR` at `/home/phil/app-data/tokentracker` — that
directory holds raw session data.

## Coolify Agent Access
- Coolify API access is enabled.
- Local token env file: `C:\Users\phili\.config\coolify\env.ps1`
- Expected env vars: `COOLIFY_URL=https://coolify.philippeho.dev` and `COOLIFY_TOKEN=<secret>`.
- Never commit or print `COOLIFY_TOKEN`.
- REST API base: `https://coolify.philippeho.dev/api/v1`
- MCP endpoint: `https://coolify.philippeho.dev/mcp`

## GitHub
- Projects should live under the `PhilHo-Projects` GitHub organization.
- Organization deploy secrets:
  - `SERVER_HOST`
  - `SERVER_SSH_KEY`
  - `SERVER_USER`
- Portfolio GitHub Actions deploys should target Coolify, not PM2.
- The portfolio deploy workflow expects the GitHub Actions secret `COOLIFY_TOKEN`; the Coolify URL and portfolio resource UUID are non-secret and live in `.github/workflows/deploy.yml`.

## AWS Legacy Notes
- AWS legacy/source server: `ssh 3.99.70.5` as `phil`.
- AWS project structure: `~/projects/`.
- AWS nginx config root: `/etc/nginx/`.
- AWS n8n data/workflows: `~/.n8n/`.
- Treat AWS as historical fallback only now that the migration is effectively complete.
