# EduFlow Monorepo

This workspace is split into two folders:

- `backend`: Node.js + Express API (MongoDB + Azure Blob integration)
- `frontend`: React app (Vite)

## Backend

Path: `backend`

### Responsibilities

- Authentication and session management
- MongoDB access through Mongoose
- Azure Blob Storage upload/delete for thumbnails and videos
- Role-based APIs for student/instructor/admin

### Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Fill in MongoDB and Azure values
3. Install and run:

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3000`.

## Frontend

Path: `frontend`

### Responsibilities

- Login and signup UI
- Role-based dashboard routing
- Student learning and video progress UI
- Instructor course creation UI
- Admin course management UI

### Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to backend.

## API Summary

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/courses`
- `POST /api/courses` (instructor)
- `GET /api/courses/my-courses` (instructor)
- `POST /api/courses/enroll/:courseId` (student)
- `GET /api/courses/enrolled` (student)
- `POST /api/courses/:courseId/videos/:videoId/watch` (student)
- `GET /api/admin/courses` (admin)
- `DELETE /api/admin/courses/:id` (admin)
