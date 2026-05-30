# Reporter App

Citizen journalism upload app — React Native + Expo + TypeScript. The core product.

## Purpose

Anyone can register as a reporter and submit real-time local news: capture
photo/video, record a voice note, AI converts it to text, admin verifies, news
publishes instantly.

## Screens

Onboarding · Registration (two-name system) · Dashboard · Upload News ·
My Reports · Rewards & Wallet · Emergency Report · Profile & ID Card.

## Key flows

- **Two-name system:** real name + pen name + "publish with pen name" checkbox.
- **Account path:** Temporary → Verified → Senior → Press ID (30-day program).
- **Upload:** capture media → record voice → AI text preview → category → submit.

## src layout

```
src/
├── screens/      One folder per screen
├── components/   Reusable UI (UploadCard, VoiceRecorder, TrustBadge, ...)
├── navigation/   React Navigation stacks & tabs
├── services/     API client, auth, media upload, push
├── store/        State management
├── locales/      Tamil + English strings
└── assets/       Images, fonts, icons
```

## Setup

```bash
npm install
npx expo start
```
