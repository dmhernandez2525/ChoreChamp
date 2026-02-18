# SDD-012: Enterprise & School Edition

**Status:** Implemented (Phase 12.4)
**Priority:** P1
**Last Updated:** 2026-02-15

---

## 1. Overview

### 1.1 Purpose

Deliver a production-grade school/enterprise layer for ChoreChamp that supports district administration, multi-school structures, classroom workflows, LMS integrations, compliance controls, and school reporting.

### 1.2 Scope

- District and school administration
- Multi-classroom roster management
- Teacher assignment issue/review loop
- School-wide challenge operations
- CSV import/export for student management
- LMS configuration and sync snapshots (Canvas, Google Classroom, Clever)
- FERPA/COPPA configuration and parent visibility controls
- School analytics and PDF/Excel report generation
- Administrative audit logging

### 1.3 Out of Scope

- Real-time bidirectional LMS gradebook synchronization
- Automated role provisioning from district SIS
- Dedicated district billing contract workflows

---

## 2. Domain Model

### 2.1 Core Entities

- `enterprise_districts`
- `enterprise_schools`
- `enterprise_classrooms`
- `enterprise_classroom_students`
- `enterprise_assignments`
- `enterprise_assignment_submissions`
- `enterprise_challenges`
- `enterprise_challenge_participations`
- `enterprise_bulk_imports`
- `enterprise_lms_integrations`
- `enterprise_parent_visibility`
- `enterprise_admin_audits`

### 2.2 Key Relationships

- One district can contain many schools.
- One school can contain many classrooms.
- One classroom can enroll many students.
- One assignment can have one submission per enrolled student.
- One school can configure multiple LMS providers.
- One student can have one visibility record per school.

---

## 3. API Design

### 3.1 Route Prefix

`/api/households/:householdId/enterprise/*`

### 3.2 Endpoint Groups

- Overview and admin lists
  - `GET /enterprise/overview`
  - `GET /enterprise/districts`
  - `POST /enterprise/districts`
  - `GET /enterprise/schools`
  - `POST /enterprise/schools`
  - `PATCH /enterprise/schools/:schoolId`
- Classroom and roster management
  - `POST /enterprise/schools/:schoolId/classrooms`
  - `GET /enterprise/schools/:schoolId/classrooms`
  - `POST /enterprise/classrooms/:classroomId/students`
  - `POST /enterprise/classrooms/:classroomId/students/import`
  - `GET /enterprise/classrooms/:classroomId/students`
  - `GET /enterprise/classrooms/:classroomId/students/export`
- Assignment lifecycle
  - `POST /enterprise/classrooms/:classroomId/assignments`
  - `GET /enterprise/classrooms/:classroomId/assignments`
  - `POST /enterprise/assignments/:assignmentId/submit`
  - `POST /enterprise/submissions/:submissionId/review`
  - `GET /enterprise/classrooms/:classroomId/dashboard`
- Challenge workflows
  - `POST /enterprise/schools/:schoolId/challenges`
  - `GET /enterprise/schools/:schoolId/challenges`
  - `POST /enterprise/challenges/:challengeId/participations`
- LMS workflows
  - `POST /enterprise/schools/:schoolId/lms/:provider`
  - `GET /enterprise/schools/:schoolId/lms`
  - `POST /enterprise/schools/:schoolId/lms/:provider/sync`
- Compliance and governance
  - `POST /enterprise/schools/:schoolId/parent-visibility/:studentMemberId`
  - `GET /enterprise/schools/:schoolId/parent-visibility`
  - `GET /enterprise/schools/:schoolId/analytics`
  - `GET /enterprise/schools/:schoolId/reports`
  - `GET /enterprise/imports`
  - `GET /enterprise/audits`

### 3.3 Authorization Rules

- Parent role is required for all administrative operations.
- Non-parent users are prevented from school administration endpoints.
- Audit events are persisted for mutating operations.

---

## 4. Compliance & Privacy

### 4.1 FERPA/COPPA Flags

School records expose:

- `ferpaModeEnabled`
- `coppaModeEnabled`

These values are stored with school configuration and surfaced in reporting.

### 4.2 Parent Visibility

Per-school per-student records define:

- visibility level (`private`, `summary`, `full`)
- teacher message visibility
- challenge visibility

### 4.3 Audit Logging

Administrative changes are written to `enterprise_admin_audits` with actor, event type, target metadata, and timestamp.

---

## 5. Reporting

### 5.1 Formats

- PDF (`application/pdf`) generated server-side as a binary payload encoded to base64.
- Excel-compatible CSV (`text/csv`) generated server-side and encoded to base64.

### 5.2 Contents

Reports include school profile metadata, classroom counts, assignment/submission metrics, approval rates, challenge activity, and connected LMS providers.

---

## 6. Web Portal

### 6.1 Route

`/households/:householdId/enterprise`

### 6.2 UX Modules

- District setup and district analytics
- School creation with branding and compliance toggles
- Classroom and roster management
- Assignment/review dashboard
- Challenge creation and participation defaults
- LMS configuration and sync controls
- Parent visibility overrides
- Report downloads and audit/history views

---

## 7. Testing

### 7.1 Implemented Tests

- `apps/api/src/routes/enterprise-school.test.ts`
  - CSV parsing edge cases
  - PDF structure generation sanity checks
  - Approval rate calculation behavior

### 7.2 Validation Commands

- `../../node_modules/.bin/tsc --noEmit` in:
  - `packages/api-client`
  - `apps/api`
  - `apps/web`
- `node_modules/.bin/vitest run src/routes/enterprise-school.test.ts` in `apps/api`

---

## 8. Risks and Follow-ups

### 8.1 Current Risks

- LMS sync is currently snapshot-style and not a full external system reconciliation.
- PDF generation is intentionally lightweight for broad runtime compatibility.

### 8.2 Recommended Next Enhancements

- OAuth token refresh and provider-specific sync adapters.
- Scheduled background LMS sync jobs.
- Enhanced report templates with branded headers and pagination.
