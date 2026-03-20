# Blackline Matrix — Backend (Phase 1)

This backend provides basic user authentication and will be extended with trades, resources, and community features for Phase 1.

Environment variables

- `MONGODB_URI` — MongoDB connection string (MongoDB Atlas recommended)
- `JWT_SECRET` — secret used to sign JWT tokens
- `PORT` — optional (defaults to 5000)

Quick start

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:

```powershell
cd Backend
npm install
```

3. Start the server (development):

```powershell
npm run dev 
node server.js
```

Auth endpoints

- POST `/api/auth/register` { name, email, password, role? }
- POST `/api/auth/login` { email, password }
- GET `/api/auth/me` (requires Authorization: Bearer <token>)
- POST `/api/auth/request-reset` { email } (logs reset token)
- POST `/api/auth/reset-password` { token, newPassword }

Notes

- Password reset currently logs the token to console for Phase 1. Replace with real email delivery in Phase 2.
- Role-based checks are supported via middleware in `src/middleware/auth.js`.
