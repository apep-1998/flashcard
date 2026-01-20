# Repository Guidelines

## Project Structure & Module Organization
- `backend/` houses the Django project. `backend/manage.py` is the entry point; `backend/backend/` contains `settings.py`, `urls.py`, and WSGI/ASGI setup.
- `frontend/` is a Next.js (App Router) app. The UI lives in `frontend/app/`, static files in `frontend/public/`.
- `venv/` is a local Python virtual environment; avoid editing or committing changes there.

## Build, Test, and Development Commands
- Frontend (run from `frontend/`):
  - `npm run dev`: start the Next.js dev server at `http://localhost:3000`.
  - `npm run build`: produce a production build.
  - `npm run start`: run the production server after a build.
  - `npm run lint`: run ESLint.
- Backend (run from `backend/`):
  - `python manage.py runserver`: start the Django dev server.
  - `python manage.py migrate`: apply database migrations (SQLite by default).
  - `python manage.py makemigrations`: create new migrations after model changes.

## Coding Style & Naming Conventions
- Python: follow PEP 8 conventions, 4-space indentation, `snake_case` for variables/functions, `PascalCase` for classes.
- TypeScript/React: follow the Next.js + ESLint defaults; use `PascalCase` for components and `camelCase` for props/hooks.
- CSS: Tailwind is configured; prefer utility classes in `frontend/app/` components.

## Testing Guidelines
- No automated test suite is configured yet. If you add tests, keep them close to the code (e.g., `backend/<app>/tests.py` for Django) and document the new command in this file.

## Commit & Pull Request Guidelines
- This directory is not a Git repository, so there is no commit history to infer conventions. If you initialize Git, favor short, imperative commit messages (e.g., "Add login form").
- PRs should include a clear description, list of manual/automated tests run, and screenshots for UI changes in `frontend/`.

## Security & Configuration Tips
- `backend/backend/settings.py` currently uses `DEBUG = True` and a hard-coded `SECRET_KEY`; do not ship those defaults to production.
- Prefer environment variables for secrets and settings if you add deployment support.
