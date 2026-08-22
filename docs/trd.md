# CAPACITY CONNECT

## Technical Requirements & Design Document

**Problem Statement ID:** 26075
**Organization:** Ministry of Earth Sciences (MoES)
**Department:** India Meteorological Department (IMD)
**Product:** CAPACITY CONNECT
**Version:** 1.0

---

# 1. Technical Overview

CAPACITY CONNECT will be implemented as a two-application monorepository-style project:

```text
capacity-connect/
├── frontend/
└── backend/
```

The two applications will communicate through a REST API.

---

# 2. Technology Stack

| Layer               | Technology                     |
| ------------------- | ------------------------------ |
| Frontend            | Next.js                        |
| Frontend Language   | JavaScript / JSX               |
| Backend             | Node.js                        |
| Backend Language    | Pure JavaScript                |
| Authentication      | Clerk                          |
| Authorization       | Custom backend RBAC middleware |
| Database            | PostgreSQL                     |
| ORM                 | Prisma                         |
| Object Storage      | Cloudflare R2                  |
| Frontend Deployment | Vercel                         |
| Backend Deployment  | AWS EC2                        |
| API                 | REST                           |
| Version Control     | Git                            |

The project homework also specifies the general architecture of React/Next.js, Node.js, Prisma, PostgreSQL, Cloudflare R2, Vercel, and EC2.

---

# 3. High-Level Architecture

```text
                         INTERNET
                            │
                            ▼
                  ┌───────────────────┐
                  │      Vercel       │
                  │     Next.js       │
                  │     Frontend      │
                  └─────────┬─────────┘
                            │
                       HTTPS / REST
                            │
                            ▼
                  ┌───────────────────┐
                  │      AWS EC2      │
                  │     Node.js       │
                  │      Backend      │
                  └───────┬─────┬─────┘
                          │     │
              ┌───────────┘     └────────────┐
              ▼                              ▼
      ┌────────────────┐             ┌────────────────┐
      │  PostgreSQL    │             │ Cloudflare R2  │
      │    Prisma      │             │ Object Storage │
      └────────────────┘             └────────────────┘

                         ┌────────────────┐
                         │     Clerk      │
                         │ Authentication │
                         └────────────────┘
```

---

# 4. Repository Structure

The root repository shall contain separate frontend and backend applications.

```text
capacity-connect/
│
├── frontend/
│
├── backend/
│
├── README.md
├── .gitignore
└── docs/
```

---

# 5. Frontend Architecture

The frontend shall use a **feature-based architecture**.

Recommended structure:

```text
frontend/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── trainee/
│   ├── trainer/
│   ├── admin/
│   ├── layout.js
│   └── page.js
│
├── features/
│   ├── auth/
│   ├── users/
│   ├── trainee/
│   ├── trainer/
│   ├── admin/
│   ├── courses/
│   ├── enrollments/
│   ├── resources/
│   ├── assessments/
│   ├── feedback/
│   ├── certifications/
│   ├── competencies/
│   ├── notifications/
│   └── dashboard/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── lib/
│   ├── api/
│   ├── clerk/
│   └── utils/
│
├── hooks/
├── constants/
└── ...
```

---

# 6. Frontend Feature Structure

Each major feature should own its components, API functions, hooks, schemas, and utilities.

Example:

```text
features/courses/
├── components/
│   ├── CourseCard.jsx
│   ├── CourseForm.jsx
│   ├── CourseList.jsx
│   └── CourseDetails.jsx
│
├── hooks/
│   └── useCourses.js
│
├── api/
│   └── course.api.js
│
├── schemas/
│   └── course.schema.js
│
└── utils/
    └── course.utils.js
```

This keeps course-related code together.

---

# 7. Backend Architecture

The backend shall also use a **feature-based architecture**.

```text
backend/
├── src/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── trainees/
│   │   ├── trainers/
│   │   ├── courses/
│   │   ├── enrollments/
│   │   ├── resources/
│   │   ├── assessments/
│   │   ├── submissions/
│   │   ├── feedback/
│   │   ├── certifications/
│   │   ├── competencies/
│   │   ├── notifications/
│   │   ├── announcements/
│   │   ├── achievements/
│   │   └── dashboard/
│   │
│   ├── middleware/
│   ├── config/
│   ├── database/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── prisma/
│   └── schema.prisma
│
└── package.json
```

---

# 8. Backend Feature Structure

Each feature should follow:

```text
feature/
├── feature.routes.js
├── feature.controller.js
├── feature.service.js
├── feature.repository.js
├── feature.validation.js
└── feature.constants.js
```

