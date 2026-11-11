# School Admission Management System

A web-based school admission management system built with ASP.NET Core 8, React, TypeScript, and PostgreSQL.

The system manages school classes, seat availability, temporary admission reservations, and admission confirmation.

## 1. Key Features

### School Admin
- Create school classes.
- Configure class number, shift, and total seats.
- Manage class-wise admission capacity.
- View seat availability.

### Parent / Guardian
- View available school classes.
- Check total, held, confirmed, and available seats.
- Reserve an available seat.
- View application status.
- Confirm or cancel an active reservation.

### Admission Management
- First-come-first-served admission process.
- Temporary seat reservation.
- Configurable reservation expiration.
- Automatic expiration handling.
- Prevention of duplicate active applications.
- Concurrent reservation protection using PostgreSQL row-level locking.

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core 8 Web API |
| Language | C# |
| Frontend | React |
| Frontend Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Entity Framework Core |
| Architecture | Clean Architecture |
| API Documentation | Swagger / OpenAPI |
| Containerization | Docker |
| Web Server | Nginx |

## 3. Project Structure

```text
SchoolAdmissionSystem/
¦
+-- backend/
¦   +-- src/
¦   ¦   +-- SchoolAdmission.Api/
¦   ¦   +-- SchoolAdmission.Application/
¦   ¦   +-- SchoolAdmission.Domain/
¦   ¦   +-- SchoolAdmission.Infrastructure/
¦   ¦
¦   +-- tests/
¦   ¦   +-- SchoolAdmission.Tests/
¦   ¦
¦   +-- Dockerfile
¦
+-- frontend/
¦   +-- src/
¦   +-- public/
¦   +-- Dockerfile.yml
¦
+-- docker-compose.yml
+-- ASSUMPTIONS.md
+-- AI_USAGE.md
+-- README.md
```

## 4. Prerequisites

- Docker Desktop
- Docker Compose
- Git

## 5. Run the Application Using Docker

Clone the repository:

```bash
git clone https://github.com/Jony-56/SchoolAdmissionSystem.git
```

Navigate to the project directory:

```bash
cd SchoolAdmissionSystem
```

Build and start all services:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs -f
```

Stop the application:

```bash
docker compose down
```

**Note:** The named PostgreSQL volume is retained when using `docker compose down`. Do not use `docker compose down -v` unless you intentionally want to delete the database volume.

## 6. Application URLs

| Application | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger |
| PostgreSQL | localhost:5433 |

## 7. Main API Endpoints

Base URL:

```text
http://localhost:8080/api
```

| Method | Endpoint | Description |
|---|---|---|
| GET | /classes | Get all classes |
| GET | /classes/{classId} | Get class details |
| POST | /classes | Create a class |
| POST | /classes/{classId}/holds | Reserve a seat |
| GET | /holds/{holdId} | Get reservation status |
| POST | /holds/{holdId}/confirm | Confirm admission |
| DELETE | /holds/{holdId} | Cancel reservation |

For student-specific hold operations, provide the required `X-Student-Id` request header.

## 8. Environment Configuration

The following environment variables are used by Docker Compose:

| Variable | Default | Description |
|---|---|---|
| HOLD_DURATION_SECONDS | 600 | Reservation duration in seconds |
| ASPNETCORE_ENVIRONMENT | Production | Backend environment |
| ASPNETCORE_URLS | http://+:8080 | Backend listening address |
| VITE_API_BASE_URL | http://localhost:8080/api | Frontend API base URL |

The default reservation duration is 10 minutes.

## 9. Automated Tests

Run backend tests from the project root:

```powershell
dotnet test ".\backend\tests\SchoolAdmission.Tests\SchoolAdmission.Tests.csproj"
```

The test suite includes:

1. Successful class retrieval.
2. Invalid class creation.
3. Concurrent reservation requests to verify that successful holds do not exceed available seats.

## 10. Documentation

- `ASSUMPTIONS.md` — Business rules and implementation assumptions.
- `AI_USAGE.md` — Disclosure of AI-assisted development.

## 11. Important Notes

- Admission confirmation is handled by the application; payment gateway integration is not included.
- PostgreSQL stores student, class, and admission reservation information.
- The reservation duration can be configured through `HOLD_DURATION_SECONDS`.
- Database credentials in the sample Docker Compose configuration should be changed before production deployment.

---

**Project:** School Admission Management System  
**Backend:** ASP.NET Core 8  
**Frontend:** React + TypeScript  
**Database:** PostgreSQL
