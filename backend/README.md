# Backend README

## Overview
Backend for the learning app. This service will expose a REST API for user accounts, flashcard boxes, and daily practice workflows. The MVP excludes AI tutoring features.

## Tech Stack
- Python
- Django
- Django REST Framework
- PostgreSQL

## Architecture
- Clean Architecture with clear separation between:
  - Domain (entities, value objects, use cases)
  - Application (service layer / use cases)
  - Infrastructure (ORM, external services, storage)
  - Interface (REST API controllers/serializers)
- Emphasis on testability, dependency inversion, and explicit boundaries.

## Frontend Integration Notes
- The frontend currently uses mocked data and Zod schemas to model cards and boxes.
- Card creation expects a `config` object with `type` to drive UI components.
- Planned API will expose boxes, cards, and activity endpoints to replace mocks.

## Key Modules (Planned)
- Accounts: registration, login, profile
- Boxes: collections of flashcards
- Cards: multiple card types per box
- Practice: daily review scheduling

## Development Notes
- Database: PostgreSQL (configure via environment variables).
- Local server: `python manage.py runserver`
- Migrations: `python manage.py makemigrations` and `python manage.py migrate`

### Postgres (Docker)
From repo root:
- `docker compose up -d`
Environment variables live in `backend/.env`.

## MVP Scope
- User auth (register/login)
- CRUD for boxes and cards
- Daily practice flow

## Auth Endpoints (Implemented)
- `POST /api/auth/register/` — create account (name, email, password)
- `POST /api/auth/login/` — obtain JWT access/refresh (email + password)
- `POST /api/auth/token/refresh/` — refresh access token
- `GET /api/auth/profile/` — current user profile
- `PATCH /api/auth/profile/` — update name/avatar (avatar_id)
- `POST /api/auth/change-password/` — change password (current, new, confirm)

## Upload Center (Implemented)
- `POST /api/uploads/` — upload a file (authenticated, multipart)
- `GET /api/uploads/` — list your uploads
- Files are stored under `backend/media/uploads/<user_id>/`
- Use `Upload` relations for profile avatars, card media, and other assets.

## Study Endpoints (Implemented)
- `GET /api/boxes/` — list boxes
- `POST /api/boxes/` — create box
- `PATCH /api/boxes/{id}/` — update box
- `DELETE /api/boxes/{id}/` — delete box
- `POST /api/cards/` — create card
- `GET /api/cards/` — list cards

## Non-MVP (Future)
- AI tutoring: connect a box to an LLM, generate guidance and new cards
