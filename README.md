# Agnisiragu News Platform

An AI-powered citizen journalism ecosystem — anyone can become a news reporter and
publish verified local news through a secure moderation pipeline.

## What's in this repository

This is a monorepo containing all four deliverables of the Agnisiragu platform.

```
agnisiragu/
├── apps/
│   ├── reader-app/      React Native (Expo) — public news reader
│   ├── reporter-app/    React Native (Expo) — citizen journalist upload app
│   └── admin-panel/     React.js — verification & management web panel
├── backend/             NestJS — REST API, auth, AI integration, jobs
│   ├── src/             Feature modules (auth, news, reporters, ...)
│   └── prisma/          Database schema & migrations
├── infra/               Docker, nginx, deployment scripts
├── shared/              Shared TypeScript types & constants
└── docs/                Project documentation
```

## Deliverables

| # | Component | Stack | Purpose |
|---|-----------|-------|---------|
| 1 | Reader App | React Native + Expo | Public reads verified news |
| 2 | Reporter App | React Native + Expo | Citizens upload local news |
| 3 | Admin Panel | React.js | Editorial team verifies & manages |
| 4 | Backend API | NestJS + PostgreSQL | Core business logic & AI services |

## Tech stack

- **Mobile:** React Native + Expo + TypeScript
- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Cache / queues:** Redis
- **Media storage:** AWS S3
- **CDN:** Cloudflare
- **AI:** OpenAI Whisper (voice-to-text), OpenAI Moderation
- **Auth:** JWT + OTP (MSG91)
- **Payments:** Razorpay
- **Ads:** Google AdMob
- **Push:** Firebase Cloud Messaging

## Development phases

- **Phase 1 — MVP (Months 1–3):** Auth, news feed, reporter uploads, admin verification, categories, push.
- **Phase 2 — Core (Months 4–5):** Rewards, AI voice-to-text, ads, comments, analytics, search, geo-tagging.
- **Phase 3 — Scale & AI (Months 6–8):** AI moderation, news reels, live streaming, hyper-local, Press ID, premium plans.

## Getting started

Each package has its own README with setup instructions:

- [Reader App](apps/reader-app/README.md)
- [Reporter App](apps/reporter-app/README.md)
- [Admin Panel](apps/admin-panel/README.md)
- [Backend API](backend/README.md)

## Default UI language

All apps ship with bilingual support: **Tamil + English**.
