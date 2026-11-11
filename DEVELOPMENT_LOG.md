# Development Log – Job ATS Backend

This document is the detailed implementation record for the project. The project review remains a high-level summary of milestones; this file captures the actual development work, function-level responsibilities, and the reason each change matters.

---

## 1. Architecture foundation

### Overview
The backend was structured as a layered Express + MongoDB service using controllers, routes, models, utilities, and middleware. This setup keeps business logic separated from HTTP handling and makes the system easier to extend and test.

### Components introduced or stabilized

#### `src/app.js`
- Creates the Express application instance.
- Configures middleware for JSON parsing, URL encoding, cookie parsing, and CORS.
- Exposes the `/api/v1/health` route for service checks.
- Mounts route groups for auth, jobs, applicants, and applications.
- Registers the global error handler.
- Adds stability by enforcing a consistent request pipeline and centralized error response pattern.

#### `src/db/index.js`
- Establishes the MongoDB connection through Mongoose.
- Validates the database connection before the app continues to serve traffic.
- Stabilizes startup behavior by failing fast if the database is unavailable.

#### `src/index.js`
- Initializes environment variables and starts the server after DB connection.
- Ensures the app boots in the expected runtime environment.
- Makes deployment and local setup easier by centralizing startup behavior.

---

## 2. Authentication and access control

### Milestone goal
Provide secure login, signup, token refresh, logout, and role-based access control for applicants and recruiters.

### Functions and responsibilities

#### `applicantSignup` and internal `recruiterSignup`
- Validate required user fields before creating records.
- Prevent duplicate accounts by checking email uniqueness.
- Create the user document and hash the password through the model lifecycle.
- Generate JWT access and refresh tokens.
- Store the refresh token and return the user payload with the access token.
- Adds a secure registration flow and establishes user identity for future requests.

#### `applicantLogin` and `recruiterLogin`
- Validate email and password input.
- Check the user record and verify credentials using the model password comparison method.
- Generate fresh tokens and update the stored refresh token.
- Returns a safe user payload without exposing sensitive fields.
- Stabilizes authentication by preventing unauthorized access and ensuring tokens are always issued only for valid users.

#### `refreshApplicantAccessToken` and `refreshRecruiterAccessToken`
- Verify the incoming refresh token using the environment secret.
- Confirm the token matches the one stored in the database.
- Issue a new access token only when the refresh token remains valid.
- Improves session resilience and prevents stale or revoked tokens from being used.

#### `applicantLogout` and `recruiterLogout`
- Clear the refresh token from the stored user record and remove it from the cookie.
- Ensures sign-out is consistent and prevents token reuse after logout.
- Stabilizes session management by terminating active authenticated state.

#### `verifyJwt`
- Reads the access token from the Authorization header.
- Verifies the signature and decodes the payload.
- Attaches `req.user = { id, role }` for downstream controllers.
- Creates the security boundary for authenticated routes.

#### `authorizeRoles`
- Accepts one or more allowed roles.
- Checks whether the authenticated user has permission to access the route.
- Blocks unauthorized actions before business logic runs.
- Stabilizes authorization by reducing accidental privilege exposure.

#### `getRecruiterProfile` and `getRecruiterDashboardStats`
- Fetch recruiter records securely.
- Validate the user identifier before querying.
- Aggregate metrics such as job counts, open job counts, total applicants, and application status totals.
- Adds monitoring value for the recruiter dashboard and makes admin actions observable.

---

## 3. Applicant profile and resume handling

### Milestone goal
Enable applicant registration, profile updates, resume validation, and resume upload without allowing invalid or unsafe data.

### Functions and responsibilities

#### `validateResumeFile`
- Ensures a file is present.
- Rejects files bigger than 2MB.
- Accepts only PDF, DOC, or DOCX MIME types.
- Prevents broken or malicious uploads and improves data quality.

#### `createApplicant`
- Creates applicant record in a safe and consistent way.
- Validates required input and rejects empty or duplicate user data.
- Returns a secure response object.
- Adds basic applicant onboarding flow to the system.

#### `canApplicantApplyToJob`
- Returns `false` when a job is closed or missing.
- Protects job application logic by blocking invalid submissions.
- Stabilizes the ATS by preventing applications against inactive job posts.

#### `validateResumeUrl`
- Validates that the resume URL is a non-empty HTTP or HTTPS URL.
- Prevents invalid or malformed profile data.
- Stabilizes applicant profile quality and reduces downstream errors.

#### `applyToJob`
- Validates both applicant and job IDs.
- Checks whether the job exists and is still open.
- Prevents duplicate applications for the same applicant/job pair.
- Creates the application record and appends an application history entry.
- Saves the application reference on the applicant profile.
- Adds the primary job application workflow to the ATS.

