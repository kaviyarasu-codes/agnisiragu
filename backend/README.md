# Agnisiragu Backend API

NestJS + TypeScript REST API. The single backend serving all three front-end apps.

## Module structure

```
src/
├── auth/           JWT + OTP authentication, role-based guards
├── users/          Reader account management
├── reporters/      Reporter accounts, two-name system, trust score, strikes
├── news/           News submission, verification status, publishing
├── comments/       Comments + AI toxicity moderation
├── rewards/        Points engine, weekly payout claims (Razorpay)
├── admin/          Verification queue, audit logs, dashboards
├── notifications/  Firebase Cloud Messaging push notifications
├── ai/             OpenAI Whisper voice-to-text, OpenAI Moderation
├── media/          AWS S3 uploads, virus scan, watermarking
├── common/         Shared guards, interceptors, pipes, decorators
└── prisma/         Prisma service wrapper
```

## Setup

```bash
npm install
cp .env.example .env        # fill in secrets
npx prisma migrate dev      # run database migrations
npm run start:dev           # start in watch mode
```

## Environment variables

See `.env.example`. Keys the client must supply: AWS S3, OpenAI, MSG91 (OTP),
Razorpay, Firebase, Google AdMob, Cloudflare.

## Conventions

- All code in TypeScript.
- One NestJS module per feature folder.
- JWT auth + role-based access control on every protected route.
- Input validation via DTOs + `class-validator` on every endpoint.
