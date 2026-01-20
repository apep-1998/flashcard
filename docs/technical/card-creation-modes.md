# Card Creation Modes

## Overview
The UI supports multiple ways to create cards. Today we have:

- Single card form
- JSON bulk import

In the future we may add AI-assisted creation or other workflows. This document explains how to add a new creation mode cleanly.

## Current Structure (Frontend)
The card creation page is located at:

- `frontend/app/panel/cards/page.tsx`

It renders a mode switch and a form per mode. The selected box and group ID are shared across modes.

## Adding a New Creation Mode
Follow these steps to add a new mode (e.g., AI creation):

1. **Add a new mode value**
   - Update the `mode` union in `page.tsx` (e.g., `"single" | "bulk" | "ai"`).
   - Add a new tab button to the mode switch UI.

2. **Create a mode-specific form**
   - Add a dedicated form block under the mode switch.
   - Reuse the shared `selectedBoxId` and `groupId` values.
   - Keep mode-specific UI and validation inside that block.

3. **Normalize and validate**
   - Convert any raw input to `CardConfig` objects.
   - Use the Zod schemas in `frontend/lib/schemas/cards.ts` to validate.
   - If the mode generates multiple cards, validate each config and surface the first error.

4. **Submit behavior (mock vs real)**
   - For MVP, mock the submit and display a success message.
   - When the backend is ready, send the payload to the API with the correct box and group ID.

5. **UI consistency**
   - Keep typography and spacing aligned with existing modes.
   - Use the same error/success message style.

## Notes for AI Creation
- AI generation should output a JSON array of card configs.
- Reuse the JSON import validator to avoid duplicating logic.
- Keep a clear audit trail for AI output before saving (preview or confirm step).