#### `getApplicantProfile` and `updateApplicantProfile`
- Fetch and update applicant details while protecting sensitive fields.
- Enforce non-empty values and valid field types.
- Keep profile management consistent with the rest of the system.
- Enables applicant self-service profile management.

#### `updateApplicantResume`
- Validates the provided resume URL before updating the profile.
- Ensures only valid HTTP or HTTPS URLs are accepted.
- Improves data integrity in applicant records.

#### `uploadApplicantResume`
- Accepts an uploaded file from the request.
- Runs MIME and size validation before saving.
- Stores a local resume path and updates the applicant profile.
- Adds a file upload workflow necessary for real recruitment systems.

---

## 4. Job lifecycle management

### Milestone goal
Allow recruiters to create, view, update, and delete jobs while validating job data to ensure quality and consistency.

### Functions and responsibilities

#### `validateJobPayload`
- Checks for presence and correctness of `title`, `description`, `jobStages`, and `numberOfPositions`.
- Rejects empty job titles, missing descriptions, empty stage arrays, and invalid position counts.
- Stabilizes the job creation flow by preventing invalid records from reaching the database.

#### `createJob`
- Validates the incoming payload before record creation.
- Normalizes the job stages and trims text values.
- Stores the job and returns a structured API response.
- Adds a core ATS feature for job posting.

#### `getAllJobs`
- Returns all jobs sorted by creation date.
- Enables recruiter and applicant discovery of currently available openings.

#### `getJobbyId`
- Validates the job ID.
- Fetches the specific job profile.
- Returns a clear error when the job does not exist.
- Helps the system provide job-specific details safely.

#### `updateJob`
- Allows partial updates to the job record.
- Validates changed values before saving.
- Updates title, description, stages, positions, skill requirements, and open/closed flag.
- Keeps data consistent and prevents silent corruption of job definitions.

#### `deleteJob`
- Validates the ID and deletes the matching job.
- Ensures only valid job identifiers are deleted.
- Adds lifecycle control for job listings and administrative cleanup.

---

## 5. Application workflow state machine

### Milestone goal
Model the applicant hiring pipeline in a controlled, validated way so recruiters can only move applications through valid states.

### Functions and responsibilities

#### `FSM`
- Central logic for application lifecycle transitions.
- Rejects transitions when the application is already terminal.
- Validates `NEXT_STAGE`, `REJECT`, `WITHDRAW`, and `HIRE` actions.
- Prevents invalid workflow states and stabilizes the ATS by enforcing agreed business rules.

#### `advanceApplicationStage`
- Validates application and job IDs.
- Confirms the job exists and has defined stages.
- Uses the FSM to compute the next valid stage.
- Saves the updated stage and history log.
- Adds recruiter-controlled progression through the hiring flow.

#### `rejectApplication`
- Validates the application.
- Ensures the application is not already terminal.
- Uses the FSM to mark the application as rejected.
- Logs recruiter action in the history.
- Adds a required recruiter decision path.

#### `withdrawApplication`
- Validates the applicant’s ownership of the application.
- Ensures the applicant is only withdrawing their own record.
- Uses the FSM to move the application to `WITHDRAWN`.
- Adds applicant self-service control and improves trust in the system.

#### `hireApplication`
- Marks the application as hired when valid.
- Ensures terminal-state rules are followed.
- Logs recruiter action in history.
- Adds final recruiter decision handling to the lifecycle.

#### `getAllApplications`, `getSingleApplication`, `getFilteredApplication`
- Return applications with role-aware access.
- Applicants are restricted to their own records.
- Admin users can see all applications or filter by query parameters.
- Stabilizes retrieval logic and enforces authorization on read operations.

---

## 6. Why this work matters for the overall system

The project was intentionally built to focus on three core strengths:

1. Security
   - JWT auth and role checks prevent unauthorized user actions.

2. Data integrity
   - Validation functions reject malformed job and resume data before it reaches the database.

3. Reliable process flow
   - The state machine ensures application lifecycle rules are never broken.

This combination is what turns the project from a basic CRUD service into a meaningful ATS backend MVP.

---

## 7. Security hardening and environment validation

### Milestone goal
Move the API from a working MVP into a safer, more production-oriented backend by improving baseline security and validating required runtime configuration before booting the application.

### Functions to be added or updated

#### `validateRequiredEnv()`
- Checks that required environment variables exist before the server starts.
- Validates critical values like JWT secrets and MongoDB URI.
- Stops the application early when startup configuration is incomplete.
- Adds operational stability by preventing a misconfigured service from starting in a broken state.

#### `securityHeadersMiddleware`
- Applies process-level protections using `helmet`.
- Adds default HTTP headers that reduce common web vulnerabilities.
- Hardens the app without changing business logic.

#### `apiRateLimiter`
- Limits repeated requests to public endpoints and auth routes.
- Reduces brute-force risk and helps maintain service availability.
- Improves production resilience under abusive or accidental traffic spikes.

