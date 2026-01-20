# Frontend README

## Overview
Frontend for the learning app. This is a Next.js web app that provides the UI for authentication, flashcard boxes, and daily practice. The initial implementation will use mock data and a clean architecture-inspired structure.

## Tech Stack
- Next.js
- React
- TypeScript
- MUI (Material UI) with `@mui/material-nextjs`
- PWA support

## Architecture
- Clean, feature-first structure with explicit boundaries:
  - `app/`: Next.js App Router routes and layouts
  - `app/panel/`: panel pages and layout (bottom tab navigation)
  - `features/`: domain-focused UI and state (e.g., boxes, cards, practice)
  - `shared/`: design system, UI primitives, and utilities
  - `services/`: API clients and data access layers (mocked first)
- Emphasis on composition, testability, and predictable state handling.

## Current Pages (Mocked)
- Auth: `app/page.tsx` (login/register)
- Panel home: `app/panel/page.tsx`
- Boxes list: `app/panel/boxes/page.tsx`
- Box cards list: `app/panel/boxes/[boxId]/cards/page.tsx`
- Box activity: `app/panel/boxes/[boxId]/activity/page.tsx`
- Cards create: `app/panel/cards/page.tsx`
- Profile: `app/panel/profile/page.tsx`

## Cards System (Frontend)
- Schemas: `lib/schemas/cards.ts` (Zod, discriminated union by `config.type`)
- Card UI structure:
  - `components/cards/create/`
  - `components/cards/view/`
  - `components/cards/exam/`
- Factories select components based on `config.type`.
- Media inputs:
  - `VoiceInput` supports URL, upload, or in-browser recording.
  - `ImageInput` supports URL or upload.

## Charts
- Activity graphs use `recharts` in `app/panel/boxes/[boxId]/activity/page.tsx`.

## Development Notes
- Dev server: `npm run dev`
- Production build: `npm run build`
- Linting: `npm run lint`
- PWA: planned support for offline usage and installability

## MVP Scope
- Auth screens (register/login)
- Dashboard with box list
- Flashcard editor (multiple card types)
- Daily practice flow

## Non-MVP (Future)
- AI tutoring: connect a box to an LLM and generate learning content
