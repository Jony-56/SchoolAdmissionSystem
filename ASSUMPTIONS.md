# Assumptions and Business Rules

## 1. Admission Process
- Admission is processed on a first-come-first-served basis.
- There is no lottery or random seat allocation.
- Each class and shift combination represents a separate admission group.
- Each admission group has a fixed seat capacity.

## 2. Student Identification
- A student is identified using a 17-digit Birth Registration Number.
- Only numeric 17-digit student IDs are accepted.
- A student can have only one active application per class.
- An active application means HELD or CONFIRMED.

## 3. Seat Reservation
- A seat is temporarily reserved when a hold is successfully created.
- A successful hold increases HeldSeats by one.
- A hold has a configurable expiration duration.
- The default hold duration is 600 seconds (10 minutes).
- The HOLD_DURATION_SECONDS environment variable controls the duration.
- Expired holds release their reserved seats.

## 4. Application Confirmation
- A valid, unexpired hold can be confirmed by its associated student.
- Confirmation decreases HeldSeats and increases ConfirmedSeats.
- Repeated confirmation does not increase ConfirmedSeats again.
- Expired or cancelled applications cannot be confirmed.
- Payment gateway integration is outside the current implementation.
- Confirmation represents admission confirmation within this system.

## 5. Cancellation
- Only active HELD applications can be cancelled.
- Cancellation releases the reserved seat.
- An expired hold is marked EXPIRED instead of CANCELLED.

## 6. Concurrency and Seat Availability
- PostgreSQL row-level locking is used when reserving seats.
- Concurrent requests for the same class are serialized through class-row locking.
- A hold is rejected when no seats are available.
- HeldSeats and ConfirmedSeats are maintained separately.

## 7. Technology and Configuration
- Backend: ASP.NET Core 8 Web API.
- Database: PostgreSQL.
- ORM: Entity Framework Core.
- Frontend: React and TypeScript.
- Docker Compose runs the database, backend, and frontend.
- The default hold duration is 600 seconds.