### Why this matters
This change does not add new ATS business features, but it stabilizes the system by improving the security baseline and preventing invalid deployment configuration from causing runtime issues.

### Verification plan
- Run the health route test to confirm the middleware does not break the app.
- Run a focused test verifying security headers are present on API responses.
- Confirm environment validation fails cleanly when required variables are missing.

---

## 8. Jest suite normalization and release baseline

### Milestone goal
Ensure every test file is executed by the configured Jest runner so the release baseline reflects the real state of the project.

### Functions covered

#### `canApplicantApplyToJob()` and `validateJobPayload()`
- Verify closed-job application rules and job creation validation through Jest assertions.
- Prevent the test runner from silently ignoring core business-rule checks.

#### `validateResumeFile()`
- Verify accepted resume formats, the 2MB size limit, and rejection of unsupported MIME types.
- Keeps upload constraints stable as product features are added.

#### `validateResumeUrl()`
- Verify HTTP/HTTPS resume URL acceptance and rejection of empty, malformed, or unsupported URLs.
- Protects applicant profile data quality from regression.

### Why this matters
The files previously used Node's `node:test` API while the project was configured to run Jest. Jest reported those files as empty suites, which made the overall command fail even though their assertions passed under a different runner. Converting them gives CI one authoritative test command and makes the product release baseline trustworthy.

---

## 9. Product security boundary and API consistency

### Milestone goal
Make the service safe to expose as a product by preventing unauthenticated privilege escalation and ensuring unsupported API requests receive the same JSON response contract as other API failures.

### Functions and route behavior updated

#### Recruiter provisioning route
- Removes the public recruiter signup route from the runtime API.
- Keeps recruiter creation available through the controlled seed/admin provisioning flow.
- Protects the immutable `ADMIN` role from being self-assigned by anonymous users.

#### API fallback response
- Adds a JSON `404` response for unknown routes under the Express application.
- Gives frontend and API clients a predictable `{ success, message, errors }` failure shape.
- Prevents Express's default HTML error page from leaking into an otherwise JSON API.

### Why this matters
This closes a high-impact authorization gap before deployment and makes the backend behave like a stable product API at its boundary, including for incorrect client URLs.

---

## 10. API validation coverage

### Milestone goal
Expand the test suite beyond the basic health route so the backend is validated at the config and business-rule level before more features are added.

### Functions covered by tests

#### `validateRequiredEnv()`
- Ensures required startup variables are present.
- Rejects invalid runtime configuration before the database connects.
- Prevents boot-time misconfiguration from quietly causing production failures.

#### `validateJobPayload()`
- Validates title, description, stage list, and position count.
- Rejects empty job definitions and invalid hiring constraints.
- Stabilizes job creation and update flows by catching invalid data before database writes.

### Why this matters
These tests verify the highest-value application safeguards without depending on a running MongoDB instance. This gives the project a stronger safety net while the backend continues to mature.

---

## 11. Auth flow validation

### Milestone goal
Add a real Jest-based validation layer for the core authentication flows so signup behavior is tested before broader API coverage expands.

### Functions covered by tests

#### `applicantSignup`
- Validates required applicant fields.
- Rejects duplicate email usage.
- Creates the applicant record and generates an access + refresh token pair.
- Stores the refresh token and returns a safe user payload.
- Adds reliability to the applicant onboarding flow and prevents accidental duplicate accounts.

#### Internal `recruiterSignup`
- Validates required recruiter fields.
- Prevents duplicate recruiter accounts.
- Remains available for controlled provisioning and direct validation, but is not exposed as an anonymous runtime route.
- Prevents public users from self-assigning the immutable `ADMIN` role.

### Why this matters
These tests validate the business-critical entry points for identity creation, which is the foundation for the rest of the ATS permissions and workflow logic.

### Compatibility note
The project runs in ESM mode, so Jest globals must be imported explicitly with `@jest/globals` for the test environment to support `describe`, `it`, and `jest.spyOn` without runtime errors.

### Execution guard
The shared `asyncHandler` wrapper now handles direct controller invocation safely when no Express `next` callback is supplied, which keeps tests realistic while preserving the normal Express error flow in production routes.

---

## 12. Current milestone summary

### Completed milestone areas
- Authentication and user identity flow
- Applicant and recruiter profile management
- Job creation and validation
- Application lifecycle state handling
- Resume validation and upload support
- Recruiter dashboard summary logic
- Jest + Supertest test infrastructure
- Initial production hardening for security headers and request throttling

### Remaining focus for production readiness
- More exhaustive route-level testing
- Better recruiter/admin feature depth
- More detailed applicant profile storage
- Deployment hardening and environment configuration polish

This file contains the detailed implementation logic. The main review document should remain a concise milestone summary, not a full development journal.
