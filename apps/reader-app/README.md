# Reader App

Public news reader — React Native + Expo + TypeScript.

## Purpose

Fast, scroll-based news reading for the general public (inspired by Dailyhunt).
First 10 articles are free; login is required from the 11th article.

## Screens

Splash + Language · Home Feed · News Detail · Login Gate (OTP) · Categories ·
News Reels/Shorts · Notifications · Profile/Bookmarks · Search · Reporter Profile.

## src layout

```
src/
├── screens/      One folder per screen
├── components/   Reusable UI (NewsCard, CategoryTabs, AdSlot, ...)
├── navigation/   React Navigation stacks & tabs
├── services/     API client, auth, push, analytics
├── store/        State management
├── locales/      Tamil + English strings
└── assets/       Images, fonts, icons
```

## Setup

```bash
npm install
npx expo start
```