Example:

```text
features/courses/
├── course.routes.js
├── course.controller.js
├── course.service.js
├── course.repository.js
├── course.validation.js
└── course.constants.js
```

---

# 9. Backend Request Flow

The standard request pipeline shall be:

```text
HTTP Request
     │
     ▼
Route
     │
     ▼
Authentication Middleware
     │
     ▼
User Context Middleware
     │
     ▼
Approval Middleware
     │
     ▼
Role Middleware
     │
     ▼
Validation Middleware
     │
     ▼
Controller
     │
     ▼
Service
     │
     ▼
Repository
     │
     ▼
Prisma
     │
     ▼
PostgreSQL
```

---

# 10. Authentication Architecture

Clerk shall be responsible for authentication.

The backend shall not implement:

* Password hashing.
* Password reset.
* Login credential verification.
* Session generation.

The backend shall verify the authenticated Clerk identity.

---

# 11. Authentication Flow

```text
User
 │
 ▼
Next.js
 │
 ▼
Clerk
 │
 ├── Authentication
 └── Session
 │
 ▼
Authenticated Request
 │
 ▼
Node.js API
 │
 ▼
Verify Clerk Identity
 │
 ▼
Find application user
 │
 ▼
Load role/status
 │
 ▼
Authorization
```

---

# 12. Application User Model

Clerk represents identity.

PostgreSQL represents application state.

Example:

```text
Clerk
├── clerk_user_id
├── email
└── identity information

PostgreSQL
├── user_id
├── clerk_user_id
├── role
├── status
└── application data
```

The application shall not store user passwords.

---

# 13. Authorization Middleware

Recommended middleware:

```text
authenticate
requireUser
requireApprovedUser
requireRole
requireOwnership
```

Example:

```text
router.post(
  "/",
  authenticate,
  requireApprovedUser,
  requireRole("TRAINER", "ADMIN"),
  validate(createCourseSchema),
  courseController.create
);
```

---

# 14. Controller Responsibility

Controllers shall be responsible for:

* Receiving HTTP requests.
* Extracting request data.
* Calling services.
* Returning HTTP responses.

Controllers should not contain substantial business logic.

Example:

```text
Request
   ↓
course.controller
   ↓
course.service
   ↓
Response
```

---

# 15. Service Responsibility

Services shall contain business logic.

Examples:

```text
course.service
├── createCourse()
├── updateCourse()
├── publishCourse()
└── getCourseDetails()
```

Services may coordinate:

* Repositories.
* Storage services.
* Competency services.
* Notification services.

---

# 16. Repository Responsibility

Repositories shall isolate database access.

Example:

```text
course.repository
├── create()
├── findById()
├── findMany()
├── update()
└── delete()
```

Prisma database operations should primarily remain within repository/data-access code.

---

# 17. Database Architecture

PostgreSQL shall be the primary application database.

Prisma shall provide:

* Schema definition.
* Migrations.
* Type-safe database access where applicable.
* Relationship management.
* Query abstraction.

---

# 18. Core Database Entities

The database shall contain entities representing at minimum:

```text
User
Role
TraineeProfile
TrainerProfile
Qualification
WorkExperience
Skill
Interest
Certification
Subject
Competency
TrainerCompetency
Course
Enrollment
LearningResource
Assessment
Question
Option
Submission
Answer
Feedback
Notification
Announcement
Achievement
```

---

# 19. User Schema

Conceptually:

```text
User
├── id
├── clerkUserId
├── email
├── role
├── status
├── createdAt
└── updatedAt
```

Constraints:

```text
clerkUserId → UNIQUE
email       → INDEX / appropriate uniqueness policy
role        → ENUM
status      → ENUM
```

---

# 20. Course Schema

Conceptually:

```text
Course
├── id
├── title
├── description
├── trainerId
├── subjectId
├── status
├── createdAt
└── updatedAt
```

Relationships:

```text
Trainer
   │
   └── Courses

Course
   ├── Subject
   ├── Enrollments
   ├── Resources
   └── Assessments
```

---

# 21. Enrollment Schema

```text
Enrollment
├── id
├── courseId
├── traineeId
├── status
├── enrolledAt
└── completedAt
```

A trainee should not have duplicate active enrollment for the same course.

---

# 22. Learning Resource Architecture

Large files shall be stored in Cloudflare R2.

PostgreSQL stores metadata.

