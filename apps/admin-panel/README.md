# Admin Panel

Editorial & moderation web dashboard — React.js + TypeScript.

## Purpose

The Agnisiragu editorial team verifies news, manages reporters, and controls the
whole platform from here.

## Modules

Dashboard Overview · Verification Queue · Reporter Management · User Management ·
Revenue & Ads · Reward Approval · Security & Audit Logs · AI Moderation Panel ·
Press ID Card Generator.

## src layout

```
src/
├── pages/        One folder per module
├── components/   Reusable UI (QueueTable, TrustScoreBadge, StatCard, ...)
├── layouts/      Shell, sidebar, auth layout
├── services/     API client, auth
├── hooks/        Shared React hooks
└── assets/       Images, icons
```

## Setup

```bash
npm install
npm run dev
```
