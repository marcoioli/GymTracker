# Auth Gate — Spec

**Change:** `insforge-backend-sync`
**Area:** Mandatory auth/login gate and pre-login local data handling

## Spec 1 — Mandatory Auth Gate

### Requirement 1.1: Login Required Before App Use

The application **MUST** require successful authentication before granting access to the core workout UI (routines, sessions, history, analytics, backup).

### Requirement 1.2: InsForge Auth Integration

The authentication system **SHALL** use InsForge Auth (email/password v1) as the sole provider unless an explicit later change adds OAuth.

### Requirement 1.3: Auth Session Management

An authenticated session **MUST** be maintained across page reloads and browser sessions until the user explicitly signs out.

### Requirement 1.4: Auth State Accessibility

The app **SHALL** expose the current auth state (authenticated/unauthenticated, user ID) through a single, testable source of truth usable by routers, repositories, and sync services.

### Requirement 1.5: No App Use Without Auth

Unauthenticated users **MUST NOT** be able to create, edit, or view routines, sessions, history, or analytics through the normal app UI.

### Requirement 1.6: Password Reset

The system **SHOULD** provide a password reset flow using InsForge Auth capabilities.

### Requirement 1.7: Email Verification

Whether email verification is required before sync access **MAY** be deferred to apply-time configuration; the system **SHOULD** handle unverified states gracefully without crashing.

## Spec 2 — Pre-Login / Anonymous Local Data

### Requirement 2.1: Local Data Survives Install

If the app is installed and used before the user logs in (during a grace period or legacy install), local Dexie data **SHALL** persist unchanged in IndexedDB.

### Requirement 2.2: No Silent Upload

Existing local Dexie data **MUST NOT** be automatically uploaded to InsForge upon first login. Upload requires explicit user action via the manual import flow (Spec 3).

### Requirement 2.3: Auth Gate Blocks New Local Writes

Once the auth gate is active (v1), a fresh install **SHALL** present the login screen before any new data can be created locally.

### Requirement 2.4: Sign-Out Behavior

On explicit sign-out:

- Local Dexie data **MAY** be retained in IndexedDB to allow a later manual import on re-login.
- Any in-memory InsForge session tokens **MUST** be cleared.
- The user **MUST** be redirected to the login screen.

### Requirement 2.5: Local Cache Ownership Boundary

After login, normal app screens **MUST** read only local Dexie rows owned by the authenticated user. Legacy or unclaimed local rows **MUST** be quarantined from routine, workout, history, analytics, and dashboard screens until the user explicitly imports them.

### Requirement 2.6: No Cross-Account Local Cache Mixing

If a different user signs in on the same device, the app **MUST NOT** show another account's local cache rows. It **SHALL** either scope reads by `ownerUserId` or require the user to import/claim legacy data into the current account first.

## Scenarios

### Scenario 1.1 — Fresh Install: Login Gate Blocks Access

**Given** a user installs the app for the first time after v1 auth is active
**When** the app loads
**Then** the user sees a login screen
**And** the core workout UI is not accessible
**And** no local Dexie data has been created yet

### Scenario 1.2 — Successful Login: App Opens

**Given** a user is on the login screen
**When** they provide valid credentials
**Then** the app authenticates via InsForge Auth
**And** the user is redirected to the dashboard/tracker
**And** the auth session is persisted across reloads

### Scenario 1.3 — Invalid Login: Error Shown

**Given** a user is on the login screen
**When** they provide invalid credentials
**Then** an error message is displayed
**And** the user remains on the login screen
**And** no app data is loaded

### Scenario 1.4 — Page Reload: Session Restored

**Given** a user is authenticated
**When** the page is reloaded
**Then** the InsForge session is restored
**And** the user remains on the app UI without re-login

### Scenario 1.5 — Sign-Out: Local Data Preserved

**Given** an authenticated user with local Dexie data
**When** the user signs out
**Then** the InsForge session is cleared
**And** the user is redirected to the login screen
**And** existing local Dexie data is not deleted

### Scenario 1.6 — Password Reset

**Given** a user is on the login screen
**When** they request a password reset
**Then** the InsForge password reset flow is initiated
**And** the user receives reset instructions

### Scenario 2.1 — Legacy Install: Local Data Survives

**Given** a user has existing Dexie data from a pre-v1 install
**When** the v1 auth-gate version is first loaded
**Then** the Dexie data remains intact in IndexedDB
**And** the user is presented with the login screen
**And** the data is not uploaded without explicit import action
**And** the data is not shown in authenticated app screens until imported or claimed by the current user

### Scenario 2.2 — Re-Login After Sign-Out: Manual Import Still Needed

**Given** a user signed out with local Dexie data
**When** they log back in
**Then** they see the app UI
**And** their previous local Dexie data has not been silently merged with their cloud account
**And** they can initiate a manual import if desired
