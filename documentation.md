# API Documentation

Backend base URL defaults to `http://localhost:8000`.

## Base Paths

The same route modules are mounted under versioned and unversioned aliases:

| Module | Versioned base path | Legacy base path |
| --- | --- | --- |
| Auth | `/api/v1/auth` | `/api/auth` |
| Application | `/api/v1/applications` | `/api/application`, `/api/applications` |
| Admin | `/api/v1/admin` | `/api/admin` |
| Student | `/api/v1/student` | `/api/student` |

Static uploads are served from `/uploads`.

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

Auth responses return:

```json
{
  "success": true,
  "message": "Login successful",
  "user": {},
  "accessToken": "jwt-token",
  "tokenType": "bearer"
}
```

Allowed user roles are `student`, `reviewer`, and `admin`. Admin routes also allow `superadmin`.

## Health

### `GET /health`

Public health check.

Response:

```json
{
  "status": "healthy"
}
```

## Auth Routes

Base paths: `/api/v1/auth` or `/api/auth`.

### `POST /register`

Creates a user account.

Body parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | string | Yes | Must be valid email. Stored lowercase by model behavior. |
| `password` | string | Yes | Stored as password hash. |
| `fullName` | string | Yes | Can also send `full_name`. |
| `full_name` | string | Yes | Alias for `fullName`. |
| `mobileNumber` | string | Yes | Can also send `mobile_number` or `mobile`. Must match Nepali mobile pattern. |
| `mobile_number` | string | Yes | Alias for `mobileNumber`. |
| `mobile` | string | Yes | Alias for `mobileNumber`. |
| `province` | string | Yes | Required. |
| `district` | string | Yes | Required. |
| `role` | string | No | Defaults to `student`. Allowed: `student`, `reviewer`, `admin`; invalid values become `student`. |

Validation:

- Required fields: full name, email, mobile number, password, province, district.
- Mobile format: optional `+977`, then numbers starting with `97` or `98`, total 10 local digits.
- Email or mobile number must be unique.

### `POST /login`

Logs a user in.

Body parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | string | Yes | Can also send `username`. |
| `username` | string | Yes | Alias for `email`. |
| `password` | string | Yes | Required. |
| `role` | string | No | If sent, must match the user's role. |

Validation:

- Inactive users cannot log in.
- Wrong credentials return `401`.
- Role mismatch returns `403`.

### `GET /me`

Requires authentication. Returns the authenticated user.

## Application Routes

Base paths: `/api/v1/applications`, `/api/application`, or `/api/applications`.

All application routes require authentication.

Editable actions are only allowed while the application status is `draft` or `need_correction`.

Application statuses:

```text
draft
submitted
under_review
need_correction
shortlisted
interviewed
approved
rejected
awarded
```

Required document types:

```text
recent_photograph
citizenship_front
citizenship_back
academic_transcript
character_certificate
```

If the applicant is a minor, `guardian_citizenship` is also required.

Allowed upload MIME types:

```text
application/pdf
image/jpeg
image/png
```

Max upload size: `10 MB`.

### `GET /me`

Gets or creates the authenticated user's application.

Response data:

```json
{
  "success": true,
  "message": "Application loaded",
  "data": {
    "application": {},
    "documents": []
  }
}
```

### `POST /`

Creates an application for the authenticated user. Fails if the user already has an application.

Body parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `educationLevel` | string | No | Alias: `education_level`. |
| `currentInstitution` | string | No | Alias: `current_institution`. |
| `gpaPercentage` | string | No | GPA from `0.0` to `4.0`. Aliases: `gpa_percentage`, `gpa`. |
| `familyIncomeRange` | string | No | Alias: `family_income_range`. |
| `district` | string | No | Applicant district. |
| `gender` | string | No | Applicant gender. |
| `permanentAddress` | string | No | Alias: `permanent_address`. |
| `temporaryAddress` | string | No | Alias: `temporary_address`. |
| `guardianFullName` | string | No | Alias: `guardian_full_name`. |
| `guardianContact` | string | No | Alias: `guardian_contact`. |
| `marginalizedCategory` | string | No | Alias: `marginalized_category`. |
| `disabilityStatus` | boolean | No | Alias: `disability_status`. Defaults false in normalization. |
| `sop` | string | No | Statement of purpose. |
| `entranceExamScore` | string | No | Alias: `entrance_exam_score`. |
| `completenessPercentage` | number | No | Alias: `completeness_percentage`. |
| `applicationData` | object | No | Alias: `application_data`. Defaults `{}`. |

