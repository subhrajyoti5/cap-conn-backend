# CAPACITY CONNECT

## Software Requirements Specification

**Problem Statement ID:** 26075
**Problem Statement Title:** CAPACITY CONNECT — A Digital Capacity Building and Learning Management Portal
**Organization:** Ministry of Earth Sciences (MoES)
**Department:** India Meteorological Department (IMD)
**Category:** Software
**Theme:** Smart Education
**Version:** 1.0

---

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements of **CAPACITY CONNECT**, a centralized digital capacity-building and learning management portal for organizational training, competency development, assessment, knowledge sharing, and performance monitoring.

The system will provide dedicated functionality for three primary roles:

1. Trainee
2. Trainer
3. Administrator

The system will centralize professional profiles, courses, learning resources, assessments, performance information, certifications, feedback, announcements, and competency information.

---

# 2. Scope

CAPACITY CONNECT shall provide the following major capabilities:

* Secure user signup and authentication.
* User approval workflow.
* Role-based access control.
* Professional trainee profiles.
* Professional trainer profiles.
* Course creation and management.
* Course enrollment.
* Learning-resource management.
* Recorded lectures.
* Presentations.
* Study materials.
* Subject-wise MCQ assessments.
* Trainer-created questionnaires.
* Assessment deadlines.
* Assessment submission and evaluation.
* Trainee performance monitoring.
* Course and training-content feedback.
* Certification management.
* Administrative dashboards.
* User and role management.
* Notifications and announcements.
* Achievement publication.
* Learning-content publication.
* Competency mapping.
* Trainer identification based on competencies and subjects.

---

# 3. Product Overview

CAPACITY CONNECT is a web-based platform consisting of:

```text
Trainees
     │
     ├── Professional Profile
     ├── Course Enrollment
     ├── Learning Resources
     ├── Assessments
     ├── Results
     ├── Certifications
     └── Feedback

Trainers
     │
     ├── Professional Profile
     ├── Competencies
     ├── Course Management
     ├── Learning Resources
     ├── Assessments
     └── Performance Monitoring

Administrators
     │
     ├── User Approval
     ├── Role Management
     ├── Course Monitoring
     ├── Enrollment Monitoring
     ├── Assessment Monitoring
     ├── Certification Monitoring
     ├── Platform Analytics
     ├── Announcements
     ├── Notifications
     └── Competency Management
```

---

# 4. User Roles

## 4.1 Trainee

A trainee is an organizational learner who participates in training programs and develops professional competencies.

The trainee shall be able to:

* Register through the platform.
* Authenticate using the platform's authentication system.
* Maintain a professional profile.
* Add qualifications.
* Add work experience.
* Add interests.
* Add skills.
* Add certifications.
* Browse courses.
* View course details.
* Enroll in courses.
* Access authorized learning resources.
* Watch recorded lectures.
* Access presentations.
* Access study materials.
* Attempt MCQ assessments.
* View assessment results.
* Track learning participation.
* Provide course feedback.
* Provide training-content feedback.
* View notifications.
* View announcements.
* View achievements.
* View certification information.

---

# 5. Trainer Requirements

## 5.1 Trainer

A trainer is responsible for creating and delivering organizational learning content.

The trainer shall be able to:

* Register through the platform.
* Maintain a professional profile.
* Add qualifications.
* Add work experience.
* Add skills.
* Add certifications.
* Define areas of expertise.
* Define competencies.
* Associate expertise with relevant subjects.
* Create courses.
* Edit courses.
* Manage course information.
* Upload recorded lectures.
* Upload presentations.
* Upload study materials.
* Create questionnaires.
* Create MCQ assessments.
* Define assessment deadlines.
* Publish assessments.
* Monitor trainee participation.
* Monitor trainee performance.
* View assessment results.
* Review course feedback.

The submitted project work also proposes AI-based summarization associated with trainer-uploaded content. This is considered an optional enhancement and not a mandatory core requirement unless explicitly required by the final competition specification.

---

# 6. Administrator Requirements

## 6.1 Administrator

The administrator shall have platform-level control.

The administrator shall be able to:

* Authenticate securely.
* View pending users.
* Approve users.
* Reject users.
* Manage user roles.
* Manage user status.
* Monitor courses.
* Monitor enrollments.
* Monitor certifications.
* Monitor assessments.
* Monitor participation statistics.
* View platform dashboards.
* Manage competency information.
* Publish notifications.
* Publish announcements.
* Publish achievements.
* Publish newly added learning content.
* Identify suitable trainers based on competency requirements.

---

# 7. Functional Requirements

## FR-01 Authentication

The system shall provide secure authentication through **Clerk**.

The system shall not store user passwords.

Clerk shall be responsible for:

* User authentication.
* Login.
* Signup.
* Session management.
* Identity management.

The application backend shall verify authenticated requests and associate the authenticated Clerk identity with the corresponding application user.

---

## FR-02 Application User Management

The application shall maintain a user record in PostgreSQL.

The application user record shall contain information such as:

* Internal user ID.
* Clerk user ID.
* Email.
* Role.
* Account status.
* Creation timestamp.
* Update timestamp.

Possible account states:

* Pending
* Approved
* Rejected
* Suspended

---

## FR-03 Role-Based Authorization

The backend shall enforce role-based authorization.

Supported roles:

* TRAINEE
* TRAINER
* ADMIN

Authorization shall be enforced on the backend and shall not depend solely on frontend route protection.

---

## FR-04 Trainee Profile

The trainee shall be able to create and update:

* Professional information.
* Qualifications.
* Work experience.
* Interests.
* Skills.
* Certifications.

---

## FR-05 Trainer Profile

The trainer shall be able to create and update:

* Professional information.
* Qualifications.
* Work experience.
* Skills.
* Certifications.
* Expertise.
* Competencies.
* Relevant subjects.

---

## FR-06 Course Management

Authorized trainers shall be able to:

* Create courses.
* Update courses.
* Add course descriptions.
* Associate courses with subjects.
* Add learning resources.
* Publish courses.
* Manage course status.

Administrators shall be able to monitor courses.

---

## FR-07 Course Enrollment

Trainees shall be able to:

1. Browse available courses.
2. Open course details.
3. View trainer information.
4. Enroll in a course.
5. View enrolled courses.
6. Access resources associated with enrolled courses.

---

## FR-08 Learning Resources

The system shall support:

* Recorded lectures.
* Presentations.
* Study materials.
* Other authorized learning content.

Resources shall be associated with appropriate courses and subjects.

Access shall be controlled based on authorization and enrollment.

---

## FR-09 Assessment Management

Trainers shall be able to create assessments.

An assessment may contain:

* Title.
* Description.
* Subject.
* Course.
* Questions.
* Options.
* Correct answers.
* Marks.
* Deadline.
* Publication status.

---

## FR-10 Assessment Attempt

Trainees shall be able to:

* View available assessments.
* View deadlines.
* Start an assessment.
* Answer MCQs.
* Submit answers.
* View results where permitted.

The backend shall validate the submission and calculate automatically gradable scores.

---

## FR-11 Performance Monitoring

The system shall record:

* Enrollment.
* Assessment participation.
* Assessment submissions.
* Assessment scores.
* Course participation.
* Completion information.

Trainers shall be able to monitor trainees associated with their courses.

Administrators shall be able to view aggregate platform statistics.

---

## FR-12 Feedback

Trainees shall be able to provide feedback regarding:

* Courses.
* Training content.
* Learning experience.

Authorized trainers and administrators shall be able to access relevant feedback.

---

## FR-13 Certification

The system shall maintain certification information associated with users.

Certification records may contain:

* Certification name.
* Issuing organization.
* Issue date.
* Expiry date.
* Credential information.

---

## FR-14 Notifications

The system shall support notifications for relevant users.

Administrators shall be able to publish important notifications.

---

## FR-15 Announcements

Administrators shall be able to create and publish announcements.

Announcements may contain:

* Title.
* Description.
* Publication date.
* Author.
* Status.

---

## FR-16 Achievements

Administrators shall be able to publish organizational achievements and related information on the platform.

---

## FR-17 Competency Mapping

The system shall maintain a structured relationship between:

```text
Subject
   ↓
Required Competencies
   ↓
Trainer Competencies
   ↓
Suitable Trainers
```

The system shall allow administrators to identify trainers suitable for a subject based on their:

* Skills.
* Qualifications.
* Experience.
* Certifications.
* Competencies.
* Subject expertise.

---

# 8. Non-Functional Requirements

## NFR-01 Security

The system shall:

* Use Clerk for authentication.
* Verify authenticated requests on the backend.
* Enforce backend authorization.
* Protect application data.
* Validate API input.
* Restrict file access.
* Protect administrative operations.
* Prevent unauthorized resource access.

---

## NFR-02 Performance

The system should provide responsive interactions under expected organizational workloads.

Large learning resources shall be served through object storage rather than unnecessarily passing large files through the Node.js application server.

---

## NFR-03 Scalability

The architecture shall support future increases in:

* Users.
* Courses.
* Learning resources.
* Assessments.
* Enrollments.
* Competencies.
* Certifications.

---

## NFR-04 Availability

The production system should be deployed using reliable cloud infrastructure and appropriate monitoring.

---

## NFR-05 Usability

The system shall:

* Provide role-specific dashboards.
* Use consistent navigation.
* Clearly communicate system status.
* Minimize unnecessary steps.
* Provide responsive layouts.

---

## NFR-06 Accessibility

The interface shall support desktop, tablet, and mobile screen sizes.

---

## NFR-07 Maintainability

The application shall use:

* Feature-based architecture.
* Modular services.
* Reusable components.
* Centralized middleware.
* Consistent API conventions.

---

## NFR-08 Data Integrity

The system shall maintain referential integrity between:

* Users.
* Profiles.
* Courses.
* Enrollments.
* Assessments.
* Submissions.
* Certifications.
* Competencies.

---

# 9. Access Control Matrix

| Capability                | Trainee | Trainer | Admin |
| ------------------------- | ------: | ------: | ----: |
| Manage own profile        |       ✓ |       ✓ |     ✓ |
| Browse courses            |       ✓ |       ✓ |     ✓ |
| Enroll in courses         |       ✓ |       — |     ✓ |
| Access learning resources |       ✓ |       ✓ |     ✓ |
| Create courses            |       — |       ✓ |     ✓ |
| Upload resources          |       — |       ✓ |     ✓ |
| Create assessments        |       — |       ✓ |     ✓ |
| Attempt assessments       |       ✓ |       — |     ✓ |
| View own results          |       ✓ |       — |     ✓ |
| Monitor trainees          |       — |       ✓ |     ✓ |
| Approve users             |       — |       — |     ✓ |
| Manage roles              |       — |       — |     ✓ |
| Monitor courses           |       — |       ✓ |     ✓ |
| Monitor enrollments       |       — |       ✓ |     ✓ |
| Publish announcements     |       — |       — |     ✓ |
| Publish notifications     |       — |       — |     ✓ |
| Manage competencies       |       — | Profile |     ✓ |
| Find suitable trainers    |       — |       — |     ✓ |

---

# 10. Major Use Cases

## UC-01 — User Registration

**Actors:** Trainee, Trainer

1. User opens signup.
2. Clerk performs authentication/account creation.
3. Application creates the corresponding application user.
4. User receives `PENDING` status.
5. Administrator reviews the account.
6. Administrator approves or rejects the account.

---

## UC-02 — User Approval

**Actor:** Admin

1. Admin opens pending-user dashboard.
2. Admin reviews profile information.
3. Admin selects Approve or Reject.
4. Backend updates user status.
5. Appropriate notification/state is presented to the user.

---

## UC-03 — Course Enrollment

**Actor:** Trainee

1. Trainee browses courses.
2. Trainee opens a course.
3. Trainee selects Enroll.
4. Backend verifies eligibility.
5. Enrollment is created.
6. Course becomes available in the trainee dashboard.

---

## UC-04 — Create Course

**Actor:** Trainer

1. Trainer opens course management.
2. Trainer creates course.
3. Trainer enters course details.
4. Trainer adds resources.
5. Trainer publishes the course.
6. Course becomes available according to its publication status.

---

## UC-05 — Assessment Submission

**Actor:** Trainee

1. Trainee opens assessment.
2. Backend verifies enrollment and availability.
3. Trainee answers questions.
4. Trainee submits.
5. Backend validates submission.
6. Backend calculates score.
7. Submission and result are persisted.

---

## UC-06 — Trainer Matching

**Actor:** Admin

1. Admin selects a subject.
2. System identifies required competencies.
3. System compares trainer competency data.
4. System calculates matching results.
5. System displays suitable trainers.

---

# 11. Constraints

1. Next.js shall be used for the frontend.
2. Node.js shall be used for the backend.
3. Backend code shall use pure JavaScript.
4. Clerk shall provide authentication.
5. PostgreSQL shall be the primary database.
6. Prisma shall be used as ORM.
7. Cloudflare R2 shall be used for large learning resources.
8. Backend authorization shall use middleware.
9. Frontend and backend shall be maintained as separate applications under one repository.
10. Both applications shall follow feature-based organization.

---

# 12. Acceptance Criteria

The system shall be considered functionally complete when:

* Clerk authentication works.
* Application users are created and linked to Clerk identities.
* Admin approval works.
* Backend RBAC works.
* Trainee profiles work.
* Trainer profiles work.
* Trainers can create courses.
* Trainees can enroll.
* Trainers can upload resources.
* Trainees can access authorized resources.
* Trainers can create assessments.
* Trainees can submit assessments.
* Scores are calculated and stored.
* Performance can be monitored.
* Feedback can be submitted.
* Certifications can be maintained.
* Admin dashboards display platform information.
* Notifications and announcements can be published.
* Competency mapping can identify suitable trainers.
* The application works across supported device sizes.
