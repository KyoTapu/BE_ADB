# Pullman Booking Backend

This backend now follows a document-aligned modular structure under `src/modules`.

- PostgreSQL / Supabase: transactional hotel booking data
- MongoDB: pricing rules, pricing history, search logs
- Redis: caching and inventory locking

Primary auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Legacy compatibility endpoints remain mounted at:

- `/api/client/auth`
- `/api/admin/auth`
