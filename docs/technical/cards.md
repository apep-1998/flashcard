# Cards System

## Overview
Cards are stored as a base record plus a `config` payload. The `config.type` field determines which UI components render the create form, list view, and exam/review experience. This lets the app support multiple card formats without changing the core card model.

## Card Shape (Base)
Each card follows this structure (fields used in the frontend model):

- `boxId`: the owning box
- `userId`: the owner of the card
- `finished`: whether the card is fully mastered
- `createdAt` / `updatedAt`: timestamps
- `level`: spaced-repetition level
- `groupId`: optional grouping ID
- `nextReviewTime`: when the card becomes ready again
- `config`: type-specific payload (see below)

## Card Types (Current)
The `config.type` field defines the card type and drives the factories.

- `spelling`
- `word-standard`
- `german-verb-conjugator`
- `multiple-choice`
- `ai-reviewer`
- `standard`

## Voice and Image Inputs
Some config fields require media:

- `voice_file_url`: supports URL, upload, or in-browser recording.
- `front_voice_file_url` / `back_voice_file_url`: same as `voice_file_url`.
- `image_file_url`: supports URL or upload.

For now, uploads and recordings create local object URLs in the browser. When the backend is ready, replace these with real upload endpoints.

## Frontend Architecture
Card UIs are split by concern and loaded via factories:

- Create/Edit components
- View components
- Exam/Review components

Factory lookup is based on `config.type`.

```
components/
  cards/
    create/
    view/
    exam/
```

Factories:

- `components/cards/create/CardCreateFactory.tsx`
- `components/cards/view/CardViewFactory.tsx`
- `components/cards/exam/CardExamFactory.tsx`

Schemas:

- `lib/schemas/cards.ts`

## How to Add a New Card Type
1. **Update schemas**
   - Add a new Zod schema in `lib/schemas/cards.ts`.
   - Add it to `cardConfigSchema` (discriminated union).
   - Export the type.

2. **Create UI components**
   - Create the Create/Edit component in `components/cards/create/`.
   - Create View and Exam components in their respective folders.

3. **Register factories**
   - Add the new type to `CardCreateFactory`, `CardViewFactory`, and `CardExamFactory`.

4. **Add defaults and UI options**
   - Add a default config in `app/panel/cards/page.tsx`.
   - Ensure the new type appears in the card type dropdown.

5. **Test the flow**
   - Use the Cards page to create a mock card.
   - Validate the Zod schema passes for the new config.
