# Uptime Monitoring — Agnisiragu

## UptimeRobot (Free — 5min intervals)
Sign up: https://uptimerobot.com
Add monitors:
- API Health:  GET https://api.agnisiragu.in/api/v1/health   → expect 200 + "status":"ok"
- Admin Panel: GET https://agnisiragu-admin-panel.vercel.app  → expect 200

Alert contacts: kaviyarasukanthavel@gmail.com

## Sentry (Error tracking — Free tier)
1. Create account at sentry.io
2. New project → Node.js
3. Copy DSN → add to .env as SENTRY_DSN
4. Install in backend: npm install @sentry/node