### `PATCH /account`

Marks the account step complete and sets `currentStep` to at least `2`.

Body: none required.

### `PATCH /personal-info`

Saves personal details and recalculates `isMinor`.

Body parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `fullLegalName` | string | No | Alias: `full_legal_name`. Required later for submission. |
| `full_legal_name` | string | No | Alias for `fullLegalName`. |
| `dateOfBirth` | date string | No | Alias: `date_of_birth`. Cannot be in the future. |
| `date_of_birth` | date string | No | Alias for `dateOfBirth`. |
| `gender` | string | No | Required later for submission. |
| `district` | string | No | Required later for submission. |
| `permanentAddress` | string | No | Alias: `permanent_address`. Required later for submission. |
| `permanent_address` | string | No | Alias for `permanentAddress`. |
| `temporaryAddress` | string | No | Alias: `temporary_address`. |
| `temporary_address` | string | No | Alias for `temporaryAddress`. |
| `guardianFullName` | string | No | Alias: `guardian_full_name`. Required later for submission. |
| `guardian_full_name` | string | No | Alias for `guardianFullName`. |
| `guardianContact` | string | No | Alias: `guardian_contact`. Required later for submission. Must be valid mobile if sent. |
| `guardian_contact` | string | No | Alias for `guardianContact`. |

### `PATCH /academic`

Saves academic and supporting application details.

Body parameters are the same normalized application payload as `POST /`.

Validation:

- If `gpaPercentage` is sent, it must be a GPA number from `0.0` to `4.0`.

### `PATCH /me`

Updates the authenticated user's application using the same normalized payload as `POST /`.

### `POST /documents/upload`

Uploads or replaces a document for the authenticated user's application.

Content type: `multipart/form-data`.

Form fields:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `file` | file | Yes | PDF, JPG/JPEG, or PNG. Max 10 MB. |
| `documentType` | string | Yes | Alias: `document_type`. Must be an allowed document type. |
| `document_type` | string | Yes | Alias for `documentType`. |

If a document already exists for the same `documentType`, the old database document and provider file are deleted before creating the new one.

### `POST /:applicationId/documents`

Uploads or replaces a document for the authenticated user's application after checking that `applicationId` belongs to the user.

Path parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `applicationId` | MongoDB ObjectId | Yes | Must belong to authenticated user. |

Form fields are the same as `POST /documents/upload`.

### `DELETE /documents/:documentType`

Deletes one uploaded document.

Path parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `documentType` | string | Yes | Document type to remove. |

### `POST /submit`

Submits the application.

Body parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `confirmationAccepted` | boolean | Yes | Alias: `confirmation_accepted`. Must be truthy. |
| `confirmation_accepted` | boolean | Yes | Alias for `confirmationAccepted`. |

Submission validation requires:

- Account user has full name, valid email, valid mobile number, province, and district.
- Application has `fullLegalName`, `dateOfBirth`, `gender`, `district`, `permanentAddress`, `guardianFullName`, and `guardianContact`.
- Application has `educationLevel`, `currentInstitution`, `gpaPercentage`, and `familyIncomeRange`.
- GPA is valid from `0.0` to `4.0`.
- All required documents are uploaded.
- Minor applicants also need `guardian_citizenship`.

On success, status becomes `submitted`, `currentStep` becomes `5`, and `completenessPercentage` becomes `100`.

### `POST /me/submit`

Alias for `POST /submit`.

## Student Routes

Base paths: `/api/v1/student` or `/api/student`.

All student routes require authentication and role `student`.

### `GET /application-status`

Returns the student's application status summary.

Response when no application exists:

```json
{
  "success": true,
  "data": {
    "status": "not_started",
    "completenessPercentage": 0,
    "documents": []
  }
}
```

Response when application exists:

