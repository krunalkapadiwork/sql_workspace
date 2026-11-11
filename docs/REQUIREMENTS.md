# SQL Workspace – Requirements

> **Status:** Approved baseline v1.0 (2026-11-10)
> This document describes **business and functional requirements only**. Technical decisions live in `ARCHITECTURE.md`.
> Rules tagged `[Dn]` are approved decisions. They must not be changed without explicit approval from the project owner (see `PROGRESS.md` → Decision Log).

---

## 1. Overview

SQL Workspace is a multi-tenant platform. A single **Super Admin** onboards **Admins**, and each Admin runs an isolated workspace with their own users, designations (job titles) and projects. Access to each project is controlled by permissions granted per user.

### 1.1 Objectives
- Invitation-based onboarding, so no one self-registers.
- Strict separation between Admin workspaces.
- Flexible, granular project permissions that are simple to manage.
- Secure account access and recovery.

---

## 2. Actors

| Actor | Description |
|---|---|
| **Super Admin** | The single highest-level account. It is created during system setup and manages Admins. It has full control over every workspace. |
| **Admin** | Owns one isolated workspace. Manages their users, designations, projects and project permissions. |
| **User** | A member of exactly one Admin's workspace. Has exactly one designation. What they can do in each project depends on the permissions they've been granted. |

---

## 3. Business Rules

### 3.1 Roles and Tenancy
- **BR-1 [D4]** There are exactly three system roles: `SUPER_ADMIN`, `ADMIN` and `USER`. System roles cannot be created, edited or deleted.
- **BR-2 [D2]** There is exactly one Super Admin. It is created during system setup, never through the application, and cannot be deleted or deactivated.
- **BR-3** The Super Admin's initial password must be changed on first login.
- **BR-4 [D1]** Each Admin owns an isolated workspace. Users, designations and projects belong to exactly one workspace and are never visible to other Admins or their users.
- **BR-5 [D3]** The Super Admin has full control. It can view, create, edit and delete anything in any workspace.
- **BR-6 [D4]** Users created by an Admin always have the `USER` role. An Admin cannot create another Admin.

### 3.2 Accounts
- **BR-7 [D12]** Email addresses are globally unique and case-insensitive. Inviting an email that already exists anywhere in the system is rejected.
- **BR-8 [D11]** An account has one of three statuses:
  - `INVITED`: created, but the invitation hasn't been accepted yet.
  - `ACTIVE`: can log in.
  - `INACTIVE`: deactivated and cannot log in.
- **BR-9 [D13]** When an Admin is deactivated, the Admin **and all users in their workspace** can no longer log in, and their active sessions end. All data is kept. Reactivating the Admin restores access for users who are themselves `ACTIVE`.
- **BR-10** An Admin can deactivate and reactivate users in their own workspace.
- **BR-11 [D14]** Deletion is always a **soft delete**: records are hidden from normal use but kept. Nothing is permanently deleted through the application.
- **BR-12** A deleted or deactivated user's email stays reserved (BR-7). Reusing it requires the existing record to be restored.

### 3.3 Designations
- **BR-13 [D15]** When an Admin is created, four default designations are added to their workspace: *Project Manager*, *Project Coordinator*, *Developer* and *QA Engineer*. The Admin can edit or delete them like any other designation.
- **BR-14** Admins can create, view, update and delete designations in their workspace. Designation names must be unique within a workspace (case-insensitive).
- **BR-15 [D17]** Every user (`USER` role) has **exactly one** designation, and it is required.
- **BR-16 [D16]** A designation cannot be deleted while any (non-deleted) user is assigned to it.
- **BR-17 [D5]** Each designation can have a set of **default project permissions** (see 3.5).
- **BR-18** Changing a designation's default permissions does **not** change permissions that were already granted to existing project members. It only affects members added afterwards.

### 3.4 Projects
- **BR-19** Admins can create, view, update and delete (soft delete) projects in their workspace.
- **BR-20** A project has a name (unique within the workspace), an optional description, a status (`ACTIVE` or `ARCHIVED`), and optional start and end dates. The end date can't be earlier than the start date.
- **BR-21** Archived projects are read-only for everyone except the Admin and Super Admin.
- **BR-22** Users can only see projects they're members of.
- **BR-23** Admins have full access to every project in their workspace without being added as members. Admins are not added as project members.

### 3.5 Project Permissions
- **BR-24 [D6]** Permissions are granted per user, per project. The permissions available in v1 are:

  | Permission | Meaning in v1 |
  |---|---|
  | `READ` | View the project, its details and its member list |
  | `CREATE` | Create resources within the project *(reserved for future project resources)* |
  | `UPDATE` | Edit project details (name, description, dates) |
  | `DELETE` | Delete resources within the project *(reserved for future project resources)* |
  | `MANAGE_MEMBERS` | Add or remove project members and change their permissions |

- **BR-25** Every project member has at least `READ`.
- **BR-26 [D6]** The permission model must allow **per-module permissions** inside a project to be added later (e.g. *Queries: READ+CREATE*) without changing the meaning of existing grants.
- **BR-27 [D5]** When a user is added to a project, they start with their designation's default permissions. The person adding them can then adjust (override) those permissions for that user in that project.
- **BR-28** A user can be a member of many projects in their workspace, with different permissions in each. Only users from the project's own workspace can be added.
- **BR-29 [D7]** A member holding `MANAGE_MEMBERS` can add and remove members and edit their permissions, but:
  - they can only grant permissions they hold themselves.
  - they can't change their own permissions or remove themselves.
  - they can't change or remove a member who holds a permission they don't have.
