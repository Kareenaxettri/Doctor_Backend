# MediClick — Backend API

A RESTful backend for a doctor appointment booking platform, built with Node.js, Express, TypeScript, and MongoDB (Mongoose).

## Features

- User registration, login, and JWT-based authentication
- Role-based access control (`user` / `admin`)
- Doctor management (CRUD, search, pagination)
- Appointment booking with time-slot validation and conflict detection
- Favorites (save/unsave doctors)
- Payments (Khalti integration)
- Notifications
- Password reset via email (SMTP)
- Rate limiting and security headers (Helmet)
- Automated tests (Jest + Supertest) covering all major entities

## Tech Stack

- **Runtime:** Node.js, Express 5, TypeScript
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (jsonwebtoken), bcryptjs
- **Validation:** Zod
- **File uploads:** Multer
- **Email:** Nodemailer
- **Testing:** Jest, Supertest

## Getting Started

### Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)

### Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your own values:
   ```bash
   cp .env.example .env
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:8089` (or the `PORT` you set).

4. (Optional) Seed an admin account and doctors:
   ```bash
   npm run seed:admin
   npm run seed:doctors
   ```
   Doctors are also auto-seeded on first server start if none exist.

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on |
| `MONGODB_URL` | MongoDB connection string |
| `SECRET_KEY` | Secret used to sign JWTs (min 32 chars) |
| `CLIENT_URL` | URL of the frontend app, used for CORS and reset links |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP credentials for sending emails |
| `EMAIL_FROM` | From-address for outgoing emails |
| `KHALTI_SECRET_KEY` / `KHALTI_APP_URL` | Khalti payment gateway credentials |

**Never commit `.env`.** Only `.env.example` (with placeholder values) should be tracked in git.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm test` | Run the full Jest test suite |
| `npm run seed:admin` | Create/verify the default admin account |
| `npm run seed:doctors` | Seed sample doctors |

## API Overview

Base URL: `/api/v1`

### Auth (`/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | – | Register a new user |
| POST | `/auth/login` | – | Log in, returns a JWT |
| GET | `/auth/whoami` | ✅ | Get current user |
| PATCH | `/auth/update-password` | ✅ | Change password |
| POST | `/auth/forgot-password` | – | Request a reset link |
| POST | `/auth/reset-password` | – | Reset password with token |

### Users (`/users`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | ✅ | Get own profile |
| PATCH | `/users/profile` | ✅ | Update own profile |

### Admin — Users (`/admin/users`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/users` | ✅ Admin | List all users |
| GET | `/admin/users/:id` | ✅ Admin | Get a user |
| POST | `/admin/users` | ✅ Admin | Create a user |
| PUT/PATCH | `/admin/users/:id` | ✅ Admin | Update a user |
| DELETE | `/admin/users/:id` | ✅ Admin | Delete a user |

### Doctors (`/doctors`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/doctors` | – | List doctors (paginated, searchable) |
| GET | `/doctors/:id` | – | Get a doctor |
| POST | `/doctors` | ✅ Admin | Create a doctor (supports photo upload) |
| PATCH | `/doctors/:id` | ✅ Admin | Update a doctor |
| DELETE | `/doctors/:id` | ✅ Admin | Delete a doctor |

### Appointments (`/appointments`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/appointments` | ✅ | List own (or all, if admin) appointments |
| GET | `/appointments/slots/:doctorId` | ✅ | Get available time slots for a date |
| GET | `/appointments/:id` | ✅ | Get an appointment |
| POST | `/appointments` | ✅ | Book an appointment |
| PATCH | `/appointments/:id` | ✅ | Update an appointment |
| PATCH | `/appointments/:id/cancel` | ✅ | Cancel own appointment |
| PATCH | `/appointments/:id/complete` | ✅ Admin | Mark an appointment complete |
| DELETE | `/appointments/:id` | ✅ | Delete an appointment |

### Favorites (`/favorites`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/favorites` | ✅ | List favorited doctors |
| POST | `/favorites/:doctorId` | ✅ | Toggle a doctor as favorite |

### Payments (`/payments`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/payments` | ✅ | List own payments |
| GET | `/payments/:id` | ✅ | Get a payment |
| POST | `/payments` | ✅ | Create a payment |
| PATCH | `/payments/:id` | ✅ Admin | Update a payment |
| DELETE | `/payments/:id` | ✅ Admin | Delete a payment |

### Notifications (`/notifications`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | – | List notifications |
| GET | `/notifications/unread-count` | – | Get unread count |
| PATCH | `/notifications/:id/read` | – | Mark one as read |
| PATCH | `/notifications/read-all` | – | Mark all as read |
| DELETE | `/notifications/:id` | – | Delete one |
| DELETE | `/notifications` | – | Delete all |

All responses follow the shape:
```json
{ "success": true, "message": "...", "data": { }, "meta": { } }
```

## Testing

The project has automated tests for every major entity: auth, users, admin-users, doctors, appointments, favorites, notifications, and payments.

```bash
npm test
```

Tests run against a real MongoDB connection (same `MONGODB_URL` as dev) using Supertest against the Express app, and clean up the test data they create in `afterAll`. Make sure `npm run seed:admin` has been run at least once before running the suite, since some tests log in as the seeded admin account.

## Project Structure

```
src/
├── app.ts                # Express app setup (middleware, routes)
├── index.ts               # Entry point, DB connection, doctor auto-seed
├── configs/                # Environment/config constants
├── controllers/            # Request handlers
├── services/                # Business logic
├── repositories/            # Data access layer (Mongoose)
├── models/                   # Mongoose schemas
├── dtos/                      # Zod validation schemas
├── routes/                     # Express routers
├── middlewares/                 # Auth, upload, sanitization
├── exception/                    # Custom HTTP exceptions
├── utils/                         # Shared helpers
├── scripts/                        # Seed scripts
└── tests/                           # Jest + Supertest test suites
```

## License

Created as part of a university coursework assignment.