```json
{
  "success": true,
  "data": {
    "applicationId": "PGS-...",
    "status": "draft",
    "currentStep": 1,
    "completenessPercentage": 0,
    "submittedAt": null,
    "reviewRemarks": null,
    "documents": []
  }
}
```

## Admin Routes

Base paths: `/api/v1/admin` or `/api/admin`.

All admin routes require authentication and one of these roles:

```text
admin
superadmin
reviewer
```

### `GET /dashboard`

Returns aggregate dashboard data.

Response shape:

```json
{
  "stats": {
    "totalApplicants": 0,
    "underReview": 0,
    "shortlisted": 0,
    "awarded": 0,
    "byStatus": {}
  },
  "topDistricts": [],
  "levelCounts": [],
  "genderCounts": [],
  "recentApplications": []
}
```

### `GET /applications`

Lists applications.

Query parameters:

| Name | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `status` | string | No | none | If `all`, no status filter is applied. |
| `search` | string | No | none | Searches application ID, district, education level, user full name, email, and mobile number. |
| `page` | number | No | `1` | Pagination page. |
| `limit` | number | No | `20` | Page size. |

Response shape:

```json
{
  "applications": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

### `GET /applications/:id`

Gets an application with its documents.

Path parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | MongoDB ObjectId | Yes | Application `_id`. |

Response shape:

```json
{
  "application": {},
  "documents": []
}
```

### `PATCH /applications/:id/status`

Updates application status and review fields.

Path parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | MongoDB ObjectId | Yes | Application `_id`. |

Body parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | string | Yes | Must be one of the application statuses. |
| `reviewNotes` | string | No | Saved to `reviewNotes`. |
| `reviewRemarks` | string | No | Saved to `reviewRemarks`. |

The backend also sets `reviewedBy`, `reviewedAt`, and appends a timeline event.

### `PATCH /applications/:id/request-correction`

Requests corrections and changes status to `need_correction`.

Path parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | MongoDB ObjectId | Yes | Application `_id`. |

Body parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `remarks` | string | Yes | Saved to both `reviewRemarks` and `reviewNotes`. |
| `fields` | array | No | Defaults to `[]`. Non-array values are saved as `[]`. |

### `POST /admin/campaigns/send`

Sends a bulk campaign email to active subscribers for a matching target level and target course.

This route is mounted separately from the main admin base path:

```text
POST /api/v1/admin/campaigns/send
POST /api/admin/campaigns/send
```

Authentication:

```http
Authorization: Bearer <admin_accessToken>
Content-Type: application/json
```

Only users with the `admin` role can call this route.

Body parameters:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `targetLevel` | string | Yes | Must exactly match subscriber `targetLevel`. Alias: `target_level`. |
| `targetCourse` | string | Yes | Must exactly match subscriber `targetCourse`. Alias: `target_course`. |
| `subject` | string | Yes | Email subject. |
| `message` | string | Yes | Email message body. |

Postman test case:

1. Log in as an admin and copy `accessToken`.
2. Create or confirm at least one active subscription with the same `targetLevel` and `targetCourse`.
3. Send the campaign request below.

Request:

```http
POST http://localhost:8000/api/admin/campaigns/send
```

Headers:

```http
Authorization: Bearer <admin_accessToken>
Content-Type: application/json
```

Body:

```json
{
  "targetLevel": "Bachelor",
  "targetCourse": "Information Technology",
  "subject": "Scholarship Application Update",
  "message": "Applications for the Bachelor Information Technology scholarship are now open. Please visit the scholarship portal for details."
}
```

Equivalent snake_case body:

```json
{
  "target_level": "Bachelor",
  "target_course": "Information Technology",
  "subject": "Scholarship Application Update",
  "message": "Applications for the Bachelor Information Technology scholarship are now open. Please visit the scholarship portal for details."
}
```

Successful response:

```json
{
  "success": true,
  "message": "Campaign email sending completed",
  "campaign": {
    "subject": "Scholarship Application Update",
    "message": "Applications for the Bachelor Information Technology scholarship are now open. Please visit the scholarship portal for details.",
    "targetLevel": "Bachelor",
    "targetCourse": "Information Technology",
    "totalRecipients": 1,
    "sentCount": 1,
    "failedCount": 0,
    "status": "sent",
    "sentBy": "admin-user-id",
    "sentAt": "2026-06-02T00:00:00.000Z",
    "createdAt": "2026-06-02T00:00:00.000Z",
    "updatedAt": "2026-06-02T00:00:00.000Z",
    "id": "campaign-id"
  }
}
```

Validation/error cases to test in Postman:

| Case | Request change | Expected result |
| --- | --- | --- |
| Missing token | Remove `Authorization` header. | `401` with authentication error. |
| Non-admin token | Use a student/reviewer token. | `403` permission error. |
| Missing target level | Remove `targetLevel` / `target_level`. | `400` with `Target level is required`. |
| Missing target course | Remove `targetCourse` / `target_course`. | `400` with `Target course is required`. |
| Missing subject | Remove `subject`. | `400` with `Subject is required`. |
| Missing message | Remove `message`. | `400` with `Message is required`. |
| No matching subscribers | Use a target level/course with no active subscribers. | `200`; campaign is created with `totalRecipients: 0`, `sentCount: 0`, `failedCount: 0`, and `status: "sent"`. |

Email sending notes:

- Recipients are selected from subscriptions where `targetLevel`, `targetCourse`, and `isSubscribed: true` all match.
- Matching is exact after trimming request values, so `Bachelor` and `bachelor` are different.
- If there are matching subscribers, email configuration must be valid or the request can fail after creating the campaign record.
- The backend waits `EMAIL_SEND_DELAY_MS` between recipients. Default: `500` milliseconds.

## Frontend API Wrapper Paths

The frontend currently calls the unversioned aliases through `frontend/src/api`:

| Function | Method and path |
| --- | --- |
| `register(payload)` | `POST /auth/register` |
| `login(payload)` | `POST /auth/login` |
| `me()` | `GET /auth/me` |
| `getMyApplication()` | `GET /application/me` |
| `saveAccountStep()` | `PATCH /application/account` |
| `savePersonalInfo(payload)` | `PATCH /application/personal-info` |
| `saveAcademic(payload)` | `PATCH /application/academic` |
| `uploadDocument(documentType, file, onUploadProgress)` | `POST /application/documents/upload` |
| `deleteDocument(documentType)` | `DELETE /application/documents/:documentType` |
| `submitApplication(payload)` | `POST /application/submit` |
| `getAdminDashboard()` | `GET /admin/dashboard` |
| `getApplications(params)` | `GET /admin/applications` |
| `getApplicationDetail(id)` | `GET /admin/applications/:id` |
| `getSubscriptions(params)` | `GET /admin/subscriptions` |
| `sendCampaignEmail(payload)` | `POST /admin/campaigns/send` |
| `updateApplicationStatus(id, payload)` | `PATCH /admin/applications/:id/status` |
| `requestCorrection(id, payload)` | `PATCH /admin/applications/:id/request-correction` |

## Storage Configuration

Provider-neutral upload code is exposed from `backend/src/storage`.

Exports:

```js
const {
  uploadMiddleware,
  uploadFile,
  uploadfile,
  deleteFile,
  getFileUrl,
} = require('../storage');
```

Environment variables:

| Name | Default | Notes |
| --- | --- | --- |
| `UPLOAD_DIR` | `uploads` | Local upload directory. |
| `STORAGE_PROVIDER` | `local` | Supported values: `local`, `cloudinary`, `s3`. |
| `STORAGE_FOLDER` | `scholarship-documents` | Provider folder/prefix. |
| `CLOUDINARY_CLOUD_NAME` | none | Required for Cloudinary provider. |
| `CLOUDINARY_API_KEY` | none | Required for Cloudinary provider. |
| `CLOUDINARY_API_SECRET` | none | Required for Cloudinary provider. |
| `AWS_REGION` | `us-east-1` | Required for S3 provider. |
| `AWS_S3_BUCKET` | none | Required for S3 provider. |
| `AWS_ACCESS_KEY_ID` | none | Optional if runtime provides AWS credentials. |
| `AWS_SECRET_ACCESS_KEY` | none | Optional if runtime provides AWS credentials. |
| `AWS_CLOUDFRONT_URL` | none | Optional public URL prefix for S3 files. |

Cloudinary requires the `cloudinary` package. S3 requires `@aws-sdk/client-s3`.