- **BR-30** Only the Admin (or Super Admin) can change a project's status or delete it.
- **BR-31** Removing a member immediately revokes all of their permissions on that project.
- **BR-32** Deactivating or deleting a user immediately revokes their access to every project.

### 3.6 Invitations
- **BR-33** Accounts are created only by invitation:
  - The Super Admin invites Admins.
  - An Admin invites Users into their workspace and must assign a designation.
- **BR-34** An invitation has one of four statuses [D11]:
  - `PENDING`: sent and awaiting acceptance.
  - `ACCEPTED`: the invitee set a password and activated the account.
  - `EXPIRED`: the validity period has passed.
  - `REVOKED`: cancelled by an authorized person, or replaced by a newer invitation.
- **BR-35 [D8]** An invitation is valid for **48 hours** by default. The duration is configurable by the system operator.
- **BR-36** An invitation link can be used only once. After it's accepted, the link no longer works.
- **BR-37 [D9]** An invitation can be resent while its status is `PENDING` or `EXPIRED`. Resending creates a new link with a new validity period and **immediately invalidates** the previous link (its status becomes `REVOKED`).
- **BR-38 [D9]** Who can resend:
  - The Super Admin, for any invitation.
  - An Admin, for invitations to users in their own workspace.
- **BR-39 [D10]** The same people (BR-38) can revoke a `PENDING` invitation. A revoked invitation can be replaced by resending.
- **BR-40** Accepting an invitation requires a new password that meets the password policy (BR-46). On success, the invitation becomes `ACCEPTED` and the account becomes `ACTIVE`.
- **BR-41** An invitation can't be accepted if the inviting Admin's workspace is deactivated or the invited account was deleted.
- **BR-42** Only one usable invitation can exist per account at a time.

### 3.7 Authentication and Account Security
- **BR-43** Only `ACTIVE` accounts in active workspaces can log in. Login uses email and password.
- **BR-44 [D18]** A login session expires after a period of inactivity (see `ARCHITECTURE.md`). Users can log out, which ends their current session.
- **BR-45 [D19]** After **5** consecutive failed login attempts, the account is locked for **15 minutes**. The login response must not reveal whether the email exists.
- **BR-46** Password policy: at least 8 characters, with at least one upper-case letter, one lower-case letter, one digit and one symbol.
- **BR-47 [D19]** Users can change their password while logged in, which requires the current password.
- **BR-48 [D19]** Forgot password: a user enters their email and receives a reset link if an `ACTIVE` account exists. The response is the same whether or not the account exists. Reset links are single use, expire after **1 hour**, and requesting a new one invalidates the previous one.
- **BR-49** Changing or resetting a password ends the user's other sessions.
- **BR-50** Out of scope for v1: logging out from all devices on request [D19].

### 3.8 Notifications
- **BR-51 [D21]** The system sends emails for invitations (initial and resent) and password resets only.

---

## 4. Permission Matrix (Summary)

| Action | Super Admin | Admin (own workspace) | User |
|---|---|---|---|
| Manage Admins (invite, resend, revoke, (de)activate, delete) | ✅ | ❌ | ❌ |
| Manage designations | ✅ | ✅ | ❌ |
| Invite / manage users | ✅ | ✅ | ❌ |
| Create / delete / archive projects | ✅ | ✅ | ❌ |
| View project | ✅ | ✅ | `READ` |
| Edit project details | ✅ | ✅ | `UPDATE` |
| Manage project members & permissions | ✅ | ✅ | `MANAGE_MEMBERS` (limits in BR-29) |
| Change own password | ✅ | ✅ | ✅ |

---

## 5. User Journeys

### J1 – Super Admin invites an Admin
1. The Super Admin enters the Admin's name and email.
2. The system checks the email is unique, creates an `INVITED` account, creates the Admin's workspace with the default designations, and sends an invitation email.
3. The Admin opens the link, sets a password, and their account becomes `ACTIVE`.

### J2 – Admin invites a User
1. The Admin enters the user's name and email and picks a designation.
2. The system creates an `INVITED` account in the Admin's workspace and sends an invitation email.
3. The user accepts the invitation as in J1, step 3.

### J3 – Resend or revoke an invitation
1. The inviter (or the Super Admin) sees an invitation that is `PENDING` or `EXPIRED`.
2. **Resend:** the old link stops working immediately, and a new email is sent with a new 48-hour link.
3. **Revoke:** the link stops working, and the account stays `INVITED` until the invitation is resent or the account is deleted.

### J4 – Add a member to a project
1. The Admin, or a member with `MANAGE_MEMBERS`, picks a user from the workspace.
2. The user's designation defaults are pre-filled. The person adding them can adjust these (within BR-29) and confirms.
3. The user can now see the project and act according to their permissions.

### J5 – Forgot password
1. The user requests a reset and gets a neutral confirmation.
2. If the account is eligible, an email with a 1-hour link is sent.
3. The user sets a new password and their other sessions end.

### J6 – Deactivate an Admin
1. The Super Admin deactivates the Admin.
2. The Admin and all of their users are logged out and can't log in. Pending invitations from that workspace can't be accepted.
3. When the Admin is reactivated, users who are individually `ACTIVE` regain access.

---

## 6. Out of Scope (v1)
- Audit log [D22]
- In-app notifications, and emails other than invitations and password resets [D21]
- Logging out from all devices on request [D19]
- Per-module project permissions (the design supports them later) [D6]
- Self-registration, Single Sign-On (SSO), Multi-Factor Authentication (MFA)
- Moving users between workspaces