```text
PostgreSQL
     │
     ├── resource ID
     ├── course ID
     ├── title
     ├── type
     └── storage key
             │
             ▼
       Cloudflare R2
             │
             ├── lectures
             ├── presentations
             └── study materials
```

---

# 23. Secure File Upload Flow

```text
Trainer
   │
   ▼
Next.js
   │
   ▼
POST /resources/upload-url
   │
   ▼
Backend authorization
   │
   ▼
Generate signed R2 URL
   │
   ▼
Frontend uploads directly to R2
   │
   ▼
Backend stores resource metadata
```

This prevents the Node.js server from unnecessarily handling large video/document payloads.

---

# 24. Assessment Architecture

Assessment structure:

```text
Assessment
   │
   ├── Course
   ├── Subject
   ├── Trainer
   ├── Questions
   │      └── Options
   │
   ├── Deadline
   └── Total Marks
```

Submission:

```text
Trainee
   ↓
Assessment
   ↓
Answers
   ↓
Backend Validation
   ↓
Scoring Service
   ↓
Submission
   ↓
Result
```

Scores shall be calculated server-side.

---

# 25. Competency Matching Architecture

The first implementation shall use deterministic matching.

```text
Subject
   ↓
Required Competencies
   ↓
Trainer Competencies
   ↓
Matching Service
   ↓
Ranked Trainers
```

Example:

```text
Trainer Match Score =
Matched Required Competencies
──────────────────────────────
Total Required Competencies
```

Future versions may incorporate:

* Proficiency.
* Years of experience.
* Certifications.
* Relevant training history.

---

# 26. API Structure

The backend shall expose REST endpoints grouped by feature.

## Authentication / User

```text
GET /api/me
GET /api/users/:id
```

## Admin

```text
GET   /api/admin/users/pending
PATCH /api/admin/users/:id/approve
PATCH /api/admin/users/:id/reject
PATCH /api/admin/users/:id/role
```

## Courses

```text
GET    /api/courses
POST   /api/courses
GET    /api/courses/:id
PATCH  /api/courses/:id
DELETE /api/courses/:id
```

## Enrollment

```text
POST   /api/courses/:id/enroll
DELETE /api/courses/:id/enroll
GET    /api/me/enrollments
```

## Resources

```text
POST   /api/resources/upload-url
POST   /api/resources
GET    /api/resources/:id
DELETE /api/resources/:id
```

## Assessments

```text
GET    /api/assessments
POST   /api/assessments
GET    /api/assessments/:id
PATCH  /api/assessments/:id
POST   /api/assessments/:id/submit
GET    /api/assessments/:id/result
```

## Feedback

```text
POST /api/feedback
GET  /api/courses/:id/feedback
```

## Competencies

```text
GET /api/competencies
GET /api/trainers/match
```

## Notifications

```text
GET  /api/notifications
POST /api/admin/notifications
```

---

# 27. API Response Standard

Successful response:

```json
{
  "success": true,
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Course not found",
  "code": "COURSE_NOT_FOUND"
}
```

Errors shall be handled centrally through error-handling middleware.

---

# 28. Validation

Request validation shall occur before controller execution.

Validation should cover:

* Required fields.
* Data types.
* String lengths.
* Dates.
* Assessment deadlines.
* File metadata.
* IDs.
* Role-sensitive inputs.

---

# 29. Security Architecture

The backend shall implement:

* Clerk identity verification.
* Backend RBAC.
* Input validation.
* Rate limiting.
* CORS restrictions.
* Secure headers.
* Resource authorization.
* File-upload restrictions.
* Signed storage URLs.
* Centralized error handling.
* Audit logging for important administrative actions.

---

# 30. Ownership Authorization

Role authorization alone is insufficient.

Example:

A trainer should only be able to edit courses they own.

```text
requireRole("TRAINER")
        ↓
requireCourseOwnership
        ↓
Controller
```

Similarly, trainees should only be able to access their own:

* Profile.
* Submissions.
* Results.
* Certifications where appropriate.

---

# 31. Dashboard Architecture

Dashboards should use dedicated aggregation APIs.

Example:

```text
GET /api/dashboard/trainee
GET /api/dashboard/trainer
GET /api/dashboard/admin
```

The backend should calculate aggregate statistics rather than sending large raw datasets to the frontend.

---

# 32. Error Handling

A centralized error middleware shall handle:

* Validation errors.
* Authentication errors.
* Authorization errors.
* Resource-not-found errors.
* Database errors.
* Unexpected server errors.

HTTP status codes should be used consistently.

---

# 33. Logging and Audit

The backend should log:

* Authentication failures.
* Administrative actions.
* User approval/rejection.
* Role changes.
* Course publication.
* Assessment submission failures.
* File operations.
* Server errors.

Passwords, Clerk secrets, API keys, and other sensitive credentials shall never be logged.

---

# 34. Environment Configuration

Environment-specific secrets shall be stored outside source control.

Example backend configuration:

```text
DATABASE_URL=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
```

Frontend configuration should contain only values safe for browser exposure.

Secrets must never be committed to Git.

---

# 35. Deployment

## Frontend

```text
Git Repository
      ↓
Vercel
      ↓
Next.js
```

## Backend

```text
Git Repository
      ↓
AWS EC2
      ↓
Node.js
```

## Database

```text
PostgreSQL
```

## Storage

```text
Cloudflare R2
```

---

# 36. Production Architecture

```text
                    ┌──────────────┐
                    │    Users     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Next.js    │
                    │    Vercel    │
                    └──────┬───────┘
                           │
                       HTTPS API
                           │
                           ▼
                    ┌──────────────┐
                    │   Node.js    │
                    │    EC2       │
                    └──────┬───────┘
                           │
              ┌────────────┼─────────────┐
              ▼            ▼             ▼
       ┌────────────┐ ┌───────────┐ ┌───────────┐
       │ PostgreSQL │ │    R2     │ │  Clerk    │
       │   Prisma   │ │  Storage  │ │   Auth    │
       └────────────┘ └───────────┘ └───────────┘
```

---

# 37. Testing Strategy

## Unit Testing

Test:

* Services.
* Scoring logic.
* Competency matching.
* Validation.
* Utility functions.

## API Testing

Test:

* Authentication verification.
* Authorization.
* Courses.
* Enrollment.
* Assessments.
* Submission.
* Profiles.
* Admin operations.

## Integration Testing

Critical workflows:

```text
Clerk Signup
    ↓
Application User
    ↓
Admin Approval
    ↓
Login
```

```text
Trainer
   ↓
Course
   ↓
Resource
   ↓
Trainee Enrollment
   ↓
Learning
```

```text
Trainer
   ↓
Assessment
   ↓
Trainee
   ↓
Submission
   ↓
Scoring
   ↓
Result
```

---

# 38. Development Phases

## Phase 1 — Project Foundation

* Repository setup.
* Frontend setup.
* Backend setup.
* PostgreSQL setup.
* Prisma setup.
* Clerk integration.
* Environment configuration.
* Feature architecture.

## Phase 2 — User Management

* Application user.
* Roles.
* Account status.
* Admin approval.
* RBAC middleware.

## Phase 3 — Profiles

* Trainee profile.
* Trainer profile.
* Qualifications.
* Experience.
* Skills.
* Interests.
* Certifications.

## Phase 4 — Courses

* Subjects.
* Courses.
* Course management.
* Enrollment.

## Phase 5 — Learning Resources

* R2 integration.
* Upload URLs.
* Resource metadata.
* Resource access control.
* Trainer library.

## Phase 6 — Assessments

* Assessment creation.
* MCQs.
* Deadlines.
* Submission.
* Scoring.
* Results.

## Phase 7 — Monitoring

* Trainee dashboard.
* Trainer dashboard.
* Admin dashboard.
* Performance analytics.

## Phase 8 — Communication

* Notifications.
* Announcements.
* Achievements.
* New learning-content publication.

## Phase 9 — Competency

* Competency taxonomy.
* Trainer competencies.
* Subject requirements.
* Matching algorithm.

## Phase 10 — Production Hardening

* Security testing.
* API testing.
* Performance optimization.
* Error handling.
* Logging.
* Deployment.
* Documentation.

---

# 39. Technical Definition of Done

The technical implementation shall be considered ready for MVP demonstration when:

* `frontend/` and `backend/` are independently runnable.
* Both follow feature-based architecture.
* Clerk authentication is integrated.
* Backend Clerk verification works.
* Application users are synchronized with Clerk identities.
* RBAC middleware works.
* Approval middleware works.
* Controllers contain no major business logic.
* Services contain business logic.
* Repository layer handles database access.
* Prisma migrations work.
* PostgreSQL relationships are implemented.
* R2 upload/access works.
* Course workflows work.
* Enrollment works.
* Assessment submission and server-side scoring work.
* Performance data is available.
* Feedback works.
* Admin management works.
* Competency matching works.
* API errors are handled consistently.
* Sensitive secrets are excluded from source control.
* Production frontend and backend deployments work.
