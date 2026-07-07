# Pawan Golyan Scholarship Program

A full-stack web application designed for the Golyan Group to facilitate scholarship applications for students across Nepal.

## Tech Stack
- **Frontend**: React (Vite), TailwindCSS, React Router
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT Auth
- **Infrastructure**: Docker, Docker Compose, Nginx

## Getting Started

1. **Prerequisites**: Make sure Docker Desktop is installed and running.
2. **Run the App**: 
   ```bash
   docker-compose up --build
   ```
3. **Access**:
   - Frontend: `http://localhost`
   - API health: `http://localhost:8000/health`

## Features
- Dynamic multi-step application wizard based on applicant education level.
- JWT-based Role-Based Access Control (Student, Admin, Reviewer).
- Local file storage abstraction designed to easily swap to AWS S3.
- Premium UI with deep maroon and gold accents inspired by the Golyan Group brand.

## Backend API
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/applications`
- `GET /api/v1/applications/me`
- `PATCH /api/v1/applications/me`
- `POST /api/v1/applications/me/submit`
- `POST /api/v1/applications/:applicationId/documents`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/applications`
- `GET /api/v1/admin/applications/:id`
- `PATCH /api/v1/admin/applications/:id/status`

## Admin Access
To seed the database with an initial admin user:
```bash
docker-compose exec backend npm run seed
```
**Email**: admin@golyan.com
**Password**: admin123
# GolyanGroupsDeploy
# GolyanGroupsDeploy
# GolyanDeploy
